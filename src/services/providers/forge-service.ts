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

  /**
   * Create a new Forge service provider
   */
  constructor() {
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
    const settingsService = SettingsService.getInstance();
    const models = settingsService.getModels(FORGE_PROVIDER_NAME);

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