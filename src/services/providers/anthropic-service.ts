import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { AIServiceCapability, mapModelCapabilities } from '../core/capabilities';
import { SettingsService } from '../settings-service';

/**
 * Implementation of Anthropic service provider using the AI SDK
 */
export class AnthropicService implements AiServiceProvider {
  private settingsService: SettingsService;
  private anthropic: ReturnType<typeof createAnthropic>;
  private _apiKey: string = '';
  private _apiVersion: string = '';
  private _baseUrl: string = 'https://api.anthropic.com';
  private _apiModels: string[] = [];

  /**
   * Create a new Anthropic service provider
   */
  constructor() {
    this.settingsService = SettingsService.getInstance();
    const anthropicSettings = this.settingsService.getProviderSettings('Anthropic');
    
    this._apiKey = anthropicSettings.apiKey || '';
    this._apiVersion = anthropicSettings.apiVersion || '2023-06-01';
    this._baseUrl = anthropicSettings.baseUrl || 'https://api.anthropic.com';
    
    this.anthropic = this.createAnthropicClient();
  }

  /**
   * Create the Anthropic client with current settings
   */
  private createAnthropicClient() {
    return createAnthropic({
      apiKey: this._apiKey,
      baseURL: this._baseUrl,
      // version is handled internally in the library
    });
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return 'Anthropic';
  }

  /**
   * Get the capabilities supported by this provider
   */
  get capabilities(): AIServiceCapability[] {
    return [
      AIServiceCapability.TextCompletion,
      AIServiceCapability.ChatCompletion,
      AIServiceCapability.VisionAnalysis,
      AIServiceCapability.StreamingCompletion,
      AIServiceCapability.ToolUsage
    ];
  }

  /**
   * Get the available models for this provider
   */
  get availableModels(): string[] | undefined {
    return this._apiModels.length > 0 
      ? this._apiModels 
      : ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
  }

  /**
   * Fetch the list of available models from Anthropic
   */
  public async fetchAvailableModels(): Promise<string[]> {
    try {
      // Hardcoded list of models as Anthropic doesn't have a free models endpoint
      this._apiModels = [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307', 
        'claude-3-5-sonnet-20240620'
      ];
      
      return this._apiModels;
    } catch (error) {
      console.error('Failed to fetch Anthropic models:', error);
      return this._apiModels;
    }
  }

  /**
   * Update the API key for Anthropic
   */
  public updateApiKey(apiKey: string): void {
    this._apiKey = apiKey;
    this.setupAuthentication();
  }

  /**
   * Setup authentication for Anthropic
   */
  public setupAuthentication(): void {
    this.anthropic = this.createAnthropicClient();
  }

  /**
   * Check if the service has a valid API key
   */
  public hasValidApiKey(): boolean {
    return !!this._apiKey && this._apiKey.length > 0;
  }

  /**
   * Check if the provider supports a specific capability
   */
  public supportsCapability(capability: AIServiceCapability): boolean {
    return this.capabilities.includes(capability);
  }

  /**
   * Get a text completion
   */
  public async getCompletion(prompt: string, options: CompletionOptions): Promise<string> {
    if (!this.hasValidApiKey()) {
      throw new Error('No API key provided for Anthropic');
    }

    try {
      const model = this.anthropic(options.model || 'claude-3-haiku-20240307');
      
      const response = await generateText({
        model,
        prompt,
        temperature: options.temperature,
        maxTokens: options.max_tokens,
        topP: options.top_p,
        stop: options.stop,
      });

      return response.text;
    } catch (error) {
      console.error('Anthropic completion error:', error);
      throw new Error(`Anthropic completion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a chat completion
   */
  public async getChatCompletion(messages: Message[], options: CompletionOptions): Promise<Message> {
    if (!this.hasValidApiKey()) {
      throw new Error('No API key provided for Anthropic');
    }

    try {
      const model = this.anthropic(options.model || 'claude-3-haiku-20240307');
      
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await generateText({
        model,
        messages: formattedMessages,
        temperature: options.temperature,
        maxTokens: options.max_tokens,
        topP: options.top_p,
        stop: options.stop,
      });

      return {
        messageId: uuidv4(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        provider: this.name,
        model: options.model || 'claude-3-haiku-20240307'
      };
    } catch (error) {
      console.error('Anthropic chat completion error:', error);
      throw new Error(`Anthropic chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a streaming chat completion
   */
  public async streamChatCompletion(
    messages: Message[],
    options: CompletionOptions,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<Message> {
    if (!this.hasValidApiKey()) {
      throw new Error('No API key provided for Anthropic');
    }

    try {
      const model = this.anthropic(options.model || 'claude-3-haiku-20240307');
      
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      let fullText = '';

      await streamText({
        model,
        messages: formattedMessages,
        temperature: options.temperature,
        maxTokens: options.max_tokens,
        topP: options.top_p,
        stop: options.stop,
        onStreamStart: () => {
          fullText = '';
        },
        onToken: (token) => {
          fullText += token;
          onChunk(token);
        },
        signal
      });

      return {
        messageId: uuidv4(),
        conversationId: messages[0].conversationId,
        role: 'assistant',
        content: fullText,
        timestamp: new Date(),
        provider: this.name,
        model: options.model || 'claude-3-haiku-20240307'
      };
    } catch (error) {
      // If the error is an AbortError, we don't need to log it
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      console.error('Anthropic streaming chat completion error:', error);
      throw new Error(`Anthropic streaming chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 