# Chat Service API

The Chat Service module provides functionality for managing chat conversations and messages, handling the interaction between the user and AI providers.

## `ChatService` Class

Service for managing chat conversations and interactions.

```typescript
export class ChatService {
  private static instance: ChatService;
  private dbService: DatabaseService;
  private aiService: AIService;
  private state: ChatState;
  private listeners: Set<() => void>;

  // Singleton Access
  public static getInstance(): ChatService;
  private constructor();

  // State Management
  private setState(newState: Partial<ChatState>): void;
  private notifyListeners(): void;
  public getState(): ChatState;
  public subscribe(listener: () => void): () => void;

  // Conversation Management
  public async initialize(): Promise<void>;
  public async createConversation(title?: string): Promise<Conversation>;
  public async loadConversations(): Promise<Conversation[]>;
  public async getConversation(id: string): Promise<Conversation | undefined>;
  public async deleteConversation(id: string): Promise<void>;
  public async updateConversationTitle(id: string, title: string): Promise<void>;
  public async setActiveConversation(id: string): Promise<void>;

  // Message Management
  public async sendMessage(content: string, options?: {
    systemMessage?: string;
    provider?: string;
    model?: string;
  }): Promise<Message | null>;
  
  public async regenerateLastMessage(): Promise<Message | null>;
  public async clearConversation(conversationId: string): Promise<void>;
}
```

## Interfaces

### `ChatState`

Represents the current state of chat functionality.

```typescript
export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}
```

## Message Processing

The Chat Service handles:

1. Sending user messages to AI providers
2. Processing and storing AI responses
3. Managing conversation history
4. Error handling and retry logic

## Usage Examples

### Getting the Chat Service Instance

```typescript
const chatService = ChatService.getInstance();
```

### Initializing the Chat Service

```typescript
await chatService.initialize();
```

### Creating a New Conversation

```typescript
const conversation = await chatService.createConversation('Brainstorming Session');
```

### Sending a Message

```typescript
const response = await chatService.sendMessage('Tell me about machine learning', {
  systemMessage: 'You are a helpful AI assistant specialized in explaining technical concepts.',
  provider: 'OpenAI',
  model: 'gpt-4'
});
```

### Setting the Active Conversation

```typescript
await chatService.setActiveConversation('conversation-id-123');
```

### Regenerating the Last Message

```typescript
const regeneratedResponse = await chatService.regenerateLastMessage();
```

### Subscribing to State Changes

```typescript
const unsubscribe = chatService.subscribe(() => {
  const state = chatService.getState();
  // Update UI based on new state
  console.log('Active conversation:', state.activeConversationId);
});

// Later, when no longer needed:
unsubscribe();
``` 