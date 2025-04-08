import React from 'react';
import { MessageSquare, Settings } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onChangePage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onChangePage }) => {
  return (
    <div className="w-[68px] h-full bg-main-background-color flex flex-col">
 
      {/* Navigation buttons */}
      <div className="flex flex-col items-center flex-1 pt-2">
        <button 
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            activePage === 'chat' 
              ? 'bg-gray-200 text-black' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => onChangePage('chat')}
          aria-label="Chat"
        >
          <MessageSquare size={22} />
        </button>
        
        {/* Add more navigation buttons here as needed */}
      </div>

      {/* Settings button at bottom */}
      <div className="flex justify-center mb-4">
        <button 
          className={`flex items-center justify-center w-12 h-12 text-gray-600 rounded-lg ${
            activePage === 'settings' 
              ? 'bg-gray-200 text-black' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => onChangePage('settings')}
          aria-label="Settings"
        >
          <Settings size={22} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 