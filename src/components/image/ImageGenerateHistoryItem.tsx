import React from 'react';
import { ImageGenerationResult } from '../../types/image';
import { MessageContent } from '../../types/chat';
import { Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AIService } from '../../services/ai-service';

interface ImageGenerateHistoryItemProps {
  imageResult: ImageGenerationResult;
}

const ImageGenerateHistoryItem: React.FC<ImageGenerateHistoryItemProps> = ({ 
  imageResult,
}) => { 
  const { t } = useTranslation();
  const isGenerating = imageResult.status === 'generating';
  const isFailed = imageResult.status === 'failed';

  // Function to render image grid based on number of images and aspect ratio
  const renderImageGrid = (images: MessageContent[]) => {
    if (images.length === 0 && !isGenerating) return null;

    // Convert aspect ratio string (e.g. "16:9") to calculate best layout
    const [widthRatio, heightRatio] = imageResult.aspectRatio.split(':').map(Number);
    const isWide = widthRatio > heightRatio;
    
    // Grid layout classes based on number of images
    let gridClass = "grid-cols-1";
    
    if (images.length === 2) {
      gridClass = isWide ? "grid-cols-2" : "grid-cols-1 grid-rows-2";
    } else if (images.length === 3) {
      gridClass = "grid-cols-3";
    } else if (images.length === 4) {
      gridClass = "grid-cols-2 grid-rows-2";
    }
    
    // If still generating, show a loading indicator
    if (isGenerating) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50" style={{ aspectRatio: imageResult.aspectRatio.replace(':', '/') }}>
          <div className="flex flex-col items-center">
            <Loader size={40} className="text-primary-500 animate-spin" />
            <p className="mt-4 text-sm text-gray-600">{t('imageGeneration.creatingImage')}</p>
          </div>
        </div>
      );
    }
    
    // Show error message if generation failed
    if (isFailed) {
      return (
        <div className="flex items-center justify-center h-64 bg-red-50" style={{ aspectRatio: imageResult.aspectRatio.replace(':', '/') }}>
          <div className="flex flex-col items-center">
            <p className="text-red-600">{t('imageGeneration.generationFailed')}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`grid gap-2 ${gridClass}`}>
        {images.map((image, index) => (
          <div 
            key={index} 
            className="overflow-hidden rounded-lg"
            style={{
              aspectRatio: imageResult.aspectRatio.replace(':', '/'),
            }}
          >
            <img 
              src={image.content} 
              alt={`${imageResult.prompt} (${index + 1})`}
              className="object-cover w-full h-full"
            />
          </div>
        ))}
      </div>
    );
  };

  const getProviderName = (providerId: string, providerName: string) => {
    const providerService = AIService.getInstance().getProvider(providerId);
    return providerService?.name || providerName || providerId;
  }

  return (
    <div className={`mb-6 overflow-hidden border rounded-lg shadow-sm image-result-item ${isGenerating ? 'border-primary-300' : ''}`}>
      <div className="image-result-container">
        {renderImageGrid(imageResult.images)}
      </div>
      
      <div className="p-4 border-t bg-gray-50">
        <div className="mb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <p className="mb-1 text-sm font-medium text-gray-900 truncate">{imageResult.prompt}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${isGenerating ? 'bg-primary-100 text-primary-800' : 'bg-gray-100'}`}>
                  {imageResult.model}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${isGenerating ? 'bg-primary-100 text-primary-800' : 'bg-gray-100'}`}>
                  {getProviderName(imageResult.provider, imageResult.providerName)}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${isGenerating ? 'bg-primary-100 text-primary-800' : 'bg-gray-100'}`}>
                  {imageResult.aspectRatio}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${isGenerating ? 'bg-primary-100 text-primary-800' : 'bg-gray-100'}`}>
                  Seed: {imageResult.seed}
                </span>
                {isGenerating && (
                  <span className="px-2 py-1 text-xs text-white rounded-full bg-primary-500 animate-pulse">
                    {t('imageGeneration.generating')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerateHistoryItem; 