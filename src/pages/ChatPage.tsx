import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TopBar from '../components/layout/TopBar';
import ChatHistoryList from '../components/chat/ChatHistoryList';
import ChatMessageArea from '../components/chat/ChatMessageArea';
import { Conversation, Message } from '../types/chat';
import { useAI } from '../hooks/useAI';
import { ChatMessage } from '../services/core/ai-service-provider';

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

  // Update selected model when initialSelectedModel changes
  useEffect(() => {
    if (initialSelectedModel && initialSelectedModel !== selectedModel) {
      setSelectedModel(initialSelectedModel);
    }
  }, [initialSelectedModel, selectedModel]);

  // Get the active conversation
  const activeConversation = activeConversationId
    ? conversations.find(c => c.id === activeConversationId) || null
    : null;

  // Create a new conversation
  const createNewChat = useCallback(() => {
    const id = uuidv4();
    const newConversation: Conversation = {
      id,
      title: 'New Conversation',
      messages: [
        {
          id: uuidv4(),
          role: 'system',
          content: 'You are a helpful assistant. Be concise in your responses.',
          timestamp: new Date()
        }
      ],
      modelId: selectedModel,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(id);
  }, [selectedModel]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !selectedModel) return;
    
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    // Update conversation with user message
    const updatedConversations = conversations.map(conv => {
      if (conv.id === activeConversationId) {
        // Update conversation title for new conversations
        const shouldUpdateTitle = conv.messages.length === 1 && conv.messages[0].role === 'system';
        
        return {
          ...conv,
          title: shouldUpdateTitle 
            ? content.substring(0, 30) + (content.length > 30 ? '...' : '') 
            : conv.title,
          messages: [...conv.messages, userMessage],
          updatedAt: new Date()
        };
      }
      return conv;
    });
    
    setConversations(updatedConversations);
    
    // Prepare messages for AI service
    const activeConv = updatedConversations.find(c => c.id === activeConversationId);
    if (!activeConv) return;
    
    const messagesForAI: ChatMessage[] = activeConv.messages.map(m => ({
      role: m.role,
      content: m.content
    }));
    
    // Get AI response
    const response = await getChatCompletion(messagesForAI);
    
    if (response) {
      // Add assistant message
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      };
      
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, assistantMessage],
              updatedAt: new Date()
            };
          }
          return conv;
        })
      );
    }
  };

  // Select a conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  // Create an initial chat if there are none
  useEffect(() => {
    if (conversations.length === 0 && !initialChatCreated.current) {
      initialChatCreated.current = true;
      createNewChat();
    }
  }, [conversations.length, createNewChat]);

  // Show API key missing message if needed
  const isApiKeyMissing = !apiKey && selectedModel;

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar 
        onSelectModel={setSelectedModel}
        selectedModel={selectedModel}
      />

      {/* Main content with chat history and messages */}
      <div className="flex flex-1 overflow-hidden">
        <ChatHistoryList 
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onCreateNewChat={createNewChat}
        />
        
        <div className="flex flex-col flex-1 overflow-hidden">
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