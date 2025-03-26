import { AiServiceProvider, AIServiceCapability, AiServiceConfig, CompletionOptions } from './core/ai-service-provider';
import { OpenAIService } from './providers/openai-service';
import { SettingsService, SETTINGS_CHANGE_EVENT } from './settings-service';
import * as providersList from './providers/providers';
import { Message } from '../types/chat';


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
    this.registerAllProviders();
    this.configureApiKey();
    this.setupSettingsListener();
  }

  private registerAllProviders(): void {
    Object.values(providersList).forEach(ProviderClass => {
      if (typeof ProviderClass === 'function') {
        const instance = new ProviderClass(); // instantiate it
        this.registerProvider(instance);
      }
    });
  }
  
  /**
   * Register a new AI service provider
   */
  public registerProvider(provider: AiServiceProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Configure API key from settings
   */
  private configureApiKey(): void {
    const settingsService = SettingsService.getInstance();
    const apiKey = settingsService.getApiKey();
    
    if (apiKey) {
      // We need to reinitialize the OpenAI service with the new API key
      this.configureService('OpenAI', {
        apiKey
      });
    }
  }

  /**
   * Setup event listener for settings changes
   */
  private setupSettingsListener(): void {
    const handleSettingsChange = () => {
      this.configureApiKey();
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
   * Configure an existing service with new options
   */
  public configureService(name: string, config: Partial<AiServiceConfig>): boolean {
    // Remove the existing provider
    const existingProvider = this.getProvider(name);
    if (!existingProvider) {
      console.warn(`Cannot configure provider ${name}: Provider not found`);
      return false;
    }
    
    // Create a new instance with the updated configuration
    try {
      // Currently only supporting OpenAI
      if (name === 'OpenAI') {
        const newProvider = new OpenAIService(config);
        this.providers.set(name, newProvider);
        return true;
      }
      
      console.warn(`Cannot configure provider ${name}: Provider type not supported for reconfiguration`);
      return false;
    } catch (error) {
      console.error(`Error configuring service ${name}:`, error);
      return false;
    }
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

      const result = await provider.getChatCompletion(messages, {
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
} 