import { GoogleGenerativeAIProvider, createGoogleGenerativeAI } from '@ai-sdk/google';
import { Message } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { StreamControlHandler } from '../streaming-control';
import { CommonProviderHelper } from './common-provider-service';
import { SettingsService } from '../settings-service';
import { AIServiceCapability } from '../../types/capabilities';
import { mapModelCapabilities } from '../../types/capabilities';
import { LanguageModel } from 'ai';
import { ModelSettings } from '../../types/settings';

export const GEMINI_PROVIDER_NAME = 'Gemini';

/**
 * Implementation of Anthropic service provider using the AI SDK
 */
export class GeminiService implements AiServiceProvider {
  private settingsService: SettingsService;
  private _apiKey: string = '';
  private ProviderInstance: GoogleGenerativeAIProvider;

  private apiModels: ModelSettings[] = [];

  /**
   * Create a new Anthropic service provider
   */
  constructor() {
    this.settingsService = SettingsService.getInstance();
    this.apiModels = this.settingsService.getModels(GEMINI_PROVIDER_NAME);
    const providerSettings = this.settingsService.getProviderSettings(GEMINI_PROVIDER_NAME);
    
    this._apiKey = providerSettings.apiKey || '';

    this.ProviderInstance = createGoogleGenerativeAI({
      apiKey: this._apiKey
    });
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return GEMINI_PROVIDER_NAME;
  }

  /**
   * Get the ID of the service provider
   */
  get id(): string {
    return GEMINI_PROVIDER_NAME;
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
    const models = this.settingsService.getModels(GEMINI_PROVIDER_NAME);

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
    this.ProviderInstance = createGoogleGenerativeAI({
      apiKey: this._apiKey
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
    const isWebSearchActive = SettingsService.getInstance().getWebSearchActive();

    let modelInstance: LanguageModel;

    if (isWebSearchActive) {
      modelInstance = this.ProviderInstance.languageModel(options.model, {
        useSearchGrounding: true,
      });

      options.stream = false;
    } 
    else {
      modelInstance = this.ProviderInstance.languageModel(options.model);
    }

    return CommonProviderHelper.getChatCompletionByModel(modelInstance, messages, options, streamController);
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