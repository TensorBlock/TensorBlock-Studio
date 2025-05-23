import { Message } from '../../types/chat';
import { StreamControlHandler } from '../streaming-control';
import { AIServiceCapability } from '../../types/capabilities';
import { ModelSettings } from '../../types/settings';

/**
 * Configuration for AI service providers
 */
export interface AiServiceConfig {
  apiKey?: string;
  baseURL: string;
}

/**
 * Options for text and chat completions
 */
export interface CompletionOptions {
  model: string;
  provider: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  user?: string;
  stream?: boolean; // Whether to stream the response
  signal?: AbortSignal; // AbortSignal for cancellation
  tools?: Record<string, unknown>; // Pre-configured tools for the AI
  toolChoice?: Record<string, unknown>; // Pre-configured tool Choice for the AI
}

/**
 * Provider for AI services using the @ai-sdk package
 */
export interface AiServiceProvider {
  /**
   * The name of the provider
   */
  name: string;

  /**
   * The ID of the provider
   */
  id: string;
  
  /**
   * The available models for this provider
   */
  availableModels?: ModelSettings[];
  
  /**
   * Get the capabilities of a model with this provider
   */
  getModelCapabilities(modelId: string): AIServiceCapability[];

  /**
   * Fetch available models from the provider API
   */
  fetchAvailableModels(): Promise<ModelSettings[]>;
  
  /**
   * Update the API key for this provider
   */
  updateApiKey(apiKey: string): void;
  
  /**
   * Set up authentication for this provider
   */
  recreateClient(): void;
  
  /**
   * Check if the provider has a valid API key
   */
  hasValidApiKey(): boolean;

  /**
   * Get a streaming chat completion
   */
  getChatCompletion(
    messages: Message[], 
    options: CompletionOptions,
    streamController: StreamControlHandler,
  ): Promise<Message>;
  
  /**
   * Generate an image
   */
  getImageGeneration(
    prompt: string,
    options: {
      size?: `${number}x${number}`;
      aspectRatio?: `${number}:${number}`;
      style?: string;
      quality?: string;
    }
  ): Promise<string[] | Uint8Array<ArrayBufferLike>[]>;
}