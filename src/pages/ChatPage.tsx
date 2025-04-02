import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatHistoryList from '../components/chat/ChatHistoryList';
import ChatMessageArea from '../components/chat/ChatMessageArea';
import { Conversation } from '../types/chat';
import { SettingsService } from '../services/settings-service';
import { ChatService } from '../services/chat-service';
import { AIService } from '../services/ai-service';
interface ChatPageProps {
  initialSelectedModel?: string;
  apiKey?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({ 
  initialSelectedModel = '',
  apiKey = ''
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const chatServiceRef = useRef<ChatService | null>(null);
  const [isServiceInitialized, setIsServiceInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize the services
  useEffect(() => {
    const initServices = async () => {
      try {
        // Initialize chat service
        
        const chatService = ChatService.getInstance();
        await chatService.initialize();
        chatServiceRef.current = chatService;
        
        // Setup AI service state listener
        const aiService = AIService.getInstance();
        const unsubscribe = aiService.subscribe(() => {
          setIsLoading(aiService.isLoading);
          setError(aiService.error);
        });
        
        // Load conversations from chat service
        const conversationsList = chatService.getConversations();
        setConversations(conversationsList);
        
        // Set active conversation from chat service
        const activeId = chatService.getActiveConversationId();
        if (activeId) {
          setActiveConversationId(activeId);
        }
        
        // Get streaming settings
        const settingsService = SettingsService.getInstance();
        
        setIsServiceInitialized(true);
        
        // Get saved model from settings if no initial model provided
        if (!initialSelectedModel) {
          const settings = settingsService.getSettings();
          if (settings.selectedModel) {
            settingsService.setSelectedModel(settings.selectedModel);
          }
          aiService.refreshModels();
        }
        
        return () => {
          unsubscribe(); // Clean up the subscription
        };
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    if(!isServiceInitialized) {
      initServices();
    }
    
  }, [initialSelectedModel, isServiceInitialized]);

  // Load active conversation details when selected
  useEffect(() => {
    if (activeConversationId && isServiceInitialized && chatServiceRef.current) {
      const loadConversation = async () => {

        try {
          const chatService = chatServiceRef.current;
          if (!chatService) return;
          
          // Tell the chat service which conversation is active
          chatService.setActiveConversation(activeConversationId);
          
          // Load the conversation details
          const conversation = await chatService.loadConversation(activeConversationId);
          
          if (conversation) {
            // Update the conversations list
            setConversations(chatService.getConversations());
          }
        } catch (error) {
          console.error('Failed to load conversation:', error);
        }
      };
      
      loadConversation();
    }
  }, [activeConversationId, isServiceInitialized]);

  // Get the active conversation
  const activeConversation = activeConversationId
    ? conversations.find(c => c.conversationId === activeConversationId) || null
    : null;

  // Create a new conversation
  const createNewChat = useCallback(async () => {
    if (!isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      
      const newConversation = await chatService.createConversation(
        'New Conversation',
      );
      
      // Update the state with the new list of conversations
      setConversations(chatService.getConversations());
      setActiveConversationId(newConversation.conversationId);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  }, [SettingsService.getInstance().getSelectedModel(), isServiceInitialized]);

  // Handle sending a message with streaming
  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      const selectedModel = SettingsService.getInstance().getSelectedModel();
      const selectedProvider = SettingsService.getInstance().getSelectedProvider();
      console.log('Using streaming with provider:', selectedProvider);
      console.log('Using streaming with model:', selectedModel);

      // Send user message with streaming
      await chatService.sendMessage(
        content, 
        activeConversationId,
        true,
        (updatedConversation) => {
          setConversations(updatedConversation);
        }
      );
      
    } catch (err) {
      console.error('Error sending streaming message:', err);
      
      // // If streaming fails, we'll try to fall back to regular mode
      // const error = err as Error;
      // if (error.message && error.message.includes('does not support streaming')) {
      //   await handleSendMessage(content);
      // }
    }
  };

  // Select a conversation
  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    
    // Also update in the service
    if (chatServiceRef.current) {
      chatServiceRef.current.setActiveConversation(conversationId);
    }
  };

  // Rename a conversation
  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    if (!isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      
      // Rename the conversation
      await chatService.renameConversation(conversationId, newTitle);
      
      // Update conversations state
      setConversations(chatService.getConversations());
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      
      // Delete the conversation
      await chatService.deleteConversation(conversationId);
      
      // Update conversations state
      setConversations(chatService.getConversations());
      
      // Update active conversation id
      const newActiveId = chatService.getActiveConversationId();
      setActiveConversationId(newActiveId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Create an initial chat if there are none
  useEffect(() => {
    if (conversations.length === 0 && isServiceInitialized) {
      createNewChat();
    }
  }, [conversations.length, createNewChat, isServiceInitialized]);

  // Show API key missing message if needed
  const isApiKeyMissing = !apiKey && SettingsService.getInstance().getSelectedModel();

  // Handle stopping a streaming response
  const handleStopStreaming = () => {
    if (!chatServiceRef.current) return;
    
    try {
      chatServiceRef.current.stopStreaming(activeConversationId);
    } catch (error) {
      console.error('Error stopping streaming:', error);
    }
  };

  // Handle regenerating the last AI response
  const handleRegenerateResponse = async (messageId: string) => {
    if (!activeConversationId || !isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      // Use the new regenerateLastMessage method
      await chatServiceRef.current.regenerateAiMessage(
        messageId, 
        activeConversationId,
        true,
        (updatedConversation) => {
          setConversations(updatedConversation);
        }
      );
    } catch (error) {
      console.error('Error regenerating response:', error);
    }
  };
  
  // Handle editing a message
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!activeConversationId || !isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      const selectedModel = SettingsService.getInstance().getSelectedModel();
      const selectedProvider = SettingsService.getInstance().getSelectedProvider();
      console.log('Using streaming with provider:', selectedProvider);
      console.log('Using streaming with model:', selectedModel);

      // Send user message with streaming
      await chatService.editMessage(
        messageId, 
        activeConversationId,
        newContent,
        true,
        (updatedConversation) => {
          setConversations(updatedConversation);
        }
      );
      
    } catch (err) {
      console.error('Error editing message:', err);
      // // If streaming fails, we'll try to fall back to regular mode
      // const error = err as Error;
      // if (error.message && error.message.includes('does not support streaming')) {
      //   await handleSendMessage(content);
      // }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Main content with chat history and messages */}
      <div className="flex flex-1 overflow-hidden">
        <ChatHistoryList 
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onCreateNewChat={createNewChat}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
        />
        
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {isApiKeyMissing && (
            <div className="p-2 text-sm text-center text-yellow-800 bg-yellow-100">
              Please set your API key for the selected provider in the settings.
            </div>
          )}
          
          <ChatMessageArea 
            activeConversation={activeConversation}
            isLoading={isLoading}
            error={error ? error.message : null}
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
            onRegenerateResponse={handleRegenerateResponse}
            onEditMessage={handleEditMessage}
            isCurrentlyStreaming={chatServiceRef.current?.isCurrentlyStreaming(activeConversationId) || false}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 