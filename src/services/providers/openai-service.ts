import { 
  AiServiceProvider, 
  AIServiceCapability, 
  AiServiceConfig, 
  CompletionOptions 
} from '../core/ai-service-provider';
import { AxiosError, AxiosHeaders, AxiosProgressEvent } from 'axios';
import { API_CONFIG, getValidatedApiKey } from '../core/config';
import { SettingsService } from '../settings-service';
import { Message } from '../../types/chat';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
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
 * Response format for streaming chat completions
 */
export interface OpenAIChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    delta: {
      role?: string;
      content?: string;
    };
    index: number;
    finish_reason: string | null;
  }[];
}

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
      AIServiceCapability.StreamingCompletion,
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
  public override async fetchAvailableModels(): Promise<string[]> {
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
   * Update the API key for OpenRouter
   */
  public override updateApiKey(ApiKey: string): void {
    this.config.apiKey = ApiKey;
    this.setupAuthenticationByProvider();
  }

  /**
   * Setup authentication for OpenAI
   */
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
      max_tokens: options.max_tokens ?? undefined,
      temperature: options.temperature ?? 1.0,
      top_p: options.top_p ?? 1.0,
      frequency_penalty: options.frequency_penalty ?? 0,
      presence_penalty: options.presence_penalty ?? 0,
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
      model: options.model,
      messages: messagesForAI,
      max_tokens: options.max_tokens ?? undefined,
      temperature: options.temperature ?? 1.0,
      top_p: options.top_p ?? 1.0,
      frequency_penalty: options.frequency_penalty ?? 0,
      presence_penalty: options.presence_penalty ?? 0,
      stop: options.stop,
      user: options.user,
    };

    try {
      console.log('OpenAI chat completion options:', completionOptions);

      const response = await this.client.post<OpenAIChatCompletionResponse>(
        '/chat/completions',
        completionOptions
      );

      console.log('OpenAI chat completion response:', response);

      if (response.choices && response.choices.length > 0) {
        const { role, content } = response.choices[0].message;
        return { 
          id: uuidv4(),
          role: role as Message['role'], 
          content: content.trim(),
          timestamp: new Date(),
          provider: this.name,
          model: response.model
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
   * Implementation of streaming chat completion for OpenAI
   */
  protected async streamChatCompletionImplementation(
    messages: Message[],
    options: CompletionOptions,
    onChunk: (chunk: string) => void
  ): Promise<Message> {
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
      max_tokens: options.max_tokens ?? undefined,
      temperature: options.temperature ?? 1.0,
      top_p: options.top_p ?? 1.0,
      frequency_penalty: options.frequency_penalty ?? 0,
      presence_penalty: options.presence_penalty ?? 0,
      stop: options.stop,
      user: options.user,
      stream: true,
    };

    let accumulatedContent = '';
    let responseRole = 'assistant';
    let responseModel = options.model;

    try {
      console.log('OpenAI streaming chat completion options:', completionOptions);

      // Use axios directly instead of the client wrapper for streaming
      await axios({
        method: 'post',
        url: `${this.config.baseURL}/chat/completions`,
        data: completionOptions,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getSanitizedApiKey()}`,
          ...this.config.headers
        },
        responseType: 'text', // Changed to text instead of stream
        signal: options.signal, // Pass the abort signal if provided
        onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
          // Safely access the responseText property
          const target = progressEvent.event?.target as { responseText?: string } | undefined;
          const responseText = target?.responseText || '';
          
          // Process the partial text response
          this.processStreamData(responseText, (content) => {
            accumulatedContent += content;
            onChunk(content);
          }, (role) => {
            responseRole = role;
          }, (model) => {
            responseModel = model;
          });
        }
      });

      console.log('Streaming response complete');

      return {
        id: uuidv4(),
        role: responseRole as Message['role'],
        content: accumulatedContent.trim(),
        timestamp: new Date(),
        provider: this.name,
        model: responseModel
      };
    } catch (err) {
      // Check if this is an abort error
      const error = err as Error;
      if (error.name === 'AbortError' || (error as { code?: string }).code === 'ERR_CANCELED') {
        console.log('Streaming request was aborted');
        // Return a partial message with what we've accumulated so far
        return {
          id: uuidv4(),
          role: responseRole as Message['role'],
          content: accumulatedContent.trim() || '[Response was stopped]',
          timestamp: new Date(),
          provider: this.name,
          model: responseModel
        };
      }

      // Check for auth errors first
      if ((err as AxiosError).response?.status === 401 || 
          (err as AxiosError).response?.status === 403) {
        throw this.handleAuthError(err);
      }
      
      // Log detailed error information
      const axiosError = err as AxiosError;
      if (axiosError.response) {
        console.error('OpenAI streaming chat completion error details:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          request: {
            model: completionOptions.model,
            messageCount: completionOptions.messages.length
          }
        });
      }
      console.error('OpenAI streaming chat completion error:', err);
      throw err;
    }
  }

  /**
   * Process streaming data from OpenAI
   */
  private processStreamData(
    data: string, 
    onContent: (content: string) => void,
    onRole: (role: string) => void,
    onModel: (model: string) => void
  ): void {
    // Split the response by lines and process each SSE line
    const lines = data.split('\n');
    let buffer = '';

    for (const line of lines) {
      // Accumulate lines until we have a complete JSON object
      if (line.startsWith('data: ')) {
        const jsonLine = line.replace(/^data: /, '').trim();
        
        // Skip [DONE] marker
        if (jsonLine === '[DONE]') continue;
        
        try {
          // Try to parse the JSON
          const parsedChunk = JSON.parse(jsonLine);
          
          if (parsedChunk.choices && parsedChunk.choices.length > 0) {
            const choice = parsedChunk.choices[0];
            
            // Handle both streaming formats
            if (choice.delta) {
              // SSE streaming format
              const { delta } = choice;
              if (delta.role) onRole(delta.role);
              if (delta.content) onContent(delta.content);
              if (parsedChunk.model) onModel(parsedChunk.model);
            } else if (choice.message) {
              // Regular format in a streaming response
              const { message } = choice;
              if (message.role) onRole(message.role);
              if (message.content) onContent(message.content);
              if (parsedChunk.model) onModel(parsedChunk.model);
            }
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // If it's not complete JSON, add to buffer
          buffer += jsonLine;
          
          // Try to parse the buffer
          try {
            const parsedBuffer = JSON.parse(buffer);
            // If it parses successfully, process it and clear buffer
            if (parsedBuffer.choices && parsedBuffer.choices.length > 0) {
              const { delta } = parsedBuffer.choices[0];
              if (delta.role) onRole(delta.role);
              if (delta.content) onContent(delta.content);
              if (parsedBuffer.model) onModel(parsedBuffer.model);
            }
            buffer = '';
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (bufferError) {
            // Buffer isn't complete JSON yet, keep collecting
          }
        }
      }
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