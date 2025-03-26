import { DatabaseIntegrationService } from './database-integration';
import { Conversation } from '../types/chat';
import { AIService } from './ai-service';
import { SettingsService } from './settings-service';

/**
 * Service for managing chat conversations
 */
export class ChatService {
  private aiService: AIService;
  private static instance: ChatService;
  private dbService: DatabaseIntegrationService | null = null;
  private conversations: Conversation[] = [];
  private activeConversationId: string | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.aiService = AIService.getInstance();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Initialize the chat service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.dbService = DatabaseIntegrationService.getInstance();
      await this.dbService.initialize();
      
      // Load conversations
      await this.loadConversations();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize chat service:', error);
      throw error;
    }
  }

  /**
   * Load all conversations from the database
   */
  public async loadConversations(): Promise<Conversation[]> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }
    
    try {
      this.conversations = await this.dbService.loadConversationsList();
      
      // Set first conversation as active if none is selected and there are conversations
      if (!this.activeConversationId && this.conversations.length > 0) {
        this.activeConversationId = this.conversations[0].id;
      }
      
      return [...this.conversations];
    } catch (error) {
      console.error('Failed to load conversations:', error);
      throw error;
    }
  }

  /**
   * Load a specific conversation with its messages
   */
  public async loadConversation(conversationId: string): Promise<Conversation | null> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }
    
    try {
      const conversation = await this.dbService.loadConversation(conversationId);
      
      if (conversation) {
        // Update the conversation in the local list
        this.conversations = this.conversations.map(c => 
          c.id === conversationId ? conversation : c
        );
        return conversation;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load conversation:', error);
      throw error;
    }
  }

  /**
   * Create a new conversation
   */
  public async createConversation(title: string): Promise<Conversation> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }
    
    try {
      const newConversation = await this.dbService.createConversation(title);
      
      // Add to local list
      this.conversations = [newConversation, ...this.conversations];
      
      // Set as active conversation
      this.activeConversationId = newConversation.id;
      
      return newConversation;
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      throw error;
    }
  }

  /**
   * Send a message in the active conversation
   */
  public async sendMessage(content: string, conversationUpdate: (conversations: Conversation[]) => void): Promise<void> {
    if (!this.dbService || !this.activeConversationId) {
      throw new Error('Database service not initialized or no active conversation');
    }
    
    try {
      const settingsService = SettingsService.getInstance();
      const conversationId = this.activeConversationId;
      const provider = settingsService.getSelectedProvider();
      const model = settingsService.getSelectedModel();

      // Save user message to database
      const userMessage = await this.dbService.saveChatMessage(
        conversationId,
        'user',
        content,
        'user',
        'user'
      );
      
      // Get the active conversation
      const activeConversation = this.conversations.find(c => c.id === conversationId);
      if (!activeConversation) return;

      // Update conversation title in memory
      const shouldUpdateTitle = activeConversation.messages.length === 1 && 
                              activeConversation.messages[0].role === 'system';
      
      const title = shouldUpdateTitle 
        ? content.substring(0, 30) + (content.length > 30 ? '...' : '') 
        : activeConversation.title;
      
      const updatedConversation = {
        ...activeConversation,
        title,
        messages: [...activeConversation.messages, userMessage],
        updatedAt: new Date()
      };
      
      // Update in database
      await this.dbService.updateConversation(updatedConversation);
      
      // Update in memory
      this.conversations = this.conversations.map(c => 
        c.id === conversationId ? updatedConversation : c
      );

      conversationUpdate(this.conversations);

      // Send Chat Message to AI
      const aiResponse = await this.aiService.getChatCompletion(updatedConversation.messages, {
        model: settingsService.getSelectedModel(),
        provider: settingsService.getSelectedProvider()
      });

      if (aiResponse === null) return;
      
      // Save ai response message to database
      await this.dbService.saveChatMessage(
        conversationId,
        'assistant',
        aiResponse.content,
        provider,
        model
      );

      const aiResponedConversation: Conversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiResponse],
        updatedAt: new Date()
      };
      
      await this.dbService.updateConversation(aiResponedConversation);

      // Update in memory
      this.conversations = this.conversations.map(c => 
        c.id === conversationId ? aiResponedConversation : c
      );

      conversationUpdate(this.conversations);

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Set the active conversation
   */
  public setActiveConversation(conversationId: string): void {
    this.activeConversationId = conversationId;
  }

  /**
   * Get the active conversation
   */
  public getActiveConversation(): Conversation | null {
    if (!this.activeConversationId) return null;
    return this.conversations.find(c => c.id === this.activeConversationId) || null;
  }

  /**
   * Get the active conversation ID
   */
  public getActiveConversationId(): string | null {
    return this.activeConversationId;
  }

  /**
   * Get all conversations
   */
  public getConversations(): Conversation[] {
    return [...this.conversations];
  }

  /**
   * Rename a conversation
   */
  public async renameConversation(id: string, newTitle: string): Promise<void> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }
    
    try {
      // Update in database
      await this.dbService.renameConversation(id, newTitle);
      
      // Update in memory
      this.conversations = this.conversations.map(conv => 
        conv.id === id ? { ...conv, title: newTitle } : conv
      );
    } catch (error) {
      console.error('Error renaming conversation:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  public async deleteConversation(id: string): Promise<void> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }
    
    try {
      // Delete from database
      await this.dbService.deleteConversation(id);
      
      // Remove from memory
      this.conversations = this.conversations.filter(conv => conv.id !== id);
      
      // If the active conversation was deleted, set active to null or the first available
      if (this.activeConversationId === id) {
        this.activeConversationId = this.conversations.length > 0 ? this.conversations[0].id : null;
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Get the AI service
   */
  public getAIService(): AIService {
    return this.aiService;
  }

  /**
   * Check if the service is initialized
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}
