import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Conversation, Message } from '../../types/chat';
import { Send, Square, Copy, RotateCcw, Share2, Pencil, Loader2 } from 'lucide-react';
import MarkdownContent from './MarkdownContent';
import MessageToolboxMenu, { ToolboxAction } from '../ui/MessageToolboxMenu';
import { MessageHelper } from '../../services/message-helper';

interface ChatMessageAreaProps {
  activeConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  onSendMessage: (content: string) => void;
  onStopStreaming?: () => void;
  onRegenerateResponse?: () => void;
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
  
  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    if(activeConversation) {
      setMessagesList(MessageHelper.mapMessagesTreeToList(activeConversation));
    }
  }, [activeConversation, activeConversation?.messages]);
  
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
  const handleRegenerateResponse = () => {
    if (onRegenerateResponse) {
      onRegenerateResponse();
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
                  onClick: () => handleRegenerateResponse(),
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
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          
          {isCurrentlyStreaming || hasStreamingMessage ? (
            <button
              type="button"
              onClick={handleStopStreaming}
              className="p-2 text-white bg-red-500 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Stop response"
              title="Stop response"
            >
              <Square size={20} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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