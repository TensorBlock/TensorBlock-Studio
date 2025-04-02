import { DatabaseIntegrationService } from './database-integration';
import { Conversation, Message } from '../types/chat';
import { AIService } from './ai-service';
import { SettingsService } from './settings-service';
import { StreamControlHandler } from './streaming-control';
import { MessageHelper } from './message-helper';
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

  private streamControllerMap: Map<string, StreamControlHandler> = new Map();

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
   * Send a message in the active conversation with streaming support
   */
  public async sendMessage(
    content: string,
    conversationId: string,
    isStreaming: boolean,
    conversationUpdate: (conversations: Conversation[]) => void
  ): Promise<void> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }

    const currentConversation = this.conversations.find(c => c.id === conversationId);
    if (currentConversation === undefined) {
      throw new Error('Active conversation not found');
    }
    
    try {
      const settingsService = SettingsService.getInstance();
      const provider = settingsService.getSelectedProvider();
      const model = settingsService.getSelectedModel();

      //#region Save user message to database and update title
      let updatedConversation = await MessageHelper.addUserMessageToConversation(content, currentConversation);
      
      // Update in memory
      this.conversations = this.conversations.map(c => 
        c.id === conversationId ? updatedConversation : c
      );

      conversationUpdate(this.conversations);
      //#endregion

      //#region Map messages to messages array
      const messages = MessageHelper.mapMessagesTreeToList(updatedConversation, false);
      //#endregion

      //#region Streaming Special Message Handling
      if(isStreaming) {
        // Create a placeholder for the streaming message
        const placeholderMessage: Message = MessageHelper.getPlaceholderMessage(model, provider, conversationId);

        const latestMessage = updatedConversation.messages.length > 0 ? updatedConversation.messages[updatedConversation.messages.length - 1] : null;

        if(latestMessage) {
          latestMessage.childrenMessageIds.push(placeholderMessage.messageId);
          latestMessage.preferIndex = latestMessage.childrenMessageIds.length - 1;
        }

        // Add placeholder to conversation and update UI
        updatedConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, placeholderMessage],
          updatedAt: new Date()
        };

        this.conversations = this.conversations.map(c => 
          c.id === conversationId ? updatedConversation : c
        );

        conversationUpdate(this.conversations);
      }
      //#endregion

      //#region Send Chat Message to AI with streaming

      // Create a new abort controller for this request
      const streamController = new StreamControlHandler(updatedConversation, 
        // ---- On chunk callback ----
        (updated: Conversation) => {  
          this.conversations = this.conversations.map(c => 
            c.id === conversationId ? updated : c
          );
          conversationUpdate(this.conversations);
        }, 
        // ---- On finish callback ----
        async (aiResponse: Message | null) => { 

          console.log(aiResponse);

          if (aiResponse === null) return;

          const finalConversation = await MessageHelper.addAssistantMessageToConversation(aiResponse, updatedConversation);

          // Update in memory
          this.conversations = this.conversations.map(c => 
            c.id === conversationId ? finalConversation : c
          );

          conversationUpdate(this.conversations);

          this.streamControllerMap.delete(conversationId);
        }
      );

      this.streamControllerMap.set(conversationId, streamController);

      // Send Chat Message to AI with streaming
      await this.aiService.getChatCompletion(
        messages, 
        {
          model: settingsService.getSelectedModel(),
          provider: settingsService.getSelectedProvider(),
          stream: isStreaming
        },
        streamController
      );

      conversationUpdate(this.conversations);
      
      //#endregion

    } catch (err) {     
      console.error('Error sending streaming message:', err);
      
      // Don't throw the error if it was an abort error
      const error = err as Error;
      if (error.name === 'AbortError') {
        return;
      }
      throw error;
    }
  }

  /**
   * Edit a message in a conversation
   */
  public async editMessage(
    messageId: string, 
    conversationId: string,
    newContent: string, 
    isStreaming: boolean,
    conversationUpdate: (conversations: Conversation[]) => void
  ): Promise<void> {

    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }
    
    try {
      //#region Get message and father message in conversation
      const currentConversation = this.conversations.find(c => c.id === conversationId);
      
      if (!currentConversation) {
        throw new Error('Active conversation not found');
      }
      
      // Find the message
      const messageIndex = currentConversation.messages.findIndex(m => m.messageId === messageId);
      
      if (messageIndex === -1) {
        throw new Error('Message not found');
      }
      
      // Get the original message
      const originalMessage = currentConversation.messages[messageIndex];

      // Check if the message is a user message (only user messages can be edited)
      if (originalMessage.role !== 'user') {
        throw new Error('Only user messages can be edited');
      }
      
      const fatherMessageId = originalMessage.fatherMessageId;
      const fatherMessage = currentConversation.messages.find(m => m.messageId === fatherMessageId);

      if(!fatherMessage) {
        throw new Error('Father message not found');
      }
      //#endregion

      const settingsService = SettingsService.getInstance();
      const provider = settingsService.getSelectedProvider();
      const model = settingsService.getSelectedModel();

      //#region Save edited message to database
      let updatedConversation = await MessageHelper.insertUserMessageToConversation(fatherMessage, newContent, currentConversation);

      // Update in memory
      this.conversations = this.conversations.map(c => 
        c.id === conversationId ? updatedConversation : c
      );

      conversationUpdate(this.conversations);
      //#endregion
      
      //#region Map messages to messages array
      const messages = MessageHelper.mapMessagesTreeToList(updatedConversation, false);
      //#endregion

      //#region Streaming Special Message Handling
      if(isStreaming) {
        // Create a placeholder for the streaming message
        const placeholderMessage: Message = MessageHelper.getPlaceholderMessage(model, provider, conversationId);

        const latestMessage = updatedConversation.messages.length > 0 ? updatedConversation.messages[updatedConversation.messages.length - 1] : null;

        if(latestMessage) {
          latestMessage.childrenMessageIds.push(placeholderMessage.messageId);
          latestMessage.preferIndex = latestMessage.childrenMessageIds.length - 1;
        }

        // Add placeholder to conversation and update UI
        updatedConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, placeholderMessage],
          updatedAt: new Date()
        };

        this.conversations = this.conversations.map(c => 
          c.id === conversationId ? updatedConversation : c
        );

        conversationUpdate(this.conversations);
      }
      //#endregion

      //#region Send Chat Message to AI with streaming

      // Create a new abort controller for this request
      const streamController = new StreamControlHandler(updatedConversation, 
        // ---- On chunk callback ----
        (updated: Conversation) => {  
          this.conversations = this.conversations.map(c => 
            c.id === conversationId ? updated : c
          );
          conversationUpdate(this.conversations);
        }, 
        // ---- On finish callback ----
        async (aiResponse: Message | null) => { 

          console.log(aiResponse);

          if (aiResponse === null) return;

          const finalConversation = await MessageHelper.addAssistantMessageToConversation(aiResponse, updatedConversation);

          // Update in memory
          this.conversations = this.conversations.map(c => 
            c.id === conversationId ? finalConversation : c
          );

          conversationUpdate(this.conversations);

          this.streamControllerMap.delete(conversationId);
        }
      );

      this.streamControllerMap.set(conversationId, streamController);

      // Send Chat Message to AI with streaming
      await this.aiService.getChatCompletion(
        messages, 
        {
          model: settingsService.getSelectedModel(),
          provider: settingsService.getSelectedProvider(),
          stream: isStreaming
        },
        streamController
      );

      conversationUpdate(this.conversations);
      
      //#endregion
      
    } catch (err) {
      console.error('Error sending streaming message:', err);
      
      // Don't throw the error if it was an abort error
      const error = err as Error;
      if (error.name === 'AbortError') {
        return;
      }
      throw error;
    }
  }

  /**
   * Stop the currently streaming response
   */
  public stopStreaming(conversationId: string | null): void {
    if (!conversationId) return;
    
    if (this.streamControllerMap.has(conversationId)) {
      this.streamControllerMap.get(conversationId)!.abort();
    }
  }

  /**
   * Check if a response is currently streaming
   */
  public isCurrentlyStreaming(conversationId: string | null): boolean {
    if (!conversationId) return false;
    
    return this.streamControllerMap.has(conversationId);
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

  /**
   * Regenerate the last AI response in the active conversation
   */
  public async regenerateLastMessage(conversationUpdate: (conversations: Conversation[]) => void): Promise<void> {
    if (!this.dbService || !this.activeConversationId) {
      throw new Error('Database service not initialized or no active conversation');
    }
    
    try {
      const conversationId = this.activeConversationId;
      const activeConversation = this.conversations.find(c => c.id === conversationId);
      if (!activeConversation) {
        throw new Error('Active conversation not found');
      }
      
      // Find the last user message
      const messages = [...activeConversation.messages];
      
      // Remove the last assistant message
      let lastAssistantIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          lastAssistantIndex = i;
          break;
        }
      }
      
      // If no assistant message found, nothing to regenerate
      if (lastAssistantIndex === -1) {
        throw new Error('No assistant message to regenerate');
      }
      
      // Keep only messages up to the last user message before the assistant response
      const updatedMessages = messages.slice(0, lastAssistantIndex);
      
      // Create a new conversation state without the last assistant message
      const updatedConversation: Conversation = {
        ...activeConversation,
        messages: updatedMessages,
        updatedAt: new Date()
      };
      
      // Update in memory
      this.conversations = this.conversations.map(c => 
        c.id === conversationId ? updatedConversation : c
      );
      
      // Update UI
      conversationUpdate(this.conversations);
      
      // const settingsService = SettingsService.getInstance();
      
      // TODO: Uncomment this when we have a way to handle streaming

      // Select between streaming and non-streaming based on settings
      // if (settingsService.getUseStreaming()) {
      //   await this.sendMessage(
      //     updatedConversation, 
      //     conversationUpdate, 
      //     undefined
      //   );
      // } else {
      //   await this.sendMessageInternal(updatedConversation, conversationUpdate);
      // }
      
    } catch (error) {
      console.error('Error regenerating message:', error);
      throw error;
    }
  }
}
