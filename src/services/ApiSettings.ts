export interface ApiSettings {
    provider: string;
    apiKey: string;
    baseUrl?: string;
    organizationId?: string;
    apiVersion?: string;
    additional?: Record<string, string | number | boolean>;
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    lastMessage?: string;
}

export interface ChatMessage {
    id: number;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: Record<string, string | number | boolean>;
}
