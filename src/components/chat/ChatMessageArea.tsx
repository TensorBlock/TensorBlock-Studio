import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Conversation, Message } from '../../types/chat';
import { Send, Square, Copy, RotateCcw, Share2, Pencil, Loader2, Globe } from 'lucide-react';
import MarkdownContent from './MarkdownContent';
import MessageToolboxMenu, { ToolboxAction } from '../ui/MessageToolboxMenu';
import { MessageHelper } from '../../services/message-helper';
import { DatabaseIntegrationService } from '../../services/database-integration';
import { SettingsService } from '../../services/settings-service';
import { ChatService } from '../../services/chat-service';
import { AIServiceCapability } from '../../services/core/capabilities';

interface ChatMessageAreaProps {
  activeConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  onSendMessage: (content: string) => void;
  onStopStreaming?: () => void;
  onRegenerateResponse?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  isCurrentlyStreaming?: boolean;
}

export const ChatMessageArea: React.FC<ChatMessageAreaProps> = ({
  activeConversation,
  isLoading,
  error,
  onSendMessage,
  onStopStreaming,
  onRegenerateResponse,
  onEditMessage,
  isCurrentlyStreaming = false,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [messagesList, setMessagesList] = useState<Message[]>([]);
  const [webSearchActive, setWebSearchActive] = useState(false);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    if(activeConversation) {
      const messagesList = MessageHelper.mapMessagesTreeToList(activeConversation);
      console.log(activeConversation);
      console.log(messagesList);
      setMessagesList(messagesList);
    }
  }, [activeConversation, activeConversation?.messages]);

  useEffect(() => {
    const webSearchActive = SettingsService.getInstance().getWebSearchEnabled();
    setWebSearchActive(webSearchActive);
    
  }, [SettingsService.getInstance().getWebSearchEnabled()]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input);
    
    setInput('');
  };

  const handleStopStreaming = () => {
    if (onStopStreaming) {
      onStopStreaming();
      isCurrentlyStreaming = false;
    }
  };

  // Handle regenerate response
  const handleRegenerateResponse = (messageId: string) => {
    if (onRegenerateResponse) {
      onRegenerateResponse(messageId);
    } else {
      console.error('Regenerate response function not provided');
    }
  };

  // Handle edit message
  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  // Handle send edited message
  const handleSendEditedMessage = () => {
    if (editingMessageId && onEditMessage && editingContent.trim()) {
      const newContent = editingContent;

      // First cancel the edit mode
      setEditingMessageId(null);
      setEditingContent('');
      
      onEditMessage(editingMessageId, newContent);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Handle copy message action
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
      .catch(() => {
        console.error('Failed to copy message');
      });
  };

  // Placeholder error handler for other actions
  const handleActionError = (action: string) => {
    console.error(`Function not implemented yet: ${action}`);
  };
  
  const getMessagesList = () => {
    return messagesList;
  }

  const handleMessageIndexChange = async (messageId: string, isPrevious: boolean) => {
    if (!activeConversation) return;

    const message = messagesList.find(m => m.messageId === messageId);
    if (!message || !message.fatherMessageId) return;

    const fatherMessage = activeConversation.messages.get(message.fatherMessageId);
    if (!fatherMessage) return;

    const currentIndex = fatherMessage.childrenMessageIds.indexOf(messageId);
    if (currentIndex <= 0 && isPrevious) return;
    if (currentIndex >= fatherMessage.childrenMessageIds.length - 1 && !isPrevious) return;

    // Create updated message
    const updatedFatherMessage = {
      ...fatherMessage,
      preferIndex: currentIndex + (isPrevious ? -1 : 1),
    };

    // Update activeConversation
    activeConversation.messages.set(updatedFatherMessage.messageId, updatedFatherMessage);

    // Update database
    const dbService = DatabaseIntegrationService.getInstance();
    await dbService.updateChatMessage(
      updatedFatherMessage.messageId,
      updatedFatherMessage,
      updatedFatherMessage.conversationId
    );

    setMessagesList(MessageHelper.mapMessagesTreeToList(activeConversation));
  };

  const getCurrentMessageIndex = (messageId: string) => {
    const message = messagesList.find(m => m.messageId === messageId);
    if (!message) return 0;
    
    const fatherMessage = messagesList.find(m => m.messageId === message.fatherMessageId);
    if (fatherMessage) {
      // Find the index of this message in the father's children
      const index = fatherMessage.childrenMessageIds.indexOf(messageId);
      return index >= 0 ? index : 0;
    }
    return 0;
  }

  const getTotalMessagesNumber = (messageId: string) => {
    const message = messagesList.find(m => m.messageId === messageId);
    if (!message) return 0;
    
    const fatherMessage = messagesList.find(m => m.messageId === message.fatherMessageId);
    if (fatherMessage) {
      return fatherMessage.childrenMessageIds.length;
    }
    return 0;
  }

  const handleToggleWebSearch = () => {
    setWebSearchActive(!webSearchActive);
    SettingsService.getInstance().setWebSearchEnabled(!webSearchActive);
  }
  
  const getWebSearchAllowed = () => {
    return ChatService.getInstance().getCurrentProviderModelCapabilities().includes(AIServiceCapability.WebSearch);
  }

  // If no active conversation is selected
  if (!activeConversation) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-gray-500">
        <h3 className="mb-4 text-2xl font-light">Select a conversation or start a new chat</h3>
      </div>
    );
  }
  
  // Check if there's a streaming message
  const hasStreamingMessage = Array.from(activeConversation.messages.values()).some(m => m.messageId.startsWith('streaming-'));
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {getMessagesList().map((message) => {
          const isUserMessage = message.role === 'user';
          const isEditing = editingMessageId === message.messageId;
          
          // Define actions based on message type (user or AI)
          const toolboxActions: ToolboxAction[] = isUserMessage
            ? [
                {
                  id: 'edit',
                  icon: Pencil,
                  label: 'Edit',
                  onClick: () => handleEditMessage(message.messageId, message.content),
                },
                {
                  id: 'copy',
                  icon: Copy,
                  label: 'Copy',
                  onClick: () => handleCopyMessage(message.content),
                }
              ]
            : [
                {
                  id: 'copy',
                  icon: Copy,
                  label: 'Copy',
                  onClick: () => handleCopyMessage(message.content),
                },
                {
                  id: 'share',
                  icon: Share2,
                  label: 'Share',
                  onClick: () => handleActionError('share message'),
                },
                {
                  id: 'regenerate',
                  icon: RotateCcw,
                  label: 'Regenerate',
                  onClick: () => handleRegenerateResponse(message.messageId),
                }
              ];
              
          return (
            <div 
              key={message.messageId}
              className={`flex flex-col ${isUserMessage ? 'items-end' : 'items-start'}`}
              onMouseEnter={() => setHoveredMessageId(message.messageId)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              {isEditing && isUserMessage ? (
                <div className="w-[80%]">
                  <textarea 
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end mt-2 space-x-2">
                    <button 
                      onClick={handleCancelEdit} 
                      className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSendEditedMessage} 
                      className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                      disabled={!editingContent.trim()}
                    >
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isUserMessage 
                        ? 'bg-blue-500 text-white rounded-tr-none' 
                        : 'bg-gray-200 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    {isUserMessage ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      message.content === '' ? (
                        <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                      ) : (
                        <MarkdownContent content={message.content} />
                      )
                    )}
                  </div>
                  
                  {/* Message toolbox */}
                  <div className="mt-1">
                    <MessageToolboxMenu 
                      actions={toolboxActions} 
                      className={`mr-1 ${hoveredMessageId === message.messageId ? 'opacity-100' : 'opacity-0'}`}
                      currentMessageIndex={getCurrentMessageIndex(message.messageId)}
                      totalMessages={getTotalMessagesNumber(message.messageId)}
                      onPreviousMessageClick={() => handleMessageIndexChange(message.messageId, true)}
                      onNextMessageClick={() => handleMessageIndexChange(message.messageId, false)}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
        
        {isLoading && !hasStreamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-200 text-gray-800 rounded-tl-none">
              <div className="flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin" />
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center">
            <div className="max-w-[80%] rounded-lg p-3 bg-red-100 text-red-800 border border-red-300">
              <p>Error: {error}</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 pt-4 pb-2 m-2 mb-4 border border-gray-200 rounded-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-row items-center justify-between px-2">
          {
            getWebSearchAllowed() ? (
              <button
                type="button"
                onClick={handleToggleWebSearch}
                className={`flex items-center justify-center w-fit h-8 p-2 transition-all duration-200 rounded-full outline outline-2 hover:outline
                  ${webSearchActive ? 'bg-blue-50 outline-blue-300 hover:bg-blue-200 hover:outline hover:outline-blue-500' : 'bg-white outline-gray-100 hover:bg-blue-50 hover:outline hover:outline-blue-300'}`}
                aria-label="Toggle Web Search"
                title="Toggle Web Search"
              >
                <Globe className={`mr-1 ${webSearchActive ? 'text-blue-500' : 'text-gray-400'} transition-all duration-200`} size={20} />
                <span className={`text-sm font-light ${webSearchActive ? 'text-blue-500' : 'text-gray-400'} transition-all duration-200`}>Web Search</span>
              </button>
            )
            :
            (
              <button
                type="button"
                className={`flex items-center justify-center bg-gray-100 w-fit h-8 p-2 ml-2 transition-all duration-200 rounded-full cursor-not-allowed`}
                aria-label="Toggle Web Search"
                title="Toggle Web Search"
              >
                <Globe className={`mr-1 text-gray-400 transition-all duration-200`} size={20} />
                <span className={`text-sm font-light text-gray-400 transition-all duration-200`}>Web Search (Not available)</span>
              </button>
            )
          }

          {isCurrentlyStreaming || hasStreamingMessage ? (
            <button
              type="button"
              onClick={handleStopStreaming}
              className="flex items-center justify-center w-10 h-10 text-white bg-red-500 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Stop response"
              title="Stop response"
            >
              <Square size={20} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center justify-center w-10 h-10 text-white bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatMessageArea; 