import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import SettingsPage from '../pages/SettingsPage';
import TopBar from './TopBar';
import { SettingsService } from '../../services/settings-service';

interface MainLayoutProps {
  children: ReactNode;
  activePage: string;
  onChangePage: (page: string) => void;
  showSettings: boolean;
  setShowSettings: (showSettings: boolean) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  activePage, 
  onChangePage, 
  showSettings, 
  setShowSettings
}) => {
  
  // Handle settings dialog
  const handleOpenSettingsDialog = () => {
    if(activePage === 'settings' && activePage !== 'settings'){
      // Save settings
      SettingsService.getInstance().saveSettings();
    }

    setShowSettings(true);
    onChangePage('settings');
  };

  // Handle page changes
  const handlePageChange = (page: string) => {
    if (page === 'settings') {
      setShowSettings(true);
      onChangePage('settings');
    } else {
      setShowSettings(false);
      onChangePage(page);
    }
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
          showSettings={showSettings}
          setShowSettings={setShowSettings}
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