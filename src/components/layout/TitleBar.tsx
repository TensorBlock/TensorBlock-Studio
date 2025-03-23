import React, { useEffect, useState } from 'react';

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  // Check if window is maximized on mount
  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electron && window.electron.isMaximized) {
        const maximized = await window.electron.isMaximized();
        setIsMaximized(maximized);
      }
    };
    
    checkMaximized();
  }, []);

  // Window control handlers
  const handleMinimize = () => {
    if (window.electron && window.electron.minimize) {
      window.electron.minimize();
    }
  };

  const handleMaximize = async () => {
    if (!window.electron) return;
    
    if (isMaximized && window.electron.unmaximize) {
      await window.electron.unmaximize();
      setIsMaximized(false);
    } else if (window.electron.maximize) {
      await window.electron.maximize();
      setIsMaximized(true);
    }
  };

  const handleClose = () => {
    if (window.electron && window.electron.closeApp) {
      window.electron.closeApp();
    }
  };

  return (
    <div className="h-[29px] bg-[#f3f3f3] flex items-center justify-end w-full app-region-drag">
      <div className="flex items-center flex-1 px-2">
        <span className="text-sm font-medium text-gray-700">TensorBlock Studio</span>
      </div>
      <div className="flex h-full app-region-no-drag">
        <button 
          onClick={handleMinimize}
          className="h-full w-[45px] flex items-center justify-center hover:bg-gray-300"
          aria-label="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <line x1="0" y1="0.5" x2="10" y2="0.5" stroke="black" strokeWidth="1" />
          </svg>
        </button>
        <button 
          onClick={handleMaximize}
          className="h-full w-[45px] flex items-center justify-center hover:bg-gray-300"
          aria-label={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="1" y="1" width="8" height="8" stroke="black" strokeWidth="1" fill="none" />
              <rect x="3" y="3" width="8" height="8" stroke="black" strokeWidth="1" fill="none" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0" y="0" width="10" height="10" stroke="black" strokeWidth="1" fill="none" />
            </svg>
          )}
        </button>
        <button 
          onClick={handleClose}
          className="h-full w-[45px] flex items-center justify-center hover:bg-red-500 hover:text-white"
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar; 