import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Conversation, Message } from '../../types/chat';
import { MCPServerSettings } from '../../types/settings';
import { Send, Square, Copy, Pencil, Loader2, Globe, RefreshCw, Check, X, 
  // ServerCog 
} from 'lucide-react';
import MarkdownContent from './MarkdownContent';
import MessageToolboxMenu, { ToolboxAction } from '../ui/MessageToolboxMenu';
import { MessageHelper } from '../../services/message-helper';
import { DatabaseIntegrationService } from '../../services/database-integration';
import { SETTINGS_CHANGE_EVENT, SettingsService } from '../../services/settings-service';
import { ChatService } from '../../services/chat-service';
import { AIServiceCapability } from '../../types/capabilities';
import ProviderIcon from '../ui/ProviderIcon';
import { useTranslation } from '../../hooks/useTranslation';
import FileUploadButton from './FileUploadButton';
import FileAttachmentDisplay from './FileAttachmentDisplay';
// import ImageGenerationButton from './ImageGenerationButton';

interface ChatMessageAreaProps {
  activeConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  onSendMessage: (content: string, files?: File[]) => void;
  onSendMessageWithFiles?: (content: string, files: File[]) => void;
  onStopStreaming?: () => void;
  onRegenerateResponse?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  isCurrentlyStreaming?: boolean;
  selectedProvider: string;
  selectedModel: string;
  mcpServers?: Record<string, MCPServerSettings>;
  selectedMcpServers?: string[];
  onToggleMcpServer?: (serverId: string) => void;
}

export const ChatMessageArea: React.FC<ChatMessageAreaProps> = ({
  activeConversation,
  isLoading,
  error,
  onSendMessage,
  onSendMessageWithFiles,
  onStopStreaming,
  onRegenerateResponse,
  onEditMessage,
  isCurrentlyStreaming = false,
  selectedProvider,
  selectedModel,
  // mcpServers,
  // selectedMcpServers,
  // onToggleMcpServer,
}) => {
  const { t } = useTranslation();
  const [inputValue, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editingContentRef = useRef<HTMLTextAreaElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [messagesList, setMessagesList] = useState<Message[]>([]);
  const [ableToWebSearch, setAbleToWebSearch] = useState(false);
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [isWebSearchPreviewEnabled, setIsWebSearchPreviewEnabled] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // const [mcpPopupOpen, setMcpPopupOpen] = useState(false);
  // const mcpButtonRef = useRef<HTMLButtonElement>(null);
  // const mcpPopupRef = useRef<HTMLDivElement>(null);
  
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
        setWebSearchActive(settingsService.getWebSearchActive());
        setIsWebSearchPreviewEnabled(settingsService.getWebSearchPreviewEnabled());
      } catch (error) {
        console.error('Failed to load web search status:', error);
      }
    };
    
    loadWebSearchStatus();

    window.addEventListener(SETTINGS_CHANGE_EVENT, () => {
      loadWebSearchStatus();
    });
  }, []);

  useEffect(() => {
    const result = ChatService.getInstance().getCurrentProviderModelCapabilities().includes(AIServiceCapability.WebSearch);
    setAbleToWebSearch(result);
  }, [selectedProvider, selectedModel]);

  useEffect(() => {
    if(isCurrentlyStreaming) {
      inputRef.current?.focus();
    }
  }, [isCurrentlyStreaming]);

  // Handle file selection
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles([...selectedFiles, ...files]);
  };

  // Remove a selected file
  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  // Handle form submission with files
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLoading || isCurrentlyStreaming || !inputValue.trim()) return;

    if (selectedFiles.length > 0) {
      // Use the combined method with files parameter
      onSendMessage(inputValue, selectedFiles);
      setSelectedFiles([]);
    } else {
      // Use the combined method without files
      onSendMessage(inputValue);
    }

    setInput('');
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
    if(isCurrentlyStreaming) return;

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

  const handleStopStreaming = () => {
    if (onStopStreaming) {
      onStopStreaming();
    }
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

  const handleInputChanged = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Adjust height based on content
    const textarea = e.target;
    textarea.style.height = 'auto'; // Reset height
    
    // Calculate new height based on scrollHeight, with min and max constraints
    const minHeight = 36; // Approx height for 1 row
    const maxHeight = 36 * 3; // Approx height for 3 rows
    
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }

  // Add useEffect to handle click outside for MCP popup
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       mcpPopupRef.current && 
  //       !mcpPopupRef.current.contains(event.target as Node) &&
  //       mcpButtonRef.current && 
  //       !mcpButtonRef.current.contains(event.target as Node)
  //     ) {
  //       setMcpPopupOpen(false);
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, []);

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
  
  const webSearchElement = isWebSearchPreviewEnabled ? (
    ableToWebSearch ? (
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
  )
  :<></>;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Messages area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {getMessagesList().map((message) => {
          if(message.role === 'system') return null;

          const isUserMessage = message.role === 'user';
          const isEditing = editingMessageId === message.messageId;
          
          // Define actions based on message type (user or AI)
          const toolboxActions: ToolboxAction[] = isUserMessage
            ? [
                {
                  id: 'edit',
                  icon: Pencil,
                  label: t('chat.edit'),
                  onClick: () => handleEditMessage(message.messageId, MessageHelper.MessageContentToText(message.content)),
                },
                {
                  id: 'copy',
                  icon: Copy,
                  label: t('chat.copy'),
                  onClick: () => handleCopyMessage(MessageHelper.MessageContentToText(message.content)),
                }
              ]
            : [
                {
                  id: 'copy',
                  icon: Copy,
                  label: t('chat.copy'),
                  onClick: () => handleCopyMessage(MessageHelper.MessageContentToText(message.content)),
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
                  label: t('chat.regenerate'),
                  onClick: () => handleRegenerateResponse(message.messageId),
                }
              ];
             
          return (
            <div 
              key={message.messageId}
              className={`flex flex-col h-fit ${isUserMessage ? 'items-end' : 'items-start'}`}
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
                      disabled={!editingContent.trim() || isCurrentlyStreaming}
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
                    className={`max-w-[80%] h-fit rounded-lg p-3 text-wrap break-words ${
                      isUserMessage 
                        ? 'message-user rounded-tr-none' 
                        : 'message-assistant rounded-tl-none'
                    }`}
                  >
                    {isUserMessage ? (
                      <MarkdownContent content={message.content} isUserMessage={true} />
                    ) : (
                      (message.content.length === 0 || MessageHelper.MessageContentToText(message.content).length === 0) ? (
                        <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                      ) : (
                        <MarkdownContent content={message.content} isUserMessage={false} />
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
      <form onSubmit={handleFormSubmit}
        onClick={() => {
          inputRef.current?.focus();
        }}
        onFocus={() => {
          inputRef.current?.focus();
        }}
        className={`relative flex flex-col gap-2 h-fit px-4 pt-3 pb-2 m-2 mb-4 transition-all duration-200 rounded-lg form-textarea-border cursor-text`}
      >
        {/* Selected Files Display */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-row w-full gap-1 mb-2">
            {selectedFiles.map((file, index) => (
              <FileAttachmentDisplay 
                key={`${file.name}-${index}`}
                file={file}
                isUser={true}
                showRemoveButton={true}
                onRemove={() => handleRemoveFile(index)}
              />
            ))}
          </div>
        )}

        <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {handleInputChanged(e);}}
            onKeyDown={(e) => {
              if(e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleFormSubmit(e);
              }
            }}
            placeholder={t('chat.typeMessage')}
            className="w-[100%] resize-none focus:outline-none"
            disabled={isLoading}
            inputMode='text'
            rows={1}
            style={{ minHeight: '36px', maxHeight: '108px', height: '36px', overflow: 'auto' }}
          ></textarea>

        <div className="flex flex-row items-center justify-between flex-1 h-full gap-2 px-1">
          <div className='flex flex-row items-center h-full gap-2'>
            {/* File upload button */}
            {onSendMessageWithFiles && (
              <FileUploadButton
                onFilesSelected={handleFilesSelected}
                disabled={isLoading || isCurrentlyStreaming}
              />
            )}
            
            {/* Image generation button */}
            {/* <ImageGenerationButton 
              disabled={isLoading || isCurrentlyStreaming}
              onImageGenerate={(prompt, provider, model) => {
                // Set special message for image generation
                const imageGenPrompt = prompt || `/image Generate an image using ${provider} ${model}`;
                setInput(imageGenPrompt);
                // Focus the input
                inputRef.current?.focus();
              }}
            /> */}
          </div>

          {/* Web search element */}
          {
            webSearchElement
          }

          {/* MCP Servers dropdown */}
          {/* {mcpServers && Object.keys(mcpServers).length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMcpPopupOpen(!mcpPopupOpen)}
                ref={mcpButtonRef}
                className={`flex items-center justify-center w-fit h-8 p-2 transition-all duration-200 rounded-full outline outline-2
                  ${selectedMcpServers && selectedMcpServers.length > 0 ? 'bg-blue-50 outline-blue-300 hover:bg-blue-200 hover:outline hover:outline-blue-500' : 'bg-white outline-gray-100 hover:bg-blue-50 hover:outline hover:outline-blue-300'}`}
                aria-label="MCP Servers"
                title="MCP Servers"
              >
                <ServerCog className={`mr-1 ${selectedMcpServers && selectedMcpServers.length > 0 ? 'text-blue-500' : 'text-gray-400'} transition-all duration-200`} size={20} />
                <span className={`text-sm font-light ${selectedMcpServers && selectedMcpServers.length > 0 ? 'text-blue-500' : 'text-gray-400'} transition-all duration-200`}>
                  MCP Tools {selectedMcpServers && selectedMcpServers.length > 0 ? `(${selectedMcpServers.length})` : ''}
                </span>
              </button>
              
              {mcpPopupOpen && (
                <div 
                  ref={mcpPopupRef}
                  className="absolute z-10 mt-2 image-generation-popup"
                  style={{ bottom: '100%', left: 0, minWidth: '220px' }}
                >
                  <div className="p-2">
                    <div className="mb-2 text-sm font-medium text-gray-700">
                      {t('chat.availableMcpServers')}
                    </div>
                    <div className="overflow-y-auto max-h-60">
                      {Object.values(mcpServers)
                        // Filter out image generation servers - they're handled by the ImageGenerationButton
                        .filter(server => !server.isImageGeneration)
                        .map((server) => (
                          <div
                            key={server.id}
                            className={`flex items-center px-3 py-2 cursor-pointer rounded-md ${
                              selectedMcpServers?.includes(server.id)
                                ? 'image-generation-provider-selected'
                                : 'image-generation-provider-item'
                            }`}
                            onClick={() => onToggleMcpServer?.(server.id)}
                          >
                            <ServerCog className="w-5 h-5 mr-2" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{server.name}</span>
                              {server.isDefault && (
                                <span className="text-xs text-gray-500">{t('mcpServer.default')}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      
                      {Object.values(mcpServers).filter(server => !server.isImageGeneration).length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          {t('chat.noMcpServersAvailable')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )} */}

          <span className={`flex-1 hidden text-xs text-center pt-4 text-gray-300 md:block truncate pr-6 lg:pr-12`}>
            {t('chat.pressShiftEnterToChangeLines')}
          </span>

          {isCurrentlyStreaming || hasStreamingMessage ? (
            <button
              type="button"
              onClick={handleStopStreaming}
              className="flex items-center justify-center w-10 h-10 transition-all duration-200 rounded-full conversation-stop-button focus:outline-none"
              aria-label={t('chat.stopResponse')}
              title={t('chat.stopResponse')}
            >
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex items-center justify-center w-10 h-10 transition-all duration-200 rounded-full conversation-send-button focus:outline-none disabled:cursor-not-allowed"
              aria-label={isLoading || !inputValue.trim() ? t('chat.cannotSendMessage') : t('chat.sendMessage')}
              title={isLoading || !inputValue.trim() ? t('chat.cannotSendMessage') : t('chat.sendMessage')}
            >
              <Send className="translate-x-[0px] translate-y-[1px]" size={20} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatMessageArea; 