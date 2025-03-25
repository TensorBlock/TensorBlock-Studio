import { useState, useEffect } from 'react';
import { ChatPage } from './pages/ChatPage';
import MainLayout from './components/layout/MainLayout';
import { SettingsService, SETTINGS_CHANGE_EVENT } from './services/settings-service';
import DatabaseInitializer from './components/core/DatabaseInitializer';

function App() {
  // State for settings
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  
  // Load settings when app starts
  useEffect(() => {
    const settingsService = SettingsService.getInstance();
    const selectedProvider = settingsService.getSelectedProvider();
    setApiKey(settingsService.getApiKey(selectedProvider));
    setSelectedModel(settingsService.getSelectedModel());
    
    // Listen for settings changes
    const handleSettingsChange = () => {
      const provider = settingsService.getSelectedProvider();
      setApiKey(settingsService.getApiKey(provider));
      setSelectedModel(settingsService.getSelectedModel());
    };
    
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    return () => window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
  }, []);

  return (
    <DatabaseInitializer>
      <MainLayout>
        <ChatPage 
          initialSelectedModel={selectedModel}
          apiKey={apiKey}
        />
      </MainLayout>
    </DatabaseInitializer>
  );
}

export default App;