import React, { useState, useEffect, useRef } from 'react';
import { Server, MessageSquare } from 'lucide-react';
import { SettingsService } from '../../services/settings-service';
import { ProviderSettings } from '../../types/settings';
import { ApiManagement, ModelManagement, ChatSettings } from '../settings';
import { DatabaseIntegrationService } from '../../services/database-integration';
import { AIService } from '../../services/ai-service';
import { v4 as uuidv4 } from 'uuid';
import ConfirmDialog from '../ui/ConfirmDialog';

interface SettingsPageProps {
  isOpen: boolean;
}

type SettingsTab = 'api' | 'models' | 'chat';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isOpen,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api');
  const [selectedProvider, setSelectedProvider] = useState<string>('TensorBlock');
  const [providerSettings, setProviderSettings] = useState<Record<string, ProviderSettings>>({});
  const [selectedModel, setSelectedModel] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [hasApiKeyChanged, setHasApiKeyChanged] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const settingsService = SettingsService.getInstance();
  const aiService = AIService.getInstance();
  
  const lastOpenedSettings = useRef(false);

  // Initialize database and settings service
  useEffect(() => {
    const initServices = async () => {
      try {
        // Initialize database integration which will also initialize settings service
        const dbService = DatabaseIntegrationService.getInstance();
        await dbService.initialize();
        setIsDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };
    
    initServices();
  }, []);
  
  // Load settings when the modal opens
  useEffect(() => {
    if (isOpen && isDbInitialized) {
      const settings = settingsService.getSettings();
      setSelectedProvider(settings.selectedProvider);
      setProviderSettings(settings.providers);
      setSelectedModel(settings.selectedModel);
      setUseWebSearch(settings.webSearchEnabled);
      setHasApiKeyChanged(false);
      lastOpenedSettings.current = true;
    }

    if(!isOpen && lastOpenedSettings.current){
      handleSave();
      lastOpenedSettings.current = false;
    }
  }, [isOpen, isDbInitialized, settingsService]);
  
  // Handle provider change
  const handleProviderChange = (provider: string) => {
    console.log('Change to provider: ', provider);
    setSelectedProvider(provider);
  };
  
  // Handle model selection change
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };
  
  // Handle web search setting change
  const handleWebSearchChange = (enabled: boolean) => {
    console.log('Web search setting changed to: ', enabled);
    setUseWebSearch(enabled);
  };

  const handleProviderSettingsChange = (newSettings: ProviderSettings) => {
    const currentProviderSettings = providerSettings[selectedProvider] || { apiKey: '' };

    if (newSettings.apiKey !== currentProviderSettings.apiKey) {
      setHasApiKeyChanged(true);
    }

    setProviderSettings({
      ...providerSettings,
      [selectedProvider]: {
        ...currentProviderSettings,
        ...newSettings
      }
    });
    console.log('Provider settings: ', providerSettings);
  };

  const handleSave = async () => {
    console.log('Saving settings');

    if (!isDbInitialized) {
      return;
    }

    if(!settingsService.isInitialized){
      return;
    }
    
    try {
      // Update all settings in one go
      await settingsService.updateSettings({
        providers: providerSettings,
        webSearchEnabled: useWebSearch
      });
      
      // Refresh models if API key has changed
      if (hasApiKeyChanged) {
        void aiService.refreshModels();
        setHasApiKeyChanged(false);
      }

    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const handleAddCustomProvider = async () => {
    if (!isDbInitialized) {
      return;
    }
    
    try {
      const newProviderId = uuidv4();

      const newProvider: ProviderSettings = {
        apiKey: '',
        providerId: newProviderId,
        providerName: 'New Custom Provider',
        apiVersion: '',
        baseUrl: '',
        models: [],
        organizationId: '',
        modelsEndpoint: '',
        chatCompletionsEndpoint: '',
        customProvider: true,
      };
      
      setProviderSettings({
        ...providerSettings,
        [newProviderId]: newProvider
      });

      // Update all settings in one go
      await settingsService.updateProviderSettings(newProvider, newProviderId);
      
      // Refresh models if API key has changed
      if (hasApiKeyChanged) {
        void aiService.refreshModels();
        setHasApiKeyChanged(false);
      }
      
      handleProviderChange(newProvider.providerId);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };
  
  const handleDeleteCustomProvider = async () => {
    if (!isDbInitialized || !providerSettings[selectedProvider]?.customProvider) {
      return;
    }
    
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteProvider = async () => {
    setIsDeleteDialogOpen(false);
    
    try {
      // Create a copy of the providers without the current one
      const updatedProviders = { ...providerSettings };
      delete updatedProviders[selectedProvider];
      
      setProviderSettings(updatedProviders);

      // Update settings
      await settingsService.deleteProvider(selectedProvider);
      
      // Switch to another provider
      const remainingProviders = Object.keys(updatedProviders);
      if (remainingProviders.length > 0) {
        handleProviderChange(remainingProviders[0]);
      } else {
        // Default provider if none exist
        handleProviderChange('TensorBlock');
      }
      
    } catch (err) {
      console.error('Error deleting provider:', err);
    }
  };
  
  const cancelDeleteProvider = () => {
    setIsDeleteDialogOpen(false);
  };
  
  // if (!isOpen) return null;
  
  return (
    <div className={`absolute flex-none inset-0 z-20 items-center justify-center w-full h-full ${isOpen ? 'move-in flex' : (lastOpenedSettings.current ? 'move-out' : 'hidden')}`}>
      <div className="flex w-full h-full overflow-hidden major-area-bg-color ">
        {/* Sidebar */}
        <div className="flex flex-col w-64 h-full frame-right-border">
          <div className="p-4">
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>
          
          <div className="flex-1 px-2 overflow-y-auto">
            <button
              className={`flex items-center w-full px-4 py-3 text-left transition-all duration-200 ${
                activeTab === 'api' ? 'settings-category-selected-item settings-category-selected-item-text font-medium' : 'settings-category-item settings-category-item-text'
              }`}
              onClick={() => setActiveTab('api')}
            >
              <Server size={18} className="mr-2" />
              API Management
            </button>
            
            <button
              className={`flex items-center w-full px-4 py-3 text-left transition-all duration-200 ${
                activeTab === 'chat' ? 'settings-category-selected-item settings-category-selected-item-text font-medium' : 'settings-category-item settings-category-item-text'
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
          
          {/* <div className="p-4 border-t border-gray-200">
            <button
              onClick={async () => {
                await handleSave();
              }}
              className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div> */}
        </div>
        
        {/* Main content */}
        <div className="flex flex-col flex-1 h-full">
          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {/* API Management Tab */}
            {activeTab === 'api' && (
              <ApiManagement
                selectedProvider={selectedProvider}
                providerSettings={providerSettings}
                onProviderChange={handleProviderChange}
                onProviderSettingsChange={handleProviderSettingsChange}
                onAddCustomProvider={handleAddCustomProvider}
                onDeleteCustomProvider={handleDeleteCustomProvider}
              />
            )}
            
            {/* Chat Settings Tab */}
            {activeTab === 'chat' && (
              <ChatSettings
                useWebSearch={useWebSearch}
                onWebSearchChange={handleWebSearchChange}
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
      
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Custom Provider"
        message={`Are you sure you want to delete "${providerSettings[selectedProvider]?.providerName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        onConfirm={confirmDeleteProvider}
        onCancel={cancelDeleteProvider}
      />
    </div>
  );
};

export default SettingsPage; 