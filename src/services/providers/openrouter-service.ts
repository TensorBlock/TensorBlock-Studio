import { Message } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { StreamControlHandler } from '../streaming-control';
import { CommonProviderHelper } from './common-provider-service';
import { SettingsService } from '../settings-service';
import { createOpenRouter, OpenRouterProvider } from '@openrouter/ai-sdk-provider';
import { mapModelCapabilities } from '../../types/capabilities';
import { AIServiceCapability } from '../../types/capabilities';
import { ModelSettings } from '../../types/settings';

export const OPENROUTER_PROVIDER_NAME = 'OpenRouter';

/**
 * Implementation of Anthropic service provider using the AI SDK
 */
export class OpenRouterService implements AiServiceProvider {
  private settingsService: SettingsService;
  private _apiKey: string = '';
  private ProviderInstance: OpenRouterProvider;

  private apiModels: ModelSettings[] = [];

  /**
   * Create a new Anthropic service provider
   */
  constructor() {
    this.settingsService = SettingsService.getInstance();
    const providerSettings = this.settingsService.getProviderSettings(OPENROUTER_PROVIDER_NAME);
    
    this._apiKey = providerSettings.apiKey || '';

    this.ProviderInstance = createOpenRouter({
      apiKey: this._apiKey
    });
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return OPENROUTER_PROVIDER_NAME;
  }

  /**
   * Get the ID of the service provider
   */
  get id(): string {
    return OPENROUTER_PROVIDER_NAME;
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
    const models = this.settingsService.getModels(OPENROUTER_PROVIDER_NAME);

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
    this._apiKey = apiKey;
    this.recreateClient();
  }

  /**
   * Setup authentication for OpenAI
   */
  public recreateClient(): void {
    this.ProviderInstance = createOpenRouter({
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
    const modelInstance = this.ProviderInstance.languageModel(options.model);
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