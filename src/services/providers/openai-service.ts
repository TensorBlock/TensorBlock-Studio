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
 * Response format for text completions
 */
export interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    text: string;
    index: number;
    logprobs: null | {
      tokens: string[];
      token_logprobs: number[];
      top_logprobs: Record<string, number>[] | null;
      text_offset: number[];
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
 * Response format for chat completions
 */
export interface OpenAIChatCompletionResponse {
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
export interface OpenAIImageGenerationResponse {
  created: number;
  data: Array<{ 
    url?: string; 
    b64_json?: string; 
    revised_prompt?: string 
  }>;
}

/**
 * Default models for OpenAI
 */
// export const OPENAI_MODELS = {
//   GPT_3_5_TURBO: 'gpt-3.5-turbo',
//   GPT_3_5_TURBO_16K: 'gpt-3.5-turbo-16k',
//   GPT_4: 'gpt-4',
//   GPT_4_TURBO: 'gpt-4-turbo',
//   GPT_4_VISION: 'gpt-4-vision-preview',
//   GPT_4_32K: 'gpt-4-32k',
//   TEXT_EMBEDDING_ADA_002: 'text-embedding-ada-002',
//   DALL_E_3: 'dall-e-3',
//   DALL_E_2: 'dall-e-2',
//   WHISPER_1: 'whisper-1',
//   TTS_1: 'tts-1',
//   TTS_1_HD: 'tts-1-hd',
// };

/**
 * Implementation of OpenAI service provider
 */
export class OpenAIService extends AiServiceProvider {
  private settingsService: SettingsService;
  private apiModels: string[] = [];

  /**
   * Create a new OpenAI service provider
   */
  constructor(config?: Partial<AiServiceConfig>) {
    // Get settings from settings service
    const settingsService = SettingsService.getInstance();
    const openaiSettings = settingsService.getProviderSettings('OpenAI');
    
    // Apply default configuration
    super({
      baseURL: config?.baseURL || API_CONFIG.openai.baseUrl,
      apiKey: config?.apiKey || getValidatedApiKey(openaiSettings.apiKey || API_CONFIG.openai.apiKey),
      organizationId: config?.organizationId || getValidatedApiKey(openaiSettings.organizationId || API_CONFIG.openai.organizationId),
      timeout: config?.timeout || API_CONFIG.openai.defaultTimeout,
      headers: {
        'OpenAI-Beta': 'assistants=v1',
        ...config?.headers,
      },
      ...config,
    });

    // Store services
    this.settingsService = settingsService;

    // We're omitting the API version header as it's not needed
    // and can cause compatibility issues with the OpenAI API
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return 'OpenAI';
  }

  /**
   * Get the capabilities supported by OpenAI
   */
  get capabilities(): AIServiceCapability[] {
    return [
      AIServiceCapability.TextCompletion,
      AIServiceCapability.ChatCompletion,
      AIServiceCapability.ImageGeneration,
      AIServiceCapability.ImageEditing,
      AIServiceCapability.AudioTranscription,
      AIServiceCapability.AudioGeneration,
      AIServiceCapability.Embedding,
      AIServiceCapability.FunctionCalling,
      AIServiceCapability.ToolUsage,
      AIServiceCapability.VisionAnalysis,
      AIServiceCapability.FineTuning,
    ];
  }

  /**
   * Get the available models for OpenAI
   */
  get availableModels(): string[] | undefined {
    return this.apiModels;
  }

  /**
   * Fetch the list of available models from OpenAI
   */
  public async fetchAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get<{ data: Array<{ id: string }> }>('/models');
      this.apiModels = response.data.map(model => model.id);
      return this.apiModels;
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
      return this.apiModels;
    }
  }

  /**
   * Implementation of text completion for OpenAI
   */
  protected async completionImplementation(prompt: string, options: CompletionOptions): Promise<string> {
    // Validate API key before making the request
    if (!this.hasValidApiKey()) {
      throw new Error(`API key not configured for ${this.name} service`);
    }

    const completionOptions = {
      model: options.model || 'gpt-3.5-turbo',
      prompt,
      max_tokens: options.max_tokens || options.maxTokens || 1000,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? options.topP ?? 1.0,
      frequency_penalty: options.frequency_penalty ?? options.frequencyPenalty ?? 0,
      presence_penalty: options.presence_penalty ?? options.presencePenalty ?? 0,
      stop: options.stop,
      user: options.user,
    };

    console.log('completionOptions', completionOptions);

    try {
      const response = await this.client.post<OpenAICompletionResponse>(
        '/completions',
        completionOptions
      );

      if (response.choices && response.choices.length > 0) {
        return response.choices[0].text.trim();
      }

      throw new Error('No completion choices returned');
    } catch (error) {
      // Check for auth errors first
      if ((error as AxiosError).response?.status === 401 || 
          (error as AxiosError).response?.status === 403) {
        throw this.handleAuthError(error);
      }
      
      // Log detailed error information
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('OpenAI text completion error details:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          request: {
            model: completionOptions.model,
            prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
          }
        });
      }
      console.error('OpenAI completion error:', error);
      throw error;
    }
  }

  /**
   * Implementation of chat completion for OpenAI
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
      model: options.model || 'gpt-3.5-turbo',
      messages: messagesForAI,
      max_tokens: options.max_tokens || options.maxTokens,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? options.topP ?? 1.0,
      frequency_penalty: options.frequency_penalty ?? options.frequencyPenalty ?? 0,
      presence_penalty: options.presence_penalty ?? options.presencePenalty ?? 0,
      stop: options.stop,
      user: options.user,
    };

    try {
      const response = await this.client.post<OpenAIChatCompletionResponse>(
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

      throw new Error('No chat completion choices returned');
    } catch (error) {
      // Check for auth errors first
      if ((error as AxiosError).response?.status === 401 || 
          (error as AxiosError).response?.status === 403) {
        throw this.handleAuthError(error);
      }
      
      // Log detailed error information
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('OpenAI chat completion error details:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          request: {
            model: completionOptions.model,
            messageCount: completionOptions.messages.length
          }
        });
      }
      console.error('OpenAI chat completion error:', error);
      throw error;
    }
  }

  /**
   * Generate an image using DALL-E
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
      model: options.model || 'dall-e-3',
      prompt,
      n: options.n || 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'vivid',
      response_format: options.responseFormat || 'url',
      user: options.user,
    };

    try {
      const response = await this.client.post<OpenAIImageGenerationResponse>(
        '/images/generations',
        imageOptions
      );

      return response.data.map(item => item.url || `data:image/png;base64,${item.b64_json}`);
    } catch (error) {
      console.error('OpenAI image generation error:', error);
      throw error;
    }
  }
} 