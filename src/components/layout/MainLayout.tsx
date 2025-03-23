import React, { ReactNode, useState, useEffect } from 'react';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';
import SettingsPage from '../settings/SettingsPage';
import { SettingsService, UserSettings } from '../../services/settings-service';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [activePage, setActivePage] = useState('chat');
  const [loadedModels] = useState<string[]>(['OpenAI API']);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({ apiKey: '', selectedModel: '' });

  // Initialize settings
  useEffect(() => {
    const settingsService = SettingsService.getInstance();
    setSettings(settingsService.getSettings());
  }, []);

  // Handle page changes
  const handlePageChange = (page: string) => {
    if (page === 'settings') {
      setShowSettings(true);
    } else {
      setActivePage(page);
    }
  };

  // Handle settings save
  const handleSaveSettings = (newSettings: UserSettings) => {
    const settingsService = SettingsService.getInstance();
    settingsService.updateSettings(newSettings);
    setSettings(newSettings);
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
        onSave={handleSaveSettings}
        currentSettings={settings}
      />
    </div>
  );
};

export default MainLayout; 