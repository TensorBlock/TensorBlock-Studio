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
 * Response format for chat completions from Anthropic
 */
export interface AnthropicChatCompletionResponse {
  id: string;
  type: string;
  model: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  stop_reason: string;
  stop_sequence: string | null;
}

/**
 * Default models for Anthropic
 */
export const ANTHROPIC_MODELS = {
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
  CLAUDE_2_1: 'claude-2.1',
  CLAUDE_2: 'claude-2',
  CLAUDE_INSTANT_1: 'claude-instant-1.2',
};

/**
 * Implementation of Anthropic service provider
 */
export class AnthropicService extends AiServiceProvider {
  private apiModels: string[] = Object.values(ANTHROPIC_MODELS);
  private apiVersion: string;
  private settingsService: SettingsService;

  /**
   * Create a new Anthropic service provider
   */
  constructor(config?: Partial<AiServiceConfig>) {
    // Get settings from settings service
    const settingsService = SettingsService.getInstance();
    const anthropicSettings = settingsService.getProviderSettings('Anthropic');
    
    // Default configuration for Anthropic
    const defaultConfig = {
      baseURL: API_CONFIG.anthropic.baseUrl,
      apiKey: getValidatedApiKey(anthropicSettings.apiKey || API_CONFIG.anthropic.apiKey),
      timeout: API_CONFIG.anthropic.defaultTimeout,
    };

    // Apply default configuration and override with provided config
    super({
      ...defaultConfig,
      ...config,
    });
    
    // Store services
    this.settingsService = settingsService;

    // Set API version with default
    this.apiVersion = anthropicSettings.apiVersion || 
                      config?.headers?.['anthropic-version'] || 
                      API_CONFIG.anthropic.apiVersion;
    
    // Add Anthropic-specific headers
    this.client.addRequestInterceptor((config) => {
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      
      config.headers['anthropic-version'] = this.apiVersion;
      
      return config;
    });
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return 'Anthropic';
  }

  /**
   * Get the capabilities supported by Anthropic
   */
  get capabilities(): AIServiceCapability[] {
    return [
      AIServiceCapability.ChatCompletion,
      AIServiceCapability.VisionAnalysis,
      AIServiceCapability.ToolUsage,
    ];
  }

  /**
   * Get the available models for Anthropic
   */
  get availableModels(): string[] {
    return this.apiModels;
  }

  /**
   * Fetch the list of available models from Anthropic
   * Note: Anthropic doesn't have a models endpoint like OpenAI,
   * so we return the predefined list
   */
  public override async fetchAvailableModels(): Promise<string[]> {
    return this.apiModels;
  }

  /**
   * Update the API key for OpenRouter
   */
  public override updateApiKey(ApiKey: string): void {
    this.config.apiKey = ApiKey;
  }

  /**
   * Implementation of text completion for Anthropic
   * Note: Anthropic doesn't support traditional text completion API,
   * so we adapt the chat completion API for this purpose
   */
  protected async completionImplementation(prompt: string, options: CompletionOptions): Promise<string> {
    // Convert to chat completion since Anthropic doesn't have a dedicated completion endpoint
    const chatMessage: Message = { role: 'user', content: prompt, id: uuidv4(), timestamp: new Date(), provider: this.name, model: options.model };
    const response = await this.chatCompletionImplementation([chatMessage], options);
    return response.content;
  }

  /**
   * Implementation of chat completion for Anthropic
   */
  protected async chatCompletionImplementation(messages: Message[], options: CompletionOptions): Promise<Message> {
    // Validate API key before making the request
    if (!this.hasValidApiKey()) {
      throw new Error(`API key not configured for ${this.name} service`);
    }
    
    // Anthropic uses "human" and "assistant" roles instead of "user" and "assistant"
    // We need to convert messages to Anthropic format
    const systemMessage = messages.find(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');
    
    // Prepare messages in Anthropic format
    const formattedMessages = [];
    
    // Handle system message differently since Anthropic expects it as a parameter
    const system = systemMessage?.content || '';
    
    // Format other messages
    for (const message of nonSystemMessages) {
      formattedMessages.push({
        role: message.role === 'user' ? 'user' : 'assistant',
        content: message.content,
      });
    }
    
    // Prepare completion options
    const completionOptions = {
      model: options.model || ANTHROPIC_MODELS.CLAUDE_3_HAIKU,
      messages: formattedMessages,
      system: system,
      max_tokens: options.max_tokens || options.maxTokens || 1000,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? options.topP ?? 1.0,
      stop_sequences: options.stop || [],
    };

    try {
      const response = await this.client.post<AnthropicChatCompletionResponse>(
        '/v1/messages',
        completionOptions
      );

      // Extract the response content
      const content = response.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('');

      return { 
        id: uuidv4(),
        role: 'assistant', 
        content: content.trim(),
        timestamp: new Date(),
        provider: this.name,
        model: completionOptions.model
      };
    } catch (error) {
      // Check for auth errors
      if ((error as AxiosError).response?.status === 401 || 
          (error as AxiosError).response?.status === 403) {
        throw this.handleAuthError(error);
      }
      
      // Log detailed error information
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Anthropic chat completion error details:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          request: {
            model: completionOptions.model,
            messageCount: completionOptions.messages.length
          }
        });
      }
      console.error('Anthropic chat completion error:', error);
      throw error;
    }
  }
} 