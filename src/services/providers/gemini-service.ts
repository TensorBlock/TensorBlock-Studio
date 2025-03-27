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
 * Response format for chat completions from Google's Gemini API
 */
export interface GeminiChatCompletionResponse {
  candidates: {
    content: {
      parts: {
        text?: string;
      }[];
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  }[];
  promptFeedback?: {
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  };
  usage?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Default models for Gemini
 */
export const GEMINI_MODELS = {
  GEMINI_PRO: 'gemini-pro',
  GEMINI_PRO_VISION: 'gemini-pro-vision',
  GEMINI_ULTRA: 'gemini-ultra',
  GEMINI_ULTRA_VISION: 'gemini-ultra-vision',
};

/**
 * Implementation of Gemini service provider
 */
export class GeminiService extends AiServiceProvider {
  private apiModels: string[] = Object.values(GEMINI_MODELS);
  private apiVersion: string;
  private settingsService: SettingsService;

  /**
   * Create a new Gemini service provider
   */
  constructor(config?: Partial<AiServiceConfig>) {
    // Get settings from settings service
    const settingsService = SettingsService.getInstance();
    const geminiSettings = settingsService.getProviderSettings('Gemini');
    
    // Default configuration
    const apiVersion = geminiSettings.apiVersion || config?.headers?.['x-goog-api-version'] || API_CONFIG.gemini.apiVersion;
    const baseURL = geminiSettings.baseUrl || config?.baseURL || API_CONFIG.gemini.baseUrl;
    
    super({
      baseURL: `${baseURL}/${apiVersion}`,
      apiKey: config?.apiKey || getValidatedApiKey(geminiSettings.apiKey || API_CONFIG.gemini.apiKey),
      timeout: config?.timeout || API_CONFIG.gemini.defaultTimeout,
      ...config,
    });
    
    // Store services and settings
    this.settingsService = settingsService;
    this.apiVersion = apiVersion;
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return 'Gemini';
  }

  /**
   * Get the capabilities supported by Gemini
   */
  get capabilities(): AIServiceCapability[] {
    return [
      AIServiceCapability.ChatCompletion,
      AIServiceCapability.VisionAnalysis,
    ];
  }

  /**
   * Get the available models for Gemini
   */
  get availableModels(): string[] {
    return this.apiModels;
  }

  /**
   * Fetch the list of available models from Gemini
   * Note: We return the predefined list as Gemini API doesn't provide a comprehensive models endpoint
   */
  public async fetchAvailableModels(): Promise<string[]> {
    return this.apiModels;
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
   * Implementation of text completion for Gemini
   * Note: Gemini doesn't support traditional text completion API,
   * so we adapt the chat completion API for this purpose
   */
  protected async completionImplementation(prompt: string, options: CompletionOptions): Promise<string> {
    // Convert to chat completion since Gemini doesn't have a dedicated completion endpoint
    const chatMessage: Message = { 
      role: 'user', 
      content: prompt, 
      id: uuidv4(), 
      timestamp: new Date(), 
      provider: this.name, 
      model: options.model 
    };
    const response = await this.chatCompletionImplementation([chatMessage], options);
    return response.content;
  }

  /**
   * Implementation of chat completion for Gemini
   */
  protected async chatCompletionImplementation(messages: Message[], options: CompletionOptions): Promise<Message> {
    // Validate API key before making the request
    if (!this.hasValidApiKey()) {
      throw new Error(`API key not configured for ${this.name} service`);
    }
    
    // Prepare messages in Gemini format
    const formattedMessages = [];
    
    // Format messages for Gemini API
    for (const message of messages) {
      formattedMessages.push({
        role: message.role === 'system' ? 'user' : message.role,
        parts: [{ text: message.content }],
      });
    }
    
    // Handle special case: If the first message is a system message, we need to combine it with the first user message
    // since Gemini doesn't have a dedicated system message concept
    if (messages.length > 1 && messages[0].role === 'system' && messages[1].role === 'user') {
      formattedMessages[1].parts[0].text = `${messages[0].content}\n\n${messages[1].content}`;
      formattedMessages.shift(); // Remove the system message
    }
    
    const model = options.model || GEMINI_MODELS.GEMINI_PRO;
    
    // Prepare completion options
    const completionOptions = {
      contents: formattedMessages,
      generationConfig: {
        maxOutputTokens: options.max_tokens || options.maxTokens || 1000,
        temperature: options.temperature ?? 0.7,
        topP: options.top_p ?? options.topP ?? 1.0,
        stopSequences: options.stop || [],
      },
    };

    try {
      // Note the specific URL format with API key as a query parameter
      const apiKey = this.getSanitizedApiKey();
      const response = await this.client.post<GeminiChatCompletionResponse>(
        `/${this.apiVersion}/models/${model}:generateContent?key=${apiKey}`,
        completionOptions
      );

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No completion candidates returned from Gemini API');
      }

      // Extract the response content
      const candidate = response.candidates[0];
      const content = candidate.content.parts
        .map(part => part.text || '')
        .join('');

      return { 
        role: 'assistant', 
        content: content.trim(),
        id: uuidv4(),
        timestamp: new Date(),
        provider: this.name,
        model: options.model
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
        console.error('Gemini chat completion error details:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          request: {
            model: model,
            messageCount: completionOptions.contents.length
          }
        });
      }
      console.error('Gemini chat completion error:', error);
      throw error;
    }
  }

  /**
   * Override the default authentication method since Gemini uses API key as a query parameter
   */
  protected setupAuthentication(): void {
    // Gemini API uses API key as a query parameter, not in headers
    // We override the parent method to avoid setting Authorization header
  }
} 