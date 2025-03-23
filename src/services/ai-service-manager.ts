import { AiServiceProvider, AIServiceCapability, AiServiceConfig } from './core/ai-service-provider';
import { OpenAIService } from './providers/openai-service';

/**
 * Central manager for all AI service providers
 */
export class AiServiceManager {
  private static instance: AiServiceManager;
  private providers: Map<string, AiServiceProvider> = new Map();

  /**
   * Get the singleton instance of the service manager
   */
  public static getInstance(): AiServiceManager {
    if (!AiServiceManager.instance) {
      AiServiceManager.instance = new AiServiceManager();
    }
    return AiServiceManager.instance;
  }

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    // Initialize with default providers
    this.registerDefaultProviders();
  }

  /**
   * Register default providers
   */
  private registerDefaultProviders(): void {
    // Only register OpenAI if API key is available
    const openAiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openAiKey) {
      this.registerProvider(new OpenAIService());
    }
  }

  /**
   * Register a new AI service provider
   */
  public registerProvider(provider: AiServiceProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get a specific provider by name
   */
  public getProvider(name: string): AiServiceProvider | undefined {
    return this.providers.get(name);
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
} 