import { generateText, LanguageModelV1, LanguageModelUsage, Provider, streamText, ToolSet, ToolChoice } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageRole } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { SettingsService } from '../settings-service';
import { StreamControlHandler } from '../streaming-control';
import { AIServiceCapability } from '../../types/capabilities';
import { mapModelCapabilities } from '../../types/capabilities';

/**
 * Implementation of OpenAI service provider using the AI SDK
 */
export class CommonProviderHelper implements AiServiceProvider {
  private settingsService: SettingsService;
  public ProviderInstance: Provider;
  private _apiKey: string = '';
  private apiModels: string[] = [];

  private providerName: string;
  private createProviderFunction: (apiKey: string) => Provider;


  /**
   * Create a new OpenAI service provider
   */
  constructor(
    providerName: string,
    createProviderFunction: (apiKey: string) => Provider) 
  {
    this.providerName = providerName;
    this.createProviderFunction = createProviderFunction;

    this.settingsService = SettingsService.getInstance();
    const providerSettings = this.settingsService.getProviderSettings(providerName);
    
    this._apiKey = providerSettings.apiKey || '';
    
    this.ProviderInstance = this.createClient();
  }

  /**
   * Create the OpenAI client with current settings
   */
  private createClient() {
    // console.log(`Creating ${this.providerName} client`);
    // console.log(this._apiKey);
    return this.createProviderFunction(this._apiKey);
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return this.providerName;
  }

  /**
   * Get the available models for this provider
   */
  get availableModels(): string[] | undefined {
    return this.apiModels.length > 0 
      ? this.apiModels 
      : ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }

  set availableModels(models: string[]) {
    this.apiModels = models;
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
   * Get the capabilities of a model with this provider
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getModelCapabilities(model: string): AIServiceCapability[] {
    return mapModelCapabilities(
      false,
      false,
      false,
      false,
      true
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
    // console.log(`Updating ${this.providerName} client`);
    // console.log(this._apiKey);
    this.ProviderInstance = this.createClient();
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
      throw new Error(`No API key provided for ${options.provider}`);
    }

    const modelInstance = this.ProviderInstance.languageModel(options.model);

    return CommonProviderHelper.getChatCompletionByModel(modelInstance, messages, options, streamController);
  }

  public static async getChatCompletionByModel(
    modelInstance: LanguageModelV1,
    messages: Message[],
    options: CompletionOptions,
    streamController: StreamControlHandler,
    tools: ToolSet | undefined = undefined,
    toolChoice: ToolChoice<ToolSet> | undefined = undefined
  ): Promise<Message> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      let fullText = '';

      if (options.stream) {
        console.log(`Streaming ${options.provider}/${options.model} response`);
        const result = streamText({
          model: modelInstance,
          abortSignal: streamController.getAbortSignal(),
          messages: formattedMessages,
          temperature: options.temperature,
          maxTokens: options.max_tokens,
          topP: options.top_p,
          frequencyPenalty: options.frequency_penalty,
          presencePenalty: options.presence_penalty,
          tools: tools,
          toolChoice: toolChoice,
          onFinish: (result: { usage: LanguageModelUsage }) => {
            console.log('OpenAI streaming chat completion finished');
            streamController.onFinish(result.usage);
          },
          onError: (error) => {
            console.error(`${options.provider}/${options.model} streaming chat completion error:`, error);
            throw new Error(`${options.provider}/${options.model} streaming chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        });

        for await (const textPart of result.textStream) {
          fullText += textPart;
          streamController.onChunk(fullText);
        }
      }
      else{
        console.log(`Generating ${options.provider}/${options.model} response`);
        const { text, usage, toolResults } = await generateText({
          model: modelInstance,
          messages: formattedMessages,
          temperature: options.temperature,
          maxTokens: options.max_tokens,
          topP: options.top_p,
          frequencyPenalty: options.frequency_penalty,
          presencePenalty: options.presence_penalty,
          tools: tools,
          toolChoice: toolChoice,
        });

        console.log('toolResults: ', toolResults);

        fullText = text;
        streamController.onChunk(fullText);
        streamController.onFinish(usage);
      }

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

    } catch (error) {
      // If the error is an AbortError, we don't need to log it
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      console.error(`${options.provider}/${options.model} chat completion error:`, error);
      throw new Error(`${options.provider}/${options.model} chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
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