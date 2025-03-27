import { HttpClient } from './http-client';
import { AxiosHeaders } from 'axios';
import { AxiosError } from 'axios';
import { Message } from '../../types/chat';

/**
 * Configuration for AI service providers
 */
export interface AiServiceConfig {
  apiKey?: string;
  baseURL: string;
  organizationId?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Base rate limit tracking
 */
export interface RateLimitInfo {
  totalRequests: number;
  remainingRequests: number;
  resetTime: Date | null;
}

/**
 * Represents a capability that an AI service provider can support
 */
export enum AIServiceCapability {
  TextCompletion = 'textCompletion',
  ChatCompletion = 'chatCompletion',
  ImageGeneration = 'imageGeneration',
  ImageEditing = 'imageEditing',
  AudioTranscription = 'audioTranscription',
  AudioGeneration = 'audioGeneration',
  Embedding = 'embedding',
  VoiceCloning = 'voiceCloning',
  LangchainSupport = 'langchainSupport',
  FunctionCalling = 'functionCalling',
  AgentFramework = 'agentFramework',
  ToolUsage = 'toolUsage',
  VisionAnalysis = 'visionAnalysis',
  FineTuning = 'fineTuning',
}

/**
 * Options for text and chat completions
 */
export interface CompletionOptions {
  model: string;
  provider: string;
  maxTokens?: number;
  max_tokens?: number; // OpenAI API parameter name
  temperature?: number;
  topP?: number;
  top_p?: number; // OpenAI API parameter name
  frequencyPenalty?: number;
  frequency_penalty?: number; // OpenAI API parameter name
  presencePenalty?: number;
  presence_penalty?: number; // OpenAI API parameter name
  stop?: string[];
  user?: string;
}

/**
 * Base class for all AI service providers
 */
export abstract class AiServiceProvider {
  protected readonly client: HttpClient;
  protected config: AiServiceConfig;
  protected rateLimitInfo: RateLimitInfo = {
    totalRequests: Infinity,
    remainingRequests: Infinity,
    resetTime: null
  };

  /**
   * Get the name of the service provider
   */
  abstract get name(): string;

  /**
   * Get the capabilities supported by this provider
   */
  abstract get capabilities(): AIServiceCapability[];

  /**
   * Get the available models for this provider
   */
  abstract get availableModels(): string[] | undefined;

  /**
   * Fetch the available models for this provider
   */
  abstract fetchAvailableModels(): Promise<string[]>;

  /**
   * Update the API key for this provider
   */
  abstract updateApiKey(ApiKey: string): void;

  /**
   * Create a new AI service provider
   */
  constructor(config: AiServiceConfig) {
    this.config = config;
    
    // Create HTTP client with basic configuration
    this.client = new HttpClient({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        ...config.headers,
      }
    });
    
    // Set up authentication if API key is provided
    this.setupAuthentication();
    
    // Set up rate limit tracking
    this.setupRateLimitTracking();
  }

  /**
   * Get a sanitized API key by trimming whitespace
   */
  protected getSanitizedApiKey(): string | undefined {
    if (!this.config.apiKey) return undefined;
    
    // Trim whitespace and check for common issues
    const apiKey = this.config.apiKey.trim();
    
    // If the key starts with "sk-" or similar pattern, it's probably valid
    // Otherwise, log a warning
    if (apiKey && !apiKey.startsWith('sk-') && this.name === 'OpenAI') {
      console.warn(`${this.name} API key doesn't follow the expected format (should start with 'sk-')`);
    }
    
    return apiKey;
  }

  /**
   * Setup authentication for API requests
   */
  protected setupAuthentication(): void {
    const sanitizedApiKey = this.getSanitizedApiKey();
    
    if (!sanitizedApiKey) {
      console.warn(`No API key provided for ${this.name} service`);
      return;
    }

    this.client.addRequestInterceptor((config) => {
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      
      // Set authorization header based on the API key
      config.headers.set('Authorization', `Bearer ${sanitizedApiKey}`);
      
      // Set organization if provided (for services like OpenAI)
      if (this.config.organizationId && this.config.organizationId.trim() !== '') {
        config.headers.set('OpenAI-Organization', this.config.organizationId.trim());
      }
      
      return config;
    });
  }

  /**
   * Set up rate limit tracking for the service provider
   */
  protected setupRateLimitTracking(): void {
    this.client.addResponseInterceptor(
      (response) => {
        // Update rate limit info if headers are present
        const totalRequests = response.headers['x-ratelimit-limit'];
        const remainingRequests = response.headers['x-ratelimit-remaining'];
        const resetTimestamp = response.headers['x-ratelimit-reset'];

        if (totalRequests) {
          this.rateLimitInfo.totalRequests = parseInt(totalRequests, 10);
        }
        if (remainingRequests) {
          this.rateLimitInfo.remainingRequests = parseInt(remainingRequests, 10);
        }
        if (resetTimestamp) {
          this.rateLimitInfo.resetTime = new Date(parseInt(resetTimestamp, 10) * 1000);
        }

        return response;
      }
    );
  }

  /**
   * Get the current rate limit information
   */
  public getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Check if a capability is supported
   */
  public supportsCapability(capability: AIServiceCapability): boolean {
    return this.capabilities.includes(capability);
  }

  /**
   * Get a text completion
   */
  public async getCompletion(prompt: string, options: CompletionOptions): Promise<string> {
    if (!this.supportsCapability(AIServiceCapability.TextCompletion)) {
      throw new Error(`${this.name} does not support text completion`);
    }
    
    return this.completionImplementation(prompt, options);
  }

  /**
   * Implementation of text completion - to be overridden by providers
   */
  protected abstract completionImplementation(prompt: string, options: CompletionOptions): Promise<string>;

  /**
   * Get a chat completion 
   */
  public async getChatCompletion(messages: Message[], options: CompletionOptions): Promise<Message> {
    if (!this.supportsCapability(AIServiceCapability.ChatCompletion)) {
      throw new Error(`${this.name} does not support chat completion`);
    }
    
    return this.chatCompletionImplementation(messages, options);
  }

  /**
   * Implementation of chat completion - to be overridden by providers
   */
  protected abstract chatCompletionImplementation(messages: Message[], options: CompletionOptions): Promise<Message>;

  /**
   * Check if the service has a valid API key
   */
  public hasValidApiKey(): boolean {
    const apiKey = this.getSanitizedApiKey();
    return !!apiKey && apiKey.length > 0;
  }

  /**
   * Handle authentication errors and provide clear messages
   */
  protected handleAuthError(error: unknown): Error {
    const axiosError = error as AxiosError;
    
    // Log the full error details for debugging
    console.error(`Authentication error details for ${this.name}:`, {
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
      headers: {
        sent: {
          authorization: this.config.apiKey ? 'Bearer *****' + this.config.apiKey.slice(-4) : 'None',
          organization: this.config.organizationId || 'None'
        },
        received: axiosError.response?.headers
      }
    });
    
    if (axiosError.response?.status === 401) {
      return new Error(`Authentication failed: Invalid API key for ${this.name} service`);
    }
    
    if (axiosError.response?.status === 403) {
      return new Error(`Authorization failed: API key for ${this.name} service doesn't have permission for this request`);
    }
    
    if (!this.hasValidApiKey()) {
      return new Error(`API key not configured for ${this.name} service`);
    }
    
    return error instanceof Error ? error : new Error(String(error));
  }
} 