# AI Service API

The AI Service module provides a unified interface for interacting with various AI providers, handling the communication with specific provider implementations.

## `AIService` Class

Singleton service for managing interactions with AI providers.

```typescript
export class AIService {
  private static instance: AIService;
  private providers: Map<string, AiServiceProvider>;
  private state: AIState;
  private listeners: Set<() => void>;
  private modelCache: Map<string, ModelOption[]>;
  private lastFetchTime: Map<string, number>;
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  // Static Methods
  public static getInstance(): AIService;

  // Provider Management Methods
  private configureProviders(): void;
  private setupSettingsListener(): void;
  public getProvider(name: string): AiServiceProvider | undefined;
  public getAllProviders(): AiServiceProvider[];
  public getProvidersByCapability(capability: AIServiceCapability): AiServiceProvider[];
  public getOpenAI(): OpenAIService | undefined;
  public getTextCompletionProvider(): AiServiceProvider | undefined;
  public getChatCompletionProvider(): AiServiceProvider | undefined;
  public getImageGenerationProvider(): AiServiceProvider | undefined;

  // State Management Methods
  public subscribe(listener: () => void): () => void;
  private notifyListeners(): void;
  private setState(newState: Partial<AIState>): void;
  private startRequest(): void;
  private handleSuccess(): void;
  private handleError(error: Error): void;
  public getState(): AIState;

  // AI Operations Methods
  public async getCompletion(
    prompt: string, 
    options?: Partial<CompletionOptions>
  ): Promise<string | null>;
  
  public async getChatCompletion(
    messages: Message[], 
    options?: Partial<CompletionOptions>
  ): Promise<Message | null>;
  
  public async generateImage(
    prompt: string,
    options?: {
      size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
      style?: 'vivid' | 'natural';
      quality?: 'standard' | 'hd';
    }
  ): Promise<string[] | null>;

  // State Getters
  public get status(): AIRequestStatus;
  public get error(): Error | null;
  public get isLoading(): boolean;
  public get isError(): boolean;
  public get isSuccess(): boolean;

  // Model Management Methods
  public getServiceManager(): AIService;
  public async refreshGetAllModels(): Promise<ModelOption[]>;
  public async getModelsForProvider(providerName: string): Promise<ModelOption[]>;
  public async refreshModels(): Promise<void>;
}
```

## Interfaces & Types

### `ModelOption`

```typescript
export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
}
```

### `AIRequestStatus`

```typescript
export type AIRequestStatus = 'idle' | 'loading' | 'success' | 'error';
```

### `AIState`

```typescript
interface AIState {
  status: AIRequestStatus;
  error: Error | null;
}
```

## Constants

```typescript
export const SETTINGS_CHANGE_EVENT = 'tensorblock_settings_change';
```

## Usage Examples

### Getting the AI Service Instance

```typescript
const aiService = AIService.getInstance();
```

### Performing a Chat Completion

```typescript
const messages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Hello, can you help me with something?',
    timestamp: new Date(),
    provider: 'OpenAI',
    model: 'gpt-3.5-turbo'
  }
];

const options = {
  model: 'gpt-3.5-turbo',
  provider: 'OpenAI',
  temperature: 0.7
};

const response = await aiService.getChatCompletion(messages, options);
```

### Getting Available Models for a Provider

```typescript
const openAIModels = await aiService.getModelsForProvider('OpenAI');
``` 