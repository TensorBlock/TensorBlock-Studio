import React, { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import SettingsPage from '../pages/SettingsPage';
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
    if(activePage === 'settings' && page !== activePage){
      // Save settings
    }

    if (page === 'settings') {
      setShowSettings(true);
      setActivePage('settings');
    } else {
      setShowSettings(false);
      setActivePage(page);
    }
  };

  // Handle page changes
  const handleOpenSettingsDialog = () => {
    handlePageChange('settings');
  };

  // Handle selecting a model
  const handleSelectModel = (modelId: string, provider: string) => {
    SettingsService.getInstance().setSelectedModel(modelId);
    SettingsService.getInstance().setSelectedProvider(provider);
  };

  return (
    <div className="flex flex-col w-full h-screen bg-white">
      {/* <TitleBar /> */}
      <TopBar 
        onSelectModel={handleSelectModel}
        onOpenSettingsDialog={handleOpenSettingsDialog}
      />

      <div className="flex flex-1 w-full overflow-hidden">
        <Sidebar 
          activePage={activePage}
          onChangePage={handlePageChange}
        />

        <div className="flex flex-col flex-1 w-[calc(100%-68px)] bg-main-background-color">
          {/* Main content */}

          <div className='relative flex flex-col flex-1 w-full overflow-hidden major-area-border major-area-bg-color'>
            <div className="flex-1 w-full overflow-auto">
              {children}
            </div>
            
            <SettingsPage
              isOpen={showSettings}
            />
          </div>

          {/* <BottomBar loadedModels={loadedModels} /> */}
        </div>
      </div>
      
    </div>
  );
};

export default MainLayout; 