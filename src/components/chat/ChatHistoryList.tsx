import React from 'react';
import { Conversation } from '../../types/chat';
import { PlusCircle, MessageSquare, MoreVertical } from 'lucide-react';

interface ChatHistoryListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateNewChat: () => void;
}

export const ChatHistoryList: React.FC<ChatHistoryListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateNewChat,
}) => {
  return (
    <div className="flex flex-col w-64 h-full border-r border-gray-200 bg-gray-50">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onCreateNewChat}
          className="flex items-center justify-center w-full p-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <PlusCircle size={16} className="mr-2" />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare size={24} className="mb-2" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <ul className="py-2">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`flex items-center justify-between w-full px-4 py-2 text-left ${
                    activeConversationId === conversation.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center truncate">
                    <MessageSquare size={16} className="flex-shrink-0 mr-2" />
                    <span className="truncate">{conversation.title}</span>
                  </div>
                  <MoreVertical size={16} className="flex-shrink-0 text-gray-400" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryList; 