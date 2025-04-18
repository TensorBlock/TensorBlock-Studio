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
    
    const settingsService = SettingsService.getInstance();
    const providerSettings = settingsService.getProviderSettings(this.providerID);
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
    const settingsService = SettingsService.getInstance();
    const providerSettings = settingsService.getProviderSettings(this.providerID);
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
    const settingsService = SettingsService.getInstance();
    const models = settingsService.getModels(this.providerID);

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