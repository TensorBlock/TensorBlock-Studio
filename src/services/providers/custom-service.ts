import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai';
import { Message } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { StreamControlHandler } from '../streaming-control';
import { AIServiceCapability } from '../../types/capabilities';
import { mapModelCapabilities } from '../../types/capabilities';
import { ModelSettings } from '../../types/settings';
import { SettingsService } from '../settings-service';
import { CommonProviderHelper } from './common-provider-service';

/**
 * Implementation of Forge service provider using the AI SDK
 */
export class CustomService implements AiServiceProvider {

  private settingsService: SettingsService;
  private openAIProvider: OpenAIProvider;
  private apiModels: ModelSettings[] = [];

  private baseURL: string | undefined;
  private apiKey: string;

  private providerID: string = '';

  private apiVersion: string = 'v1';

  /**
   * Create a new Forge service provider
   */
  constructor(providerID: string) {
    this.providerID = providerID;
    
    this.settingsService = SettingsService.getInstance();
    const providerSettings = this.settingsService.getProviderSettings(this.providerID);
    const apiKey = providerSettings.apiKey;
    const baseURL = providerSettings.baseUrl;

    this.baseURL = `${baseURL}/${this.apiVersion}`;
    this.apiKey = apiKey;

    this.openAIProvider = createOpenAI({
      apiKey: this.apiKey,
      compatibility: 'compatible',
      baseURL: this.baseURL,
      name: this.providerID,
    });
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    const providerSettings = this.settingsService.getProviderSettings(this.providerID);
    const error = new Error('Custom provider settings: ' + JSON.stringify(providerSettings));
    console.log(error);
    console.log('Provider Name: ', providerSettings.providerName);
    return providerSettings.providerName;
  }

  /**
   * Get the ID of the service provider
   */
  get id(): string {
    return this.providerID;
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
    const models = this.settingsService.getModels(this.providerID);

    this.apiModels = models;

    return this.apiModels;
  }
  
  /**
   * Get the capabilities of a model with this provider
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getModelCapabilities(modelId: string): AIServiceCapability[] {
    // Get model data by modelId
    const models = this.settingsService.getModels(this.providerID);
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
    this.apiKey = apiKey;
    this.recreateClient();
  }

  /**
   * Setup authentication for OpenAI
   */
  public recreateClient(): void {
    this.openAIProvider = createOpenAI({
      apiKey: this.apiKey,
      compatibility: 'compatible',
      baseURL: this.baseURL,
      name: this.providerID,
    });
  }

  /**
   * Check if the service has a valid API key
   */
  public hasValidApiKey(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Get a streaming chat completion
   */
  public async getChatCompletion(
    messages: Message[],
    options: CompletionOptions,
    streamController: StreamControlHandler
  ): Promise<Message> {

    const modelInstance = this.openAIProvider.languageModel(options.model);

    return CommonProviderHelper.getChatCompletionByModel(modelInstance, messages, options, streamController);
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

    const imageModel = this.openAIProvider.imageModel('dall-e-3');

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