import React, { useState, useEffect, useCallback, useRef } from 'react';
import TopBar from '../components/layout/TopBar';
import ChatHistoryList from '../components/chat/ChatHistoryList';
import ChatMessageArea from '../components/chat/ChatMessageArea';
import { Conversation } from '../types/chat';
import { useAI } from '../hooks/useAI';
import { DatabaseIntegrationService } from '../services/database-integration';
import { ModelCacheService } from '../services/model-cache-service';
import { SettingsService } from '../services/settings-service';

interface ChatPageProps {
  initialSelectedModel?: string;
  apiKey?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({ 
  initialSelectedModel = '',
  apiKey = ''
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(initialSelectedModel);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { isLoading, error, getChatCompletion } = useAI();
  const initialChatCreated = useRef(false);
  const dbServiceRef = useRef<DatabaseIntegrationService | null>(null);
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  // Initialize the database
  useEffect(() => {
    const initDb = async () => {
      try {
        const dbService = DatabaseIntegrationService.getInstance();
        await dbService.initialize();
        dbServiceRef.current = dbService;
        setIsDbInitialized(true);
        
        // Load conversations
        const conversationsList = await dbService.loadConversationsList();
        setConversations(conversationsList);
        
        // Set active conversation if there are any
        if (conversationsList.length > 0 && !activeConversationId) {
          setActiveConversationId(conversationsList[0].id);
        }
        
        // Initialize model cache
        const modelCache = ModelCacheService.getInstance();
        modelCache.getAllModels(); // Start fetching models in the background
        
        // Get saved model from settings if no initial model provided
        if (!initialSelectedModel) {
          const settingsService = SettingsService.getInstance();
          const settings = settingsService.getSettings();
          if (settings.lastUsedModel) {
            setSelectedModel(settings.lastUsedModel);
          }
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    
    initDb();
  }, []);

  // Load active conversation details when selected
  useEffect(() => {
    if (activeConversationId && isDbInitialized) {
      const loadConversation = async () => {
        try {
          const dbService = dbServiceRef.current;
          if (!dbService) return;
          
          const conversation = await dbService.loadConversation(activeConversationId);
          
          if (conversation) {
            // Update the conversation in the list with its messages
            setConversations(prev => 
              prev.map(c => c.id === activeConversationId ? conversation : c)
            );
          }
        } catch (error) {
          console.error('Failed to load conversation:', error);
        }
      };
      
      loadConversation();
    }
  }, [activeConversationId, isDbInitialized]);

  // Update selected model when initialSelectedModel changes
  useEffect(() => {
    if (initialSelectedModel && initialSelectedModel !== selectedModel) {
      setSelectedModel(initialSelectedModel);
    }
  }, [initialSelectedModel, selectedModel]);
  
  // Save selected model to settings when it changes
  useEffect(() => {
    if (selectedModel && isDbInitialized) {
      const settingsService = SettingsService.getInstance();
      const settings = settingsService.getSettings();
      
      if (settings.lastUsedModel !== selectedModel) {
        settingsService.updateSettings({
          ...settings,
          lastUsedModel: selectedModel
        });
      }
    }
  }, [selectedModel, isDbInitialized]);

  // Get the active conversation
  const activeConversation = activeConversationId
    ? conversations.find(c => c.id === activeConversationId) || null
    : null;

  // Create a new conversation
  const createNewChat = useCallback(async () => {
    if (!isDbInitialized) return;
    
    try {
      const dbService = dbServiceRef.current;
      if (!dbService) return;
      
      const newConversation = await dbService.createConversation(
        'New Conversation', 
        selectedModel
      );
      
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  }, [selectedModel, isDbInitialized]);

  // Handle selecting a model
  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
  };

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !selectedModel || !isDbInitialized) return;
    
    try {
      const dbService = dbServiceRef.current;
      if (!dbService) return;
      
      // Save user message to database
      const userMessage = await dbService.saveChatMessage(
        activeConversationId,
        'user',
        content
      );
      
      // Update conversation in UI
      const updatedConversations = conversations.map(conv => {
        if (conv.id === activeConversationId) {
          // Update conversation title for new conversations
          const shouldUpdateTitle = conv.messages.length === 1 && conv.messages[0].role === 'system';
          const title = shouldUpdateTitle 
            ? content.substring(0, 30) + (content.length > 30 ? '...' : '') 
            : conv.title;
          
          // Update conversation
          const updatedConv = {
            ...conv,
            title,
            messages: [...conv.messages, userMessage],
            updatedAt: new Date()
          };
          
          // Update conversation in database
          dbService.updateConversation(updatedConv);
          
          return updatedConv;
        }
        return conv;
      });
      
      setConversations(updatedConversations);
      
      // Prepare messages for AI service
      const activeConv = updatedConversations.find(c => c.id === activeConversationId);
      if (!activeConv) return;
      
      const messagesForAI = activeConv.messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Get AI response
      const response = await getChatCompletion(messagesForAI);
      
      if (response) {
        // Save assistant message to database
        const assistantMessage = await dbService.saveChatMessage(
          activeConversationId,
          'assistant',
          response.content
        );
        
        // Update conversation in UI
        setConversations(prevConversations => 
          prevConversations.map(conv => {
            if (conv.id === activeConversationId) {
              const updatedConv = {
                ...conv,
                messages: [...conv.messages, assistantMessage],
                updatedAt: new Date()
              };
              
              // Update conversation in database
              dbService.updateConversation(updatedConv);
              
              return updatedConv;
            }
            return conv;
          })
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Select a conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  // Rename a conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    if (!isDbInitialized) return;
    
    try {
      const dbService = dbServiceRef.current;
      if (!dbService) return;
      
      // Update in database
      await dbService.renameConversation(id, newTitle);
      
      // Update in UI
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === id ? { ...conv, title: newTitle } : conv
        )
      );
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (id: string) => {
    if (!isDbInitialized) return;
    
    try {
      const dbService = dbServiceRef.current;
      if (!dbService) return;
      
      // Delete from database
      await dbService.deleteConversation(id);
      
      // Remove from UI
      setConversations(prevConversations => 
        prevConversations.filter(conv => conv.id !== id)
      );
      
      // If the active conversation was deleted, set active to null or the first available
      if (activeConversationId === id) {
        const remainingConversations = conversations.filter(conv => conv.id !== id);
        setActiveConversationId(remainingConversations.length > 0 ? remainingConversations[0].id : null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Create an initial chat if there are none
  useEffect(() => {
    if (conversations.length === 0 && !initialChatCreated.current && isDbInitialized) {
      initialChatCreated.current = true;
      createNewChat();
    }
  }, [conversations.length, createNewChat, isDbInitialized]);

  // Show API key missing message if needed
  const isApiKeyMissing = !apiKey && selectedModel;

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar 
        onSelectModel={handleSelectModel}
        selectedModel={selectedModel}
      />

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