import React, { useState, useEffect } from 'react';
import { Server, MessageSquare } from 'lucide-react';
import { SettingsService } from '../services/settings-service';
import { ProviderSettings } from '../types/settings';
import { ApiManagement, ModelManagement, ChatSettings } from '../components/settings';
import { AIProvider } from '../types/ai-providers';
import { DatabaseIntegrationService } from '../services/database-integration';
import { AIService } from '../services/ai-service';

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void; // Optional callback when settings are saved
}

type SettingsTab = 'api' | 'models' | 'chat';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('TensorBlock');
  const [providerSettings, setProviderSettings] = useState<Record<string, ProviderSettings>>({});
  const [selectedModel, setSelectedModel] = useState('');
  const [useStreaming, setUseStreaming] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [hasApiKeyChanged, setHasApiKeyChanged] = useState(false);
  
  const settingsService = SettingsService.getInstance();
  const aiService = AIService.getInstance();
  
  // Initialize database
  useEffect(() => {
    const initDb = async () => {
      try {
        const dbService = DatabaseIntegrationService.getInstance();
        await dbService.initialize();
        setIsDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    
    initDb();
  }, []);
  
  // Load settings when the modal opens
  useEffect(() => {
    if (isOpen) {
      const settings = settingsService.getSettings();
      setSelectedProvider(settings.selectedProvider as AIProvider);
      setProviderSettings(settings.providers);
      setSelectedModel(settings.selectedModel);
      setUseStreaming(settings.useStreaming);
      setSaveStatus('idle');
      setHasApiKeyChanged(false);
    }
  }, [isOpen, settingsService]);
  
  // Handle provider change
  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
  };
  
  // Handle API key change
  const handleApiKeyChange = (value: string) => {
    const currentProviderSettings = providerSettings[selectedProvider] || { apiKey: '' };
    const currentApiKey = currentProviderSettings.apiKey || '';
    
    // Check if API key has changed
    if (value !== currentApiKey) {
      setHasApiKeyChanged(true);
    }
    
    setProviderSettings({
      ...providerSettings,
      [selectedProvider]: {
        ...currentProviderSettings,
        apiKey: value
      }
    });
  };
  
  // Handle API version change (Anthropic specific)
  const handleApiVersionChange = (value: string) => {
    const currentProviderSettings = providerSettings[selectedProvider] || { apiKey: '' };
    setProviderSettings({
      ...providerSettings,
      [selectedProvider]: {
        ...currentProviderSettings,
        apiVersion: value
      }
    });
  };
  
  // Handle model selection change
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };
  
  // Handle streaming setting change
  const handleStreamingChange = (enabled: boolean) => {
    setUseStreaming(enabled);
  };
  
  // Handle base URL change
  const handleBaseUrlChange = (value: string) => {
    const currentProviderSettings = providerSettings[selectedProvider] || { apiKey: '' };
    setProviderSettings({
      ...providerSettings,
      [selectedProvider]: {
        ...currentProviderSettings,
        baseUrl: value
      }
    });
  };
  
  // Handle endpoint change for custom provider
  const handleEndpointChange = (endpoint: string, value: string) => {
    const currentProviderSettings = providerSettings[selectedProvider] || { apiKey: '' };
    setProviderSettings({
      ...providerSettings,
      [selectedProvider]: {
        ...currentProviderSettings,
        [endpoint]: value
      }
    });
  };
  
  // Save all settings
  const handleSave = async () => {
    if (!isDbInitialized) {
      setSaveStatus('error');
      return;
    }
    
    setSaveStatus('saving');
    
    try {
      // Update provider settings in memory
      Object.keys(providerSettings).forEach(provider => {
        settingsService.updateProviderSettings(providerSettings[provider], provider);
      });
      
      // Update streaming setting
      settingsService.setUseStreaming(useStreaming);
      
      // Save to database
      const dbService = DatabaseIntegrationService.getInstance();
      await dbService.saveApiSettings();
      
      // Refresh models if API key has changed
      if (hasApiKeyChanged) {
        void aiService.refreshModels();
        setHasApiKeyChanged(false);
      }
      
      setSaveStatus('success');
      
      // Call the onSave callback if provided
      if (onSave) {
        onSave();
      }
      
      // Reset to idle after a short delay
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveStatus('error');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white mt-[29px]">
      <div className="flex w-full h-full overflow-hidden bg-white rounded-lg shadow-xl">
        {/* Sidebar */}
        <div className="flex flex-col w-64 h-full bg-gray-100 border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <button
              className={`flex items-center w-full px-4 py-3 text-left ${
                activeTab === 'api' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('api')}
            >
              <Server size={18} className="mr-2" />
              API Management
            </button>
            
            <button
              className={`flex items-center w-full px-4 py-3 text-left ${
                activeTab === 'chat' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={18} className="mr-2" />
              Chat Settings
            </button>
            
            {/*<button
              className={`flex items-center w-full px-4 py-3 text-left ${
                activeTab === 'models' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('models')}
            >
              <Layers size={18} className="mr-2" />
              Model Management
            </button>*/}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex flex-col flex-1 h-full">
          {/* Content area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* API Management Tab */}
            {activeTab === 'api' && (
              <ApiManagement
                selectedProvider={selectedProvider}
                providerSettings={providerSettings}
                onProviderChange={handleProviderChange}
                onApiKeyChange={handleApiKeyChange}
                onApiVersionChange={handleApiVersionChange}
                onBaseUrlChange={handleBaseUrlChange}
                onEndpointChange={handleEndpointChange}
                saveStatus={saveStatus}
                onSaveSettings={handleSave}
              />
            )}
            
            {/* Chat Settings Tab */}
            {activeTab === 'chat' && (
              <ChatSettings
                useStreaming={useStreaming}
                onStreamingChange={handleStreamingChange}
                saveStatus={saveStatus}
                onSaveSettings={handleSave}
              />
            )}
            
            {/* Model Management Tab */}
            {activeTab === 'models' && (
              <ModelManagement
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 