import React, { useEffect, useState } from 'react';
import { ChevronRight, AlertCircle, Plus, Trash2, Edit2, Search, X, Brain, Eye, Wrench, Type, Database } from 'lucide-react';
import { ProviderSettings, ModelSettings } from '../../types/settings';
import { AIServiceCapability } from '../../types/capabilities';

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
  const [currentProviderSettings, setCurrentProviderSettings] = useState<ProviderSettings>({ apiKey: '', providerName: '', customProvider: true, providerId: '' });
  const [showModelSearch, setShowModelSearch] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [isEditModelDialogOpen, setIsEditModelDialogOpen] = useState(false);
  const [currentEditModel, setCurrentEditModel] = useState<ModelSettings | null>(null);

  // Get current provider settings
  useEffect(() => {
    if(selectedProvider.trim() !== '') {
      const currentProviderSettings = providerSettings[selectedProvider];
      setCurrentProviderSettings(currentProviderSettings);
    }
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

  // const handleEndpointChange = (endpoint: string, value: string) => {
  //   setCurrentProviderSettings({ ...currentProviderSettings, [endpoint]: value });
  // }

  const handleOnEndEditing = () => {
    onProviderSettingsChange(currentProviderSettings);
  }

  // Group models by category
  const getGroupedModels = (): Record<string, ModelSettings[]> => {
    if (!currentProviderSettings.models || currentProviderSettings.models.length === 0) {
      return {};
    }

    const filteredModels = modelSearchQuery 
      ? currentProviderSettings.models.filter(model => 
          model.modelName.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
          model.modelId.toLowerCase().includes(modelSearchQuery.toLowerCase())
        )
      : currentProviderSettings.models;

    return filteredModels.reduce((groups, model) => {
      const category = model.modelCategory || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(model);
      return groups;
    }, {} as Record<string, ModelSettings[]>);
  };

  // Handle adding a new model
  const handleAddModel = () => {
    const newModel: ModelSettings = {
      modelId: '',
      modelName: 'New Model',
      modelCategory: 'Custom',
      modelDescription: 'Custom model description',
      modelCapabilities: [AIServiceCapability.TextCompletion]
    };
    
    setCurrentEditModel(newModel);
    setIsEditModelDialogOpen(true);
  };

  // Handle editing an existing model
  const handleEditModel = (model: ModelSettings) => {
    setCurrentEditModel({...model});
    setIsEditModelDialogOpen(true);
  };

  // Handle deleting a model
  const handleDeleteModel = (modelId: string) => {
    if (!currentProviderSettings.models) return;
    
    const updatedModels = currentProviderSettings.models.filter(model => model.modelId !== modelId);
    const updatedSettings = {
      ...currentProviderSettings,
      models: updatedModels
    };
    
    setCurrentProviderSettings(updatedSettings);
    onProviderSettingsChange(updatedSettings);
  };

  // Save model after editing
  const handleSaveModel = (model: ModelSettings) => {
    if (!model.modelId || !model.modelName) return;
    
    let updatedModels: ModelSettings[] = [];
    
    if (!currentProviderSettings.models) {
      updatedModels = [model];
    } else {
      const existingModelIndex = currentProviderSettings.models.findIndex(m => m.modelId === model.modelId);
      
      if (existingModelIndex >= 0) {
        // Update existing model
        updatedModels = [...currentProviderSettings.models];
        updatedModels[existingModelIndex] = model;
      } else {
        // Add new model
        updatedModels = [...currentProviderSettings.models, model];
      }
    }
    
    const updatedSettings = {
      ...currentProviderSettings,
      models: updatedModels
    };
    
    setCurrentProviderSettings(updatedSettings);
    onProviderSettingsChange(updatedSettings);
    setIsEditModelDialogOpen(false);
    setCurrentEditModel(null);
  };

  // Handle capability change
  const handleCapabilityChange = (capability: AIServiceCapability, isChecked: boolean) => {
    if (!currentEditModel) return;
    
    let updatedCapabilities = [...currentEditModel.modelCapabilities];
    
    if (isChecked) {
      if (!updatedCapabilities.includes(capability)) {
        updatedCapabilities.push(capability);
      }
    } else {
      updatedCapabilities = updatedCapabilities.filter(cap => cap !== capability);
    }
    
    setCurrentEditModel({
      ...currentEditModel,
      modelCapabilities: updatedCapabilities
    });
  };

  // Get capability icon
  const getCapabilityIcon = (capability: AIServiceCapability) => {
    switch (capability) {
      case AIServiceCapability.TextCompletion:
        return <Type size={16} className="text-blue-500" />;
      case AIServiceCapability.Reasoning:
        return <Brain size={16} className="text-purple-500" />;
      case AIServiceCapability.VisionAnalysis:
        return <Eye size={16} className="text-green-500" />;
      case AIServiceCapability.ToolUsage:
        return <Wrench size={16} className="text-orange-500" />;
      case AIServiceCapability.Embedding:
        return <Database size={16} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  // Render capability badge
  const renderCapabilityBadge = (capability: AIServiceCapability) => {
    const icon = getCapabilityIcon(capability);
    return icon ? (
      <div key={capability} className="flex items-center justify-center w-6 h-6 p-1 bg-gray-100 rounded-md" title={capability}>
        {icon}
      </div>
    ) : null;
  };

  // Model edit dialog
  const renderModelEditDialog = () => {
    if (!isEditModelDialogOpen || !currentEditModel) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 mt-[29px]">
        <div className="w-full max-w-lg max-h-full p-6 overflow-y-auto bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">{currentEditModel.modelId ? 'Edit Model' : 'Add New Model'}</h3>
            <button 
              onClick={() => {
                setIsEditModelDialogOpen(false);
                setCurrentEditModel(null);
              }}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Model ID
              </label>
              <input
                type="text"
                value={currentEditModel.modelId}
                onChange={(e) => setCurrentEditModel({...currentEditModel, modelId: e.target.value})}
                placeholder="model-id"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Model Name
              </label>
              <input
                type="text"
                value={currentEditModel.modelName}
                onChange={(e) => setCurrentEditModel({...currentEditModel, modelName: e.target.value})}
                placeholder="Model Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Model Category
              </label>
              <input
                type="text"
                value={currentEditModel.modelCategory}
                onChange={(e) => setCurrentEditModel({...currentEditModel, modelCategory: e.target.value})}
                placeholder="Category"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Model Description
              </label>
              <textarea
                value={currentEditModel.modelDescription}
                onChange={(e) => setCurrentEditModel({...currentEditModel, modelDescription: e.target.value})}
                placeholder="Description"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              ></textarea>
            </div> */}
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Capabilities
              </label>
              <div className="space-y-2">
                {[
                  {capability: AIServiceCapability.TextCompletion, label: 'Text Completion'},
                  {capability: AIServiceCapability.Reasoning, label: 'Reasoning'},
                  {capability: AIServiceCapability.VisionAnalysis, label: 'Vision'},
                  {capability: AIServiceCapability.ToolUsage, label: 'Tool Usage'},
                  {capability: AIServiceCapability.Embedding, label: 'Embedding'}
                ].map(({capability, label}) => (
                  <div key={capability} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`capability-${capability}`}
                      checked={currentEditModel.modelCapabilities.includes(capability)}
                      onChange={(e) => handleCapabilityChange(capability, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label 
                      htmlFor={`capability-${capability}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-2">
            <button
              onClick={() => {
                setIsEditModelDialogOpen(false);
                setCurrentEditModel(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveModel(currentEditModel)}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={!currentEditModel.modelId || !currentEditModel.modelName}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Title area removed - settings are auto-saved */}
      
      <div className="flex flex-1 max-h-full">
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
        {(selectedProvider.trim() === '' || !currentProviderSettings) ? (
          <div className="w-2/3 pl-6 overflow-y-auto">
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Please select a provider</p>
            </div>
          </div>
        ) : (
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
              {/* {selectedProvider === 'Anthropic' && (
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
              )} */}
              
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
                      placeholder="https://your-custom-api.com/"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-row items-center justify-between">
                      <p className="mt-2 text-xs text-gray-500">
                        The base URL for your custom OpenAI-compatible API
                      </p>
                      <p className="mt-2 overflow-hidden text-xs text-gray-500">
                        {currentProviderSettings.baseUrl}/v1/chat/completions
                      </p>
                    </div>
                  </div>
                  
                  {/* <div className="pt-6 mt-6 border-t border-gray-200">
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
                  </div> */}
                </>
              )}

              {/* Model management section */}
              <div className="pt-6 mt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-md">Models</h4>
                      <div className="flex items-center space-x-2">
                        {showModelSearch ? (
                          <div className="relative">
                            <input
                              type="text"
                              value={modelSearchQuery}
                              onChange={(e) => setModelSearchQuery(e.target.value)}
                              placeholder="Search models..."
                              className="w-40 p-1 pl-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <Search size={14} className="absolute text-gray-400 transform -translate-y-1/2 left-2 top-1/2" />
                            <button
                              onClick={() => {
                                setShowModelSearch(false);
                                setModelSearchQuery('');
                              }}
                              className="absolute text-gray-400 transform -translate-y-1/2 right-2 top-1/2 hover:text-gray-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowModelSearch(true)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                            title="Search models"
                          >
                            <Search size={16} />
                          </button>
                        )}
                        <button
                          onClick={handleAddModel}
                          className="flex items-center px-2 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          <Plus size={14} className="mr-1" />
                          Add Model
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {Object.entries(getGroupedModels()).map(([category, models]) => (
                        <div key={category} className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-600">{category}</h5>
                          {models.map((model) => (
                            <div key={model.modelId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                              <div className="flex-1">
                                <div className="font-medium">{model.modelName}</div>
                                <div className="text-xs text-gray-500">{model.modelId}</div>
                              </div>
                              <div className="flex items-center gap-2 mr-6">
                                {model.modelCapabilities.map(cap => renderCapabilityBadge(cap))}
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleEditModel(model)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  title="Edit model"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteModel(model.modelId)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Delete model"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      
                      {currentProviderSettings.models && 
                      currentProviderSettings.models.length > 0 && 
                      Object.keys(getGroupedModels()).length === 0 && (
                        <div className="py-4 text-center text-gray-500">
                          No models found matching "{modelSearchQuery}"
                        </div>
                      )}
                      
                      {(!currentProviderSettings.models || currentProviderSettings.models.length === 0) && (
                        <div className="py-4 text-center text-gray-500">
                          No models configured. Click "Add Model" to create one.
                        </div>
                      )}
                    </div>
                  </div>
            </div>
            
            {saveStatus === 'error' && (
              <div className="flex items-center mt-4 text-red-600">
                <AlertCircle size={16} className="mr-1" />
                <span>Failed to save settings</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {renderModelEditDialog()}
    </div>
  );
};

export default ApiManagement; 