import { 
  AiServiceProvider, 
  AIServiceCapability, 
  AiServiceConfig, 
  CompletionOptions 
} from '../core/ai-service-provider';
import { AxiosError, AxiosHeaders } from 'axios';
import { API_CONFIG, getValidatedApiKey } from '../core/config';
import { SettingsService } from '../settings-service';
import { Message } from '../../types/chat';
import { v4 as uuidv4 } from 'uuid';

/**
 * Response format for chat completions
 * Fireworks.ai uses OpenAI-compatible API, so we reuse the same response format
 */
export interface FireworksCompletionResponse {
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
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Implementation of Fireworks.ai service provider
 */
export class FireworksService extends AiServiceProvider {
  private apiModels: string[] = [];
  private settingsService: SettingsService;

  /**
   * Create a new Fireworks service provider
   */
  constructor(config?: Partial<AiServiceConfig>) {
    // Get settings from settings service
    const settingsService = SettingsService.getInstance();
    const fireworksSettings = settingsService.getProviderSettings('Fireworks');
    
    // Default configuration for Fireworks
    const baseURL = fireworksSettings.baseUrl || config?.baseURL || API_CONFIG.fireworks.baseUrl;
    
    // Apply default configuration and override with provided config
    super({
      baseURL: baseURL,
      apiKey: config?.apiKey || getValidatedApiKey(fireworksSettings.apiKey || API_CONFIG.fireworks.apiKey),
      timeout: config?.timeout || API_CONFIG.fireworks.defaultTimeout,
      ...config,
    });
    
    // Store services
    this.settingsService = settingsService;
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return 'Fireworks.ai';
  }

  /**
   * Get the capabilities supported by Fireworks.ai
   */
  get capabilities(): AIServiceCapability[] {
    return [
      AIServiceCapability.TextCompletion,
      AIServiceCapability.ChatCompletion,
      AIServiceCapability.FunctionCalling,
    ];
  }

  /**
   * Get the available models for Fireworks.ai
   */
  get availableModels(): string[] {
    return this.apiModels;
  }

  /**
   * Fetch the list of available models from Fireworks.ai
   */
  public async fetchAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get<{ data: Array<{ id: string }> }>('/models');
      this.apiModels = response.data.map(model => model.id);
      return this.apiModels;
    } catch (error) {
      console.error('Failed to fetch Fireworks.ai models:', error);
      return this.apiModels;
    }
  }

  /**
   * Update the API key for Fireworks.ai
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
      config.headers.set('Authorization', `Bearer ${sanitizedApiKey}`);
      
      return config;
    });
  }

  /**
   * Implementation of text completion for Fireworks.ai
   */
  protected async completionImplementation(prompt: string, options: CompletionOptions): Promise<string> {
    // Validate API key before making the request
    if (!this.hasValidApiKey()) {
      throw new Error(`API key not configured for ${this.name} service`);
    }

    const completionOptions = {
      model: options.model,
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
      const response = await this.client.post<FireworksCompletionResponse>(
        '/completions',
        completionOptions
      );

      if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content.trim();
      }

      throw new Error('No completion choices returned from Fireworks.ai API');
    } catch (error) {
      // Check for auth errors
      if ((error as AxiosError).response?.status === 401 || 
          (error as AxiosError).response?.status === 403) {
        throw this.handleAuthError(error);
      }
      
      // Log detailed error information
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Fireworks.ai text completion error details:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          request: {
            model: completionOptions.model,
            prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
          }
        });
      }
      console.error('Fireworks.ai completion error:', error);
      throw error;
    }
  }

  /**
   * Implementation of chat completion for Fireworks.ai
   */
  protected async chatCompletionImplementation(messages: Message[], options: CompletionOptions): Promise<Message> {
    // Validate API key before making the request
    if (!this.hasValidApiKey()) {
      throw new Error(`API key not configured for ${this.name} service`);
    }
    
    const messagesForAI = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const completionOptions = {
      model: options.model,
      messages: messagesForAI,
      max_tokens: options.max_tokens || options.maxTokens || 1000,
      temperature: options.temperature ?? 1.0,
      top_p: options.top_p ?? options.topP ?? 1.0,
      frequency_penalty: options.frequency_penalty ?? options.frequencyPenalty ?? 0,
      presence_penalty: options.presence_penalty ?? options.presencePenalty ?? 0,
      stop: options.stop,
      user: options.user,
    };

    try {
      const response = await this.client.post<FireworksCompletionResponse>(
        '/chat/completions',
        completionOptions
      );

      if (response.choices && response.choices.length > 0) {
        const { role, content } = response.choices[0].message;
        return { 
          role: role as Message['role'], 
          content: content.trim(),
          messageId: uuidv4(),
          timestamp: new Date(),
          provider: this.name,
          model: options.model
        };
      }

      throw new Error('No chat completion choices returned from Fireworks.ai API');
    } catch (error) {
      // Check for auth errors
      if ((error as AxiosError).response?.status === 401 || 
          (error as AxiosError).response?.status === 403) {
        throw this.handleAuthError(error);
      }
      
      // Log detailed error information
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Fireworks.ai chat completion error details:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          request: {
            model: completionOptions.model,
            messageCount: completionOptions.messages.length
          }
        });
      }
      console.error('Fireworks.ai chat completion error:', error);
      throw error;
    }
  }
} 