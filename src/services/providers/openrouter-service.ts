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
 * OpenRouter uses an OpenAI-compatible API
 */
export interface OpenRouterCompletionResponse {
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
 * Response format for image generation
 */
interface OpenRouterImageGenerationResponse {
  data: Array<{ 
    url?: string; 
    b64_json?: string; 
    revised_prompt?: string 
  }>;
}

/**
 * Default models for OpenRouter
 * Note: OpenRouter supports many models, this is just a curated selection of popular ones
 */
export const OPENROUTER_MODELS = {
  // OpenAI models
  GPT_4: 'openai/gpt-4',
  GPT_4_TURBO: 'openai/gpt-4-turbo-preview',
  GPT_3_5_TURBO: 'openai/gpt-3.5-turbo',
  
  // Anthropic models
  CLAUDE_3_OPUS: 'anthropic/claude-3-opus',
  CLAUDE_3_SONNET: 'anthropic/claude-3-sonnet',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  
  // Other popular models
  LLAMA_3_70B: 'meta-llama/llama-3-70b-chat',
  MIXTRAL_8X7B: 'mistralai/mixtral-8x7b-instruct',
  
  // Image generation models
  DALLE_3: 'openai/dall-e-3',
};

/**
 * Implementation of OpenRouter service provider
 */
export class OpenRouterService extends AiServiceProvider {
  private apiModels: string[] = Object.values(OPENROUTER_MODELS);
  private settingsService: SettingsService;

  /**
   * Create a new OpenRouter service provider
   */
  constructor(config?: Partial<AiServiceConfig>) {
    // Get settings from settings service
    const settingsService = SettingsService.getInstance();
    const openrouterSettings = settingsService.getProviderSettings('OpenRouter');
    
    // Default configuration for OpenRouter
    const baseURL = openrouterSettings.baseUrl || config?.baseURL || API_CONFIG.openrouter.baseUrl;
    
    super({
      baseURL: baseURL,
      apiKey: config?.apiKey || getValidatedApiKey(openrouterSettings.apiKey || API_CONFIG.openrouter.apiKey),
      timeout: config?.timeout || API_CONFIG.openrouter.defaultTimeout,
      headers: {
        'HTTP-Referer': config?.headers?.['HTTP-Referer'] || window.location.origin,
        'X-Title': config?.headers?.['X-Title'] || 'TensorBlock Studio',
        ...config?.headers,
      },
      ...config,
    });
    
    // Store services
    this.settingsService = settingsService;
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return 'OpenRouter';
  }

  /**
   * Get the capabilities supported by OpenRouter
   */
  get capabilities(): AIServiceCapability[] {
    return [
      AIServiceCapability.TextCompletion,
      AIServiceCapability.ChatCompletion,
      AIServiceCapability.ImageGeneration,
      AIServiceCapability.FunctionCalling,
      AIServiceCapability.ToolUsage,
      AIServiceCapability.VisionAnalysis,
    ];
  }

  /**
   * Get the available models for OpenRouter
   */
  get availableModels(): string[] {
    return this.apiModels;
  }

  /**
   * Fetch the list of available models from OpenRouter
   */
  public async fetchAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get<{ data: Array<{ id: string }> }>('/models');
      this.apiModels = response.data.map(model => model.id);
      return this.apiModels;
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
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
   * Implementation of text completion for OpenRouter
   */
  protected async completionImplementation(prompt: string, options: CompletionOptions): Promise<string> {
    // OpenRouter doesn't have a dedicated completions endpoint like OpenAI
    // Convert text completion to chat completion
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
   * Implementation of chat completion for OpenRouter
   */
  protected async chatCompletionImplementation(messages: Message[], options: CompletionOptions): Promise<Message> {
    // Validate API key before making the request
    if (!this.hasValidApiKey()) {
      throw new Error(`API key not configured for ${this.name} service`);
    }
    
    const completionOptions = {
      model: options.model || OPENROUTER_MODELS.CLAUDE_3_HAIKU, // More cost-effective default
      messages,
      max_tokens: options.max_tokens || options.maxTokens || 1000,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? options.topP ?? 1.0,
      frequency_penalty: options.frequency_penalty ?? options.frequencyPenalty ?? 0,
      presence_penalty: options.presence_penalty ?? options.presencePenalty ?? 0,
      stop: options.stop,
      user: options.user,
      // OpenRouter specific options
      transforms: ['middle-out'],
      route: 'fallback',
    };

    try {
      const response = await this.client.post<OpenRouterCompletionResponse>(
        '/chat/completions',
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

      throw new Error('No chat completion choices returned from OpenRouter API');
    } catch (error) {
      // Check for auth errors
      if ((error as AxiosError).response?.status === 401 || 
          (error as AxiosError).response?.status === 403) {
        throw this.handleAuthError(error);
      }
      
      // Log detailed error information
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('OpenRouter chat completion error details:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          request: {
            model: completionOptions.model,
            messageCount: completionOptions.messages.length
          }
        });
      }
      console.error('OpenRouter chat completion error:', error);
      throw error;
    }
  }

  /**
   * Generate an image using OpenRouter (which routes to services like DALL-E)
   */
  public async generateImage(
    prompt: string, 
    options: { 
      model?: string; 
      size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
      quality?: 'standard' | 'hd';
      n?: number;
      style?: 'vivid' | 'natural';
      responseFormat?: 'url' | 'b64_json';
      user?: string;
    } = {}
  ): Promise<string[]> {
    if (!this.supportsCapability(AIServiceCapability.ImageGeneration)) {
      throw new Error(`${this.name} does not support image generation`);
    }

    const imageOptions = {
      model: options.model || OPENROUTER_MODELS.DALLE_3,
      prompt,
      n: options.n || 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'vivid',
      response_format: options.responseFormat || 'url',
      user: options.user,
    };

    try {
      const response = await this.client.post<OpenRouterImageGenerationResponse>(
        '/images/generations',
        imageOptions
      );

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from OpenRouter image generation API');
      }

      return response.data.map(item => item.url || `data:image/png;base64,${item.b64_json || ''}`);
    } catch (error) {
      console.error('OpenRouter image generation error:', error);
      throw error;
    }
  }
} 