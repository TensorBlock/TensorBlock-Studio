import React, { useState } from 'react';
import { ChevronRight, Save, AlertCircle } from 'lucide-react';
import { ProviderSettings } from '../../services/settings-service';

export type AIProvider = 'OpenAI' | 'Anthropic' | 'Gemini' | 'Fireworks.ai' | 'Together' | 'OpenRouter' | 'Custom';

interface ApiManagementProps {
  selectedProvider: AIProvider;
  providerSettings: Record<string, ProviderSettings>;
  onProviderChange: (provider: AIProvider) => void;
  onApiKeyChange: (value: string) => void;
  onApiVersionChange: (value: string) => void;
  onBaseUrlChange?: (value: string) => void;
  onEndpointChange?: (endpoint: string, value: string) => void;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  onSaveSettings: () => void;
}

export const ApiManagement: React.FC<ApiManagementProps> = ({
  selectedProvider,
  providerSettings,
  onProviderChange,
  onApiKeyChange,
  onApiVersionChange,
  onBaseUrlChange,
  onEndpointChange,
  saveStatus,
  onSaveSettings,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Get current provider settings
  const currentProviderSettings = providerSettings[selectedProvider] || { apiKey: '' };
  
  const providers: AIProvider[] = [
    'OpenAI', 
    'Anthropic', 
    'Gemini', 
    'Fireworks.ai', 
    'Together', 
    'OpenRouter', 
    'Custom'
  ];
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">API Management</h2>
        <button
          onClick={onSaveSettings}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? (
            'Saving...'
          ) : (
            <>
              <Save size={16} className="mr-1" />
              Save Settings
            </>
          )}
        </button>
      </div>
      
      <div className="flex flex-1">
        {/* Provider Selection */}
        <div className="w-1/3 pr-6 border-r border-gray-200">
          <h3 className="mb-4 text-lg font-medium">AI Service Providers</h3>
          <p className="mb-4 text-sm text-gray-600">
            Select an AI service provider to configure its API settings.
          </p>
          
          <div className="space-y-2">
            {providers.map((provider) => (
              <button
                key={provider}
                className={`flex items-center justify-between w-full px-4 py-3 text-left rounded-lg ${
                  selectedProvider === provider 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => onProviderChange(provider)}
              >
                <span>{provider}</span>
                {selectedProvider === provider && <ChevronRight size={16} />}
              </button>
            ))}
          </div>
        </div>
        
        {/* Provider Settings */}
        <div className="w-2/3 pl-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">{selectedProvider} Settings</h3>
            {saveStatus === 'success' && (
              <div className="text-sm text-green-600">
                Settings saved successfully!
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            {/* API Key - Common for all providers */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={currentProviderSettings.apiKey || ''}
                  onChange={(e) => onApiKeyChange(e.target.value)}
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
            
            {/* OpenAI-specific settings */}
            {/* {selectedProvider === 'OpenAI' && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Organization ID (optional)
                </label>
                <input
                  type="text"
                  value={currentProviderSettings.organizationId || ''}
                  onChange={(e) => onOrgIdChange(e.target.value)}
                  placeholder="org-..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )} */}
            
            {/* Anthropic-specific settings */}
            {selectedProvider === 'Anthropic' && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  API Version
                </label>
                <select 
                  value={currentProviderSettings.apiVersion || '2023-06-01'}
                  onChange={(e) => onApiVersionChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2023-06-01">2023-06-01</option>
                  <option value="2023-01-01">2023-01-01</option>
                </select>
              </div>
            )}
            
            {/* Gemini-specific settings */}
            {selectedProvider === 'Gemini' && (
              <>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={currentProviderSettings.baseUrl || 'https://generativelanguage.googleapis.com'}
                    onChange={(e) => onBaseUrlChange && onBaseUrlChange(e.target.value)}
                    placeholder="https://generativelanguage.googleapis.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    API Version
                  </label>
                  <input
                    type="text"
                    value={currentProviderSettings.apiVersion || 'v1'}
                    onChange={(e) => onApiVersionChange(e.target.value)}
                    placeholder="v1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
            
            {/* Base URL setting for providers that need it */}
            {(selectedProvider === 'Fireworks.ai' || 
              selectedProvider === 'Together' || 
              selectedProvider === 'OpenRouter') && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Base URL
                </label>
                <input
                  type="text"
                  value={currentProviderSettings.baseUrl || ''}
                  onChange={(e) => onBaseUrlChange && onBaseUrlChange(e.target.value)}
                  placeholder={
                    selectedProvider === 'Fireworks.ai' 
                      ? 'https://api.fireworks.ai/inference/v1' 
                      : selectedProvider === 'Together'
                        ? 'https://api.together.xyz/v1'
                        : 'https://openrouter.ai/api/v1'
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            {/* Custom provider settings */}
            {selectedProvider === 'Custom' && (
              <>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={currentProviderSettings.baseUrl || ''}
                    onChange={(e) => onBaseUrlChange && onBaseUrlChange(e.target.value)}
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
                        Completions Endpoint
                      </label>
                      <input
                        type="text"
                        value={currentProviderSettings.completionsEndpoint || '/completions'}
                        onChange={(e) => onEndpointChange && onEndpointChange('completionsEndpoint', e.target.value)}
                        placeholder="/completions"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Chat Completions Endpoint
                      </label>
                      <input
                        type="text"
                        value={currentProviderSettings.chatCompletionsEndpoint || '/chat/completions'}
                        onChange={(e) => onEndpointChange && onEndpointChange('chatCompletionsEndpoint', e.target.value)}
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
                        onChange={(e) => onEndpointChange && onEndpointChange('modelsEndpoint', e.target.value)}
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