import React, { ReactNode, useState } from 'react';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';
import SettingsPage from '../../pages/SettingsPage';
import TopBar from './TopBar';
import { SettingsService } from '../../services/settings-service';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [activePage, setActivePage] = useState('chat');
  const [showSettings, setShowSettings] = useState(false);

  // Handle page changes
  const handlePageChange = (page: string) => {
    if (page === 'settings') {
      setShowSettings(true);
    } else {
      setActivePage(page);
    }
  };

  // Handle page changes
  const handleOpenSettingsDialog = () => {
    setShowSettings(true);
  };

  // Handle settings save
  const handleSettingsSaved = () => {
    // Refresh the page or reload the necessary components
    console.log('Settings saved, updating components...');
  };

  // Handle selecting a model
  const handleSelectModel = (modelId: string, provider: string) => {
    SettingsService.getInstance().setSelectedModel(modelId);
    SettingsService.getInstance().setSelectedProvider(provider);
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
          
          <TopBar 
            onSelectModel={handleSelectModel}
            selectedModel={SettingsService.getInstance().getSelectedModel()}
            selectedProvider={SettingsService.getInstance().getSelectedProvider()}
            onOpenSettingsDialog={handleOpenSettingsDialog}
          />

          <div className="flex-1 overflow-auto">
            {children}
          </div>
          
          {/* <BottomBar loadedModels={loadedModels} /> */}
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