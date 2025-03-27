import { 
  AiServiceProvider, 
  AIServiceCapability, 
  AiServiceConfig, 
  CompletionOptions 
} from '../core/ai-service-provider';
import { AxiosError, AxiosHeaders } from 'axios';
import { API_CONFIG } from '../core/config';
import { SettingsService } from '../settings-service';
import { Message } from '../../types/chat';
import { v4 as uuidv4 } from 'uuid';

/**
 * Response formats for custom provider (OpenAI-compatible)
 */
export interface CustomCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    text: string;
    index: number;
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface CustomChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Custom endpoint configuration
 */
export interface CustomEndpoints {
  completions?: string;
  chatCompletions?: string;
  models?: string;
  embeddings?: string;
  imageGenerations?: string;
}

/**
 * Configuration for custom provider
 */
export interface CustomProviderConfig extends Partial<AiServiceConfig> {
  name?: string;
  endpoints?: CustomEndpoints;
  models?: string[];
  capabilities?: AIServiceCapability[];
}

/**
 * Implementation of a custom service provider
 * This provider allows users to configure their own endpoints
 * and connect to any OpenAI-compatible API
 */
export class CustomService extends AiServiceProvider {
  private apiModels: string[] = [];
  private customName: string;
  private customEndpoints: CustomEndpoints;
  private customCapabilities: AIServiceCapability[];
  private settingsService: SettingsService;

  /**
   * Create a new custom service provider
   */
  constructor(config?: CustomProviderConfig) {
    // Get settings service
    const settingsService = SettingsService.getInstance();
    const customSettings = settingsService.getProviderSettings('Custom');
    
    // Set default endpoints from settings if available
    const endpoints: CustomEndpoints = config?.endpoints || {
      completions: customSettings.completionsEndpoint || '/completions',
      chatCompletions: customSettings.chatCompletionsEndpoint || '/chat/completions',
      models: customSettings.modelsEndpoint || '/models',
      embeddings: '/embeddings',
      imageGenerations: '/images/generations',
    };

    // Apply default configuration
    super({
      baseURL: config?.baseURL || customSettings.baseUrl || API_CONFIG.custom.baseUrl,
      apiKey: config?.apiKey || customSettings.apiKey || API_CONFIG.custom.apiKey,
      timeout: config?.timeout || API_CONFIG.custom.defaultTimeout,
      headers: config?.headers || {},
      ...config,
    });

    // Store services
    this.settingsService = settingsService;
    
    // Store custom configuration
    this.customName = config?.name || 'Custom Provider';
    this.customEndpoints = endpoints;
    this.apiModels = config?.models || ['default-model'];
    this.customCapabilities = config?.capabilities || [
      AIServiceCapability.TextCompletion,
      AIServiceCapability.ChatCompletion
    ];

    // Add API version header if needed
    if (config?.headers?.['api-version']) {
      this.client.addRequestInterceptor((config) => {
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        
        // Add custom headers here if needed
        
        return config;
      });
    }
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return this.customName;
  }

  /**
   * Get the capabilities supported by this provider
   */
  get capabilities(): AIServiceCapability[] {
    return this.customCapabilities;
  }

  /**
   * Get the available models for this provider
   */
  get availableModels(): string[] {
    return this.apiModels;
  }

  /**
   * Set available models
   */
  public setModels(models: string[]): void {
    this.apiModels = models;
  }

  /**
   * Fetch the list of available models
   */
  public async fetchAvailableModels(): Promise<string[]> {
    if (!this.customEndpoints.models) {
      return this.apiModels;
    }

    try {
      const response = await this.client.get<{ data: Array<{ id: string }> }>(
        this.customEndpoints.models
      );
      this.apiModels = response.data.map(model => model.id);
      return this.apiModels;
    } catch (error) {
      console.error(`Failed to fetch ${this.name} models:`, error);
      return this.apiModels;
    }
  }

  /**
   * Update the API key for OpenRouter
   */
  public override updateApiKey(ApiKey: string): void {
    this.config.apiKey = ApiKey;
    this.setupAuthenticationByProvider();
  }

  override setupAuthenticationByProvider(): void {
    const sanitizedApiKey = this.getSanitizedApiKey();
    
    if (!sanitizedApiKey) {
      console.warn(`No API key provided for ${this.name} service`);
      return;
    }

    this.client.addRequestInterceptor((config) => {
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      
      // Set authorization header based on the API key
      config.headers.set('x-api-key', `${sanitizedApiKey}`);
      
      return config;
    });
  }

  /**
   * Implementation of text completion
   */
  protected async completionImplementation(prompt: string, options: CompletionOptions): Promise<string> {
    // Validate API key before making the request
    if (!this.hasValidApiKey()) {
      throw new Error(`API key not configured for ${this.name} service`);
    }

    // If no completions endpoint is defined but chat completions is,
    // use chat completions as a fallback
    if (!this.customEndpoints.completions && this.customEndpoints.chatCompletions) {
      const chatMessage: Message = { role: 'user', content: prompt, 
        id: uuidv4(), 
        timestamp: new Date(), 
        provider: this.name, 
        model: options.model 
      };
      const response = await this.chatCompletionImplementation([chatMessage], options);
      return response.content;
    }

    const completionOptions = {
      model: options.model || this.apiModels[0],
      prompt,
      max_tokens: options.max_tokens || options.maxTokens || 1000,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? options.topP ?? 1.0,
      frequency_penalty: options.frequency_penalty ?? options.frequencyPenalty ?? 0,
      presence_penalty: options.presence_penalty ?? options.presencePenalty ?? 0,
      stop: options.stop,
      user: options.user,
    };

    try {
      const endpoint = this.customEndpoints.completions || '/completions';
      const response = await this.client.post<CustomCompletionResponse>(
        endpoint,
        completionOptions
      );

      if (response.choices && response.choices.length > 0) {
        return response.choices[0].text.trim();
      }

      throw new Error(`No completion choices returned from ${this.name}`);
    } catch (error) {
      // Check for auth errors
      if ((error as AxiosError).response?.status === 401 || 
          (error as AxiosError).response?.status === 403) {
        throw this.handleAuthError(error);
      }
      
      // Log detailed error information
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error(`${this.name} text completion error details:`, {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data
        });
      }
      console.error(`${this.name} completion error:`, error);
      throw error;
    }
  }

  /**
   * Implementation of chat completion
   */
  protected async chatCompletionImplementation(messages: Message[], options: CompletionOptions): Promise<Message> {
    // Validate API key before making the request
    if (!this.hasValidApiKey()) {
      throw new Error(`API key not configured for ${this.name} service`);
    }
    
    const completionOptions = {
      model: options.model || this.apiModels[0],
      messages,
      max_tokens: options.max_tokens || options.maxTokens || 1000,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? options.topP ?? 1.0,
      frequency_penalty: options.frequency_penalty ?? options.frequencyPenalty ?? 0,
      presence_penalty: options.presence_penalty ?? options.presencePenalty ?? 0,
      stop: options.stop,
      user: options.user,
    };

    try {
      const endpoint = this.customEndpoints.chatCompletions || '/chat/completions';
      const response = await this.client.post<CustomChatCompletionResponse>(
        endpoint,
        completionOptions
      );

      if (response.choices && response.choices.length > 0) {
        const { role, content } = response.choices[0].message;
        return { 
          role: role as Message['role'], 
          content: content.trim(),
          id: uuidv4(),
          timestamp: new Date(),
          provider: this.name,
          model: options.model
        };
      }

      throw new Error(`No chat completion choices returned from ${this.name}`);
    } catch (error) {
      // Check for auth errors
      if ((error as AxiosError).response?.status === 401 || 
          (error as AxiosError).response?.status === 403) {
        throw this.handleAuthError(error);
      }
      
      // Log detailed error information
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error(`${this.name} chat completion error details:`, {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data
        });
      }
      console.error(`${this.name} chat completion error:`, error);
      throw error;
    }
  }

  /**
   * Update the endpoints configuration
   */
  public updateEndpoints(endpoints: Partial<CustomEndpoints>): void {
    this.customEndpoints = {
      ...this.customEndpoints,
      ...endpoints
    };
  }

  /**
   * Update the capabilities
   */
  public setCapabilities(capabilities: AIServiceCapability[]): void {
    this.customCapabilities = capabilities;
  }

  /**
   * Update the provider name
   */
  public setName(name: string): void {
    this.customName = name;
  }

  /**
   * Update the base URL
   */
  public setBaseURL(baseURL: string): void {
    // Update the internal client config
    this.config.baseURL = baseURL;
    
    // Re-create the client with the new base URL
    this.client.setBaseURL(baseURL);
  }
} 