import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageRole } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { SettingsService } from '../settings-service';
import { StreamControlHandler } from '../streaming-control';

export const OPENAI_PROVIDER_NAME = 'OpenAI';

/**
 * Implementation of OpenAI service provider using the AI SDK
 */
export class OpenAIService implements AiServiceProvider {
  private settingsService: SettingsService;
  private OpenAiProviderInstance: OpenAIProvider;
  private _apiKey: string = '';
  private apiModels: string[] = [];

  /**
   * Create a new OpenAI service provider
   */
  constructor() {
    this.settingsService = SettingsService.getInstance();
    const openaiSettings = this.settingsService.getProviderSettings(OPENAI_PROVIDER_NAME);
    
    this._apiKey = openaiSettings.apiKey || '';
    
    this.OpenAiProviderInstance = this.createOpenAIClient();
  }

  /**
   * Create the OpenAI client with current settings
   */
  private createOpenAIClient() {
    console.log('Creating OpenAI client');
    console.log(this._apiKey);
    return createOpenAI({
      apiKey: this._apiKey,
      compatibility: 'strict',
      name: OPENAI_PROVIDER_NAME
    });
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return OPENAI_PROVIDER_NAME;
  }

  /**
   * Get the available models for this provider
   */
  get availableModels(): string[] | undefined {
    return this.apiModels.length > 0 
      ? this.apiModels 
      : ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }

  /**
   * Fetch the list of available models from OpenAI
   */
  public async fetchAvailableModels(): Promise<string[]> {
    this.apiModels = [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo'
    ];

    return this.apiModels;
    
    // try {
    //   const response = await this.client.get<{ data: Array<{ id: string }> }>('/models');
    //   this.apiModels = response.data.map(model => model.id);
    //   return this.apiModels;
    // } catch (error) {
    //   console.error('Failed to fetch OpenAI models:', error);
    //   return this.apiModels;
    // }
  }

  /**
   * Update the API key for OpenAI
   */
  public updateApiKey(apiKey: string): void {
    this._apiKey = apiKey;
    this.setupAuthentication();
  }

  /**
   * Setup authentication for OpenAI
   */
  public setupAuthentication(): void {
    this.OpenAiProviderInstance = this.createOpenAIClient();
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
    if (!this.hasValidApiKey()) {
      throw new Error('No API key provided for OpenAI');
    }

    try {
      const model = this.OpenAiProviderInstance(options.model);
      console.log('Model:', model.modelId);
      
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      console.log('Formatted messages:', formattedMessages);

      let fullText = '';

      if (options.stream) {
        console.log('Streaming OpenAI response');
        const { textStream } = await streamText({
          model,
          abortSignal: streamController.getAbortSignal(),
          messages: formattedMessages,
          temperature: options.temperature,
          maxTokens: options.max_tokens,
          topP: options.top_p,
          frequencyPenalty: options.frequency_penalty,
          presencePenalty: options.presence_penalty,
          onFinish: () => {
            console.log('OpenAI streaming chat completion finished');
            streamController.onFinish();
          },
          
          onError: (error) => {
            console.error('OpenAI streaming chat completion error:', error);
            throw new Error(`OpenAI streaming chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        });

        for await (const textPart of textStream) {
          fullText += textPart;
          streamController.onChunk(fullText);
        }
      }
      else{
        const { text } = await generateText({
          model,
          messages: formattedMessages,
          temperature: options.temperature,
          maxTokens: options.max_tokens,
          topP: options.top_p,
          frequencyPenalty: options.frequency_penalty,
          presencePenalty: options.presence_penalty
        });

        fullText = text;
        streamController.onFinish();
      }

      return {
        messageId: uuidv4(),
        conversationId: messages[0].conversationId,
        role: 'assistant' as MessageRole,
        content: fullText,
        timestamp: new Date(),
        provider: this.name,
        model: options.model
      };

    } catch (error) {
      // If the error is an AbortError, we don't need to log it
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      console.error('OpenAI streaming chat completion error:', error);
      throw new Error(`OpenAI streaming chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
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

    // if (!this.hasValidApiKey()) {
    //   throw new Error('No API key provided for OpenAI');
    // }

    // try {
    //   const response = await generateImage({
    //     model: 'dall-e-3',
    //     prompt,
    //     n: 1,
    //     size: options.size || '1024x1024',
    //     style: options.style || 'vivid',
    //   });

    //   if (!response.ok) {
    //     const errorData = await response.json();
    //     throw new Error(`Image generation failed: ${errorData.error?.message || response.statusText}`);
    //   }

    //   const data = await response.json();
    //   return data.data.map((item: any) => item.url);
    // } catch (error) {
    //   console.error('OpenAI image generation error:', error);
    //   throw new Error(`OpenAI image generation failed: ${error instanceof Error ? error.message : String(error)}`);
    // }
  }
} 