import { useState, useEffect } from "react";
import {
  SettingsService,
  SETTINGS_CHANGE_EVENT,
} from "../../services/settings-service";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

export const ImageGenerationPage = () => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(true);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageCount, setImageCount] = useState(1);
  const [randomSeed, setRandomSeed] = useState(
    Math.floor(Math.random() * 1000000).toString()
  );

  // Check if API key is available
  useEffect(() => {
    setIsApiKeyMissing(!SettingsService.getInstance().getApiKey());
    setSelectedProvider(SettingsService.getInstance().getSelectedProvider());
    setSelectedModel(SettingsService.getInstance().getSelectedModel());

    const handleSettingsChange = () => {
      setSelectedProvider(SettingsService.getInstance().getSelectedProvider());
      setSelectedModel(SettingsService.getInstance().getSelectedModel());
      setIsApiKeyMissing(!SettingsService.getInstance().getApiKey());
    };

    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);

    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    };
  }, []);

  // Handle generating an image (mock function)
  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      // In a real implementation, this would call an actual image generation service
      // For now, just simulate the process with a timeout
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demo purposes, just show a placeholder result
      setImageResult(
        `https://placehold.co/512x512/eee/999?text=${encodeURIComponent(
          prompt
        )}`
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate new random seed
  const generateNewSeed = () => {
    setRandomSeed(Math.floor(Math.random() * 1000000).toString());
  };

  // Get model name
  const getModelName = (modelID: string, provider: string) => {
    const providerSettings =
      SettingsService.getInstance().getProviderSettings(provider);
    if (!providerSettings.models) return modelID;

    const model = providerSettings.models?.find((m) => m.modelId === modelID);
    if (!model) return modelID;

    return model.modelName;
  };

  // Get display provider name
  const getDisplayProviderName = () => {
    if (!selectedProvider) return "硅基流动";

    const providerSettings =
      SettingsService.getInstance().getProviderSettings(selectedProvider);
    return providerSettings.providerName || selectedProvider;
  };

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {isApiKeyMissing && (
        <div className="p-2 text-sm text-center text-yellow-800 bg-yellow-100">
          {t("imageGeneration.apiKeyMissing")}
        </div>
      )}

      <div className="flex flex-row h-full">
        {/* Left side - Controls */}
        <div className="flex-1 p-6 overflow-y-auto frame-right-border">
          <h1 className="mb-6 text-2xl font-semibold">
            {t("imageGeneration.title")}
          </h1>

          {/* Prompt input */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {t("imageGeneration.prompt")}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("imageGeneration.promptPlaceholder")}
              className="w-full p-3 input-box min-h-14"
              rows={4}
            />
          </div>

          {/* Negative prompt */}
          {/* <div className="mb-6">
            <label className="flex items-center block mb-2 text-sm font-medium text-gray-700">
              反向提示词
              <div className="flex items-center justify-center w-4 h-4 ml-1 text-xs text-gray-500 bg-gray-200 rounded-full cursor-help" title="Elements to avoid in the image">?</div>
            </label>
            <textarea 
              placeholder="输入不希望在生成的图像中出现的元素"
              className="w-full p-3 input-box"
              rows={3}
            />
          </div> */}

          {/* Generation button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating || !prompt.trim() || isApiKeyMissing}
              className="px-8 py-2.5 text-white confirm-btn"
            >
              {isGenerating
                ? t("imageGeneration.generating")
                : t("imageGeneration.generateButton")}
            </button>
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

          {/* Loading indicator */}
          {isGenerating && (
            <div className="flex items-center justify-center h-64 rounded-lg bg-gray-50">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 rounded-full border-primary-300 border-t-primary-600 animate-spin"></div>
                <p className="mt-4 text-gray-600">
                  {t("imageGeneration.generating")}
                </p>
              </div>
            </div>
          )}

          {/* Results display */}
          {imageResult && !isGenerating && (
            <div className="grid grid-cols-1 gap-4">
              <div className="overflow-hidden border rounded-lg image-result-area">
                <img
                  src={imageResult}
                  alt="Generated from AI"
                  className="object-contain w-full"
                />
              </div>
            </div>
          )}

          {/* Placeholder when no results */}
          {!imageResult && !isGenerating && (
            <div className="flex items-center justify-center h-64 rounded-lg image-generation-result-placeholder">
              <div className="text-center">
                <p className="text-gray-500">
                  {t("imageGeneration.placeholderText")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Results */}
        <div className="w-[420px] h-full p-6 overflow-y-auto">
          {/* Provider selection */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {t("imageGeneration.provider")}
            </label>
            <div className="relative">
              <button
                className="flex items-center justify-between w-full p-3 text-left input-box"
                disabled={true}
              >
                <span>{getDisplayProviderName()}</span>
                <ChevronDown size={18} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Model selection */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {t("imageGeneration.model")}
            </label>
            <div className="relative">
              <button
                className="flex items-center justify-between w-full p-3 text-left input-box"
                disabled={true}
              >
                <span>
                  {getModelName(selectedModel, selectedProvider) ||
                    "FLUX.1 Schnell"}
                </span>
                <ChevronDown size={18} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Aspect ratio selection */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {t("imageGeneration.imageSize")}
            </label>
            <div className="grid grid-cols-6 gap-1">
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

          {/* Image count */}
          <div className="mb-6">
            <label className="flex items-center block mb-2 text-sm font-medium text-gray-700">
              {t("imageGeneration.generationCount")}
              <div
                className="flex items-center justify-center w-4 h-4 ml-1 text-xs text-gray-500 bg-gray-200 rounded-full cursor-help"
                title={t("imageGeneration.generationCount")}
              >
                ?
              </div>
            </label>
            <input
              type="number"
              value={imageCount}
              onChange={(e) => setImageCount(parseInt(e.target.value) || 1)}
              min="1"
              max="4"
              className="w-full p-3 input-box"
            />
          </div>

          {/* Random seed */}
          <div className="mb-6">
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
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationPage;
