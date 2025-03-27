import { 
  AiServiceProvider, 
  AIServiceCapability, 
  AiServiceConfig,
  CompletionOptions 
} from '../core/ai-service-provider';
import { AxiosError } from 'axios';
import { API_CONFIG, getValidatedApiKey } from '../core/config';
import { SettingsService } from '../settings-service';
import { Message } from '../../types/chat';
import { v4 as uuidv4 } from 'uuid';

/**
 * Response format for chat completions
 * Together.ai uses OpenAI-compatible API, so we reuse the same response format
 */
export interface TogetherCompletionResponse {
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
 * Default models for Together.ai
 */
export const TOGETHER_MODELS = {
  LLAMA_3_8B: 'meta-llama/Llama-3-8b-chat',
  LLAMA_3_70B: 'meta-llama/Llama-3-70b-chat',
  MIXTRAL_8X7B: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
  QWEN_72B: 'Qwen/Qwen1.5-72B-Chat',
  YI_34B: 'zero-one-ai/Yi-34B-Chat',
  CODELLAMA_34B: 'codellama/CodeLlama-34b-Instruct',
};

/**
 * Implementation of Together.ai service provider
 */
export class TogetherService extends AiServiceProvider {
  private apiModels: string[] = Object.values(TOGETHER_MODELS);
  private settingsService: SettingsService;

  /**
   * Create a new Together.ai service provider
   */
  constructor(config?: Partial<AiServiceConfig>) {
    // Get settings from settings service
    const settingsService = SettingsService.getInstance();
    const togetherSettings = settingsService.getProviderSettings('Together');
    
    // Default configuration for Together.ai
    const baseURL = togetherSettings.baseUrl || config?.baseURL || API_CONFIG.together.baseUrl;
    
    // Apply default configuration and override with provided config
    super({
      baseURL: baseURL,
      apiKey: config?.apiKey || getValidatedApiKey(togetherSettings.apiKey || API_CONFIG.together.apiKey),
      timeout: config?.timeout || API_CONFIG.together.defaultTimeout,
      ...config,
    });
    
    // Store services
    this.settingsService = settingsService;
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return 'Together.ai';
  }

  /**
   * Get the capabilities supported by Together.ai
   */
  get capabilities(): AIServiceCapability[] {
    return [
      AIServiceCapability.TextCompletion,
      AIServiceCapability.ChatCompletion,
      AIServiceCapability.Embedding,
      AIServiceCapability.FunctionCalling,
    ];
  }

  /**
   * Get the available models for Together.ai
   */
  get availableModels(): string[] {
    return this.apiModels;
  }

  /**
   * Fetch the list of available models from Together.ai
   */
  public async fetchAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get<{ data: Array<{ id: string }> }>('/models');
      this.apiModels = response.data.map(model => model.id);
      return this.apiModels;
    } catch (error) {
      console.error('Failed to fetch Together.ai models:', error);
      return this.apiModels;
    }
  }

  /**
   * Update the API key for Together.ai
   */
  public override updateApiKey(ApiKey: string): void {
    this.config.apiKey = ApiKey;
  }

  /**
   * Implementation of text completion for Together.ai
   */
  protected async completionImplementation(prompt: string, options: CompletionOptions): Promise<string> {
    // Validate API key before making the request
    if (!this.hasValidApiKey()) {
      throw new Error(`API key not configured for ${this.name} service`);
    }

    const completionOptions = {
      model: options.model || TOGETHER_MODELS.LLAMA_3_8B,
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
      const response = await this.client.post<TogetherCompletionResponse>(
        '/completions',
        completionOptions
      );

      if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content.trim();
      }

      throw new Error('No completion choices returned from Together.ai API');
    } catch (error) {
      // Check for auth errors
      if ((error as AxiosError).response?.status === 401 || 
          (error as AxiosError).response?.status === 403) {
        throw this.handleAuthError(error);
      }
      
      // Log detailed error information
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Together.ai text completion error details:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          request: {
            model: completionOptions.model,
            prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
          }
        });
      }
      console.error('Together.ai completion error:', error);
      throw error;
    }
  }

  /**
   * Implementation of chat completion for Together.ai
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
      model: options.model || TOGETHER_MODELS.LLAMA_3_8B,
      messages: messagesForAI,
      max_tokens: options.max_tokens || options.maxTokens || 1000,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? options.topP ?? 1.0,
      frequency_penalty: options.frequency_penalty ?? options.frequencyPenalty ?? 0,
      presence_penalty: options.presence_penalty ?? options.presencePenalty ?? 0,
      stop: options.stop,
      user: options.user,
    };

    try {
      const response = await this.client.post<TogetherCompletionResponse>(
        '/chat/completions',
        completionOptions
      );

      if (response.choices && response.choices.length > 0) {
        const { role, content } = response.choices[0].message;
        return { 
          id: uuidv4(),
          role: role as Message['role'], 
          content: content.trim(),
          timestamp: new Date(),
          provider: this.name,
          model: completionOptions.model
        };
      }

      throw new Error('No chat completion choices returned from Together.ai API');
    } catch (error) {
      // Check for auth errors
      if ((error as AxiosError).response?.status === 401 || 
          (error as AxiosError).response?.status === 403) {
        throw this.handleAuthError(error);
      }
      
      // Log detailed error information
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Together.ai chat completion error details:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          request: {
            model: completionOptions.model,
            messageCount: completionOptions.messages.length
          }
        });
      }
      console.error('Together.ai chat completion error:', error);
      throw error;
    }
  }
} 