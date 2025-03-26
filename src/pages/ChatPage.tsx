import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatHistoryList from '../components/chat/ChatHistoryList';
import ChatMessageArea from '../components/chat/ChatMessageArea';
import { Conversation } from '../types/chat';
import { ModelCacheService } from '../services/model-cache-service';
import { SettingsService } from '../services/settings-service';
import { ChatService } from '../services/chat-service';

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
        const aiService = chatService.getAIService();
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
        
        setIsServiceInitialized(true);
        
        // Initialize model cache
        const modelCache = ModelCacheService.getInstance();
        modelCache.getAllModels(); // Start fetching models in the background
        
        // Get saved model from settings if no initial model provided
        if (!initialSelectedModel) {
          const settingsService = SettingsService.getInstance();
          const settings = settingsService.getSettings();
          if (settings.selectedModel) {
            settingsService.setSelectedModel(settings.selectedModel);
          }
        }
        
        return () => {
          unsubscribe(); // Clean up the subscription
        };
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };
    
    initServices();
  }, [initialSelectedModel]);

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

  // Update selected model when initialSelectedModel changes
  useEffect(() => {
    const selectedModel = SettingsService.getInstance().getSelectedModel();
    if (initialSelectedModel && initialSelectedModel !== selectedModel) {
      SettingsService.getInstance().setSelectedModel(initialSelectedModel);
    }
  }, [initialSelectedModel, SettingsService.getInstance().getSelectedModel()]);
  
  // Save selected model to settings when it changes
  useEffect(() => {
    const selectedModel = SettingsService.getInstance().getSelectedModel();
    if (selectedModel && isServiceInitialized) {
      const settingsService = SettingsService.getInstance();
      const settings = settingsService.getSettings();
      
      if (settings.selectedModel !== selectedModel) {
        settingsService.updateSettings({
          ...settings,
          selectedModel: selectedModel
        });
      }
    }
  }, [SettingsService.getInstance().getSelectedModel(), isServiceInitialized]);

  // Get the active conversation
  const activeConversation = activeConversationId
    ? conversations.find(c => c.id === activeConversationId) || null
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
      setActiveConversationId(newConversation.id);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  }, [SettingsService.getInstance().getSelectedModel(), isServiceInitialized]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      const selectedModel = SettingsService.getInstance().getSelectedModel();
      const selectedProvider = SettingsService.getInstance().getSelectedProvider();
      console.log('selectedProvider', selectedProvider);
      console.log('selectedModel', selectedModel);
      
      // Send user message
      await chatService.sendMessage(content, (updatedConversation) => {
        setConversations(updatedConversation);
      });

      // Update conversations state again
      setConversations(chatService.getConversations());
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Select a conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    
    // Also update in the service
    if (chatServiceRef.current) {
      chatServiceRef.current.setActiveConversation(id);
    }
  };

  // Rename a conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    if (!isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      
      // Rename the conversation
      await chatService.renameConversation(id, newTitle);
      
      // Update conversations state
      setConversations(chatService.getConversations());
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (id: string) => {
    if (!isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      
      // Delete the conversation
      await chatService.deleteConversation(id);
      
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
              Please set your OpenAI API key in the settings to use this model.
            </div>
          )}
          
          <ChatMessageArea 
            activeConversation={activeConversation}
            isLoading={isLoading}
            error={error ? error.message : null}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 