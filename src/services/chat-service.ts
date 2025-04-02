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
      // eslint-disable-next-line prefer-const
      let {conversation: updatedConversation, message: userMessage} = await MessageHelper.addUserMessageToConversation(content, currentConversation);
      
      // Update in memory
      this.conversations = this.conversations.map(c => 
        c.id === conversationId ? updatedConversation : c
      );

      conversationUpdate(this.conversations);
      //#endregion

      //#region Map messages to messages array
      console.log('Updated conversation:', updatedConversation);
      const messages = MessageHelper.mapMessagesTreeToList(updatedConversation, false);
      console.log('Messages:', messages);
      //#endregion

      //#region Streaming Special Message Handling
      // Create a placeholder for the streaming message
      const placeholderMessage: Message = MessageHelper.getPlaceholderMessage(model, provider, conversationId);

      userMessage.childrenMessageIds.push(placeholderMessage.messageId);
      userMessage.preferIndex = userMessage.childrenMessageIds.length - 1;

      // Add placeholder to conversation and update UI
      const messagesWithPlaceholder = new Map(updatedConversation.messages);
      messagesWithPlaceholder.set(placeholderMessage.messageId, placeholderMessage);

      updatedConversation = {
        ...updatedConversation,
        messages: messagesWithPlaceholder,
        updatedAt: new Date()
      };

      this.conversations = this.conversations.map(c => 
        c.id === conversationId ? updatedConversation : c
      );

      conversationUpdate(this.conversations);
      //#endregion

      //#region Send Chat Message to AI with streaming

      // Create a new abort controller for this request
      const streamController = new StreamControlHandler(
        updatedConversation, 
        placeholderMessage,
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

          const finalConversation = await MessageHelper.insertAssistantMessageToConversation(userMessage, aiResponse, updatedConversation);

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
      const originalMessage = currentConversation.messages.get(messageId);

      if(!originalMessage) {
        throw new Error('Message not found');
      }

      // Check if the message is a user message (only user messages can be edited)
      if (originalMessage.role !== 'user') {
        throw new Error('Only user messages can be edited');
      }
      
      const fatherMessageId = originalMessage.fatherMessageId;
      if(!fatherMessageId) {
        throw new Error('Father message not found');
      }

      const fatherMessage = currentConversation.messages.get(fatherMessageId);
      if(!fatherMessage) {
        throw new Error('Father message not found');
      }

      //#endregion

      const settingsService = SettingsService.getInstance();
      const provider = settingsService.getSelectedProvider();
      const model = settingsService.getSelectedModel();

      //#region Save edited message to database
      // eslint-disable-next-line prefer-const
      let {conversation: updatedConversation, message: editedMessage} = await MessageHelper.insertUserMessageToConversation(fatherMessage, newContent, currentConversation);

      // Update in memory
      this.conversations = this.conversations.map(c => 
        c.id === conversationId ? updatedConversation : c
      );

      conversationUpdate(this.conversations);
      //#endregion
      
      //#region Map messages to messages array
      const messages = MessageHelper.mapMessagesTreeToList(updatedConversation, false, editedMessage.messageId);
      //#endregion

      //#region Streaming Special Message Handling

      // Create a placeholder for the streaming message
      const placeholderMessage: Message = MessageHelper.getPlaceholderMessage(model, provider, conversationId);

      editedMessage.childrenMessageIds.push(placeholderMessage.messageId);
      editedMessage.preferIndex = editedMessage.childrenMessageIds.length - 1;

      const messagesWithPlaceholder = new Map(updatedConversation.messages);
      messagesWithPlaceholder.set(placeholderMessage.messageId, placeholderMessage);

      // Add placeholder to conversation and update UI
      updatedConversation = {
        ...updatedConversation,
        messages: messagesWithPlaceholder,
        updatedAt: new Date()
      };

      this.conversations = this.conversations.map(c => 
        c.id === conversationId ? updatedConversation : c
      );

      conversationUpdate(this.conversations);
      //#endregion

      //#region Send Chat Message to AI with streaming

      // Create a new abort controller for this request
      const streamController = new StreamControlHandler(
        updatedConversation, 
        placeholderMessage,
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

          const finalConversation = await MessageHelper.insertAssistantMessageToConversation(editedMessage, aiResponse, updatedConversation);

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
   * Regenerate a specific AI Response in the active conversation
   */
  public async regenerateAiMessage(
    messageId: string,
    conversationId: string,
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
      
      const originalMessage = currentConversation.messages.get(messageId);

      if(!originalMessage) {
        throw new Error('Message not found');
      }

      // Check if the message is a user message (only user messages can be edited)
      if (originalMessage.role !== 'assistant') {
        throw new Error('Only assistant messages can be regenerated');
      }

      const fatherMessageId = originalMessage.fatherMessageId;
      if(!fatherMessageId) {
        throw new Error('Father message not found');
      }

      const fatherMessage = currentConversation.messages.get(fatherMessageId);
      if(!fatherMessage) {
        throw new Error('Father message not found');
      }

      //#endregion

      const settingsService = SettingsService.getInstance();
      const provider = settingsService.getSelectedProvider();
      const model = settingsService.getSelectedModel();
      
      //#region Map messages to messages array
      const messages = MessageHelper.mapMessagesTreeToList(currentConversation, false, fatherMessage.messageId);
      
      //#endregion

      //#region Streaming Special Message Handling

      // Create a placeholder for the streaming message
      const placeholderMessage: Message = MessageHelper.getPlaceholderMessage(model, provider, conversationId);

      fatherMessage.childrenMessageIds.push(placeholderMessage.messageId);
      fatherMessage.preferIndex = fatherMessage.childrenMessageIds.length - 1;

      const messagesWithPlaceholder = new Map(currentConversation.messages);
      messagesWithPlaceholder.set(placeholderMessage.messageId, placeholderMessage);

      // Add placeholder to conversation and update UI
      const updatedConversation = {
        ...currentConversation,
        messages: messagesWithPlaceholder,
        updatedAt: new Date()
      };

      this.conversations = this.conversations.map(c => 
        c.id === conversationId ? updatedConversation : c
      );

      conversationUpdate(this.conversations);
      //#endregion

      //#region Send Chat Message to AI with streaming
      // Create a new abort controller for this request
      const streamController = new StreamControlHandler(
        updatedConversation, 
        placeholderMessage,
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

          const finalConversation = await MessageHelper.insertAssistantMessageToConversation(fatherMessage, aiResponse, currentConversation);

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
      console.error('Error regenerating AI message:', err);
      throw err;
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
}
