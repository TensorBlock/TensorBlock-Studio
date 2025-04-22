import { createOpenAI, openai, OpenAIProvider } from '@ai-sdk/openai';
import { Message } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { StreamControlHandler } from '../streaming-control';
import { CommonProviderHelper } from './common-provider-service';
import { Provider, ToolChoice, ToolSet } from 'ai';
import { SettingsService } from '../settings-service';
import { AIServiceCapability, mapModelCapabilities } from '../../types/capabilities';
import { ModelSettings } from '../../types/settings';

export const OPENAI_PROVIDER_NAME = 'OpenAI';

/**
 * Implementation of OpenAI service provider using the AI SDK
 */
export class OpenAIService implements AiServiceProvider {

  private commonProviderHelper: CommonProviderHelper;
  private apiModels: ModelSettings[] = [];

  /**
   * Create a new OpenAI service provider
   */
  constructor() {
    this.commonProviderHelper = new CommonProviderHelper(OPENAI_PROVIDER_NAME, this.createClient);
  }

  private createClient(apiKey: string): Provider {
    return createOpenAI({
      apiKey: apiKey,
      compatibility: 'strict',
      name: OPENAI_PROVIDER_NAME,
    });
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return OPENAI_PROVIDER_NAME;
  }

  /**
   * Get the ID of the service provider
   */
  get id(): string {
    return OPENAI_PROVIDER_NAME;
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
    const models = settingsService.getModels(OPENAI_PROVIDER_NAME);

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
      true
    );
  }

  /**
   * Update the API key for OpenAI
   */
  public updateApiKey(apiKey: string): void {
    this.commonProviderHelper.updateApiKey(apiKey);
  }

  /**
   * Setup authentication for OpenAI
   */
  public recreateClient(): void {
    this.commonProviderHelper.recreateClient();
  }

  /**
   * Check if the service has a valid API key
   */
  public hasValidApiKey(): boolean {
    return this.commonProviderHelper.hasValidApiKey();
  }

  /**
   * Get a streaming chat completion
   */
  public async getChatCompletion(
    messages: Message[],
    options: CompletionOptions,
    streamController: StreamControlHandler
  ): Promise<Message> {

    const isWebSearchActive = SettingsService.getInstance().getWebSearchActive();
    
    if (isWebSearchActive) {
      return this.getChatCompletionWithWebSearch(messages, options, streamController);
    }

    return this.commonProviderHelper.getChatCompletion(messages, options, streamController);
  }

  public async getChatCompletionWithWebSearch(
    messages: Message[],
    options: CompletionOptions,
    streamController: StreamControlHandler
  ): Promise<Message> {

    const tools: ToolSet = {
      web_search_preview: openai.tools.webSearchPreview({
        // optional configuration:
        searchContextSize: 'high',
        userLocation: {
          type: 'approximate',
          city: 'San Francisco',
          region: 'California',
        },
      }),
    };

    const toolChoice: ToolChoice<ToolSet> = {
      type: 'tool',
      toolName: 'web_search_preview',
    }
    
    const modelInstance = (this.commonProviderHelper.ProviderInstance as OpenAIProvider).responses(options.model);

    options.stream = false;

    return CommonProviderHelper.getChatCompletionByModel(modelInstance, messages, options, streamController, tools, toolChoice);
  }

  /**
   * Generate an image
   */
  public async getImageGeneration(
    prompt: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: {
      size?: `${number}x${number}`;
      aspectRatio?: `${number}:${number}`;
      style?: string;
      quality?: string;
    } = {}
    
  ): Promise<string[]> {

    // const imageModel = openai.imageModel('dall-e-3');

    // const result = await imageModel.doGenerate({
    //   prompt: prompt,
    //   n: 1,
    //   size: options.size || '1024x1024',
    //   aspectRatio: options.aspectRatio || '1:1',
    //   seed: 42,
    //   providerOptions: {
    //     "openai": {
    //       "style": options.style || 'vivid'
    //     }
    //   }
    // });

    // return result.images;

    return [];
  }
} 