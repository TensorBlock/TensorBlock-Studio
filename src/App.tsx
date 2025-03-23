import { useState, useEffect } from 'react';
import { ChatPage } from './pages/ChatPage';
import MainLayout from './components/layout/MainLayout';
import { SettingsService } from './services/settings-service';

function App() {
  // State for settings
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  
  // Load settings when app starts
  useEffect(() => {
    const settingsService = SettingsService.getInstance();
    setApiKey(settingsService.getApiKey());
    setSelectedModel(settingsService.getSelectedModel());
    
    // Listen for settings changes
    const handleStorageChange = () => {
      setApiKey(settingsService.getApiKey());
      setSelectedModel(settingsService.getSelectedModel());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <MainLayout>
      <ChatPage 
        initialSelectedModel={selectedModel}
        apiKey={apiKey}
      />
    </MainLayout>
  );
}

export default App;