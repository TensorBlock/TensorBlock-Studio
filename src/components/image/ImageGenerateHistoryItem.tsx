import React from 'react';
import { ImageGenerationResult } from '../../types/image';
import { MessageContent } from '../../types/chat';

interface ImageGenerateHistoryItemProps {
  imageResult: ImageGenerationResult;
}

const ImageGenerateHistoryItem: React.FC<ImageGenerateHistoryItemProps> = ({ 
  imageResult,
}) => { 

  // Function to render image grid based on number of images and aspect ratio
  const renderImageGrid = (images: MessageContent[]) => {
    if (images.length === 0) return null;

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

  return (
    <div className="mb-6 overflow-hidden border rounded-lg shadow-sm image-result-item">
      <div className="image-result-container">
        {renderImageGrid(imageResult.images)}
      </div>
      
      <div className="p-4 border-t bg-gray-50">
        <div className="mb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <p className="mb-1 text-sm font-medium text-gray-900 truncate">{imageResult.prompt}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                  {imageResult.model}
                </span>
                <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                  {imageResult.provider}
                </span>
                <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                  {imageResult.aspectRatio}
                </span>
                <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                  Seed: {imageResult.seed}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerateHistoryItem; 