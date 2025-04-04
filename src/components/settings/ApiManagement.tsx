import React, { useEffect, useState } from 'react';
import { ChevronRight, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { ProviderSettings } from '../../types/settings';

interface ApiManagementProps {
  selectedProvider: string;
  providerSettings: Record<string, ProviderSettings>;
  onProviderChange: (provider: string) => void;
  onProviderSettingsChange: (providerSettings: ProviderSettings) => void;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  onAddCustomProvider: () => void;
  onDeleteCustomProvider: () => void;
}

export const ApiManagement: React.FC<ApiManagementProps> = ({
  selectedProvider,
  providerSettings,
  onProviderChange,
  onProviderSettingsChange,
  saveStatus,
  onAddCustomProvider,
  onDeleteCustomProvider
}) => {
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [currentProviderSettings, setCurrentProviderSettings] = useState<ProviderSettings>({ apiKey: '', providerName: '', customProvider: false, providerId: '' });

  // Get current provider settings
  useEffect(() => {
    const currentProviderSettings = providerSettings[selectedProvider] || { apiKey: '', providerName: '', customProvider: false, providerId: '' };
    setCurrentProviderSettings(currentProviderSettings);
  }, [selectedProvider, providerSettings]);
  
  const handleMapProviderSettings = () => {
    const providers = Object.keys(providerSettings).map((provider) => {
      return providerSettings[provider];
    });
    
    return providers;
  }

  const handleProviderNameChange = (value: string) => {
    setCurrentProviderSettings({ ...currentProviderSettings, providerName: value });
  }

  const handleApiKeyChange = (value: string) => {
    setCurrentProviderSettings({ ...currentProviderSettings, apiKey: value });
  }

  const handleApiVersionChange = (value: string) => {
    setCurrentProviderSettings({ ...currentProviderSettings, apiVersion: value });
  }

  const handleBaseUrlChange = (value: string) => {
    setCurrentProviderSettings({ ...currentProviderSettings, baseUrl: value });
  }

  const handleEndpointChange = (endpoint: string, value: string) => {
    setCurrentProviderSettings({ ...currentProviderSettings, [endpoint]: value });
  }

  const handleOnEndEditing = () => {
    onProviderSettingsChange(currentProviderSettings);
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Title area removed - settings are auto-saved */}
      
      <div className="flex flex-1 max-h-[calc(100vh-8rem)]">
        {/* Provider Selection */}
        <div className="relative flex flex-col justify-between w-1/3 max-h-full pr-6 border-r border-gray-200">
          <div className="relative flex flex-col flex-1 max-h-full">
            <h3 className="mb-4 text-xl font-semibold">API Management</h3>
            <p className="mb-4 text-sm text-gray-600">
              Select an AI service provider to configure its API settings.
            </p>
            
            <div className="relative max-h-full pr-2 mb-2 space-y-2 overflow-y-scroll">
              {handleMapProviderSettings().map((provider) => (
                <button
                  key={provider.providerId}
                  className={`flex items-center justify-between w-full px-4 py-3 text-left rounded-lg ${
                    selectedProvider === provider.providerId 
                      ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => onProviderChange(provider.providerId)}
                >
                  <span>{provider.providerName}</span>
                  {selectedProvider === provider.providerId && <ChevronRight size={16} />}
                </button>
              ))}
            </div>

            <div className="w-full">
              <button onClick={() => onAddCustomProvider()} className="flex items-center w-full px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:text-gray-800">
                <Plus size={16} className="mr-2 text-base" />
                <span>Add Custom Provider</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Provider Settings */}
        <div className="w-2/3 pl-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">{currentProviderSettings.providerName} Settings</h3>
            {currentProviderSettings.customProvider && (
              <button 
                onClick={onDeleteCustomProvider}
                className="flex items-center px-3 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none"
              >
                <Trash2 size={16} className="mr-1" />
                <span>Delete Provider</span>
              </button>
            )}
          </div>
          
          <div className="space-y-6 overflow-y-scroll">
            {/* API Key - Common for all providers */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={currentProviderSettings.apiKey || ''}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  onBlur={handleOnEndEditing}
                  placeholder={selectedProvider === 'OpenAI' ? 'sk-...' : 'Enter API key'}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  className="absolute text-gray-500 transform -translate-y-1/2 right-3 top-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Your API key is stored locally and never sent to our servers.
              </p>
            </div>
            
            {/* Anthropic-specific settings */}
            {selectedProvider === 'Anthropic' && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  API Version
                </label>
                <select 
                  value={currentProviderSettings.apiVersion || '2023-06-01'}
                  onChange={(e) => handleApiVersionChange(e.target.value)}
                  onBlur={handleOnEndEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2023-06-01">2023-06-01</option>
                  <option value="2023-01-01">2023-01-01</option>
                </select>
              </div>
            )}
            
            {/* Custom provider settings */}
            {currentProviderSettings.customProvider && (
              <>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Provider Name
                  </label>
                  <input
                    type="text"
                    value={currentProviderSettings.providerName || ''}
                    onChange={(e) => handleProviderNameChange(e.target.value)}
                    onBlur={handleOnEndEditing}
                    placeholder="Custom Provider Name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    The name of your custom provider
                  </p>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={currentProviderSettings.baseUrl || ''}
                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                    onBlur={handleOnEndEditing}
                    placeholder="https://your-custom-api.com/v1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    The base URL for your custom OpenAI-compatible API
                  </p>
                </div>
                
                <div className="pt-6 mt-6 border-t border-gray-200">
                  <h4 className="mb-4 font-medium text-md">API Endpoints</h4>
                  
                  <div className="space-y-4">                   
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Chat Completions Endpoint
                      </label>
                      <input
                        type="text"
                        value={currentProviderSettings.chatCompletionsEndpoint || '/chat/completions'}
                        onChange={(e) => handleEndpointChange('chatCompletionsEndpoint', e.target.value)}
                        onBlur={handleOnEndEditing}
                        placeholder="/chat/completions"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Models Endpoint
                      </label>
                      <input
                        type="text"
                        value={currentProviderSettings.modelsEndpoint || '/models'}
                        onChange={(e) => handleEndpointChange('modelsEndpoint', e.target.value)}
                        onBlur={handleOnEndEditing}
                        placeholder="/models"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {saveStatus === 'error' && (
            <div className="flex items-center mt-4 text-red-600">
              <AlertCircle size={16} className="mr-1" />
              <span>Failed to save settings</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiManagement; 