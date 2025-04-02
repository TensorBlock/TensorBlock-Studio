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
  conversationId: string;
  folderId: string;
  title: string;
  firstMessageId: string | null;
  messages: Map<string, Message>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationFolder{
  folderId: string;
  folderName: string;
  conversations: Conversation[];
  createdAt: Date;
  updatedAt: Date;
  colorFlag: string;
}