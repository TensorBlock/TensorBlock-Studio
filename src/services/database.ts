import { ProviderSettings } from '../types/settings';
import { Conversation, Message, ConversationFolder } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';
import { UserSettings } from '../types/settings';
import { FileData } from '../types/file';

// database.ts
export class DatabaseService {
    private db: IDBDatabase | null = null;
    private readonly DB_NAME = 'tensorblock_db';
    private readonly DB_VERSION = 3; // Increase version to trigger upgrade
    private readonly ENCRYPTION_KEY = 'your-secure-encryption-key'; // In production, use a secure key management system

    private isInitialized: boolean = false;
    private isInitializing: boolean = false;

    async initialize(): Promise<void> {
        if(this.isInitialized) return;

        if(this.isInitializing) {
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if(this.isInitialized) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 50);
            });
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                resolve();
            };

            request.onupgradeneeded = (event) => {

                console.log(`Upgrade Database`);

                const db = (event.target as IDBOpenDBRequest).result;

                // Create conversations store
                if (!db.objectStoreNames.contains('conversations')) {
                    const conversationStore = db.createObjectStore('conversations', {
                        keyPath: 'conversationId'
                    });
                    conversationStore.createIndex('updatedAt', 'updatedAt');
                }

                // Create folders store
                if (!db.objectStoreNames.contains('folders')) {
                    const folderStore = db.createObjectStore('folders', {
                        keyPath: 'folderId'
                    });
                    folderStore.createIndex('updatedAt', 'updatedAt');
                }

                // Create chat history store
                if (!db.objectStoreNames.contains('chatHistory')) {
                    const chatStore = db.createObjectStore('chatHistory', {
                        keyPath: 'messageId',
                        autoIncrement: true
                    });
                    chatStore.createIndex('conversationId', 'conversationId');
                    chatStore.createIndex('messageId', 'messageId');
                }

                // Create API settings store
                if (!db.objectStoreNames.contains('apiSettings')) {
                    db.createObjectStore('apiSettings', {
                        keyPath: 'providerName'
                    });
                }

                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', {
                        keyPath: 'id'
                    });
                }

                // Create files store
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files', {
                        keyPath: 'fileId'
                    });
                }
            };
        });
    }

    // Conversation Methods
    async createConversation(title: string, folderId?: string): Promise<Conversation> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const conversation: Conversation = {
                conversationId: uuidv4(),
                folderId: folderId || '',
                title,
                createdAt: new Date(),
                updatedAt: new Date(),
                messages: new Map(),
                firstMessageId: null,
                messageInput: ''
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

            request.onsuccess = () => {
                const conversations = request.result;
                for (const conversation of conversations) {
                    if(conversation['id'] !== undefined) {
                        conversation['conversationId'] = conversation['id'];
                        delete conversation['id'];
                    }
                }
                resolve(conversations);
            }
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
                    if(conversation.messages.size === 0) {
                        conversation.firstMessageId = message.messageId;
                    }
                    conversation.messages.set(message.messageId, message);
                    console.log('dbconversation', conversation);
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
    async saveApiSettings(settings: ProviderSettings): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('apiSettings', 'readwrite');
            const store = transaction.objectStore('apiSettings');

            const encryptedSettings: ProviderSettings = {
                ...settings,
                apiKey: this.encrypt(settings.apiKey),
            };

            const request = store.put(encryptedSettings);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getApiSettings(provider: string): Promise<ProviderSettings | null> {
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

    async getApiSettingsList(): Promise<ProviderSettings[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('apiSettings', 'readonly');
            const store = transaction.objectStore('apiSettings');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
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

    // Folder Methods
    async createFolder(folderName: string, colorFlag: string): Promise<ConversationFolder> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const folder: ConversationFolder = {
                folderId: uuidv4(),
                folderName,
                createdAt: new Date(),
                updatedAt: new Date(),
                colorFlag
            };

            const transaction = this.db.transaction('folders', 'readwrite');
            const store = transaction.objectStore('folders');
            const request = store.add(folder);

            request.onsuccess = () => resolve(folder);
            request.onerror = () => reject(request.error);
        });
    }

    async getFolders(): Promise<ConversationFolder[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('folders', 'readonly');
            const store = transaction.objectStore('folders');
            const index = store.index('updatedAt');
            const request = index.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateFolder(folder: ConversationFolder): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('folders', 'readwrite');
            const store = transaction.objectStore('folders');
            const request = store.put({
                ...folder,
                updatedAt: new Date()
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFolder(folderId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction(['folders', 'conversations'], 'readwrite');
            const folderStore = transaction.objectStore('folders');
            const conversationStore = transaction.objectStore('conversations');
            
            // First, update all conversations in this folder to have no folder
            const conversationRequest = conversationStore.openCursor();
            
            conversationRequest.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    const conversation = cursor.value;
                    if (conversation.folderId === folderId) {
                        conversation.folderId = '';
                        cursor.update(conversation);
                    }
                    cursor.continue();
                }
            };
            
            // Then delete the folder
            const folderRequest = folderStore.delete(folderId);
            folderRequest.onsuccess = () => resolve();
            folderRequest.onerror = () => reject(folderRequest.error);
        });
    }

    // Update a conversation's folder
    async updateConversationFolder(conversationId: string, folderId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction(['conversations', 'folders'], 'readwrite');
            const conversationStore = transaction.objectStore('conversations');
            const folderStore = transaction.objectStore('folders');
            
            // Get the conversation
            const convRequest = conversationStore.get(conversationId);
            
            convRequest.onsuccess = () => {
                const conversation = convRequest.result;
                if (conversation) {
                    // Update the folder ID
                    conversation.folderId = folderId;
                    conversationStore.put(conversation);
                    
                    // Update the folder's timestamp if moving to a folder
                    if (folderId) {
                        const folderRequest = folderStore.get(folderId);
                        folderRequest.onsuccess = () => {
                            const folder = folderRequest.result;
                            if (folder) {
                                folder.updatedAt = new Date();
                                folderStore.put(folder);
                            }
                        };
                    }
                    
                    resolve();
                } else {
                    reject(new Error('Conversation not found'));
                }
            };
            
            convRequest.onerror = () => reject(convRequest.error);
        });
    }

    // General Settings Methods
    async saveSettings(settings: UserSettings): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('settings', 'readwrite');
            const store = transaction.objectStore('settings');
            
            // Encrypt sensitive data
            const encryptedSettings: UserSettings = {
                ...settings,
                providers: Object.entries(settings.providers).reduce((acc, [key, value]) => {
                    acc[key] = {
                        ...value,
                        apiKey: this.encrypt(value.apiKey),
                        organizationId: value.organizationId ? this.encrypt(value.organizationId) : undefined
                    };
                    return acc;
                }, {} as {[key: string]: ProviderSettings})
            };

            const request = store.put({
                id: 'user_settings', // Use a fixed ID for the settings
                ...encryptedSettings
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getSettings(): Promise<UserSettings | null> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('settings', 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get('user_settings');

            request.onsuccess = () => {
                if (!request.result) {
                    resolve(null);
                    return;
                }

                const settings = request.result;
                
                // Decrypt sensitive data
                const decryptedSettings: UserSettings = {
                    ...settings,
                    providers: Object.entries(settings.providers).reduce((acc, [key, value]) => {
                        const providerSettings = value as ProviderSettings;
                        acc[key] = {
                            ...providerSettings,
                            apiKey: this.decrypt(providerSettings.apiKey),
                            organizationId: providerSettings.organizationId ? this.decrypt(providerSettings.organizationId) : undefined
                        };
                        return acc;
                    }, {} as {[key: string]: ProviderSettings})
                };
                
                resolve(decryptedSettings);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Save a file to the database
     * @param file - The file to save
     * @returns The file ID
     */
    public async saveFile(file: FileData): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('files', 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.add(file);

            console.log('saveFile', file);

            request.onsuccess = () => resolve(request.result as string);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all files from the database
     * @returns List of files
     */
    public async getFiles(): Promise<FileData[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('files', 'readonly');
            const store = transaction.objectStore('files');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a file from the database by ID
     * @param fileId - The file ID
     * @returns The file data
     */
    public async getFile(fileId: string): Promise<FileData | null> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('files', 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(fileId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update a file in the database
     * @param file - The file to update
     */
    public async updateFile(file: FileData): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('files', 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.put(file);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete a file from the database
     * @param fileId - The file ID to delete
     */
    public async deleteFile(fileId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction('files', 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.delete(fileId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}