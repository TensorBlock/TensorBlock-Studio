import React, { useState, useEffect } from 'react';
import { Search, Check, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import { AIService, ModelOption } from '../../services/ai-service';
import { SettingsService } from '../../services/settings-service';

interface SelectModelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (model: ModelOption, provider: string) => void;
  currentModelId?: string;
  currentProviderId?: string;
}

export const SelectModelDialog: React.FC<SelectModelDialogProps> = ({
  isOpen,
  onClose,
  onSelectModel,
  currentModelId,
  currentProviderId
}) => {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(currentModelId);
  const [selectedProviderId, setSelectedProviderId] = useState<string | undefined>(currentProviderId);
  const [collapsedList, setCollapsedList] = useState<Map<string, boolean>>(new Map());
  const [aiService] = useState(() => AIService.getInstance());

  useEffect(() => {
    if (isOpen) {
      loadModels();
    }
    
    // Subscribe to AIService changes to get isCachingModels updates
    const unsubscribe = aiService.subscribe(() => {
      setIsLoading(aiService.isCachingModels);
    });
    
    return () => unsubscribe();
  }, [isOpen, aiService]);
  
  useEffect(() => {
    setSelectedModelId(currentModelId);
  }, [currentModelId]);

  useEffect(() => {
    setSelectedProviderId(currentProviderId);
  }, [currentProviderId]);
  
  const loadModels = async () => {
    try {
      const aiService = AIService.getInstance();
      const models = await aiService.getCachedAllModels();
      setModels(models);
    } catch (error) {
      console.error("Error loading models:", error);
    }
  };
  
  // const handleRefresh = async () => {
  //   try {
  //     await aiService.refreshModels();
  //     const refreshedModels = await aiService.getCachedAllModels();
  //     setModels(refreshedModels);
  //   } catch (error) {
  //     console.error("Error refreshing models:", error);
  //   }
  // };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSelectModel = (model: ModelOption, providerId: string) => {
    setSelectedModelId(model.id);
    setSelectedProviderId(providerId);
    onSelectModel(model, providerId);
  };
  
  const handleCollapseProvider = (provider: string) => {
    const newCollapsedList = new Map(collapsedList);
    newCollapsedList.set(provider, !newCollapsedList.has(provider) || !newCollapsedList.get(provider));
    setCollapsedList(newCollapsedList);
  };

  // Filter models based on search query
  const filteredModels = searchQuery
    ? models.filter(model => 
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (model.description && model.description.toLowerCase().includes(searchQuery.toLowerCase())))
    : models;
  
  // Group models by provider
  const groupedModels = filteredModels.reduce((groups, model) => {
    const provider = model.provider;
    if (!groups[provider]) {
      groups[provider] = [];
    }
    groups[provider].push(model);
    return groups;
  }, {} as Record<string, ModelOption[]>);
  
  const getProviderName = (providerId: string) => {
    const settingsService = SettingsService.getInstance();
    const providerSettings = settingsService.getProviderSettings(providerId);
    return providerSettings.providerName;
  }

  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#00000033] fade-in app-region-no-drag"
      onClick={onClose}
    >
      <div 
        className="flex flex-col w-3/4 p-4 h-4/5 select-model-dialog move-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b frame-separator-border-color">
          <h2 className="p-2 text-xl font-semibold">Select Model</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full select-model-dialog-close-button"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex items-center justify-between p-4 border-b frame-separator-border-color">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full p-2 pl-10 rounded-md input-box"
            />
            <div className="absolute transform -translate-y-1/2 left-3 top-1/2">
              <Search size={16} />
            </div>
          </div>
          
          {/* <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 ml-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              'Refresh Models'
            )}
          </button> */}
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {isLoading && models.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="mb-4 text-4xl text-blue-500 animate-spin" size={40} />
              <p className="text-gray-400">Loading available models...</p>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              {searchQuery ? 'No models match your search' : 'No models available'}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedModels).map(([providerId, providerModels]) => (
                <div key={providerId} className="mb-6">
                  
                  <div className="flex items-start justify-start">
                    <h3 className="mb-2 text-lg font-medium">{getProviderName(providerId)}</h3>
                    <button 
                      onClick={() => handleCollapseProvider(providerId)}
                      className="p-1 ml-2 select-model-dialog-expand-button"
                    >
                      {collapsedList.get(providerId) ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                  </div>

                  <div className="space-y-2" style={{display: (collapsedList.has(providerId) && collapsedList.get(providerId)) ? 'none' : 'block'}}>
                    {providerModels.map(model => (
                      <div
                        key={model.id}
                        onClick={() => handleSelectModel(model, providerId)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                          (selectedModelId === model.id && selectedProviderId === providerId)
                            ? 'settings-provider-item-selected settings-provider-item-selected-text'
                            : 'settings-provider-item settings-provider-item-tex'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{model.name}</div>
                          {model.description && (
                            <div className={`text-sm ${selectedModelId === model.id ? 'text-blue-200' : 'text-gray-400'}`}>
                              {model.description}
                            </div>
                          )}
                        </div>
                        {(selectedModelId === model.id && selectedProviderId === providerId) && (
                          <div className="ml-4">
                            <Check size={16} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 