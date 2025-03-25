import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../../types/chat';
import { PlusCircle, MessageSquare, MoreVertical, Edit, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import ContextMenu, { ContextMenuItem } from '../ui/ContextMenu';
import ConfirmDialog from '../ui/ConfirmDialog';

interface ChatHistoryListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
}

export const ChatHistoryList: React.FC<ChatHistoryListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateNewChat,
  onRenameConversation,
  onDeleteConversation,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage if available
    const savedState = localStorage.getItem('chat_sidebar_collapsed');
    return savedState ? JSON.parse(savedState) : false;
  });
  
  // Button visibility state
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    itemId: '',
    confirmText: '',
    cancelText: '',
    confirmColor: 'red' as 'red' | 'blue' | 'green' | 'gray'
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Focus input when editing
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Update localStorage when isCollapsed changes
  useEffect(() => {
    localStorage.setItem('chat_sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Show button briefly after sidebar state changes
  useEffect(() => {
    setIsButtonVisible(true);
    const timer = setTimeout(() => {
      if (!isButtonHovered && !isSidebarHovered) {
        setIsButtonVisible(false);
      }
    }, 1500); // Show for 1.5 seconds after toggling
    
    return () => clearTimeout(timer);
  }, [isCollapsed, isButtonHovered, isSidebarHovered]);

  // Handle mouse move to show/hide toggle button
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Update mouse position
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      if (!sidebarRef.current || isButtonHovered) return;
      
      // Get sidebar element dimensions and position
      const rect = sidebarRef.current.getBoundingClientRect();
      const sidebarRight = rect.right;
      
      // Define the sensitivity area (how close the mouse needs to be to show the button)
      const sensitivityArea = 40; // pixels
      
      // Check if mouse is within the sensitivity area
      const isNearToggle = Math.abs(e.clientX - sidebarRight) < sensitivityArea;
      
      // Only update if the value is different to avoid unnecessary re-renders
      if (isNearToggle !== isButtonVisible) {
        setIsButtonVisible(isNearToggle);
      }
    };
    
    // Add mousemove event listener
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isButtonHovered, isButtonVisible]);

  const handleMenuClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleRenameClick = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      itemId: id,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'red'
    });
  };

  const handleConfirmDelete = () => {
    // Proceed with deletion
    onDeleteConversation(confirmDialog.itemId);
    // Close the dialog
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancelDelete = () => {
    // Just close the dialog
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
      setEditingId(null);
    }
  };

  const handleRenameCancel = () => {
    setEditingId(null);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleButtonMouseEnter = () => {
    setIsButtonHovered(true);
    setIsButtonVisible(true);
  };

  const handleButtonMouseLeave = () => {
    setIsButtonHovered(false);
    // Only hide the button if the mouse is not near the sidebar edge
    if (!sidebarRef.current) return;
    
    const rect = sidebarRef.current.getBoundingClientRect();
    const isNearToggle = Math.abs(mousePosition.x - rect.right) < 40;
    
    if (!isNearToggle && !isSidebarHovered) {
      setIsButtonVisible(false);
    }
  };

  const handleSidebarMouseEnter = () => {
    setIsSidebarHovered(true);
    setIsButtonVisible(true);
  };

  const handleSidebarMouseLeave = () => {
    setIsSidebarHovered(false);
    
    // Only hide if not near toggle and not hovering over button
    if (!isButtonHovered) {
      const rect = sidebarRef.current?.getBoundingClientRect();
      if (rect) {
        const isNearToggle = Math.abs(mousePosition.x - rect.right) < 40;
        if (!isNearToggle) {
          setIsButtonVisible(false);
        }
      }
    }
  };

  // Create context menu items for a conversation
  const getContextMenuItems = (conversation: Conversation): ContextMenuItem[] => [
    {
      id: 'rename',
      icon: Edit,
      label: 'Rename',
      onClick: (e) => handleRenameClick(e, conversation),
      color: 'text-gray-700'
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Delete',
      onClick: (e) => handleDeleteClick(e, conversation.id),
      color: 'text-red-600'
    }
  ];

  return (
    <div 
      ref={sidebarRef}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
      className={`flex flex-col h-full border-r border-gray-200 bg-gray-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0' : 'w-64'} relative`}
    >
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        confirmColor={confirmDialog.confirmColor}
        icon={<AlertTriangle className="text-red-600" size={24} />}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      
      {/* Collapse toggle button */}
      <button 
        onClick={toggleSidebar}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleButtonMouseLeave}
        onFocus={() => setIsButtonVisible(true)}
        onBlur={() => !isSidebarHovered && setIsButtonVisible(false)}
        className={`absolute z-10 flex items-center justify-center w-6 h-20 transform -translate-y-1/2 bg-gray-200 -right-6 top-1/2 hover:bg-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-opacity duration-300 ${isButtonVisible || isButtonHovered ? 'opacity-100' : 'opacity-0'}`}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      
      <div className={`p-4 border-b border-gray-200 ${isCollapsed ? 'flex justify-center opacity-0 pointer-events-none' : ''}`}>
        {isCollapsed ? (
          <button
            onClick={onCreateNewChat}
            className="w-0 p-0 transition-colors bg-white border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="New Chat"
            aria-label="Create new chat"
          >
          </button>
        ) : (
          <button
            onClick={onCreateNewChat}
            className="flex items-center justify-center w-full p-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusCircle size={16} className="mr-2" />
            New Chat
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full text-gray-500 ${isCollapsed ? 'px-2' : ''}`}>
            <MessageSquare size={isCollapsed ? 16 : 24} className="mb-2" />
            {!isCollapsed && <p className="text-sm">No conversations yet</p>}
          </div>
        ) : (
          <ul className="py-2">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="relative">
                {editingId === conversation.id && !isCollapsed ? (
                  <form onSubmit={handleRenameSubmit} className="px-4 py-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onBlur={handleRenameCancel}
                      onKeyDown={(e) => e.key === 'Escape' && handleRenameCancel()}
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    className={`flex items-center justify-between w-full ${isCollapsed ? 'px-0 py-3 flex-col' : 'px-4 py-2'} text-left ${
                      activeConversationId === conversation.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={isCollapsed ? conversation.title : undefined}
                  >
                    {isCollapsed ? (
                      <MessageSquare size={16} className="mx-auto" />
                    ) : (
                      <>
                        <div className="flex items-center truncate">
                          <MessageSquare size={16} className="flex-shrink-0 mr-2" />
                          <span className="truncate">{conversation.title}</span>
                        </div>
                        <div onClick={(e) => handleMenuClick(e, conversation.id)}>
                          <MoreVertical size={16} className="flex-shrink-0 text-gray-400 hover:text-gray-600" />
                        </div>
                      </>
                    )}
                  </button>
                )}
                
                {!isCollapsed && (
                  <ContextMenu
                    items={getContextMenuItems(conversation)}
                    isOpen={openMenuId === conversation.id}
                    onClose={() => setOpenMenuId(null)}
                    position={{ top: '100%', right: '12px' }}
                    width="10rem"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryList; 