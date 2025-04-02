import { useState, useEffect } from 'react';
import { ChatPage } from './pages/ChatPage';
import MainLayout from './components/layout/MainLayout';
import { SettingsService, SETTINGS_CHANGE_EVENT } from './services/settings-service';
import DatabaseInitializer from './components/core/DatabaseInitializer';
import { AIService } from './services/ai-service';

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

  // Initialize AI service and cache models at startup
  useEffect(() => {
    const aiService = AIService.getInstance();
    
    // Start caching models
    const cacheModels = async () => {
      try {
        await aiService.refreshModels();
      } catch (error) {
        console.error('Error caching models:', error);
      }
    };
    
    cacheModels();
    
    return () => {};
  }, []);

  // Handle link clicks
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href && target.target !== '_self') {
        e.preventDefault();
        window.electron.openUrl(target.href);
      }
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
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