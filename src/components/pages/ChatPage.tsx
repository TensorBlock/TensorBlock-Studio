import { useState, useEffect, useCallback, useRef } from 'react';
import ChatHistoryList from '../chat/ChatHistoryList';
import ChatMessageArea from '../chat/ChatMessageArea';
import { Conversation, ConversationFolder } from '../../types/chat';
import { SETTINGS_CHANGE_EVENT, SettingsService } from '../../services/settings-service';
import { ChatService } from '../../services/chat-service';
import { AIService } from '../../services/ai-service';
import { MCPServerSettings } from '../../types/settings';

export const ChatPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<ConversationFolder[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const chatServiceRef = useRef<ChatService | null>(null);
  const [isServiceInitialized, setIsServiceInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(true);
  const [mcpServers, setMcpServers] = useState<Record<string, MCPServerSettings>>({});
  const [selectedMcpServers, setSelectedMcpServers] = useState<string[]>([]);

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
        
        // Load folders from chat service
        const foldersList = chatService.getFolders();
        setFolders(foldersList);
        
        // Load MCP servers
        const mcpServersList = chatService.getAvailableMCPServers();
        setMcpServers(mcpServersList);
        
        // Set active conversation from chat service
        const activeId = chatService.getActiveConversationId();
        if (activeId) {
          setActiveConversationId(activeId);
        }
        
        setIsServiceInitialized(true);
        
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
    
  }, [isServiceInitialized]);

  // Load MCP servers when settings change
  useEffect(() => {
    const handleSettingsChange = () => {
      if (chatServiceRef.current) {
        const mcpServersList = chatServiceRef.current.getAvailableMCPServers();
        setMcpServers(mcpServersList);
      }
    };
    
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    
    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    };
  }, []);

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

  useEffect(() => {
    const handleSettingsChange = () => {
      setSelectedProvider(SettingsService.getInstance().getSelectedProvider());
      setSelectedModel(SettingsService.getInstance().getSelectedModel());
      setIsApiKeyMissing(!SettingsService.getInstance().getApiKey());
    };

    setIsApiKeyMissing(!SettingsService.getInstance().getApiKey());
    
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
  }, []);

  // Get the active conversation
  const activeConversation = activeConversationId
    ? conversations.find(c => c.conversationId === activeConversationId) || null
    : null;

  // Create a new conversation
  const createNewChat = useCallback(async (folderId?: string) => {
    if (!isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      
      const newConversation = await chatService.createConversation(
        'New Conversation',
        folderId
      );
      
      // Update the state with the new list of conversations
      setConversations(chatService.getConversations());
      setActiveConversationId(newConversation.conversationId);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  }, [SettingsService.getInstance().getSelectedModel(), isServiceInitialized]);

  // Create a new folder
  const createNewFolder = useCallback(async () => {
    if (!isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      
      // Create new folder with default name
      await chatService.createFolder('New Folder');
      
      // Update the state with the new list of folders
      setFolders(chatService.getFolders());
    } catch (error) {
      console.error('Failed to create new folder:', error);
    }
  }, [isServiceInitialized]);

  // Rename a folder
  const handleRenameFolder = async (folderId: string, newName: string) => {
    if (!isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      
      // Rename the folder
      await chatService.renameFolder(folderId, newName);
      
      // Update folders state
      setFolders(chatService.getFolders());
    } catch (error) {
      console.error('Error renaming folder:', error);
    }
  };

  // Delete a folder
  const handleDeleteFolder = async (folderId: string) => {
    if (!isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      
      // Delete the folder
      await chatService.deleteFolder(folderId);
      
      // Update state
      setFolders(chatService.getFolders());
      setConversations(chatService.getConversations());
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  // Move a conversation to a folder
  const handleMoveConversation = async (conversationId: string, folderId: string) => {
    if (!isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      
      // Move the conversation
      await chatService.moveConversationToFolder(conversationId, folderId);
      
      // Update state
      setConversations(chatService.getConversations());
      setFolders(chatService.getFolders());
    } catch (error) {
      console.error('Error moving conversation:', error);
    }
  };

  // Handle sending a message with streaming
  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;
      
      // Check if there are selected MCP servers to use
      if (selectedMcpServers.length > 0) {
        // Send message with MCP tools
        await chatService.sendMessageWithMCPTools(
          content,
          activeConversationId,
          selectedMcpServers,
          true,
          (updatedConversation) => {
            setConversations(updatedConversation);
          }
        );
      } else {
        // Send regular message
        await chatService.sendMessage(
          content, 
          activeConversationId,
          true,
          (updatedConversation) => {
            setConversations(updatedConversation);
          }
        );
      }
    } catch (err) {
      console.error('Error sending streaming message:', err);
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

  // Handle sending a message with files
  const handleSendMessageWithFiles = async (content: string, files: File[]) => {
    if (!activeConversationId || !isServiceInitialized || !chatServiceRef.current) return;
    
    try {
      const chatService = chatServiceRef.current;

      // Send user message with files
      await chatService.sendMessageWithFiles(
        content, 
        files,
        activeConversationId,
        true,
        (updatedConversation) => {
          setConversations(updatedConversation);
        }
      );
      
    } catch (err) {
      console.error('Error sending message with files:', err);
    }
  };

  // Toggle selection of an MCP server
  const handleToggleMcpServer = (serverId: string) => {
    setSelectedMcpServers(prev => {
      if (prev.includes(serverId)) {
        return prev.filter(id => id !== serverId);
      } else {
        return [...prev, serverId];
      }
    });
  };

  return (
    <div className="flex flex-col w-full h-full bg-white">

      {/* Main content with chat history and messages */}
      <div className="flex w-full h-full overflow-hidden">
        <ChatHistoryList 
          conversations={conversations}
          folders={folders}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onCreateNewChat={createNewChat}
          onCreateNewFolder={createNewFolder}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveConversation={handleMoveConversation}
        />
        
        <div className="flex flex-col w-full h-full overflow-hidden">
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
            onSendMessageWithFiles={handleSendMessageWithFiles}
            onStopStreaming={handleStopStreaming}
            onRegenerateResponse={handleRegenerateResponse}
            onEditMessage={handleEditMessage}
            isCurrentlyStreaming={chatServiceRef.current?.isCurrentlyStreaming(activeConversationId) || false}
            selectedProvider={selectedProvider}
            selectedModel={selectedModel}
            mcpServers={mcpServers}
            selectedMcpServers={selectedMcpServers}
            onToggleMcpServer={handleToggleMcpServer}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 