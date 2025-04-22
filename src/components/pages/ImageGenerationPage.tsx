import { useState, useEffect } from 'react';
import { SettingsService, SETTINGS_CHANGE_EVENT } from '../../services/settings-service';

export const ImageGenerationPage = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(true);
  
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, just show a placeholder result
      setImageResult(`https://placehold.co/512x512/eee/999?text=${encodeURIComponent(prompt)}`);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-6 bg-white">
      {isApiKeyMissing && (
        <div className="p-2 mb-4 text-sm text-center text-yellow-800 bg-yellow-100">
          Please set your API key for the selected provider in the settings.
        </div>
      )}

      <h1 className="mb-6 text-2xl font-bold">AI Image Generation</h1>
      
      <div className="flex flex-col gap-6">
        {/* Input section */}
        <div className="flex flex-col gap-3">
          <label htmlFor="prompt" className="font-medium">
            Prompt
          </label>
          <textarea 
            id="prompt"
            className="w-full p-3 border rounded-lg resize-none" 
            rows={5}
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Using model: {selectedModel || 'None selected'}
            </div>
            <button 
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              onClick={handleGenerateImage}
              disabled={isGenerating || !prompt.trim() || isApiKeyMissing}
            >
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="p-3 text-red-700 bg-red-100 rounded-lg">
            Error: {error.message}
          </div>
        )}
        
        {/* Results section */}
        {imageResult && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-medium">Generated Image</h2>
            <div className="flex justify-center p-2 border rounded-lg">
              <img 
                src={imageResult} 
                alt="Generated from AI" 
                className="object-contain max-w-full max-h-96"
              />
            </div>
            <div className="flex justify-end">
              <button className="px-3 py-1 border rounded-lg hover:bg-gray-100">
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerationPage; 