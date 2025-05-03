import React from 'react';
import { MessageSquare, Settings, Image, Languages, FolderClosed, ServerCog } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onChangePage: (page: string) => void;
  showSettings: boolean;
  setShowSettings: (showSettings: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage, 
  onChangePage, 
  showSettings, 
  setShowSettings
}) => {

  const getActivePage = () => {
    if(showSettings){
      return 'settings';
    }
    else if(activePage === 'chat'){
      return 'chat';
    }
    else if(activePage === 'image'){
      return 'image';
    }
    else if(activePage === 'translation'){
      return 'translation';
    }
    else if(activePage === 'files'){
      return 'files';
    }
    else if(activePage === 'mcpserver'){
      return 'mcpserver';
    }

    return '';
  }

  return (
    <div className="w-[68px] h-full bg-main-background-color flex flex-col">
 
      {/* Navigation buttons */}
      <div className="flex flex-col items-center flex-1 gap-1 pt-2">
        <button 
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
            getActivePage() === 'chat' 
              ? 'navigation-item-selected navigation-item-text' 
              : 'navigation-item navigation-item-text'
          }`}
          onClick={() => onChangePage('chat')}
          aria-label="Chat"
        >
          <MessageSquare size={22} />
        </button>
        
        <button 
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
            getActivePage() === 'image' 
              ? 'navigation-item-selected navigation-item-text' 
              : 'navigation-item navigation-item-text'
          }`}
          onClick={() => onChangePage('image')}
          aria-label="Image Generation"
        >
          <Image size={22} />
        </button>
        
        <button 
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
            getActivePage() === 'translation' 
              ? 'navigation-item-selected navigation-item-text' 
              : 'navigation-item navigation-item-text'
          }`}
          onClick={() => onChangePage('translation')}
          aria-label="Translation"
        >
          <Languages size={22} />
        </button>

        <button 
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
            getActivePage() === 'files' 
              ? 'navigation-item-selected navigation-item-text' 
              : 'navigation-item navigation-item-text'
          }`}
          onClick={() => onChangePage('files')}
          aria-label="File Management"
        >
          <FolderClosed size={22} />
        </button>

        <button 
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
            getActivePage() === 'mcpserver' 
              ? 'navigation-item-selected navigation-item-text' 
              : 'navigation-item navigation-item-text'
          }`}
          onClick={() => onChangePage('mcpserver')}
          aria-label="MCP Servers"
        >
          <ServerCog size={22} />
        </button>
      </div>

      {/* Settings button at bottom */}
      <div className="flex justify-center mb-4">
        <button 
          className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
            getActivePage() === 'settings' 
              ? 'navigation-item-selected navigation-item-text' 
              : 'navigation-item navigation-item-text'
          }`}
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
        >
          <Settings size={22} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 