export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  messageId: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  provider: string;
  model: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
} 