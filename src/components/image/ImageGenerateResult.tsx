import React from 'react';
import { ImageGenerationResult } from '../../types/image';
import { useTranslation } from 'react-i18next';

interface ImageGenerateResultProps {
  imageResult: ImageGenerationResult;
}

const ImageGenerateResult: React.FC<ImageGenerateResultProps> = ({ 
    imageResult,
}) => { 
  const { t } = useTranslation();
  
  return (
    <></>
  );
};

export default ImageGenerateResult; 