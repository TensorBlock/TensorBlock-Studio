# Database Service API

The Database Service module provides functionality for data persistence using IndexedDB. It handles storage and retrieval of conversations, chat messages, and API settings.

## `DatabaseService` Class

Service for managing data storage and retrieval.

```typescript
export class DatabaseService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'tensorblock_db';
  private readonly DB_VERSION = 1;
  private readonly ENCRYPTION_KEY = 'your-secure-encryption-key';

  // Database Initialization
  async initialize(): Promise<void>;

  // Conversation Methods
  async createConversation(title: string): Promise<Conversation>;
  async getConversations(): Promise<Conversation[]>;
  async updateConversation(conversation: Conversation): Promise<void>;
  async deleteConversation(id: string): Promise<void>;

  // Chat History Methods
  async saveChatMessage(message: Omit<DbChatMessage, 'id'>): Promise<number>;
  async getChatHistory(conversationId: string): Promise<DbChatMessage[]>;

  // API Settings Methods
  async saveApiSettings(provider: string, settings: ApiSettings): Promise<void>;
  async getApiSettings(provider: string): Promise<ApiSettings | null>;

  // Encryption Methods
  private encrypt(text: string): string;
  private decrypt(encoded: string): string;
}
```

## Database Schema

The database includes the following object stores:

### `conversations` Object Store

Stores conversation metadata.

- Key Path: `id`
- Indexes:
  - `updatedAt`: For sorting conversations by update time

### `chatHistory` Object Store

Stores individual chat messages.

- Key Path: `id` (auto-incremented)
- Indexes:
  - `conversationId`: For filtering messages by conversation
  - `timestamp`: For sorting messages by time

### `apiSettings` Object Store

Stores API settings for different providers.

- Key Path: `provider`

## Interfaces

### `Conversation`

```typescript
export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: string;
}
```

### `DbChatMessage`

```typescript
export interface DbChatMessage {
  id?: number;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider: string;
  model: string;
}
```

### `ApiSettings`

```typescript
export interface ApiSettings {
  apiKey: string;
  baseUrl?: string;
  organizationId?: string;
  apiVersion?: string;
  additional?: Record<string, any>;
}
```

## Encryption

The database service includes simple encryption for sensitive data like API keys:

```typescript
private encrypt(text: string): string {
  const textToChars = (text: string) => text.split('').map(c => c.charCodeAt(0));
  const byteHex = (n: number) => ("0" + Number(n).toString(16)).substr(-2);
  const applySaltToChar = (code: number[]) => textToChars(this.ENCRYPTION_KEY).reduce((a, b) => a ^ b, code[0]);

  return text
    .split('')
    .map(textToChars)
    .map(applySaltToChar)
    .map(byteHex)
    .join('');
}

private decrypt(encoded: string): string {
  const textToChars = (text: string) => text.split('').map(c => c.charCodeAt(0));
  const applySaltToChar = (code: number) => textToChars(this.ENCRYPTION_KEY).reduce((a, b) => a ^ b, code);

  return encoded
    .match(/.{1,2}/g)!
    .map(hex => parseInt(hex, 16))
    .map(applySaltToChar)
    .map(charCode => String.fromCharCode(charCode))
    .join('');
}
```

## Usage Examples

### Initializing the Database

```typescript
const dbService = new DatabaseService();
await dbService.initialize();
```

### Creating a New Conversation

```typescript
const conversation = await dbService.createConversation('New Chat');
```

### Saving a Chat Message

```typescript
const messageId = await dbService.saveChatMessage({
  conversationId: 'conversation-id-123',
  role: 'user',
  content: 'Hello, AI assistant!',
  provider: 'OpenAI',
  model: 'gpt-3.5-turbo'
});
```

### Getting Chat History

```typescript
const messages = await dbService.getChatHistory('conversation-id-123');
```

### Saving API Settings

```typescript
await dbService.saveApiSettings('OpenAI', {
  apiKey: 'your-api-key',
  organizationId: 'your-org-id'
});
``` 