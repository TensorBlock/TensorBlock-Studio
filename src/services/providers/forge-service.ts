import { createOpenAI } from '@ai-sdk/openai';
import { Message } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { StreamControlHandler } from '../streaming-control';
import { CommonProviderHelper } from './common-provider-service';
import { Provider } from 'ai';
import { AIServiceCapability } from '../../types/capabilities';
import { mapModelCapabilities } from '../../types/capabilities';
import { ModelSettings } from '../../types/settings';
import { SettingsService } from '../settings-service';
export const FORGE_PROVIDER_NAME = 'TensorBlock';

/**
 * Implementation of Forge service provider using the AI SDK
 */
export class ForgeService implements AiServiceProvider {

  private commonProviderHelper: CommonProviderHelper;
  private apiModels: ModelSettings[] = [];
  private settingsService: SettingsService;

  /**
   * Create a new Forge service provider
   */
  constructor() {
    this.settingsService = SettingsService.getInstance();
    this.apiModels = this.settingsService.getModels(FORGE_PROVIDER_NAME);
    this.commonProviderHelper = new CommonProviderHelper(FORGE_PROVIDER_NAME, this.createClient);
  }

  private createClient(apiKey: string): Provider {
    return createOpenAI({
      apiKey: apiKey,
      compatibility: 'compatible',
      baseURL: 'http://54.177.123.202:8000/v1',
      name: FORGE_PROVIDER_NAME,
    });
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return FORGE_PROVIDER_NAME;
  }

  /**
   * Get the ID of the service provider
   */
  get id(): string {
    return FORGE_PROVIDER_NAME;
  }

  /**
   * Get the available models for this provider
   */
  get availableModels(): ModelSettings[] | undefined {
    return this.apiModels;
  }

  /**
   * Fetch the list of available models from Forge
   */
  public async fetchAvailableModels(): Promise<ModelSettings[]> {
    const models = this.settingsService.getModels(FORGE_PROVIDER_NAME);

    this.apiModels = models;

    return this.apiModels;
  }
  
  /**
   * Get the capabilities of a model with this provider
   */
  getModelCapabilities(modelId: string): AIServiceCapability[] {
    // Get model data by modelId
    const models = this.settingsService.getModels(this.name);
    const modelData = models.find(x => x.modelId === modelId);
    let hasImageGeneration = false;

    if(modelData?.modelCapabilities.findIndex(x => x === AIServiceCapability.ImageGeneration) !== -1){
      hasImageGeneration = true;
    }

    return mapModelCapabilities(
      hasImageGeneration,
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
    return this.commonProviderHelper.getChatCompletion(messages, options, streamController);
  }

  /**
   * Generate an image
   */
  public async getImageGeneration(
    prompt: string,
    options: {
      size?: `${number}x${number}`;
      aspectRatio?: `${number}:${number}`;
      style?: string;
      quality?: string;
    }
  ): Promise<string[] | Uint8Array<ArrayBufferLike>[]> {

    const imageModel = this.commonProviderHelper.ProviderInstance.imageModel('dall-e-3');

    const result = await imageModel.doGenerate({
      prompt: prompt,
      n: 1,
      size: options.size || '1024x1024',
      aspectRatio: options.aspectRatio || '1:1',
      seed: 42,
      providerOptions: {
        "openai": {
          "style": options.style || 'vivid'
        }
      }
    });

    return result.images;
  }
} 