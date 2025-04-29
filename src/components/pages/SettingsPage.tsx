import React, { useState, useEffect, useRef } from 'react';
import { Server, MessageSquare, Languages, Sliders } from 'lucide-react';
import { SettingsService } from '../../services/settings-service';
import { ProviderSettings } from '../../types/settings';
import { ApiManagement, ChatSettings, LanguageSettings, GeneralSettings } from '../settings';
import { DatabaseIntegrationService } from '../../services/database-integration';
import { AIService } from '../../services/ai-service';
import { v4 as uuidv4 } from 'uuid';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useTranslation } from 'react-i18next';

interface SettingsPageProps {
  isOpen: boolean;
}

type SettingsTab = 'api' | 'models' | 'chat' | 'language' | 'general';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isOpen,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api');
  const [selectedProvider, setSelectedProvider] = useState<string>('TensorBlock');
  const [providerSettings, setProviderSettings] = useState<Record<string, ProviderSettings>>({});
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [hasApiKeyChanged, setHasApiKeyChanged] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // General settings state
  const [startWithSystem, setStartWithSystem] = useState(false);
  const [startupToTray, setStartupToTray] = useState(false);
  const [closeToTray, setCloseToTray] = useState(true);
  const [proxyMode, setProxyMode] = useState<'system' | 'custom' | 'none'>('system');
  const [sendErrorReports, setSendErrorReports] = useState(true);
  
  const settingsService = SettingsService.getInstance();
  const aiService = AIService.getInstance();
  const { t } = useTranslation();
  
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
      setUseWebSearch(settings.enableWebSearch_Preview);
      setHasApiKeyChanged(false);
      lastOpenedSettings.current = true;
      
      // In a real implementation, we would load these from settings service
      // This is just for the UI prototype
      // setStartWithSystem(settings.startWithSystem || false);
      // setStartupToTray(settings.startupToTray || false);
      // setCloseToTray(settings.closeToTray || true);
      // setProxyMode(settings.proxyMode || 'system');
      // setSendErrorReports(settings.sendErrorReports || true);
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
  
  // Handle web search setting change
  const handleWebSearchChange = (enabled: boolean) => {
    console.log('Web search setting changed to: ', enabled);
    setUseWebSearch(enabled);
    handleSave();
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

  // Handle general settings changes
  const handleGeneralSettingChange = (key: string, value: unknown) => {
    console.log(`Setting ${key} changed to: `, value);
    
    switch(key) {
      case 'startWithSystem':
        setStartWithSystem(value as boolean);
        break;
      case 'startupToTray':
        setStartupToTray(value as boolean);
        break;
      case 'closeToTray':
        setCloseToTray(value as boolean);
        break;
      case 'proxyMode':
        setProxyMode(value as 'system' | 'custom' | 'none');
        break;
      case 'sendErrorReports':
        setSendErrorReports(value as boolean);
        break;
      default:
        break;
    }
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
        enableWebSearch_Preview: useWebSearch
        // In a real implementation, we would save general settings here
        // startWithSystem,
        // startupToTray,
        // closeToTray,
        // proxyMode,
        // sendErrorReports
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
            <h2 className="text-xl font-semibold">{t('common.settings')}</h2>
          </div>
          
          <div className="flex-1 px-2 overflow-y-auto">
            <button
              className={`flex items-center w-full px-4 py-3 text-left transition-all duration-200 ${
                activeTab === 'general' ? 'settings-category-selected-item settings-category-selected-item-text font-medium' : 'settings-category-item settings-category-item-text'
              }`}
              onClick={() => setActiveTab('general')}
            >
              <Sliders size={18} className="mr-2" />
              {t('settings.general')}
            </button>

            <button
              className={`flex items-center w-full px-4 py-3 text-left transition-all duration-200 ${
                activeTab === 'api' ? 'settings-category-selected-item settings-category-selected-item-text font-medium' : 'settings-category-item settings-category-item-text'
              }`}
              onClick={() => setActiveTab('api')}
            >
              <Server size={18} className="mr-2" />
              {t('settings.apiManagement')}
            </button>
            
            <button
              className={`flex items-center w-full px-4 py-3 text-left transition-all duration-200 ${
                activeTab === 'chat' ? 'settings-category-selected-item settings-category-selected-item-text font-medium' : 'settings-category-item settings-category-item-text'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={18} className="mr-2" />
              {t('chat.sendMessage')}
            </button>

            <button
              className={`flex items-center w-full px-4 py-3 text-left transition-all duration-200 ${
                activeTab === 'language' ? 'settings-category-selected-item settings-category-selected-item-text font-medium' : 'settings-category-item settings-category-item-text'
              }`}
              onClick={() => setActiveTab('language')}
            >
              <Languages size={18} className="mr-2" />
              {t('settings.language')}
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex flex-col flex-1 h-full">
          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {/* General Settings Tab */}
            {activeTab === 'general' && (
              <GeneralSettings
                startWithSystem={startWithSystem}
                startupToTray={startupToTray}
                closeToTray={closeToTray}
                proxyMode={proxyMode}
                sendErrorReports={sendErrorReports}
                onSettingChange={handleGeneralSettingChange}
                onSaveSettings={handleSave}
              />
            )}
            
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
            
            {/* Language Settings Tab */}
            {activeTab === 'language' && (
              <div className="p-6">
                <h1 className="mb-6 text-2xl font-semibold">{t('settings.language')}</h1>
                <LanguageSettings />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title={t('settings.apiManagement_deleteProvider_title')}
        message={`${t('settings.apiManagement_deleteProvider_confirm_message', { providerName: providerSettings[selectedProvider]?.providerName })}`}
        confirmText={t('settings.apiManagement_deleteProvider_delete')}
        cancelText={t('settings.apiManagement_deleteProvider_cancel')}
        confirmColor="red"
        onConfirm={confirmDeleteProvider}
        onCancel={cancelDeleteProvider}
      />
    </div>
  );
};

export default SettingsPage; 