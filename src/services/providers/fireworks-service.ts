import { createFireworks } from '@ai-sdk/fireworks';
import { Message } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { StreamControlHandler } from '../streaming-control';
import { CommonProviderHelper } from './common-provider-service';
import { Provider } from 'ai';
import { mapModelCapabilities } from '../core/capabilities';
import { AIServiceCapability } from '../core/capabilities';

export const FIREWORKS_PROVIDER_NAME = 'Fireworks.ai';

/**
 * Implementation of OpenAI service provider using the AI SDK
 */
export class FireworksService implements AiServiceProvider {

  private commonProviderHelper: CommonProviderHelper;
  private apiModels: string[] = [];

  /**
   * Create a new OpenAI service provider
   */
  constructor() {
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
   * Get the available models for this provider
   */
  get availableModels(): string[] | undefined {
    return this.apiModels.length > 0 
      ? this.apiModels 
      : ['accounts/fireworks/models/deepseek-r1', 'accounts/fireworks/models/deepseek-v3', 'accounts/fireworks/models/qwen2p5-coder-32b-instruct'];
  }

  /**
   * Fetch the list of available models from OpenAI
   */
  public async fetchAvailableModels(): Promise<string[]> {
    this.apiModels = [
      'accounts/fireworks/models/deepseek-r1',
      'accounts/fireworks/models/deepseek-v3',
      'accounts/fireworks/models/qwen2p5-coder-32b-instruct'
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