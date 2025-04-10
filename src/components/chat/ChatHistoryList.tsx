import React, { useState, useRef, useEffect } from 'react';
import { Conversation, ConversationFolder } from '../../types/chat';
import { MessageSquare, MoreVertical, Edit, Trash2, ChevronLeft, ChevronRight, AlertTriangle, FolderPlus, Folder, ChevronDown, PlusCircle } from 'lucide-react';
import ContextMenu, { ContextMenuItem } from '../ui/ContextMenu';
import ConfirmDialog from '../ui/ConfirmDialog';

interface ChatHistoryListProps {
  conversations: Conversation[];
  folders: ConversationFolder[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onCreateNewChat: () => void;
  onCreateNewFolder: () => void;
  onRenameConversation: (conversationId: string, newTitle: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveConversation: (conversationId: string, folderId: string) => void;
}

interface DragItem {
  id: string;
  type: 'conversation' | 'folder';
}

export const ChatHistoryList: React.FC<ChatHistoryListProps> = ({
  conversations,
  folders,
  activeConversationId,
  onSelectConversation,
  onCreateNewChat,
  onCreateNewFolder,
  onRenameConversation,
  onDeleteConversation,
  onRenameFolder,
  onDeleteFolder,
  onMoveConversation,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'conversation' | 'folder'>('conversation');
  const [editTitle, setEditTitle] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage if available
    const savedState = localStorage.getItem('chat_sidebar_collapsed');
    return savedState ? JSON.parse(savedState) : false;
  });
  
  // Folder expansion state
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
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
    itemType: '' as 'conversation' | 'folder',
    confirmText: '',
    cancelText: '',
    confirmColor: 'red' as 'red' | 'blue' | 'green' | 'gray'
  });
  
  // Drag and drop state
  const [draggingItem, setDraggingItem] = useState<DragItem | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropTargetType, setDropTargetType] = useState<'folder' | 'root'>('root');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

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
      const rect = toggleButtonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sidebarRight = rect.right;
      const sidebarYCenter = rect.top + rect.height / 2;
      
      // Define the sensitivity area (how close the mouse needs to be to show the button)
      const sensitivityArea = 70; // pixels
      
      // Check if mouse is within the sensitivity area
      const isNearToggle = Math.abs(e.clientX - sidebarRight) < sensitivityArea
        && Math.abs(e.clientY - sidebarYCenter) < sensitivityArea;
      
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

  const handleMenuClick = (e: React.MouseEvent, id: string, type: 'conversation' | 'folder') => {
    e.stopPropagation();
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(id);
      setEditingType(type);
    }
  };

  const handleRenameClick = (e: React.MouseEvent, item: Conversation | ConversationFolder, type: 'conversation' | 'folder') => {
    e.stopPropagation();
    setEditingId(type === 'conversation' ? (item as Conversation).conversationId : (item as ConversationFolder).folderId);
    setEditTitle(type === 'conversation' ? (item as Conversation).title : (item as ConversationFolder).folderName);
    setEditingType(type);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string, type: 'conversation' | 'folder') => {
    e.stopPropagation();
    
    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${type === 'conversation' ? 'Conversation' : 'Folder'}`,
      message: `Are you sure you want to delete this ${type}? ${type === 'folder' ? 'All conversations will be moved to the root.' : 'This action cannot be undone.'}`,
      itemId: id,
      itemType: type,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'red'
    });
  };

  const handleConfirmDelete = () => {
    // Proceed with deletion
    if (confirmDialog.itemType === 'conversation') {
      onDeleteConversation(confirmDialog.itemId);
    } else {
      onDeleteFolder(confirmDialog.itemId);
    }
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
      if (editingType === 'conversation') {
        onRenameConversation(editingId, editTitle.trim());
      } else {
        onRenameFolder(editingId, editTitle.trim());
      }
      setEditingId(null);
    }
  };

  const handleRenameCancel = () => {
    setEditingId(null);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
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
    const isNearToggle = Math.abs(mousePosition.x - rect.right) < 40
      && Math.abs(mousePosition.y - rect.top) < 40;
    
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
        const isNearToggle = Math.abs(mousePosition.x - rect.right) < 40
          && Math.abs(mousePosition.y - rect.top) < 40;
          
        if (!isNearToggle) {
          setIsButtonVisible(false);
        }
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    // Only allow dragging conversations, not folders
    if (item.type !== 'conversation') return;
    
    setDraggingItem(item);
    // Add some ghost image effect
    if (e.dataTransfer.setDragImage) {
      const elem = document.createElement('div');
      elem.classList.add('conversation-selected-item-bg-color', 'p-2', 'rounded', 'shadow', 'text-sm', 'w-fit');
      elem.innerText = conversations.find(c => c.conversationId === item.id)?.title || 'Moving...';
      document.body.appendChild(elem);
      e.dataTransfer.setDragImage(elem, 10, 10);
      setTimeout(() => {
        document.body.removeChild(elem);
      }, 0);
    }
    
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    // Reset drag and drop state
    setDraggingItem(null);
    setDropTargetId(null);
    setDropTargetType('root');
  };

  const handleDragOver = (e: React.DragEvent, targetId: string, targetType: 'folder' | 'root') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drop target if it's different than current one
    if (targetId !== dropTargetId || targetType !== dropTargetType) {
      setDropTargetId(targetId);
      setDropTargetType(targetType);
    }
    
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => {
    setDropTargetId(null);
    setDropTargetType('root');
  };

  const handleDrop = (e: React.DragEvent, targetId: string, targetType: 'folder' | 'root') => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Parse the dragged item data
      const item = JSON.parse(e.dataTransfer.getData('text/plain')) as DragItem;
      
      if (item.type === 'conversation' && draggingItem) {
        // If target is root, pass empty string as folderId
        const folderId = targetType === 'folder' ? targetId : '';
        onMoveConversation(item.id, folderId);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
    
    // Reset drag and drop state
    setDraggingItem(null);
    setDropTargetId(null);
    setDropTargetType('root');
  };

  // Create context menu items for a conversation
  const getConversationContextMenuItems = (conversation: Conversation): ContextMenuItem[] => [
    {
      id: 'rename',
      icon: Edit,
      label: 'Rename',
      onClick: (e) => handleRenameClick(e, conversation, 'conversation'),
      color: 'text-gray-700'
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Delete',
      onClick: (e) => handleDeleteClick(e, conversation.conversationId, 'conversation'),
      color: 'text-red-600'
    }
  ];

  // Create context menu items for a folder
  const getFolderContextMenuItems = (folder: ConversationFolder): ContextMenuItem[] => [
    {
      id: 'rename',
      icon: Edit,
      label: 'Rename',
      onClick: (e) => handleRenameClick(e, folder, 'folder'),
      color: 'text-gray-700'
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Delete',
      onClick: (e) => handleDeleteClick(e, folder.folderId, 'folder'),
      color: 'text-red-600'
    }
  ];

  // Sort items by updatedAt
  const sortByUpdatedAt = <T extends { updatedAt: Date }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  };

  // Prepare data for rendering
  const sortedFolders = sortByUpdatedAt(folders);
  const sortedConversations = sortByUpdatedAt(conversations);
  
  // Group conversations by folder
  const conversationsByFolder: Record<string, Conversation[]> = {};
  
  // Initialize with root conversations
  conversationsByFolder['root'] = sortedConversations.filter(c => !c.folderId);
  
  // Add conversations to their folders
  sortedFolders.forEach(folder => {
    conversationsByFolder[folder.folderId] = sortedConversations.filter(
      c => c.folderId === folder.folderId
    );
  });

  // Combined list of root items (folders and root conversations)
  const rootItems = [
    ...sortedFolders.map(folder => ({ type: 'folder', item: folder })),
    ...conversationsByFolder['root'].map(conv => ({ type: 'conversation', item: conv }))
  ].sort((a, b) => {
    return new Date(b.item.updatedAt).getTime() - new Date(a.item.updatedAt).getTime();
  });

  return (
    <div 
      ref={sidebarRef}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
      className={`flex flex-col h-full frame-right-border major-area-bg-color transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0' : 'w-64'} relative`}
      onDragOver={(e) => handleDragOver(e, 'root', 'root')}
      onDrop={(e) => handleDrop(e, 'root', 'root')}
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
        ref={toggleButtonRef}
        onClick={toggleSidebar}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleButtonMouseLeave}
        onFocus={() => setIsButtonVisible(true)}
        onBlur={() => !isSidebarHovered && setIsButtonVisible(false)}
        className={`absolute chat-history-list-collapse-button z-10 flex items-center justify-center w-6 h-20 transform -translate-y-1/2 -right-6 top-1/2 rounded-r-md transition-opacity duration-300 ${isButtonVisible || isButtonHovered ? 'opacity-100' : 'opacity-0'}`}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      
      <div className={`p-2 h-12 major-area-bg-color transition-all duration-100 ease-in-out ${isCollapsed ? 'opacity-0 pointer-events-none' : 'flex justify-between items-center gap-2'}`}>
        <button
          onClick={onCreateNewFolder}
          className="flex items-center justify-center h-full text-sm font-medium transition-colors aspect-square primary-btn-border primary-btn-bg-color primary-btn-text-color"
        >
          <FolderPlus size={16}/>
        </button>
        
        <button
          onClick={onCreateNewChat}
          className="flex items-center justify-center flex-1 h-full gap-2 pr-2 text-sm font-medium transition-all duration-100 primary-btn-border primary-btn-bg-color primary-btn-text-color"
        >
          <PlusCircle size={16}/>
          <span className="text-sm">New Chat</span>
        </button>
        
      </div>
      
      <div 
        className="flex-1 overflow-y-auto"
      >
        {rootItems.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full text-gray-500 ${isCollapsed ? 'px-2' : ''}`}>
            <MessageSquare size={isCollapsed ? 16 : 24} className="mb-2" />
            {!isCollapsed && <p className="text-sm">No conversations yet</p>}
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5 py-2">
            {rootItems.map(({ type, item }) => (
              <li 
                key={type === 'folder' ? `folder-${item.folderId}` : `conv-${(item as Conversation).conversationId}`} 
                className="relative"
              >
                {/* Folder Item */}
                {type === 'folder' && (
                  <>
                    {editingId === (item as ConversationFolder).folderId && !isCollapsed ? (
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
                      <div
                        className={`flex items-center justify-between w-full ${isCollapsed ? 'px-0 py-3 flex-col' : 'px-2 py-2'} 
                        text-left transition-colors duration-150 cursor-pointer
                        ${dropTargetId === (item as ConversationFolder).folderId && dropTargetType === 'folder' ? 
                          'bg-blue-100 border-2 border-blue-300 rounded-md' : 'conversation-folder-item conversation-folder-item-text'}`}
                        onDragOver={(e) => handleDragOver(e, (item as ConversationFolder).folderId, 'folder')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, (item as ConversationFolder).folderId, 'folder')}
                      >
                        {isCollapsed ? (
                          <Folder fill={(item as ConversationFolder).colorFlag} size={16} className="mx-auto text-gray-600" />
                        ) : (
                          <>
                            <div 
                              className="flex items-center flex-1 truncate cursor-pointer" 
                              onClick={() => toggleFolderExpansion((item as ConversationFolder).folderId)}
                            >
                              <button className="flex items-center justify-center w-6 h-6">
                                {expandedFolders[(item as ConversationFolder).folderId] ? 
                                  <ChevronDown size={16} /> : 
                                  <ChevronRight size={16} />
                                }
                              </button>
                              <Folder fill={(item as ConversationFolder).colorFlag} size={16} className="flex-shrink-0 mr-1 text-gray-600" />
                              <span className="font-semibold truncate select-none">{(item as ConversationFolder).folderName}</span>
                            </div>
                            <div onClick={(e) => handleMenuClick(e, (item as ConversationFolder).folderId, 'folder')}>
                              <MoreVertical size={16} className="flex-shrink-0" />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    
                    {!isCollapsed && (
                      <ContextMenu
                        items={getFolderContextMenuItems(item as ConversationFolder)}
                        isOpen={openMenuId === (item as ConversationFolder).folderId}
                        onClose={() => setOpenMenuId(null)}
                        position={{ top: '2.5rem', right: '12px' }}
                        width="10rem"
                      />
                    )}
                    
                    {/* Folder contents */}
                    {!isCollapsed && expandedFolders[(item as ConversationFolder).folderId] && (
                      <ul className="pl-6 mr-2">
                        {conversationsByFolder[(item as ConversationFolder).folderId]?.map((conversation) => (
                          <li key={conversation.conversationId} className="relative">
                            {editingId === conversation.conversationId ? (
                              <form onSubmit={handleRenameSubmit} className="px-4 py-1">
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
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, { id: conversation.conversationId, type: 'conversation' })}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOver(e, (item as ConversationFolder).folderId, 'folder')}
                                onDrop={(e) => handleDrop(e, (item as ConversationFolder).folderId, 'folder')}
                                onClick={() => onSelectConversation(conversation.conversationId)}
                                className={`flex items-center justify-between w-full px-3 py-2 text-left conversation-item-border transition-all duration-100 cursor-pointer ${
                                  activeConversationId === conversation.conversationId
                                    ? 'conversation-selected-item-bg-color conversation-selected-item-text-color'
                                    : 'conversation-item-bg-color conversation-item-text-color'
                                } 
                                ${draggingItem?.id === conversation.conversationId ? 'opacity-50' : ''}
                                ${
                                  dropTargetId === (item as ConversationFolder).folderId && dropTargetType === 'folder' ? 
                                  'bg-blue-100' : ''
                                }`}
                              >
                                <div className="flex items-center truncate">
                                  <MessageSquare size={16} className="flex-shrink-0 mr-1" />
                                  <span className="truncate">{conversation.title}</span>
                                </div>
                                <div onClick={(e) => handleMenuClick(e, conversation.conversationId, 'conversation')}>
                                  <MoreVertical size={16} className="flex-shrink-0" />
                                </div>
                              </div>
                            )}
                            
                            <ContextMenu
                              items={getConversationContextMenuItems(conversation)}
                              isOpen={openMenuId === conversation.conversationId}
                              onClose={() => setOpenMenuId(null)}
                              position={{ top: '100%', right: '12px' }}
                              width="10rem"
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                
                {/* Conversation Item in Root */}
                {type === 'conversation' && (
                  <>
                    {editingId === (item as Conversation).conversationId && !isCollapsed ? (
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
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, { id: (item as Conversation).conversationId, type: 'conversation' })}
                        onDragEnd={handleDragEnd}
                        onClick={() => onSelectConversation((item as Conversation).conversationId)}
                        className={`flex flex-1 items-center justify-between mx-2 conversation-item-border px-3 py-2 text-left transition-all duration-100 cursor-pointer ${
                          activeConversationId === (item as Conversation).conversationId
                            ? 'conversation-selected-item-bg-color conversation-selected-item-text-color'
                            : 'conversation-item-bg-color conversation-item-text-color'
                        } ${draggingItem?.id === (item as Conversation).conversationId ? 'opacity-50' : ''}`}
                        title={isCollapsed ? (item as Conversation).title : undefined}
                      >
                        {isCollapsed ? (
                          <MessageSquare size={16} className="mx-auto" />
                        ) : (
                          <>
                            <div className="flex items-center truncate">
                              <MessageSquare size={16} className="flex-shrink-0 mr-2" />
                              <span className="truncate">{(item as Conversation).title}</span>
                            </div>
                            <div onClick={(e) => handleMenuClick(e, (item as Conversation).conversationId, 'conversation')}>
                              <MoreVertical size={16} className="flex-shrink-0" />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    
                    {!isCollapsed && (
                      <ContextMenu
                        items={getConversationContextMenuItems(item as Conversation)}
                        isOpen={openMenuId === (item as Conversation).conversationId}
                        onClose={() => setOpenMenuId(null)}
                        position={{ top: '100%', right: '12px' }}
                        width="10rem"
                      />
                    )}
                  </>
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