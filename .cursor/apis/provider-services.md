# Provider Services API

The Provider Services module contains implementations of the `AiServiceProvider` abstract class for various AI providers. Each provider has its own implementation that handles the specifics of communicating with that provider's API.

## `OpenAIService` Class

Implementation of the OpenAI provider.

```typescript
export class OpenAIService extends AiServiceProvider {
  get name(): string;
  get capabilities(): AIServiceCapability[];
  get availableModels(): string[] | undefined;
  
  async fetchAvailableModels(): Promise<string[]>;
  updateApiKey(apiKey: string): void;
  setupAuthenticationByProvider(): void;
  
  protected async completionImplementation(
    prompt: string, 
    options: CompletionOptions
  ): Promise<string>;
  
  protected async chatCompletionImplementation(
    messages: Message[],
    options: CompletionOptions
  ): Promise<Message>;
  
  async generateImage(
    prompt: string, 
    options?: {
      size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
      style?: 'vivid' | 'natural';
      quality?: 'standard' | 'hd';
    }
  ): Promise<string[]>;
}
```

## `AnthropicService` Class

Implementation of the Anthropic provider.

```typescript
export class AnthropicService extends AiServiceProvider {
  get name(): string;
  get capabilities(): AIServiceCapability[];
  get availableModels(): string[] | undefined;
  
  async fetchAvailableModels(): Promise<string[]>;
  updateApiKey(apiKey: string): void;
  setupAuthenticationByProvider(): void;
  
  protected async completionImplementation(
    prompt: string, 
    options: CompletionOptions
  ): Promise<string>;
  
  protected async chatCompletionImplementation(
    messages: Message[],
    options: CompletionOptions
  ): Promise<Message>;
}
```

## `GeminiService` Class

Implementation of the Google Gemini provider.

```typescript
export class GeminiService extends AiServiceProvider {
  get name(): string;
  get capabilities(): AIServiceCapability[];
  get availableModels(): string[] | undefined;
  
  async fetchAvailableModels(): Promise<string[]>;
  updateApiKey(apiKey: string): void;
  setupAuthenticationByProvider(): void;
  
  protected async completionImplementation(
    prompt: string, 
    options: CompletionOptions
  ): Promise<string>;
  
  protected async chatCompletionImplementation(
    messages: Message[],
    options: CompletionOptions
  ): Promise<Message>;
}
```

## `FireworksService` Class

Implementation of the Fireworks provider.

```typescript
export class FireworksService extends AiServiceProvider {
  get name(): string;
  get capabilities(): AIServiceCapability[];
  get availableModels(): string[] | undefined;
  
  async fetchAvailableModels(): Promise<string[]>;
  updateApiKey(apiKey: string): void;
  setupAuthenticationByProvider(): void;
  
  protected async completionImplementation(
    prompt: string, 
    options: CompletionOptions
  ): Promise<string>;
  
  protected async chatCompletionImplementation(
    messages: Message[],
    options: CompletionOptions
  ): Promise<Message>;
}
```

## `TogetherService` Class

Implementation of the Together provider.

```typescript
export class TogetherService extends AiServiceProvider {
  get name(): string;
  get capabilities(): AIServiceCapability[];
  get availableModels(): string[] | undefined;
  
  async fetchAvailableModels(): Promise<string[]>;
  updateApiKey(apiKey: string): void;
  setupAuthenticationByProvider(): void;
  
  protected async completionImplementation(
    prompt: string, 
    options: CompletionOptions
  ): Promise<string>;
  
  protected async chatCompletionImplementation(
    messages: Message[],
    options: CompletionOptions
  ): Promise<Message>;
}
```

## `OpenRouterService` Class

Implementation of the OpenRouter provider.

```typescript
export class OpenRouterService extends AiServiceProvider {
  get name(): string;
  get capabilities(): AIServiceCapability[];
  get availableModels(): string[] | undefined;
  
  async fetchAvailableModels(): Promise<string[]>;
  updateApiKey(apiKey: string): void;
  setupAuthenticationByProvider(): void;
  
  protected async completionImplementation(
    prompt: string, 
    options: CompletionOptions
  ): Promise<string>;
  
  protected async chatCompletionImplementation(
    messages: Message[],
    options: CompletionOptions
  ): Promise<Message>;
}
```

## `CustomService` Class

Implementation for custom API endpoints.

```typescript
export class CustomService extends AiServiceProvider {
  get name(): string;
  get capabilities(): AIServiceCapability[];
  get availableModels(): string[] | undefined;
  
  async fetchAvailableModels(): Promise<string[]>;
  updateApiKey(apiKey: string): void;
  setupAuthenticationByProvider(): void;
  
  protected async completionImplementation(
    prompt: string, 
    options: CompletionOptions
  ): Promise<string>;
  
  protected async chatCompletionImplementation(
    messages: Message[],
    options: CompletionOptions
  ): Promise<Message>;
  
  public updateSettings(settings: Partial<ProviderSettings>): void;
}
```

## Provider Registration

The providers.ts file exports all provider implementations:

```typescript
export { OpenAIService } from './openai-service';
export { AnthropicService } from './anthropic-service';
export { GeminiService } from './gemini-service';
export { FireworksService } from './fireworks-service';
export { TogetherService } from './together-service';
export { OpenRouterService } from './openrouter-service';
export { CustomService } from './custom-service';
```

## Common Provider Implementation Pattern

All provider implementations follow a similar pattern:

1. Implement required abstract methods and properties from `AiServiceProvider`
2. Set up authentication mechanism specific to the provider
3. Transform input/output data to match the provider's API requirements
4. Handle provider-specific error cases and rate limiting

Each provider implementation handles the specifics of:
- Endpoint URLs and paths
- Authentication headers
- Request/response formats
- Error handling
- Available models retrieval
- Capability declarations 