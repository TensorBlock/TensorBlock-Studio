import { DatabaseService } from './database';
import { SettingsService, ProviderSettings } from './settings-service';
import { Conversation, Message } from '../types/chat';
import { ApiSettings } from './api-settings';
import { v4 as uuidv4 } from 'uuid';
import { AIProvider } from '../types/ai-providers';

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
            
            // Load and set settings from database to settings service
            await this.loadApiSettings();
            
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
     * Load a specific conversation including all messages
     */
    public async loadConversation(conversationId: string): Promise<Conversation | null> {
        try {
            // Get conversation details
            const dbConversations = await this.dbService.getConversations();
            const conversation = dbConversations.find(c => c.id === conversationId);
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
    public async createConversation(title: string): Promise<Conversation> {
        try {
            // Create in database
            const dbConversation = await this.dbService.createConversation(title);

            // Create system message
            const systemMessage: Message = {
                messageId: uuidv4(),
                conversationId: dbConversation.id,
                role: 'system',
                content: 'You are a helpful assistant. Be concise in your responses.',
                timestamp: new Date(),
                model: 'unknown',
                provider: 'unknown',
                tokens: 0,
                fatherMessageId: null,
                childrenMessageIds: [],
                preferIndex: 0
            };
            
            // Save system message
            await this.dbService.saveChatMessage(systemMessage);
            
            // Add system message to the conversation
            dbConversation.messages = new Map([
                [systemMessage.messageId, systemMessage]
            ]);
            
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
        content: string,
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
                id: conversation.id,
                title: conversation.title,
                firstMessageId: conversation.firstMessageId,
                createdAt: conversation.createdAt,
                updatedAt: new Date(),
                messages: conversation.messages
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
            const conversation = dbConversations.find(c => c.id === conversationId);
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
     * Load API settings from database to settings service
     */
    private async loadApiSettings(): Promise<void> {
        try {
            const providers: AIProvider[] = [
                'OpenAI', 
                'Anthropic', 
                'Gemini', 
                'Fireworks.ai', 
                'Together.ai', 
                'OpenRouter', 
                'Custom'
            ];
            
            const settings = this.settingsService.getSettings();
            let selectedProvider = settings.selectedProvider;
            
            // Load each provider's settings
            for (const provider of providers) {
                const dbSettings = await this.dbService.getApiSettings(provider);
                if (dbSettings) {
                    // Convert to ProviderSettings format
                    const providerSettings: ProviderSettings = {
                        apiKey: dbSettings.apiKey,
                        organizationId: dbSettings.organizationId,
                        apiVersion: dbSettings.apiVersion,
                        baseUrl: dbSettings.baseUrl,
                    };
                    
                    // Add any additional settings
                    if (dbSettings.additional) {
                        Object.assign(providerSettings, dbSettings.additional);
                    }
                    
                    // Update settings service
                    this.settingsService.updateProviderSettings(providerSettings, provider);
                    
                    // If this is the first provider with an API key, make it selected
                    if (providerSettings.apiKey && !settings.providers[selectedProvider]?.apiKey) {
                        selectedProvider = provider;
                    }
                }
            }
            
            // Update selected provider if changed
            if (selectedProvider !== settings.selectedProvider) {
                this.settingsService.setSelectedProvider(selectedProvider);
            }
            
        } catch (error) {
            console.error('Error loading API settings:', error);
        }
    }

    /**
     * Save API settings from settings service to database
     */
    public async saveApiSettings(): Promise<void> {
        try {
            const settings = this.settingsService.getSettings();
            
            // Save each provider's settings
            for (const provider in settings.providers) {
                const providerSettings = settings.providers[provider];
                if (providerSettings) {
                    // Create database settings object
                    const dbSettings: ApiSettings = {
                        provider,
                        apiKey: providerSettings.apiKey || '',
                        organizationId: providerSettings.organizationId,
                        apiVersion: providerSettings.apiVersion,
                        baseUrl: providerSettings.baseUrl
                    };
                    
                    // Add additional fields
                    const additional: Record<string, string | number | boolean> = {};
                    for (const key in providerSettings) {
                        if (!['apiKey', 'organizationId', 'apiVersion', 'baseUrl'].includes(key)) {
                            additional[key] = providerSettings[key as keyof ProviderSettings] as string | number | boolean;
                        }
                    }
                    
                    if (Object.keys(additional).length > 0) {
                        dbSettings.additional = additional;
                    }
                    
                    // Save to database
                    await this.dbService.saveApiSettings(provider, dbSettings);
                }
            }
        } catch (error) {
            console.error('Error saving API settings:', error);
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
            
            await this.dbService.updateChatMessage(dbMessage);
        } catch (error) {
            console.error('Error updating message:', error);
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
} 