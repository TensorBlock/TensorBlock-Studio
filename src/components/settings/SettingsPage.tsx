import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: {
    apiKey: string;
    selectedModel: string;
  }) => void;
  currentSettings: {
    apiKey: string;
    selectedModel: string;
  };
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings,
}) => {
  const [apiKey, setApiKey] = useState(currentSettings.apiKey || '');
  const [selectedModel, setSelectedModel] = useState(currentSettings.selectedModel || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setApiKey(currentSettings.apiKey || '');
      setSelectedModel(currentSettings.selectedModel || '');
      setSaveStatus('idle');
    }
  }, [isOpen, currentSettings]);
  
  const handleSave = () => {
    setSaveStatus('saving');
    
    try {
      onSave({
        apiKey,
        selectedModel,
      });
      setSaveStatus('success');
      
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
  
  const models = [
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo (16k)' },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Settings</h2>
          <button 
            onClick={onClose}
            className="p-1 text-gray-500 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* API Key Section */}
          <div>
            <h3 className="mb-2 text-lg font-medium">OpenAI API Key</h3>
            <p className="mb-4 text-sm text-gray-600">
              Your API key is used to authenticate requests to the OpenAI API.
              It is stored locally and never sent to our servers.
            </p>
            
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
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
          </div>
          
          {/* Model Selection */}
          <div>
            <h3 className="mb-2 text-lg font-medium">Default Model</h3>
            <p className="mb-4 text-sm text-gray-600">
              Select the model you want to use by default for new conversations.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {models.map((model) => (
                <div key={model.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`model-${model.id}`}
                    name="model"
                    value={model.id}
                    checked={selectedModel === model.id}
                    onChange={() => setSelectedModel(model.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`model-${model.id}`}
                    className="ml-2 text-gray-700"
                  >
                    {model.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer with save button */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-200">
            {saveStatus === 'error' && (
              <div className="flex items-center mr-4 text-red-600">
                <AlertCircle size={16} className="mr-1" />
                <span>Failed to save settings</span>
              </div>
            )}
            
            {saveStatus === 'success' && (
              <div className="flex items-center mr-4 text-green-600">
                <span>Settings saved!</span>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 mr-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? (
                <>Saving...</>
              ) : (
                <>
                  <Save size={16} className="mr-1" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 