import { useState, useEffect, useCallback, useRef } from "react";
import {
  SettingsService,
  SETTINGS_CHANGE_EVENT,
} from "../../services/settings-service";
import { ChevronDown, RefreshCw, Settings, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AIService } from "../../services/ai-service";
import { OPENAI_PROVIDER_NAME } from "../../services/providers/openai-service";
import { FORGE_PROVIDER_NAME as TENSORBLOCK_PROVIDER_NAME } from "../../services/providers/forge-service";
import { ImageGenerationManager, ImageGenerationStatus, ImageGenerationHandler } from "../../services/image-generation-handler";
import { DatabaseIntegrationService } from "../../services/database-integration";
import { ImageGenerationResult } from "../../types/image";
import ImageGenerateHistoryItem from "../image/ImageGenerateHistoryItem";

export const ImageGenerationPage = () => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(true);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [imageCount, setImageCount] = useState(1);
  const [randomSeed, setRandomSeed] = useState(
    Math.floor(Math.random() * 1000000).toString()
  );
  const [generationResults, setGenerationResults] = useState<Map<string, ImageGenerationHandler>>(
    new Map()
  );
  const [historyResults, setHistoryResults] = useState<ImageGenerationResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(OPENAI_PROVIDER_NAME);
  
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsPopupRef = useRef<HTMLDivElement>(null);
  const providerDropdownRef = useRef<HTMLDivElement>(null);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);

  // Load image generation history from database
  const refreshImageHistory = useCallback(async () => {
    try {
      const dbService = DatabaseIntegrationService.getInstance();
      const results = await dbService.getImageGenerationResults();
      if (results && results.length > 0) {
        // Sort by most recent first
        const sortedResults = results.sort((a, b) => 
          b.imageResultId.localeCompare(a.imageResultId)
        );
        setHistoryResults(sortedResults);
      }
    } catch (error) {
      console.error('Error refreshing image history:', error);
    }
  }, []);

  // Initialize image generation manager and load settings
  useEffect(() => {
    const initialize = async () => {
      // Initialize image generation manager
      const imageManager = ImageGenerationManager.getInstance();
      
      // Register for updates on generation status changes
      imageManager.setUpdateCallback((handlers) => {
        setGenerationResults(new Map(handlers));
      });
      
      // Initialize database and load history
      try {
        setIsLoadingHistory(true);
        const dbService = DatabaseIntegrationService.getInstance();
        await dbService.initialize();
        
        // Load settings
        const settingsService = SettingsService.getInstance();
        await settingsService.initialize();
        
        // Load saved provider preference
        const settings = settingsService.getSettings();
        if (settings.imageGenerationProvider) {
          setSelectedProvider(settings.imageGenerationProvider);
        }
        
        // Load image generation history from database
        await refreshImageHistory();
        
        setIsLoadingHistory(false);
      } catch (error) {
        console.error('Error initializing database or loading image history:', error);
        setIsLoadingHistory(false);
      }
    };
    
    initialize();
  }, [refreshImageHistory]);

  // Check if API key is available
  useEffect(() => {
    const checkApiKey = () => {
      // Check if the selected provider has an API key
      const hasApiKey = !!SettingsService.getInstance().getApiKey(selectedProvider);
      setIsApiKeyMissing(!hasApiKey);
    };
    
    checkApiKey();

    const handleSettingsChange = () => {
      checkApiKey();
    };

    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);

    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    };
  }, [selectedProvider]);

  // Handle clicks outside the settings popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsPopupRef.current && 
        !settingsPopupRef.current.contains(event.target as Node) &&
        settingsButtonRef.current && 
        !settingsButtonRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
        setIsProviderDropdownOpen(false);
      } else if (
        providerDropdownRef.current &&
        !providerDropdownRef.current.contains(event.target as Node) &&
        event.target instanceof Element &&
        !event.target.closest('.provider-dropdown-toggle')
      ) {
        setIsProviderDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle generating an image using selected provider
  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;

    setError(null);

    try {
      let providerService;
      
      // Get the appropriate service based on selected provider
      if (selectedProvider === TENSORBLOCK_PROVIDER_NAME) {
        providerService = AIService.getInstance().getProvider(TENSORBLOCK_PROVIDER_NAME);
      } else {
        providerService = AIService.getInstance().getProvider(OPENAI_PROVIDER_NAME);
      }
      
      if (!providerService) {
        throw new Error(`${selectedProvider} service not available`);
      }

      // Create a new generation handler
      const imageManager = ImageGenerationManager.getInstance();
      const handler = imageManager.createHandler({
        prompt: prompt,
        seed: randomSeed,
        number: imageCount,
        aspectRatio: aspectRatio,
        provider: selectedProvider,
        model: "dall-e-3",
      });
      
      // Set status to generating
      handler.setGenerating();

      // Map aspect ratio to size dimensions
      const sizeMap: Record<string, `${number}x${number}`> = {
        "1:1": "1024x1024",
        "1:2": "512x1024",
        "3:2": "1024x768",
        "3:4": "768x1024",
        "16:9": "1792x1024",
        "9:16": "1024x1792"
      };
      
      // Generate the image
      const images = await providerService.getImageGeneration(prompt, {
        size: sizeMap[aspectRatio] || "1024x1024",
        aspectRatio: aspectRatio as `${number}:${number}`,
        style: "vivid"
      });
      
      // Process the result
      if (images && images.length > 0) {
        // Convert image data to full URLs if needed
        const processedImages = images.map(img => {
          const base64Data = img as string;
          if (base64Data.startsWith('data:image')) {
            return base64Data;
          } else {
            return `data:image/png;base64,${base64Data}`;
          }
        });
        
        // Update the handler with successful results
        handler.setSuccess(processedImages);
        
        // Refresh history to include the new generation
        refreshImageHistory();
        
        // Generate new seed for next generation
        generateNewSeed();
      } else {
        throw new Error("No images generated");
      }
    } catch (err) {
      setError(err as Error);
    }
  };

  // Generate new random seed
  const generateNewSeed = () => {
    setRandomSeed(Math.floor(Math.random() * 1000000).toString());
  };

  // Get all results to display in order (active generations first, then history)
  const getAllResults = () => {
    // Get results from active generation handlers
    const handlerResults = Array.from(generationResults.values())
      .map(handler => handler.getResult())
      .sort((a, b) => {
        // Prioritize active generations first
        if (a.status === ImageGenerationStatus.GENERATING && b.status !== ImageGenerationStatus.GENERATING) {
          return -1;
        }
        if (b.status === ImageGenerationStatus.GENERATING && a.status !== ImageGenerationStatus.GENERATING) {
          return 1;
        }
        // Then sort by most recent first (assuming imageResultId is a UUID with timestamp components)
        return b.imageResultId.localeCompare(a.imageResultId);
      });
    
    // Combine with historical results
    return [...handlerResults, ...historyResults];
  };

  // Check if any images are currently generating
  const isAnyImageGenerating = () => {
    return Array.from(generationResults.values()).some(
      h => h.getStatus() === ImageGenerationStatus.GENERATING
    );
  };

  // Toggle settings popup
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
    setIsProviderDropdownOpen(false);
  };

  // Toggle provider dropdown
  const toggleProviderDropdown = () => {
    setIsProviderDropdownOpen(!isProviderDropdownOpen);
  };

  // Handle provider selection
  const handleProviderSelect = async (provider: string) => {
    setSelectedProvider(provider);
    setIsProviderDropdownOpen(false);
    
    // Save provider preference to settings
    const settingsService = SettingsService.getInstance();
    await settingsService.updateSettings({
      imageGenerationProvider: provider
    });
  };

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {isApiKeyMissing && (
        <div className="p-2 text-sm text-center text-yellow-800 bg-yellow-100">
          {t("imageGeneration.apiKeyMissing")}
        </div>
      )}

      <div className="flex flex-row justify-center h-full">
        {/* Left side - Controls */}
        <div className="flex-1 max-w-5xl p-6 overflow-y-auto">
          {/* Prompt input */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {t("imageGeneration.prompt")}
            </label>
            <div className="flex flex-row gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("imageGeneration.promptPlaceholder")}
                className="w-full p-3 input-box min-h-14"
                rows={1}
              />

              <div className="flex flex-row gap-2 p-2 border border-gray-300 rounded-lg shadow-sm">
                <button
                  ref={settingsButtonRef}
                  onClick={toggleSettings}
                  className="px-4 py-2.5 text-nowrap flex flex-row gap-1 text-white text-center confirm-btn"
                >
                  <Settings></Settings>
                  {t("imageGeneration.settingsButton")}
                </button>
                <button
                  onClick={handleGenerateImage}
                  disabled={!prompt.trim() || isApiKeyMissing || isAnyImageGenerating()}
                  className="px-4 py-2.5 text-nowrap flex flex-row gap-1 text-white text-center confirm-btn"
                >
                  <Zap></Zap>
                  {isAnyImageGenerating()
                    ? t("imageGeneration.generating")
                    : t("imageGeneration.generateButton")}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center mb-4">
            <h2 className="text-xl font-medium">
              {t("imageGeneration.results")}
            </h2>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-lg">
              {t("common.error")}: {error.message}
            </div>
          )}

          {/* Results display */}
          <div className="grid grid-cols-1 gap-4">
            {/* Active generations and history */}
            {getAllResults().map(result => (
              <ImageGenerateHistoryItem 
                key={result.imageResultId} 
                imageResult={result} 
              />
            ))}
            
            {/* Loading indicator for history */}
            {isLoadingHistory && (
              <div className="flex items-center justify-center h-24 rounded-lg bg-gray-50">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 rounded-full border-primary-300 border-t-primary-600 animate-spin"></div>
                  <p className="mt-2 text-sm text-gray-600">
                    {t("imageGeneration.loading")}
                  </p>
                </div>
              </div>
            )}
            
            {/* Placeholder when no results */}
            {getAllResults().length === 0 && !isLoadingHistory && (
              <div className="flex items-center justify-center h-64 rounded-lg image-generation-result-placeholder">
                <div className="text-center">
                  <p className="text-gray-500">
                    {t("imageGeneration.placeholderText")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings popup */}
        {isSettingsOpen && (
          <div 
            ref={settingsPopupRef}
            className="absolute z-10 p-4 bg-white border border-gray-300 rounded-lg shadow-lg image-generation-settings-popup"
            style={{ 
              top: settingsButtonRef.current ? 
                settingsButtonRef.current.getBoundingClientRect().top + 5 : 100,
              left: settingsButtonRef.current ? 
                settingsButtonRef.current.getBoundingClientRect().left - 130 : 100,
              width: '320px'
            }}
          >
            <div className="mb-4">
              <h3 className="mb-2 text-base font-medium text-gray-800">
                {t("imageGeneration.imageSize")}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAspectRatio("1:1")}
                  className={`p-2 text-center border rounded-lg aspect-ratio-button ${
                    aspectRatio === "1:1" ? "active" : ""
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    <div className="w-6 h-6 border border-gray-500 rounded-sm"></div>
                  </div>
                  <span className="text-xs">1:1</span>
                </button>
                <button
                  onClick={() => setAspectRatio("3:2")}
                  className={`p-2 text-center border rounded-lg aspect-ratio-button ${
                    aspectRatio === "3:2" ? "active" : ""
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    <div className="w-6 h-4 border border-gray-500 rounded-sm"></div>
                  </div>
                  <span className="text-xs">3:2</span>
                </button>
                <button
                  onClick={() => setAspectRatio("16:9")}
                  className={`p-2 text-center border rounded-lg aspect-ratio-button ${
                    aspectRatio === "16:9" ? "active" : ""
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    <div className="w-6 h-3.5 border border-gray-500 rounded-sm"></div>
                  </div>
                  <span className="text-xs">16:9</span>
                </button>
                <button
                  onClick={() => setAspectRatio("1:2")}
                  className={`p-2 text-center border rounded-lg aspect-ratio-button ${
                    aspectRatio === "1:2" ? "active" : ""
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    <div className="w-4 h-6 border border-gray-500 rounded-sm"></div>
                  </div>
                  <span className="text-xs">1:2</span>
                </button>
                <button
                  onClick={() => setAspectRatio("3:4")}
                  className={`p-2 text-center border rounded-lg aspect-ratio-button ${
                    aspectRatio === "3:4" ? "active" : ""
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    <div className="w-[1rem] h-[1.5rem] border border-gray-500 rounded-sm"></div>
                  </div>
                  <span className="text-xs">3:4</span>
                </button>
                <button
                  onClick={() => setAspectRatio("9:16")}
                  className={`p-2 text-center border rounded-lg aspect-ratio-button ${
                    aspectRatio === "9:16" ? "active" : ""
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    <div className="w-3.5 h-6 border border-gray-500 rounded-sm"></div>
                  </div>
                  <span className="text-xs">9:16</span>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center block mb-2 text-sm font-medium text-gray-700">
                {t("imageGeneration.randomSeed")}
                <div
                  className="flex items-center justify-center w-4 h-4 ml-1 text-xs text-gray-500 bg-gray-200 rounded-full cursor-help"
                  title={t("imageGeneration.seedHelp")}
                >
                  ?
                </div>
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={randomSeed}
                  onChange={(e) => setRandomSeed(e.target.value)}
                  className="flex-grow p-3 mr-2 input-box"
                />
                <button
                  onClick={generateNewSeed}
                  className="p-2 rounded-lg image-generation-refresh-button"
                  title={t("imageGeneration.randomSeed")}
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center block mb-2 text-sm font-medium text-gray-700">
                {t("imageGeneration.provider")}
              </label>
              <div className="relative">
                <button
                  className="flex items-center justify-between w-full p-3 text-left provider-dropdown-toggle input-box"
                  onClick={toggleProviderDropdown}
                >
                  <span>{selectedProvider}</span>
                  <ChevronDown size={18} className="text-gray-500" />
                </button>
                
                {isProviderDropdownOpen && (
                  <div 
                    ref={providerDropdownRef}
                    className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
                  >
                    <ul className="py-1">
                      <li 
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                          selectedProvider === OPENAI_PROVIDER_NAME ? 'bg-gray-50 font-medium' : ''
                        }`}
                        onClick={() => handleProviderSelect(OPENAI_PROVIDER_NAME)}
                      >
                        OpenAI
                      </li>
                      <li 
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                          selectedProvider === TENSORBLOCK_PROVIDER_NAME ? 'bg-gray-50 font-medium' : ''
                        }`}
                        onClick={() => handleProviderSelect(TENSORBLOCK_PROVIDER_NAME)}
                      >
                        TensorBlock
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center block mb-2 text-sm font-medium text-gray-700">
                {t("imageGeneration.model")}
              </label>
              <div className="relative">
                <button
                  className="flex items-center justify-between w-full p-3 text-left input-box"
                  disabled={true}
                >
                  <span>DALL-E 3</span>
                  <ChevronDown size={18} className="text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerationPage;
