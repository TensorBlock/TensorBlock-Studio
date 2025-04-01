import { AiServiceProvider, CompletionOptions } from './core/ai-service-provider';
import { ProviderFactory } from './providers/provider-factory';
import { Message } from '../types/chat';
import { StreamControlHandler } from './streaming-control';
import { AIProvider } from '../types/ai-providers';
import { SettingsService } from './settings-service';

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

/**
 * Status of an AI request
 */
export type AIRequestStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * State interface for AI operations
 */
interface AIState {
  status: AIRequestStatus;
  error: Error | null;
  isCachingModels: boolean;
}

/**
 * Custom event name for settings changes
 */
export const SETTINGS_CHANGE_EVENT = 'tensorblock_settings_change';

/**
 * Service for interacting with AI providers
 */
export class AIService {
  private static instance: AIService;
  private providers: Map<string, AiServiceProvider> = new Map();
  private state: AIState = {
    status: 'idle',
    error: null,
    isCachingModels: false
  };
  private listeners: Set<() => void> = new Set();
  private modelCache: Map<string, ModelOption[]> = new Map();
  private lastFetchTime: Map<string, number> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  /**
   * Get the singleton instance
   */
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    // Initialize with default providers
    this.addProviders();
    this.setupSettingsListener();
  }

  private addProviders(): void {
    const settingsService = SettingsService.getInstance();
    const settings = settingsService.getSettings();
    for (const provider of Object.keys(settings.providers)) {
      const providerSettings = settings.providers[provider];
      console.log('Provider: ', provider, ' Provider settings: ', providerSettings);
      if (providerSettings && providerSettings.apiKey && providerSettings.apiKey.length > 0) {
        const providerInstance = ProviderFactory.getNewProvider(provider as AIProvider);
        if (providerInstance) {
          this.providers.set(provider, providerInstance);
        }
      }
    }
  }

  /**
   * Setup event listener for settings changes
   */
  private setupSettingsListener(): void {
    const handleSettingsChange = () => {
      // ProviderFactory.refreshProviders();
      // Refresh models when settings change
      this.refreshModels();
    };
    
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Update the service state
   */
  private setState(newState: Partial<AIState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  /**
   * Start a new AI request
   */
  private startRequest(): void {
    this.setState({
      status: 'loading',
      error: null
    });
  }

  /**
   * Handle request success
   */
  private handleSuccess(): void {
    this.setState({
      status: 'success',
      error: null
    });
  }

  /**
   * Handle request error
   */
  private handleError(error: Error): void {
    console.error('AI request error:', error);
    this.setState({
      status: 'error',
      error
    });
  }

  /**
   * Get the current state
   */
  public getState(): AIState {
    return { ...this.state };
  }

  /**
   * Get a specific provider by name
   */
  public getProvider(name: AIProvider): AiServiceProvider | undefined {
    if (this.providers.has(name)) {
      return this.providers.get(name);
    }
    
    // If provider not in cache, try to create it
    const provider = ProviderFactory.getNewProvider(name as AIProvider);
    if (provider) {
      this.providers.set(name, provider);
      return provider;
    }
    
    return undefined;
  }

  /**
   * Get all registered providers
   */
  public getAllProviders(): AiServiceProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a streaming chat completion from the AI
   */
  public async getChatCompletion(
    messages: Message[], 
    options: CompletionOptions,
    streamController: StreamControlHandler
  ): Promise<Message | null> {
    try {
      // Get provider and model
      const providerName = options.provider;
      const modelName = options.model;
      const useStreaming = options.stream;
      
      // Get provider instance
      const provider = this.getProvider(providerName as AIProvider);
      
      if (!provider) {
        throw new Error(`Provider ${providerName} not available`);
      }
      
      const result = await provider.getChatCompletion(
        messages, 
        {
          model: modelName,
          provider: providerName,
          max_tokens: options?.max_tokens,
          temperature: options?.temperature,
          top_p: options?.top_p,
          frequency_penalty: options?.frequency_penalty,
          presence_penalty: options?.presence_penalty,
          user: options?.user,
          stream: useStreaming,
          signal: streamController.getAbortSignal(),
        },
        streamController
      );
      

      return result;
    } catch (e) {
      // Don't treat aborted requests as errors
      if (e instanceof Error && e.name === 'AbortError') {
        this.handleSuccess();
        return null;
      }
      
      const error = e instanceof Error ? e : new Error('Unknown error during streaming chat completion');
      this.handleError(error);
      return null;
    }
  }

  /**
   * Generate an image from a prompt
   */
  public async generateImage(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prompt: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: {
      size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
      style?: 'vivid' | 'natural';
      quality?: 'standard' | 'hd';
    }
  ): Promise<string[] | null> {
    throw new Error('Not implemented');

    // this.startRequest();
    
    // try {
    //   const provider = this.getImageGenerationProvider();
      
    //   if (!provider) {
    //     throw new Error('No image generation provider available');
    //   }
      
    //   if (!provider.generateImage) {
    //     throw new Error(`Provider ${provider.name} does not support image generation`);
    //   }
      
    //   const result = await provider.generateImage(prompt, options);
      
    //   this.handleSuccess();
    //   return result;
    // } catch (e) {
    //   const error = e instanceof Error ? e : new Error('Unknown error during image generation');
    //   this.handleError(error);
    //   return null;
    // }
  }

  /**
   * Get the current status
   */
  public get status(): AIRequestStatus {
    return this.state.status;
  }

  /**
   * Get the current error
   */
  public get error(): Error | null {
    return this.state.error;
  }

  /**
   * Check if a request is loading
   */
  public get isLoading(): boolean {
    return this.state.status === 'loading';
  }

  /**
   * Check if a request has errored
   */
  public get isError(): boolean {
    return this.state.status === 'error';
  }

  /**
   * Check if a request was successful
   */
  public get isSuccess(): boolean {
    return this.state.status === 'success';
  }

  /**
   * Check if models are being cached
   */
  public get isCachingModels(): boolean {
    return this.state.isCachingModels;
  }

  /**
   * Get all available models across all providers
   */
  public async getCachedAllModels(): Promise<ModelOption[]> {
    // Check if we already have a cached result
    const cacheKey = 'all_providers';
    const cachedTime = this.lastFetchTime.get(cacheKey) || 0;
    const now = Date.now();
    
    // Return cached models if they're still valid
    if (this.modelCache.has(cacheKey) && now - cachedTime < this.CACHE_TTL) {
      return this.modelCache.get(cacheKey) || [];
    }
    
    // Otherwise, collect models from all providers
    const allModels: ModelOption[] = [];
    const providerPromises = [];
    
    for (const provider of this.getAllProviders()) {
      providerPromises.push(this.getModelsForProvider(provider.name as AIProvider));
    }
    
    const results = await Promise.all(providerPromises);
    
    // Flatten results and filter out duplicates
    results.forEach(models => {
      allModels.push(...models);
    });
    
    // Cache and return results
    this.modelCache.set(cacheKey, allModels);
    this.lastFetchTime.set(cacheKey, now);
    
    return allModels;
  }

  /**
   * Get models for a specific provider
   */
  public async getModelsForProvider(providerName: AIProvider): Promise<ModelOption[]> {
    // Check if we already have a cached result
    const cachedTime = this.lastFetchTime.get(providerName) || 0;
    const now = Date.now();
    
    // Return cached models if they're still valid
    if (this.modelCache.has(providerName) && now - cachedTime < this.CACHE_TTL) {
      return this.modelCache.get(providerName) || [];
    }
    
    // Get provider instance
    const provider = this.getProvider(providerName);
    if (!provider) {
      console.warn(`Provider ${providerName} not available`);
      return [];
    }
    
    this.setState({ isCachingModels: true });
    
    try {
      // Fetch models from provider
      const models = await provider.fetchAvailableModels();
      
      // Convert to ModelOption format
      const modelOptions: ModelOption[] = models.map(model => ({
        id: model,
        name: model,
        provider: providerName
      }));

      // Cache results
      this.modelCache.set(providerName, modelOptions);
      this.lastFetchTime.set(providerName, now);
      
      this.setState({ isCachingModels: false });
      return modelOptions;
    } catch (error) {
      console.error(`Error fetching models for ${providerName}:`, error);
      this.setState({ isCachingModels: false });
      return [];
    }
  }

  /**
   * Refresh all models
   */
  public async refreshModels(): Promise<void> {
    // Clear cache
    this.modelCache.clear();
    this.lastFetchTime.clear();
    
    // Re-fetch all models
    await this.getCachedAllModels();
  }
} 