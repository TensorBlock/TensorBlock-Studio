import { Message } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { StreamControlHandler } from '../streaming-control';
import { CommonProviderHelper } from './common-provider-service';
import { SettingsService } from '../settings-service';
import { createOpenRouter, OpenRouterProvider } from '@openrouter/ai-sdk-provider';
import { mapModelCapabilities } from '../../types/capabilities';
import { AIServiceCapability } from '../../types/capabilities';

export const OPENROUTER_PROVIDER_NAME = 'OpenRouter';

/**
 * Implementation of Anthropic service provider using the AI SDK
 */
export class OpenRouterService implements AiServiceProvider {
  private settingsService: SettingsService;
  private _apiKey: string = '';
  private ProviderInstance: OpenRouterProvider;

  private apiModels: string[] = [];

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
   * Get the available models for this provider
   */
  get availableModels(): string[] | undefined {
    return this.apiModels.length > 0 
      ? this.apiModels 
        : ['deepseek/deepseek-v3-base:free', 'qwen/qwen2.5-vl-3b-instruct:free'];
  }

  /**
   * Fetch the list of available models from OpenAI
   */
  public async fetchAvailableModels(): Promise<string[]> {
    this.apiModels = [
      'deepseek/deepseek-v3-base:free',
      'qwen/qwen2.5-vl-3b-instruct:free'
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