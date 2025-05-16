import { createFireworks } from '@ai-sdk/fireworks';
import { Message } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { StreamControlHandler } from '../streaming-control';
import { CommonProviderHelper } from './common-provider-service';
import { Provider } from 'ai';
import { mapModelCapabilities } from '../../types/capabilities';
import { AIServiceCapability } from '../../types/capabilities';
import { ModelSettings } from '../../types/settings';
import { SettingsService } from '../settings-service';
export const FIREWORKS_PROVIDER_NAME = 'Fireworks.ai';

/**
 * Implementation of OpenAI service provider using the AI SDK
 */
export class FireworksService implements AiServiceProvider {

  private settingsService: SettingsService;
  private commonProviderHelper: CommonProviderHelper;
  private apiModels: ModelSettings[] = [];

  /**
   * Create a new OpenAI service provider
   */
  constructor() {
    this.settingsService = SettingsService.getInstance();
    this.commonProviderHelper = new CommonProviderHelper(FIREWORKS_PROVIDER_NAME, this.createClient);
  }

  private createClient(apiKey: string): Provider {
    return createFireworks({
      apiKey: apiKey,
    });
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return FIREWORKS_PROVIDER_NAME;
  }

  /**
   * Get the ID of the service provider
   */
  get id(): string {
    return FIREWORKS_PROVIDER_NAME;
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
    const models = this.settingsService.getModels(FIREWORKS_PROVIDER_NAME);

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