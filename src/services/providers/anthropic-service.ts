import Anthropic from '@anthropic-ai/sdk';
import { Message, MessageRole } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { StreamControlHandler } from '../streaming-control';
import { SettingsService } from '../settings-service';
import { mapModelCapabilities } from '../../types/capabilities';
import { AIServiceCapability } from '../../types/capabilities';
import { ModelSettings } from '../../types/settings';
import { LanguageModelUsage } from 'ai';
import { v4 as uuidv4 } from 'uuid';

export const ANTHROPIC_PROVIDER_NAME = 'Anthropic';

/**
 * Implementation of Anthropic service provider using the AI SDK
 */
export class AnthropicService implements AiServiceProvider {
  private settingsService: SettingsService;
  private _apiKey: string = '';
  private anthropic: Anthropic;

  private apiModels: ModelSettings[] = [];

  /**
   * Create a new Anthropic service provider
   */
  constructor() {
    this.settingsService = SettingsService.getInstance();
    const providerSettings = this.settingsService.getProviderSettings(ANTHROPIC_PROVIDER_NAME);
    
    this._apiKey = providerSettings.apiKey || '';

    this.anthropic = new Anthropic({
      apiKey: this._apiKey,
      defaultHeaders: {
        'anthropic-beta': 'output-128k-2025-02-19'
      },
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return ANTHROPIC_PROVIDER_NAME;
  }

  /**
   * Get the ID of the service provider
   */
  get id(): string {
    return ANTHROPIC_PROVIDER_NAME;
  }
  
  /**
   * Get the available models for this provider
   */
  get availableModels(): ModelSettings[] | undefined {
    return this.apiModels;
  }

  /**
   * Fetch the list of available models from OpenAI
   */
  public async fetchAvailableModels(): Promise<ModelSettings[]> {
    const settingsService = SettingsService.getInstance();
    const models = settingsService.getModels(ANTHROPIC_PROVIDER_NAME);

    this.apiModels = models;

    return this.apiModels;
  }

  /**
   * Get the capabilities of a model with this provider
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getModelCapabilities(model: string): AIServiceCapability[] {
    return mapModelCapabilities(
      false,
      false,
      false,
      false,
      false
    );
  }

  /**
   * Update the API key for OpenAI
   */
  public updateApiKey(apiKey: string): void {
    this._apiKey = apiKey;
    this.recreateClient();
  }

  /**
   * Setup authentication for OpenAI
   */
  public recreateClient(): void {
    this.anthropic = new Anthropic({
      apiKey: this._apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * Check if the service has a valid API key
   */
  public hasValidApiKey(): boolean {
    return !!this._apiKey && this._apiKey.length > 0;
  }

  /**
   * Get a streaming chat completion
   */
  public async getChatCompletion(
    messages: Message[],
    options: CompletionOptions,
    streamController: StreamControlHandler
  ): Promise<Message> {

    if(options.stream){
      return this.streamText(messages, options, streamController);
    }

    return this.generateText(messages, options, streamController);
  }

  private async generateText(
    messages: Message[],
    options: CompletionOptions,
    streamController: StreamControlHandler
  ){
    const formattedMessages: Anthropic.MessageParam[] = messages.map((message) => ({
      role: message.role === 'system' ? 'user' : message.role as Anthropic.MessageParam['role'],
      content: message.content as Anthropic.MessageParam['content'],
    }));
    
    const response = await this.anthropic.messages.create({
      model: options.model,
      max_tokens: options.max_tokens || 2048,
      stream: options.stream,
      messages: formattedMessages
    }) as Anthropic.Message;

    if(response.content[0].type === 'text'){
      const fullText = response.content[0].text;
      streamController.onChunk(fullText);

      const usage: LanguageModelUsage = {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      };
      streamController.onFinish(usage);
      
      return {
        messageId: uuidv4(),
        conversationId: messages[0].conversationId,
        role: 'assistant' as MessageRole,
        content: fullText,
        timestamp: new Date(),
        provider: options.provider,
        model: options.model,
        tokens: 0,
        fatherMessageId: null,
        childrenMessageIds: [],
        preferIndex: 0
      };
    }

    throw new Error('Anthropic response is not a text');
  }

  private async streamText(
    messages: Message[],
    options: CompletionOptions,
    streamController: StreamControlHandler
  ){
    const formattedMessages: Anthropic.MessageParam[] = messages.map((message) => ({
      role: message.role === 'system' ? 'user' : message.role as Anthropic.MessageParam['role'],
      content: message.content as Anthropic.MessageParam['content'],
    }));

    let fullText = '';

    //I want to put the stream in a returnable promise
    const streamPromise = new Promise<Message>((resolve, reject) => {

      const stream = this.anthropic.messages.stream({
        model: options.model,
        max_tokens: options.max_tokens || 2048,
        stream: options.stream,
        messages: formattedMessages,
      }).on('text', (text) => {
        fullText += text;
        streamController.onChunk(fullText);
      }).on('error', (error) => {
        reject(error);
      }).on('finalMessage', (message) => {
        const usage: LanguageModelUsage = {
          promptTokens: message.usage.input_tokens,
          completionTokens: message.usage.output_tokens,
          totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        };
        streamController.onFinish(usage);

        const aiResponse: Message = {
          messageId: uuidv4(),
          conversationId: messages[0].conversationId,
          role: 'assistant' as MessageRole,
          content: fullText,
          timestamp: new Date(),
          provider: options.provider,
          model: options.model,
          tokens: 0,
          fatherMessageId: null,
          childrenMessageIds: [],
          preferIndex: 0
        };

        resolve(aiResponse);
      }).on('abort', () => {
        const aiResponse: Message = {
          messageId: uuidv4(),
          conversationId: messages[0].conversationId,
          role: 'assistant' as MessageRole,
          content: fullText,
          timestamp: new Date(),
          provider: options.provider,
          model: options.model,
          tokens: 0,
          fatherMessageId: null,
          childrenMessageIds: [],
          preferIndex: 0
        };

        resolve(aiResponse);
      });

      streamController.getAbortSignal().addEventListener('abort', () => {
        stream.abort();
      });
    });

    return streamPromise;
  }

  /**
   * Generate an image
   */
  public async getImageGeneration(
    prompt: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: {
      size?: `${number}x${number}`;
      style?: string;
      quality?: string;
    } = {}
  ): Promise<string[]> {
    throw new Error('Not implemented');
  }
} 
