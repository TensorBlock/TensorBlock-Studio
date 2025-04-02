export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  messageId: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  provider: string;
  model: string;
  tokens: number;
  fatherMessageId: string | null;
  childrenMessageIds: string[];
  preferIndex: number;
}

export interface Conversation {
  id: string;
  title: string;
  firstMessageId: string | null;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
