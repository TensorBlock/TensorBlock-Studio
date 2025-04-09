import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Conversation, Message } from '../../types/chat';
import { Send, Square, Copy, Pencil, Loader2, Globe, RefreshCw, Check, X } from 'lucide-react';
import MarkdownContent from './MarkdownContent';
import MessageToolboxMenu, { ToolboxAction } from '../ui/MessageToolboxMenu';
import { MessageHelper } from '../../services/message-helper';
import { DatabaseIntegrationService } from '../../services/database-integration';
import { SettingsService } from '../../services/settings-service';
import { ChatService } from '../../services/chat-service';
import { AIServiceCapability } from '../../types/capabilities';
import ProviderIcon from '../ui/ProviderIcon';

interface ChatMessageAreaProps {
  activeConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  onSendMessage: (content: string) => void;
  onStopStreaming?: () => void;
  onRegenerateResponse?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  isCurrentlyStreaming?: boolean;
  selectedProvider: string;
  selectedModel: string;
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
  selectedProvider,
  selectedModel,
}) => {
  const [inputValue, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editingContentRef = useRef<HTMLTextAreaElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [messagesList, setMessagesList] = useState<Message[]>([]);
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [isWebSearchAllowed, setIsWebSearchAllowed] = useState(false);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    if(activeConversation) {
      const messagesList = MessageHelper.mapMessagesTreeToList(activeConversation, false);
      setMessagesList(messagesList);
    }

    handleCancelEdit();
  }, [activeConversation, activeConversation?.messages]);

  // Load web search status on component mount
  useEffect(() => {
    const loadWebSearchStatus = async () => {
      try {
        const settingsService = SettingsService.getInstance();
        setWebSearchActive(settingsService.getWebSearchEnabled());
      } catch (error) {
        console.error('Failed to load web search status:', error);
      }
    };
    
    loadWebSearchStatus();
  }, []);

  useEffect(() => {
    const result = ChatService.getInstance().getCurrentProviderModelCapabilities().includes(AIServiceCapability.WebSearch);
    setIsWebSearchAllowed(result);
  }, [selectedProvider, selectedModel]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    onSendMessage(inputValue);
    
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
  // const handleActionError = (action: string) => {
  //   console.error(`Function not implemented yet: ${action}`);
  // };
  
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

    setMessagesList(MessageHelper.mapMessagesTreeToList(activeConversation, false));
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

  // Handle toggle web search
  const handleToggleWebSearch = async () => {
    try {
      const newStatus = !webSearchActive;
      const settingsService = SettingsService.getInstance();
      await settingsService.setWebSearchEnabled(newStatus);
      setWebSearchActive(newStatus);
    } catch (error) {
      console.error('Failed to toggle web search:', error);
    }
  };

  const getModelName = (modelID: string, provider: string) => {
    const providerSettings = SettingsService.getInstance().getProviderSettings(provider);
    if(!providerSettings.models) return modelID;

    const model = providerSettings.models?.find(m => m.modelId === modelID);
    if(!model) return modelID;

    return model.modelName;
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
                // {
                //   id: 'share',
                //   icon: Share2,
                //   label: 'Share',
                //   onClick: () => handleActionError('share message'),
                // },
                {
                  id: 'regenerate',
                  icon: RefreshCw,
                  label: 'Regenerate',
                  onClick: () => handleRegenerateResponse(message.messageId),
                }
              ];
             
          if(message.role === 'system') return null;
          
          return (
            <div 
              key={message.messageId}
              className={`flex flex-col ${isUserMessage ? 'items-end' : 'items-start'}`}
              onMouseEnter={() => setHoveredMessageId(message.messageId)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              {isEditing && isUserMessage ? (
                <form 
                  onSubmit={handleSendEditedMessage}
                  onClick={() => {
                    editingContentRef.current?.focus();
                  }}
                  onFocus={() => {
                    editingContentRef.current?.focus();
                  }}
                  onKeyDown={(e) => {
                    if(e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                  className="w-[80%] px-3 py-2 form-textarea-border rounded-lg cursor-text transition-all duration-200"
                >
                  <textarea
                    ref={editingContentRef}
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full rounded-lg resize-none focus:outline-none"
                    rows={3}
                    autoFocus={true}
                  />
                  <div className="flex justify-end mt-2 space-x-2">
                    <button 
                      type="button"
                      onClick={handleCancelEdit} 
                      className="p-2 text-sm text-red-400 transition-all duration-200 rounded-md hover:text-red-500 message-icon-btn"
                    >
                      <X size={18} />
                    </button>
                    <button
                      type="submit"
                      className="p-2 text-sm transition-all duration-200 rounded-md message-icon-btn"
                      disabled={!editingContent.trim()}
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {!isUserMessage &&
                    <div className="flex items-center flex-1 gap-2 px-2 mb-4 justify-left">
                      <ProviderIcon providerName={message.provider} className="w-4 h-4 mr-2" />
                      <span className="text-sm message-model-tag">{getModelName(message.model, message.provider)}</span>
                      <span className="px-3 py-1 text-xs font-medium message-provider-tag">{message.provider}</span>
                    </div>
                  }

                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isUserMessage 
                        ? 'message-user rounded-tr-none' 
                        : 'message-assistant rounded-tl-none'
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
      <form onSubmit={handleSubmit}
        onClick={() => {
          inputRef.current?.focus();
        }}
        onFocus={() => {
          inputRef.current?.focus();
        }}
        className="flex flex-col gap-2 px-4 pt-3 pb-2 m-2 mb-4 transition-all duration-200 rounded-lg form-textarea-border cursor-text"
      >
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInput(e.target.value);
              // Adjust height based on content
              const textarea = e.target;
              textarea.style.height = 'auto'; // Reset height
              
              // Calculate new height based on scrollHeight, with min and max constraints
              const minHeight = 38; // Approx height for 1 row
              const maxHeight = 38 * 3; // Approx height for 3 rows
              
              const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
              textarea.style.height = `${newHeight}px`;
            }}
            placeholder="Type your message..."
            className="flex-1 px-2 pt-1 pb-2 resize-none focus:outline-none"
            disabled={isLoading}
            inputMode='text'
            rows={1}
            style={{ minHeight: '38px', maxHeight: '114px', height: '38px', overflow: 'auto' }}
          ></textarea>
        </div>

        <div className="flex flex-row items-center justify-between px-1">
          {
            isWebSearchAllowed ? (
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
              className="flex items-center justify-center w-10 h-10 transition-all duration-200 rounded-full conversation-stop-button focus:outline-none"
              aria-label="Stop response"
              title="Stop response"
            >
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex items-center justify-center w-10 h-10 transition-all duration-200 rounded-full conversation-send-button focus:outline-none disabled:cursor-not-allowed"
              aria-label={isLoading || !inputValue.trim() ? 'Cannot send message' : 'Send message'}
              title={isLoading || !inputValue.trim() ? 'Cannot send message' : 'Send message'}
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