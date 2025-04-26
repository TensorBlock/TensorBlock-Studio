export type MessageRole = 'user' | 'assistant' | 'system';

export enum MessageContentType {
  Text = 'text',
  File = 'file',
  Image = 'image',
  Audio = 'audio',
  Reference = 'reference',
  SystemMessage = 'systemMessage',
}

export interface FileJsonData{
  name: string;
  type: string;
  size: number;
}

export interface MessageContent {
  type: MessageContentType;
  content: string;
  dataJson: string;
}

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

export interface Conversation {
  conversationId: string;
  folderId: string;
  title: string;
  firstMessageId: string | null;
  messages: Map<string, Message>;
  createdAt: Date;
  updatedAt: Date;
  messageInput: string;
}

export interface ConversationFolder{
  folderId: string;
  folderName: string;
  createdAt: Date;
  updatedAt: Date;
  colorFlag: string;
}

export interface ImageGenerationResult {
  id: string;
  prompt: string;
  negativePrompt: string;
  seed: string;
  number: number;
  status: string;
  aspectRatio: string;
  provider: string;
  model: string;
  images: MessageContent[];
}
