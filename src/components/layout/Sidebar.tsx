import React from 'react';
import { MessageSquare, Settings } from 'lucide-react';
import tensorBlockLogo from '../../public/logos/TensorBlock_logo_dark.svg';

interface SidebarProps {
  activePage: string;
  onChangePage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onChangePage }) => {
  return (
    <div className="w-[68px] h-full bg-[#f8f8f8] border-r border-gray-200 flex flex-col">
      {/* Logo area */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10">
          <img 
            src={tensorBlockLogo} 
            alt="TensorBlock Logo" 
            className="w-8 h-8"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 16h.01" /><path d="M8 16h.01" /><path d="M12 8v8" /></svg>';
            }}
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex flex-col items-center flex-1 pt-2">
        <button 
          className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${
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
      <div className="flex justify-center p-4">
        <button 
          className="flex items-center justify-center w-12 h-12 text-gray-600 rounded-lg hover:bg-gray-100"
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