# Types API

The Types module defines TypeScript types and interfaces used throughout the application. These type definitions ensure consistent data structures and enable type safety across the codebase.

## Chat Types

Located in `src/types/chat.ts`, these types define the structure of chat messages and conversations.

### `MessageRole`

Defines the possible roles for a message in a conversation.

```typescript
export type MessageRole = 'user' | 'assistant' | 'system';
```

### `Message`

Represents a single message in a chat conversation.

```typescript
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  provider: string;
  model: string;
}
```

### `Conversation`

Represents a chat conversation containing multiple messages.

```typescript
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
```

### `ChatState`

Defines the state structure for the chat functionality.

```typescript
export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}
```

## API Settings Types

Located in `src/services/api-settings.ts`, these types define structures for API configuration.

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

### `DbChatMessage`

Database representation of a chat message.

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

## Window Types

Located in `src/types/window.d.ts`, these types extend the global Window interface.

```typescript
declare global {
  interface Window {
    // Add any window extensions here
    electronAPI?: {
      sendMessage: (message: string) => void;
      receiveMessage: (callback: (message: string) => void) => void;
    };
  }
}
```

## Type Usage

These types are used throughout the application to:

1. Define component props
2. Specify service method parameters and return types
3. Type state variables and context values
4. Ensure consistent data structures for database operations

## Examples

### Using Message Type in Components

```typescript
import { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

const ChatMessage: FC<ChatMessageProps> = ({ message, isLatest }) => {
  // Use message properties with type safety
  const { content, role, timestamp } = message;
  // ...
};
```

### Using Conversation Type in Services

```typescript
import { Conversation } from '../types/chat';

class ChatService {
  // ...
  
  public async createConversation(title: string): Promise<Conversation> {
    // Create and return a new conversation with the correct structure
  }
  
  public async getConversation(id: string): Promise<Conversation | undefined> {
    // Fetch and return a conversation
  }
  
  // ...
}
```

### Extending Types

New types can be created by extending existing ones:

```typescript
// Example of extending the Message type
interface EnhancedMessage extends Message {
  isRead: boolean;
  attachments?: string[];
}
``` 