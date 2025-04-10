# Types and Interfaces

The application defines several core types and interfaces for consistent data handling.

## Chat Types

**Path**: `src/types/chat.ts`

### MessageRole

```typescript
export type MessageRole = 'user' | 'assistant' | 'system';
```

**Description**: Defines the role of a message sender in a conversation.

### MessageContentType

```typescript
export enum MessageContentType {
  Text = 'text',
  File = 'file',
  Image = 'image',
  Audio = 'audio',
  Reference = 'reference',
  SystemMessage = 'systemMessage',
}
```

**Description**: Defines the different types of content a message can contain.

### MessageContent

```typescript
export interface MessageContent {
  type: MessageContentType;
  content: string;
  dataJson: string;
}
```

**Description**: Represents a piece of content within a message, such as text, image, or file.

### Message

```typescript
export interface Message {
  messageId: string;
  conversationId: string;
  role: MessageRole;
  content: MessageContent[];
  timestamp: Date;
  provider: string;
  model: string;
  tokens: number;
  fatherMessageId: string | null;
  childrenMessageIds: string[];
  preferIndex: number;
}
```

**Description**: Represents a message in a conversation, containing content and metadata.

### Conversation

```typescript
export interface Conversation {
  conversationId: string;
  folderId: string;
  title: string;
  firstMessageId: string | null;
  messages: Map<string, Message>;
  createdAt: Date;
  updatedAt: Date;
}
```

**Description**: Represents a conversation containing messages between a user and an AI assistant.

### ConversationFolder

```typescript
export interface ConversationFolder {
  folderId: string;
  folderName: string;
  createdAt: Date;
  updatedAt: Date;
  colorFlag: string;
}
```

**Description**: Represents a folder for organizing conversations.

## AI Provider Types

**Path**: `src/types/ai-providers.ts`

### ProviderType

```typescript
export type ProviderType = 'openai' | 'anthropic' | 'custom';
```

**Description**: Defines the supported AI provider types.

## Settings Types

**Path**: `src/types/settings.ts`

### AppSettings

```typescript
export interface AppSettings {
  selectedProvider: string;
  selectedModel: string;
  providers: Record<string, ProviderSettings>;
  interface: InterfaceSettings;
  webSearch: WebSearchSettings;
}
```

**Description**: Application settings containing provider, model, and interface preferences.

### ProviderSettings

```typescript
export interface ProviderSettings {
  apiKey: string;
  baseUrl?: string;
  models?: ModelOption[];
  defaultModel?: string;
}
```

**Description**: Settings for an AI provider, including API key and available models.

### InterfaceSettings

```typescript
export interface InterfaceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  messageSpacing: number;
}
```

**Description**: User interface customization settings.

### WebSearchSettings

```typescript
export interface WebSearchSettings {
  enabled: boolean;
  previewEnabled: boolean;
  numResults: number;
}
```

**Description**: Settings for web search functionality.

## Capabilities Types

**Path**: `src/types/capabilities.ts`

### AIServiceCapability

```typescript
export enum AIServiceCapability {
  TextCompletion = 'text-completion',
  ImageGeneration = 'image-generation',
  WebSearch = 'web-search',
  VoiceTranscription = 'voice-transcription',
  CodeCompletion = 'code-completion',
  Memory = 'memory'
}
```

**Description**: Defines the capabilities that an AI service provider can support.

### ModelCapabilities

```typescript
export interface ModelCapabilities {
  modelId: string;
  capabilities: AIServiceCapability[];
  maxTokens: number;
  contextSize: number;
}
```

**Description**: Defines the capabilities of a specific AI model.

## AI Service Provider Types

**Path**: `src/services/core/ai-service-provider.ts`

### CompletionOptions

```typescript
export interface CompletionOptions {
  model: string;
  provider: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  user?: string;
  stream?: boolean;
  signal?: AbortSignal;
}
```

**Description**: Options for configuring an AI completion request.

### AiServiceProvider Interface

```typescript
export interface AiServiceProvider {
  getChatCompletion(
    messages: Message[],
    options: CompletionOptions,
    streamController?: StreamControlHandler
  ): Promise<Message | null>;
  
  getAvailableModels(): Promise<ModelOption[]>;
}
```

**Description**: Interface for AI service providers, defining methods for getting completions and available models. 