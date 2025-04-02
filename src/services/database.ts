import { ApiSettings } from './api-settings';
import { Conversation, Message } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';

// database.ts
export class DatabaseService {
    private db: IDBDatabase | null = null;
    private readonly DB_NAME = 'tensorblock_db';
    private readonly DB_VERSION = 1;
    private readonly ENCRYPTION_KEY = 'your-secure-encryption-key'; // In production, use a secure key management system

    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {

                console.log(`onupgradeneeded`);

                const db = (event.target as IDBOpenDBRequest).result;

                // Create conversations store
                if (!db.objectStoreNames.contains('conversations')) {
                    const conversationStore = db.createObjectStore('conversations', {
                        keyPath: 'id'
                    });
                    conversationStore.createIndex('updatedAt', 'updatedAt');
                }

                // Create chat history store
                if (!db.objectStoreNames.contains('chatHistory')) {
                    const chatStore = db.createObjectStore('chatHistory', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    chatStore.createIndex('conversationId', 'conversationId');
                    chatStore.createIndex('messageId', 'messageId');
                }

                // Create API settings store
                if (!db.objectStoreNames.contains('apiSettings')) {
                    db.createObjectStore('apiSettings', {
                        keyPath: 'provider'
                    });
                }
            };
        });
    }

    // Conversation Methods
    async createConversation(title: string): Promise<Conversation> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const conversation: Conversation = {
                id: uuidv4(),
                title,
                createdAt: new Date(),
                updatedAt: new Date(),
                messages: new Map(),
                firstMessageId: null
            };

            const transaction = this.db.transaction('conversations', 'readwrite');
            const store = transaction.objectStore('conversations');
            const request = store.add(conversation);

            request.onsuccess = () => resolve(conversation);
            request.onerror = () => reject(request.error);
        });
    }

    async getConversations(): Promise<Conversation[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('conversations', 'readonly');
            const store = transaction.objectStore('conversations');
            const index = store.index('updatedAt');
            const request = index.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateConversation(conversation: Conversation): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('conversations', 'readwrite');
            const store = transaction.objectStore('conversations');
            console.log(conversation);
            const request = store.put(conversation);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteConversation(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction(['conversations', 'chatHistory'], 'readwrite');
            const conversationStore = transaction.objectStore('conversations');
            const chatStore = transaction.objectStore('chatHistory');
            const chatIndex = chatStore.index('conversationId');

            // Delete all messages for this conversation
            const chatRequest = chatIndex.openKeyCursor(IDBKeyRange.only(id));
            chatRequest.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    chatStore.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };

            // Delete the conversation
            const conversationRequest = conversationStore.delete(id);
            conversationRequest.onsuccess = () => resolve();
            conversationRequest.onerror = () => reject(conversationRequest.error);
        });
    }

    // Chat History Methods
    async saveChatMessage(message: Message): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            console.log(`saveChatMessage: ${message.messageId}`);

            const transaction = this.db.transaction(['chatHistory', 'conversations'], 'readwrite');
            const chatStore = transaction.objectStore('chatHistory');
            const conversationStore = transaction.objectStore('conversations');

            // Save the message
            const chatRequest = chatStore.add({
                ...message,
                messageId: message.messageId
            });

            // Update conversation's last message and timestamp
            const conversationRequest = conversationStore.get(message.conversationId);
            conversationRequest.onsuccess = () => {
                const conversation = conversationRequest.result;
                if (conversation) {
                    conversation.updatedAt = new Date();
                    conversationStore.put(conversation);
                }
            };

            chatRequest.onsuccess = () => resolve(chatRequest.result as string);
            chatRequest.onerror = () => reject(chatRequest.error);
        });
    }

    async getChatHistory(conversationId: string): Promise<Message[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('chatHistory', 'readonly');
            const store = transaction.objectStore('chatHistory');
            const index = store.index('conversationId');
            const request = index.getAll(conversationId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update a chat message in the database
     */
    async updateChatMessage(message: Message): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('chatHistory', 'readwrite');
            const store = transaction.objectStore('chatHistory');
            const request = store.put(message);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // API Settings Methods
    async saveApiSettings(provider: string, settings: ApiSettings): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('apiSettings', 'readwrite');
            const store = transaction.objectStore('apiSettings');

            const encryptedSettings = {
                provider,
                apiKey: this.encrypt(settings.apiKey),
                baseUrl: settings.baseUrl,
                organizationId: settings.organizationId ? 
                    this.encrypt(settings.organizationId) : undefined,
                apiVersion: settings.apiVersion,
                additional: settings.additional
            };

            const request = store.put(encryptedSettings);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getApiSettings(provider: string): Promise<ApiSettings | null> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('apiSettings', 'readonly');
            const store = transaction.objectStore('apiSettings');
            const request = store.get(provider);

            request.onsuccess = () => {
                if (!request.result) {
                    resolve(null);
                    return;
                }

                const settings = request.result;
                resolve({
                    ...settings,
                    apiKey: this.decrypt(settings.apiKey),
                    organizationId: settings.organizationId ? 
                        this.decrypt(settings.organizationId) : undefined
                });
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Encryption methods using a simple XOR encryption for demonstration
    // In production, use a proper encryption library like crypto-js
    private encrypt(text: string): string {
        const textToChars = (text: string) => text.split('').map(c => c.charCodeAt(0));
        const byteHex = (n: number) => ("0" + Number(n).toString(16)).substr(-2);
        const applySaltToChar = (code: number[]) => textToChars(this.ENCRYPTION_KEY).reduce((a, b) => a ^ b, code[0]);

        return text
            .split('')
            .map(c => [c.charCodeAt(0)])
            .map(applySaltToChar)
            .map(byteHex)
            .join('');
    }

    private decrypt(encoded: string): string {
        const textToChars = (text: string) => text.split('').map(c => c.charCodeAt(0));
        const applySaltToChar = (code: number) => textToChars(this.ENCRYPTION_KEY).reduce((a, b) => a ^ b, code);
        
        const decoded = encoded
            .match(/.{1,2}/g)
            ?.map(hex => parseInt(hex, 16))
            .map(applySaltToChar)
            .map(charCode => String.fromCharCode(charCode))
            .join('');

        return decoded || '';
    }
}