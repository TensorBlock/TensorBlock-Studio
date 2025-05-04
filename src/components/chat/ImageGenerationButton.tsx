import React, { useState, useRef, useEffect } from 'react';
import { Image, ToggleLeft, ToggleRight } from 'lucide-react';
import { SettingsService, SETTINGS_CHANGE_EVENT } from '../../services/settings-service';
import { AIServiceCapability } from '../../types/capabilities';
import ProviderIcon from '../ui/ProviderIcon';
import { useTranslation } from '../../hooks/useTranslation';

interface ImageGenerationButtonProps {
  onImageGenerate?: (prompt: string, provider: string, model: string) => void;
  disabled?: boolean;
}

interface ProviderModel {
  providerName: string;
  modelId: string;
  modelName: string;
}

const ImageGenerationButton: React.FC<ImageGenerationButtonProps> = ({ 
  onImageGenerate,
  disabled = false 
}) => {
  const { t } = useTranslation();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [providers, setProviders] = useState<ProviderModel[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load available image generation providers and models and settings
  useEffect(() => {
    const loadProviders = () => {
      const settingsService = SettingsService.getInstance();
      const availableProviders: ProviderModel[] = [];

      // Get all providers from settings
      const settings = settingsService.getSettings();
      const providerIds = Object.keys(settings.providers);
      
      // Load current image generation enabled status
      setIsEnabled(settings.imageGenerationEnabled !== false);
      
      // Load saved selected provider and model
      const savedProvider = settings.imageGenerationProvider;
      const savedModel = settings.imageGenerationModel;
      
      for (const providerId of providerIds) {
        // Get the provider's settings
        const providerSettings = settingsService.getProviderSettings(providerId);
        
        if (providerSettings.models) {
          // Find models with image generation capability
          for (const model of providerSettings.models) {
            // Check if model has image generation capability
            if (model.modelCapabilities?.includes(AIServiceCapability.ImageGeneration)) {
              availableProviders.push({
                providerName: providerId,
                modelId: model.modelId,
                modelName: model.modelName
              });
            }
          }
        }
      }

      setProviders(availableProviders);
      
      // Set saved or default selected provider and model
      if (savedProvider && savedModel && availableProviders.some(p => p.providerName === savedProvider && p.modelId === savedModel)) {
        setSelectedProvider(savedProvider);
        setSelectedModel(savedModel);
      } else if (availableProviders.length > 0) {
        setSelectedProvider(availableProviders[0].providerName);
        setSelectedModel(availableProviders[0].modelId);
      }
    };

    loadProviders();
    
    // Listen for settings changes to update available providers
    window.addEventListener(SETTINGS_CHANGE_EVENT, loadProviders);
    
    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, loadProviders);
    };
  }, []);

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsPopupOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const handleProviderModelSelect = async (providerName: string, modelId: string) => {
    setSelectedProvider(providerName);
    setSelectedModel(modelId);
    
    // Save selected provider and model in settings
    const settingsService = SettingsService.getInstance();
    await settingsService.updateSettings({
      imageGenerationProvider: providerName,
      imageGenerationModel: modelId
    });
    
    // If onImageGenerate is provided, call it with an empty prompt
    // The actual prompt will be filled in by the chat message
    if (onImageGenerate && isEnabled) {
      onImageGenerate("", providerName, modelId);
    }
    
    setIsPopupOpen(false);
  };
  
  const toggleImageGeneration = async () => {
    const newEnabledState = !isEnabled;
    setIsEnabled(newEnabledState);
    
    // Save the enabled state in settings
    const settingsService = SettingsService.getInstance();
    await settingsService.updateSettings({
      imageGenerationEnabled: newEnabledState
    });
  };

  const buttonClass = `flex items-center justify-center w-8 h-8 rounded-full focus:outline-none ${
    isEnabled ? 'image-generation-button' : 'text-gray-400 bg-gray-100'
  }`;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePopup}
        disabled={providers.length === 0 || disabled}
        className={buttonClass}
        title={
          providers.length === 0 
            ? t('chat.imageGenerationNotAvailable') 
            : isEnabled 
              ? t('chat.generateImage') 
              : t('chat.imageGenerationDisabled')
        }
      >
        <Image size={20} />
      </button>
      
      {isPopupOpen && (
        <div 
          ref={popupRef}
          className="absolute z-10 mt-2 image-generation-popup"
          style={{ bottom: '100%', left: 0, minWidth: '220px' }}
        >
          <div className="p-2">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-700">
                {t('chat.selectImageProvider')}
              </div>
              <button
                onClick={toggleImageGeneration}
                className="flex items-center text-sm focus:outline-none"
                title={isEnabled ? t('chat.disableImageGeneration') : t('chat.enableImageGeneration')}
              >
                {isEnabled ? (
                  <ToggleRight className="w-6 h-6 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                )}
              </button>
            </div>
            <div className="overflow-y-auto max-h-60">
              {providers.map((provider) => (
                <div
                  key={`${provider.providerName}-${provider.modelId}`}
                  className={`flex items-center px-3 py-2 cursor-pointer rounded-md ${
                    isEnabled && selectedProvider === provider.providerName && selectedModel === provider.modelId
                      ? 'image-generation-provider-selected'
                      : 'image-generation-provider-item'
                  }`}
                  onClick={() => handleProviderModelSelect(provider.providerName, provider.modelId)}
                >
                  <ProviderIcon providerName={provider.providerName} className="w-5 h-5 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{provider.providerName}</span>
                    <span className="text-xs text-gray-500">{provider.modelName}</span>
                  </div>
                </div>
              ))}
              
              {providers.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {t('chat.noImageProvidersAvailable')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerationButton; 