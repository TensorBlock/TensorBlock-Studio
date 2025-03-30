# Core Service API

The Core Service module provides foundational abstractions and interfaces used throughout the application.

## `AiServiceProvider` Abstract Class

Base class for all AI service providers.

```typescript
export abstract class AiServiceProvider {
  protected readonly client: HttpClient;
  protected config: AiServiceConfig;
  protected rateLimitInfo: RateLimitInfo;

  constructor(config: AiServiceConfig);

  // Abstract methods
  abstract get name(): string;
  abstract get capabilities(): AIServiceCapability[];
  abstract get availableModels(): string[] | undefined;
  abstract fetchAvailableModels(): Promise<string[]>;
  abstract updateApiKey(ApiKey: string): void;
  abstract setupAuthenticationByProvider(): void;
  abstract completionImplementation(prompt: string, options: CompletionOptions): Promise<string>;
  abstract chatCompletionImplementation(messages: Message[], options: CompletionOptions): Promise<Message>;

  // Implemented methods
  protected getSanitizedApiKey(): string | undefined;
  protected setupRateLimitTracking(): void;
  public getRateLimitInfo(): RateLimitInfo;
  public supportsCapability(capability: AIServiceCapability): boolean;
  public async getCompletion(prompt: string, options: CompletionOptions): Promise<string>;
  public async getChatCompletion(messages: Message[], options: CompletionOptions): Promise<Message>;
  public hasValidApiKey(): boolean;
  protected handleAuthError(error: unknown): Error;
}
```

## Interfaces

### `AiServiceConfig`

Configuration for AI service providers.

```typescript
export interface AiServiceConfig {
  apiKey?: string;
  baseURL: string;
  organizationId?: string;
  timeout?: number;
  headers?: Record<string, string>;
}
```

### `RateLimitInfo`

Base rate limit tracking.

```typescript
export interface RateLimitInfo {
  totalRequests: number;
  remainingRequests: number;
  resetTime: Date | null;
}
```

### `CompletionOptions`

Options for text and chat completions.

```typescript
export interface CompletionOptions {
  model: string;
  provider: string;
  maxTokens?: number;
  max_tokens?: number;
  temperature?: number;
  topP?: number;
  top_p?: number;
  frequencyPenalty?: number;
  frequency_penalty?: number;
  presencePenalty?: number;
  presence_penalty?: number;
  stop?: string[];
  user?: string;
}
```

## Enums

### `AIServiceCapability`

Represents capabilities that an AI service provider can support.

```typescript
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
```

## `HttpClient` Class

HTTP client for making API requests with built-in error handling and interceptors.

```typescript
export class HttpClient {
  constructor(config: AxiosRequestConfig);
  
  request<T>(config: AxiosRequestConfig): Promise<T>;
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  
  addRequestInterceptor(
    onFulfilled?: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
    onRejected?: (error: any) => any
  ): number;
  
  addResponseInterceptor(
    onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
    onRejected?: (error: any) => any
  ): number;
  
  removeInterceptor(type: 'request' | 'response', id: number): void;
}
``` 