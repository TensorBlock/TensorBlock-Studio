import { AiServiceProvider, AIServiceCapability, CompletionOptions } from './core/ai-service-provider';
import { OpenAIService } from './providers/openai-service';
import { SettingsService } from './settings-service';
import * as providersList from './providers/providers';
import { Message } from '../types/chat';

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
    error: null
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
    this.configureProviders();
    this.setupSettingsListener();
  }

  /**
   * Configure API key from settings
   */
  private configureProviders(): void {
    const settingsService = SettingsService.getInstance();
    
    Object.values(providersList).forEach(ProviderClass => {
      if (typeof ProviderClass === 'function') {
        const provider = new ProviderClass();
        const apiKey = settingsService.getApiKey(provider.name);
        console.log(`${provider.name} API Key: ${apiKey}`);
        provider.updateApiKey(apiKey);
        this.providers.set(provider.name, provider);
      }
    });
  }

  /**
   * Setup event listener for settings changes
   */
  private setupSettingsListener(): void {
    const handleSettingsChange = () => {
      this.configureProviders();
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
  public getProvider(name: string): AiServiceProvider | undefined {
    if(this.providers.has(name)) {
      return this.providers.get(name);
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
   * Find providers that support a specific capability
   */
  public getProvidersByCapability(capability: AIServiceCapability): AiServiceProvider[] {
    return this.getAllProviders().filter(provider => 
      provider.supportsCapability(capability)
    );
  }

  /**
   * Get the OpenAI service provider
   */
  public getOpenAI(): OpenAIService | undefined {
    const provider = this.getProvider('OpenAI');
    return provider ? provider as OpenAIService : undefined;
  }

  /**
   * Utility method to get a suitable provider for text completion
   */
  public getTextCompletionProvider(): AiServiceProvider | undefined {
    const providers = this.getProvidersByCapability(AIServiceCapability.TextCompletion);
    return providers.length > 0 ? providers[0] : undefined;
  }

  /**
   * Utility method to get a suitable provider for chat completion
   */
  public getChatCompletionProvider(): AiServiceProvider | undefined {
    const providers = this.getProvidersByCapability(AIServiceCapability.ChatCompletion);
    return providers.length > 0 ? providers[0] : undefined;
  }

  /**
   * Utility method to get a suitable provider for image generation
   */
  public getImageGenerationProvider(): AiServiceProvider | undefined {
    const providers = this.getProvidersByCapability(AIServiceCapability.ImageGeneration);
    return providers.length > 0 ? providers[0] : undefined;
  }

  /**
   * Get a text completion from the AI
   */
  public async getCompletion(
    prompt: string, 
    options?: Partial<CompletionOptions>
  ): Promise<string | null> {
    this.startRequest();
    
    try {
      const provider = this.getTextCompletionProvider();
      
      if (!provider) {
        throw new Error('No text completion provider available');
      }
      
      const result = await provider.getCompletion(prompt, {
        model: options?.model || provider.availableModels?.[0] || 'gpt-3.5-turbo',
        provider: options?.provider || provider.name || 'OpenAI',
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
        topP: options?.topP,
        frequencyPenalty: options?.frequencyPenalty,
        presencePenalty: options?.presencePenalty,
        stop: options?.stop,
        user: options?.user,
      });
      
      this.handleSuccess();
      return result;
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error during completion');
      this.handleError(error);
      return null;
    }
  }

  /**
   * Get a chat completion from the AI
   */
  public async getChatCompletion(
    messages: Message[], 
    options?: Partial<CompletionOptions>
  ): Promise<Message | null> {
    this.startRequest();
    
    try {
      let provider = null;

      if(!options?.provider) {
        provider = this.getChatCompletionProvider();
      }
      else {
        provider = this.getProvider(options.provider);
      }
      
      if (!provider) {
        throw new Error('No chat completion provider available');
      }

      const finalModel = options?.model || provider.availableModels?.[0] || 'gpt-3.5-turbo';

      console.log('Using model:', finalModel);
      console.log('Using provider:', provider.name);

      const result = await provider.getChatCompletion(messages, {
        model: finalModel,
        provider: options?.provider || provider.name || 'OpenAI',
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
        topP: options?.topP,
        frequencyPenalty: options?.frequencyPenalty,
        presencePenalty: options?.presencePenalty,
        stop: options?.stop,
        user: options?.user,
      });
      
      this.handleSuccess();
      return result;
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error during chat completion');
      this.handleError(error);
      return null;
    }
  }

  /**
   * Generate an image from the AI
   */
  public async generateImage(
    prompt: string,
    options?: {
      size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
      style?: 'vivid' | 'natural';
      quality?: 'standard' | 'hd';
    }
  ): Promise<string[] | null> {
    this.startRequest();
    
    try {
      const openai = this.getOpenAI();
      
      if (!openai) {
        throw new Error('OpenAI provider not available');
      }
      
      const images = await openai.generateImage(prompt, {
        size: options?.size,
        style: options?.style,
        quality: options?.quality,
      });
      
      this.handleSuccess();
      return images;
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error during image generation');
      this.handleError(error);
      return null;
    }
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
   * Check if currently loading
   */
  public get isLoading(): boolean {
    return this.state.status === 'loading';
  }

  /**
   * Check if there was an error
   */
  public get isError(): boolean {
    return this.state.status === 'error';
  }

  /**
   * Check if the request was successful
   */
  public get isSuccess(): boolean {
    return this.state.status === 'success';
  }

  /**
   * Get the service manager (now the service itself as they're merged)
   */
  public getServiceManager(): AIService {
    return this;
  }

  public async refreshGetAllModels(): Promise<ModelOption[]> {
    const allModels: ModelOption[] = [];
    for (const [providerName] of this.providers) {
      const models = await this.getModelsForProvider(providerName);
      allModels.push(...models);
    }
    
    return allModels;
  }

  public async getModelsForProvider(providerName: string): Promise<ModelOption[]> {
    if(!this.providers.has(providerName)) {
      return [];
    }

    if(!this.providers.get(providerName)!.hasValidApiKey()) {
      return [];
    }

    // Check cache first
    const cachedModels = this.modelCache.get(providerName);
    const lastFetch = this.lastFetchTime.get(providerName) || 0;
    
    if (cachedModels && Date.now() - lastFetch < this.CACHE_TTL) {
      return cachedModels;
    }

    // Fetch fresh models
    const provider = this.providers.get(providerName);
    if (!provider) {
      return [];
    }

    try {
      const models = await provider.fetchAvailableModels();
      const modelOptions: ModelOption[] = models.map(modelId => ({
        id: modelId,
        name: modelId,
        provider: providerName,
        description: `Model from ${providerName}`
      }));

      // Update cache
      this.modelCache.set(providerName, modelOptions);
      this.lastFetchTime.set(providerName, Date.now());

      return modelOptions;
    } catch (error) {
      console.error(`Failed to fetch models for ${providerName}:`, error);
      return [];
    }
  }

  public async refreshModels(): Promise<void> {
    // Clear cache
    this.modelCache.clear();
    this.lastFetchTime.clear();

    // Fetch models for all providers
    for (const providerName of this.providers.keys()) {
      await this.getModelsForProvider(providerName);
    }
  }
} 