import React, { ReactNode, useState } from 'react';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';
import SettingsPage from '../../pages/SettingsPage';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [activePage, setActivePage] = useState('chat');
  const [loadedModels] = useState<string[]>(['OpenAI API']);
  const [showSettings, setShowSettings] = useState(false);

  // Handle page changes
  const handlePageChange = (page: string) => {
    if (page === 'settings') {
      setShowSettings(true);
    } else {
      setActivePage(page);
    }
  };

  // Handle settings save
  const handleSettingsSaved = () => {
    // Refresh the page or reload the necessary components
    console.log('Settings saved, updating components...');
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <TitleBar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activePage={activePage}
          onChangePage={handlePageChange}
        />
        
        <div className="flex flex-col flex-1">
          {/* Main content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
          
          <BottomBar loadedModels={loadedModels} />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsPage 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSaved}
      />
    </div>
  );
};

export default MainLayout; 