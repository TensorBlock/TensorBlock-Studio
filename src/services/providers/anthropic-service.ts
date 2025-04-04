import { AnthropicProvider, createAnthropic } from '@ai-sdk/anthropic';
import { Message } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { StreamControlHandler } from '../streaming-control';
import { CommonProviderHelper } from './common-provider-service';
import { SettingsService } from '../settings-service';
import { mapModelCapabilities } from '../../types/capabilities';
import { AIServiceCapability } from '../../types/capabilities';
import { ModelSettings } from '../../types/settings';

export const ANTHROPIC_PROVIDER_NAME = 'Anthropic';

/**
 * Implementation of Anthropic service provider using the AI SDK
 */
export class AnthropicService implements AiServiceProvider {
  private settingsService: SettingsService;
  private _apiKey: string = '';
  private ProviderInstance: AnthropicProvider;

  private apiModels: ModelSettings[] = [];

  /**
   * Create a new Anthropic service provider
   */
  constructor() {
    this.settingsService = SettingsService.getInstance();
    const providerSettings = this.settingsService.getProviderSettings(ANTHROPIC_PROVIDER_NAME);
    
    this._apiKey = providerSettings.apiKey || '';

    this.ProviderInstance = createAnthropic({
      apiKey: this._apiKey,
      headers: {
        "anthropic-dangerous-direct-browser-access": "true",
      }
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
    this.ProviderInstance = createAnthropic({
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