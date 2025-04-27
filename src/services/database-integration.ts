import { DatabaseService } from './database';
import { SettingsService } from './settings-service';
import { Conversation, Message, ConversationFolder, MessageContent, MessageContentType, FileJsonData } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';
import { FileData } from '../types/file';

const SYSTEM_MESSAGE_CONTENT: MessageContent[] = [
    {
        type: MessageContentType.Text,
        content: 'You are a helpful assistant. Be concise in your responses.',
        dataJson: ''
    }
];

/**
 * Service for integrating database operations with app components
 */
export class DatabaseIntegrationService {
    private static instance: DatabaseIntegrationService;
    private dbService: DatabaseService;
    private settingsService: SettingsService;
    private initialized: boolean = false;

    private constructor() {
        this.dbService = new DatabaseService();
        this.settingsService = SettingsService.getInstance();
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): DatabaseIntegrationService {
        if (!DatabaseIntegrationService.instance) {
            DatabaseIntegrationService.instance = new DatabaseIntegrationService();
        }
        return DatabaseIntegrationService.instance;
    }

    /**
     * Initialize the database and load settings
     */
    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Initialize database
            await this.dbService.initialize();
            
            // Initialize settings service
            await this.settingsService.initialize();
            
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    /**
     * Load conversations list for the sidebar
     */
    public async loadConversationsList(): Promise<Conversation[]> {
        try {
            const dbConversations = await this.dbService.getConversations();
            return dbConversations.map((conv) => this.mapDbConversationToAppConversation(conv));
        } catch (error) {
            console.error('Error loading conversations list:', error);
            return [];
        }
    }

    /**
     * Load folders list
     */
    public async loadFoldersList(): Promise<ConversationFolder[]> {
        try {
            return await this.dbService.getFolders();
        } catch (error) {
            console.error('Error loading folders list:', error);
            return [];
        }
    }

    /**
     * Load a specific conversation including all messages
     */
    public async loadConversation(conversationId: string): Promise<Conversation | null> {
        try {
            // Get conversation details
            const dbConversations = await this.dbService.getConversations();
            const conversation = dbConversations.find(c => c.conversationId === conversationId);
            if (!conversation) return null;
            
            // Get chat messages
            const messages = await this.dbService.getChatHistory(conversationId);

            // Map to app conversation format
            const appConversation = this.mapDbConversationToAppConversation(conversation);
            
            // Add messages
            appConversation.messages = new Map(messages.map((msg) => [msg.messageId, this.mapDbMessageToAppMessage(msg)]));
            
            return appConversation;
        } catch (error) {
            console.error(`Error loading conversation ${conversationId}:`, error);
            return null;
        }
    }

    /**
     * Create a new conversation
     */
    public async createConversation(title: string, folderId?: string): Promise<Conversation> {
        try {
            const firstMessageId = uuidv4();

            // Create in database
            const dbConversation = await this.dbService.createConversation(title, folderId);

            // Create system message
            const systemMessage: Message = {
                messageId: firstMessageId,
                conversationId: dbConversation.conversationId,
                role: 'system',
                content: SYSTEM_MESSAGE_CONTENT,
                timestamp: new Date(),
                model: 'unknown',
                provider: 'unknown',
                tokens: 0,
                fatherMessageId: null,
                childrenMessageIds: [],
                preferIndex: -1
            };
            
            // Save system message
            await this.dbService.saveChatMessage(systemMessage);
            
            // Add system message to the conversation
            dbConversation.messages = new Map([
                [systemMessage.messageId, systemMessage]
            ]);
            
            console.log('db integration Conversation', dbConversation);

            return dbConversation;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    }

    /**
     * Save a chat message and update conversation
     */
    public async saveChatMessage(
        messageId: string,
        conversationId: string, 
        role: 'user' | 'assistant' | 'system', 
        content: MessageContent[],
        provider: string,
        model: string,
        tokens: number,
        fatherMessageId: string | null,
        childrenMessageIds: string[],
        preferIndex: number
    ): Promise<Message> {

        try {
            // Create message object
            const dbMessage: Message = {
                messageId,
                conversationId,
                role,
                content,
                timestamp: new Date(),
                model,
                provider,
                tokens,
                fatherMessageId,
                childrenMessageIds,
                preferIndex
            };
            
            // Save to database
            await this.dbService.saveChatMessage(dbMessage);
            
            // Return app message format
            return dbMessage;
        } catch (error) {
            console.error('Error saving chat message:', error);
            throw error;
        }
    }

    /**
     * Update conversation details
     */
    public async updateConversation(conversation: Conversation): Promise<void> {
        try {
            // Map to database format
            const dbConversation: Conversation = {
                conversationId: conversation.conversationId,
                folderId: conversation.folderId,
                title: conversation.title,
                firstMessageId: conversation.firstMessageId,
                createdAt: conversation.createdAt,
                updatedAt: new Date(),
                messages: conversation.messages,
                messageInput: conversation.messageInput
            };
            
            // Update in database
            await this.dbService.updateConversation(dbConversation);
        } catch (error) {
            console.error('Error updating conversation:', error);
            throw error;
        }
    }

    /**
     * Rename a conversation
     */
    public async renameConversation(conversationId: string, newTitle: string): Promise<void> {
        try {
            // Get the conversation
            const dbConversations = await this.dbService.getConversations();
            const conversation = dbConversations.find(c => c.conversationId === conversationId);
            if (!conversation) {
                throw new Error(`Conversation with ID ${conversationId} not found`);
            }
            
            // Update the title
            const updatedConversation: Conversation = {
                ...conversation,
                title: newTitle,
                updatedAt: new Date()
            };
            
            // Save to database
            await this.dbService.updateConversation(updatedConversation);
        } catch (error) {
            console.error('Error renaming conversation:', error);
            throw error;
        }
    }

    /**
     * Delete a conversation and its messages
     */
    public async deleteConversation(conversationId: string): Promise<void> {
        try {
            await this.dbService.deleteConversation(conversationId);
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    }

    /**
     * Update a chat message
     */
    public async updateChatMessage(messageId: string, updatedMessage: Message, conversationId: string): Promise<void> {
        try {
            const dbMessage: Message = {
                ...updatedMessage,
                messageId: messageId,
                conversationId: conversationId,
            };
            
            console.log('db integration updateChatMessage', dbMessage);
            
            await this.dbService.updateChatMessage(dbMessage);
        } catch (error) {
            console.error('Error updating message:', error);
            throw error;
        }
    }

    /**
     * Create a new folder
     */
    public async createFolder(folderName: string, colorFlag: string): Promise<ConversationFolder> {
        try {
            return await this.dbService.createFolder(folderName, colorFlag);
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    }

    /**
     * Rename a folder
     */
    public async renameFolder(folderId: string, newName: string): Promise<void> {
        try {
            const folders = await this.dbService.getFolders();
            const folder = folders.find(f => f.folderId === folderId);
            
            if (!folder) {
                throw new Error(`Folder with ID ${folderId} not found`);
            }
            
            const updatedFolder: ConversationFolder = {
                ...folder,
                folderName: newName,
                updatedAt: new Date()
            };
            
            await this.dbService.updateFolder(updatedFolder);
        } catch (error) {
            console.error('Error renaming folder:', error);
            throw error;
        }
    }

    /**
     * Delete a folder
     */
    public async deleteFolder(folderId: string): Promise<void> {
        try {
            await this.dbService.deleteFolder(folderId);
        } catch (error) {
            console.error('Error deleting folder:', error);
            throw error;
        }
    }

    /**
     * Update a conversation's folder
     */
    public async moveConversationToFolder(conversationId: string, folderId: string): Promise<void> {
        try {
            await this.dbService.updateConversationFolder(conversationId, folderId);
        } catch (error) {
            console.error('Error moving conversation to folder:', error);
            throw error;
        }
    }

    // Mapping helpers
    private mapDbConversationToAppConversation(dbConversation: Conversation): Conversation {
        return {
            ...dbConversation,
        };
    }

    private mapDbMessageToAppMessage(dbMessage: Message): Message {
        return {
            ...dbMessage,
        };
    }

    public async saveFile(fileData: FileJsonData, arrayBuffer: ArrayBuffer): Promise<string> {
        const fileId = uuidv4();
        const file: FileData = {
            fileId: fileId,
            name: fileData.name,
            type: fileData.type,
            size: arrayBuffer.byteLength,
            data: arrayBuffer
        };

        await this.dbService.saveFile(file);

        return fileId;
    }

    /**
     * Get all files from the database
     */
    public async getFiles(): Promise<FileData[]> {
        try {
            return await this.dbService.getFiles();
        } catch (error) {
            console.error('Error getting files:', error);
            return [];
        }
    }

    /**
     * Get a file from the database by ID
     */
    public async getFile(fileId: string): Promise<FileData | null> {
        try {
            return await this.dbService.getFile(fileId);
        } catch (error) {
            console.error(`Error getting file ${fileId}:`, error);
            return null;
        }
    }

    /**
     * Update a file name in the database
     */
    public async updateFileName(fileId: string, newName: string): Promise<void> {
        try {
            const file = await this.dbService.getFile(fileId);
            if (!file) {
                throw new Error(`File with ID ${fileId} not found`);
            }
            
            const updatedFile: FileData = {
                ...file,
                name: newName
            };
            
            await this.dbService.updateFile(updatedFile);
        } catch (error) {
            console.error('Error updating file name:', error);
            throw error;
        }
    }

    /**
     * Delete a file from the database
     */
    public async deleteFile(fileId: string): Promise<void> {
        try {
            await this.dbService.deleteFile(fileId);
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }
} 