import React, { useEffect, useState } from 'react';
import { ChevronRight, Plus, Trash2, Edit2, Search, X, Brain, Eye, Wrench, Type, Database, EyeOff, Image } from 'lucide-react';
import { ProviderSettings, ModelSettings } from '../../types/settings';
import { AIServiceCapability } from '../../types/capabilities';
import { v4 as uuidv4 } from 'uuid';
import ProviderIcon from '../ui/ProviderIcon';
import { useTranslation } from 'react-i18next';

interface ApiManagementProps {
  selectedProvider: string;
  providerSettings: Record<string, ProviderSettings>;
  onProviderChange: (provider: string) => void;
  onProviderSettingsChange: (providerSettings: ProviderSettings) => void;
  onAddCustomProvider: () => void;
  onDeleteCustomProvider: () => void;
}

export const ApiManagement: React.FC<ApiManagementProps> = ({
  selectedProvider,
  providerSettings,
  onProviderChange,
  onProviderSettingsChange,
  onAddCustomProvider,
  onDeleteCustomProvider
}) => {
  const { t } = useTranslation();
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

  // const handleApiVersionChange = (value: string) => {
  //   setCurrentProviderSettings({ ...currentProviderSettings, apiVersion: value });
  // }

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
      modelCapabilities: [AIServiceCapability.TextCompletion],
      modelRefUUID: uuidv4()
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
    
    if (model.modelRefUUID === '') {
      model.modelRefUUID = uuidv4();
    }

    let updatedModels: ModelSettings[] = [];
    
    if (!currentProviderSettings.models) {
      updatedModels = [model];
    } else {
      const existingModelIndex = currentProviderSettings.models.findIndex(m => m.modelRefUUID === model.modelRefUUID);
      
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
  // const handleCapabilityChange = (capability: AIServiceCapability, isChecked: boolean) => {
  //   if (!currentEditModel) return;
    
  //   let updatedCapabilities = [...currentEditModel.modelCapabilities];
    
  //   if (isChecked) {
  //     if (!updatedCapabilities.includes(capability)) {
  //       updatedCapabilities.push(capability);
  //     }
  //   } else {
  //     updatedCapabilities = updatedCapabilities.filter(cap => cap !== capability);
  //   }
    
  //   setCurrentEditModel({
  //     ...currentEditModel,
  //     modelCapabilities: updatedCapabilities
  //   });
  // };

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
      case AIServiceCapability.ImageGeneration:
        return <Image size={16} className="text-green-600" />;
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
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-lg max-h-full p-6 overflow-y-auto bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">{currentEditModel.modelId ? t('settings.models_editModel') : t('settings.models_newModel')}</h3>
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
                {t('settings.models_modelId')}
              </label>
              <input
                type="text"
                value={currentEditModel.modelId}
                onChange={(e) => setCurrentEditModel({...currentEditModel, modelId: e.target.value})}
                placeholder={t('settings.models_modelId_placeholder')}
                className="w-[calc(100%-0.5rem)] mx-1 p-3 input-box"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {t('settings.models_modelName')}
              </label>
              <input
                type="text"
                value={currentEditModel.modelName}
                onChange={(e) => setCurrentEditModel({...currentEditModel, modelName: e.target.value})}
                placeholder={t('settings.models_modelName_placeholder')}
                className="w-[calc(100%-0.5rem)] mx-1 p-3 input-box"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {t('settings.models_modelCategory')}
              </label>
              <input
                type="text"
                value={currentEditModel.modelCategory}
                onChange={(e) => setCurrentEditModel({...currentEditModel, modelCategory: e.target.value})}
                placeholder={t('settings.models_modelCategory_placeholder')}
                className="w-[calc(100%-0.5rem)] mx-1 p-3 input-box"
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
            
            {/* <div>
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
            </div> */}
          </div>
          
          <div className="flex justify-end mt-6 space-x-2">
            <button
              onClick={() => {
                setIsEditModelDialogOpen(false);
                setCurrentEditModel(null);
              }}
              className="px-4 py-2 cancel-btn"
            >
              {t('settings.models_cancelEditModel')}
            </button>
            <button
              onClick={() => handleSaveModel(currentEditModel)}
              className="px-4 py-2 confirm-btn"
              disabled={!currentEditModel.modelId || !currentEditModel.modelName}
            >
              {t('settings.models_saveEditModel')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Title area removed - settings are auto-saved */}
      
      <div className="flex flex-1 h-full max-h-full py-1 pr-1">
        {/* Provider Selection */}
        <div className="relative flex flex-col justify-between w-1/3 max-h-full p-6 frame-right-border">
          <div className="relative flex flex-col flex-1 h-full max-h-full">
            <h3 className="mb-4 text-xl font-semibold">
              {t('settings.apiManagement')}
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              {t('settings.apiManagement_description')}
            </p>
            
            <div className="relative flex-1 h-full max-h-full mb-2 space-y-2 overflow-y-auto">
              {handleMapProviderSettings().map((provider) => (
                <button
                  key={provider.providerId}
                  className={`flex items-center justify-between w-full px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                    selectedProvider === provider.providerId 
                      ? 'settings-provider-item-selected settings-provider-item-selected-text' 
                      : 'settings-provider-item settings-provider-item-text'
                  }`}
                  onClick={() => onProviderChange(provider.providerId)}
                >
                  <div className="flex items-center gap-2">
                    <ProviderIcon providerName={provider.providerName} className="w-4 h-4" />
                    <span>{provider.providerName}</span>
                  </div>
                  {selectedProvider === provider.providerId && <ChevronRight size={16} />}
                </button>
              ))}
            </div>

            <div className="sticky bottom-0 w-full">
              <button onClick={() => onAddCustomProvider()} className="flex items-center justify-center w-full px-4 py-2 settings-add-custom-provider-btn">
                <Plus size={16} className="mr-2 text-base" />
                {t('settings.apiManagement_addProvider')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Provider Settings */}
        {(selectedProvider.trim() === '' || !currentProviderSettings) ? (
          <div className="w-2/3 pl-6 overflow-y-auto">
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">{t('settings.apiManagement_selectProvider')}</p>
            </div>
          </div>
        ) : (
          <div className="w-2/3 px-6 py-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">{currentProviderSettings.providerName} {t('settings.settings')}</h3>
              {currentProviderSettings.customProvider && (
                <button 
                  onClick={onDeleteCustomProvider}
                  className="flex items-center px-3 py-2 text-sm transition-all duration-200 settings-delete-provider-btn"
                >
                  <Trash2 size={16} className="mr-1" />
                  <span>{t('settings.apiManagement_deleteProvider')}</span>
                </button>
              )}
            </div>
            
            <div className="space-y-6 overflow-y-scroll">
              {/* API Key - Common for all providers */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  {t('settings.apiKey')}
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={currentProviderSettings.apiKey || ''}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    onBlur={handleOnEndEditing}
                    placeholder={t('settings.apiKey_placeholder')}
                    className="w-[calc(100%-0.5rem)] p-3 pr-10 mx-1 input-box"
                  />
                  <button
                    type="button"
                    className="absolute text-gray-500 transform -translate-y-1/2 right-3 top-1/2"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {t('settings.apiKey_description')}
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
                      {t('settings.apiManagement_providerName')}
                    </label>
                    <input
                      type="text"
                      value={currentProviderSettings.providerName || ''}
                      onChange={(e) => handleProviderNameChange(e.target.value)}
                      onBlur={handleOnEndEditing}
                      placeholder={t('settings.apiManagement_providerName_placeholder')}
                      className="w-[calc(100%-0.5rem)] mx-1 p-3 input-box"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      {t('settings.apiManagement_providerName_description')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      {t('settings.apiManagement_baseUrl')}
                    </label>
                    <input
                      type="text"
                      value={currentProviderSettings.baseUrl || ''}
                      onChange={(e) => handleBaseUrlChange(e.target.value)}
                      onBlur={handleOnEndEditing}
                      placeholder={t('settings.apiManagement_baseUrl_placeholder')}
                      className="w-[calc(100%-0.5rem)] mx-1 p-3 input-box"
                    />
                    <div className="flex flex-row items-center justify-between">
                      <p className="mt-2 text-xs text-gray-500">
                        {t('settings.apiManagement_baseUrl_description')}
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
                      <h4 className="font-medium text-md">{t('settings.models')}</h4>
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
                          className="flex items-center px-2 py-1 text-xs settings-add-model-btn"
                        >
                          <Plus size={14} className="mr-1" />
                          {t('settings.models_addModel')}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {Object.entries(getGroupedModels()).map(([category, models]) => (
                        <div key={category} className="space-y-2">
                          <h5 className="text-sm font-medium settings-model-category-text">{category}</h5>
                          {models.map((model) => (
                            <div key={model.modelId} className="flex items-center justify-between p-3 settings-model-item">
                              <div className="flex-1">
                                <div className="font-medium settings-model-item-name-text">{model.modelName}</div>
                                <div className="text-xs settings-model-item-id-text">{model.modelId}</div>
                              </div>
                              <div className="flex items-center gap-2 mr-6">
                                {model.modelCapabilities.map(cap => renderCapabilityBadge(cap))}
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleEditModel(model)}
                                  className="p-2 settings-model-edit-button"
                                  title={t('settings.models_editModel')}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteModel(model.modelId)}
                                  className="p-2 settings-model-delete-button"
                                  title={t('settings.models_deleteModel')}
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
            
          </div>
        )}
      </div>
      
      {renderModelEditDialog()}
    </div>
  );
};

export default ApiManagement; 