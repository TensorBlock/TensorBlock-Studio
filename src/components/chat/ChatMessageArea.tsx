import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Conversation } from '../../types/chat';
import { Send, Loader, Square, Copy, RotateCcw, Share2, Trash2, Pencil } from 'lucide-react';
import MarkdownContent from './MarkdownContent';
import MessageToolboxMenu, { ToolboxAction } from '../ui/MessageToolboxMenu';

interface ChatMessageAreaProps {
  activeConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  onSendMessage: (content: string) => void;
  onSendStreamingMessage?: (content: string) => void;
  onStopStreaming?: () => void;
  onRegenerateResponse?: () => void;
  onDeleteMessage?: (messageId: string) => void;
  isStreamingSupported?: boolean;
  isCurrentlyStreaming?: boolean;
}

export const ChatMessageArea: React.FC<ChatMessageAreaProps> = ({
  activeConversation,
  isLoading,
  error,
  onSendMessage,
  onSendStreamingMessage,
  onStopStreaming,
  onRegenerateResponse,
  onDeleteMessage,
  isStreamingSupported = false,
  isCurrentlyStreaming = false,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    if (isStreamingSupported && onSendStreamingMessage) {
      onSendStreamingMessage(input);
    } else {
      onSendMessage(input);
    }
    
    setInput('');
  };

  const handleStopStreaming = () => {
    if (onStopStreaming) {
      onStopStreaming();
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

  // Handle delete message
  const handleDeleteMessage = (messageId: string) => {
    if (onDeleteMessage) {
      onDeleteMessage(messageId);
    } else {
      console.error('Delete message function not provided');
    }
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
  
  // If no active conversation is selected
  if (!activeConversation) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-gray-500">
        <h3 className="mb-4 text-2xl font-light">Select a conversation or start a new chat</h3>
      </div>
    );
  }
  
  // Check if there's a streaming message
  const hasStreamingMessage = activeConversation.messages.some(m => m.id.startsWith('streaming-'));
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {activeConversation.messages.filter(m => m.role !== 'system').map((message) => {
          const isUserMessage = message.role === 'user';
          
          // Define actions based on message type (user or AI)
          const toolboxActions: ToolboxAction[] = isUserMessage
            ? [
                {
                  id: 'edit',
                  icon: Pencil,
                  label: 'Edit',
                  onClick: () => handleActionError('edit message'),
                },
                {
                  id: 'copy',
                  icon: Copy,
                  label: 'Copy',
                  onClick: () => handleCopyMessage(message.content),
                },
                {
                  id: 'delete',
                  icon: Trash2,
                  label: 'Delete',
                  onClick: () => handleDeleteMessage(message.id),
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
                },
                {
                  id: 'delete',
                  icon: Trash2,
                  label: 'Delete',
                  onClick: () => handleDeleteMessage(message.id),
                }
              ];
              
          return (
            <div 
              key={message.id}
              className={`flex flex-col ${isUserMessage ? 'items-end' : 'items-start'}`}
              onMouseEnter={() => setHoveredMessageId(message.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
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
                  <MarkdownContent content={message.content} />
                )}
              </div>
              
              {/* Message toolbox */}
              <div className="mt-1">
                <MessageToolboxMenu 
                  actions={toolboxActions} 
                  className={`mr-1 ${hoveredMessageId === message.id ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>
            </div>
          );
        })}
        
        {isLoading && !hasStreamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-200 text-gray-800 rounded-tl-none">
              <div className="flex items-center space-x-2">
                <Loader size={16} className="animate-spin" />
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