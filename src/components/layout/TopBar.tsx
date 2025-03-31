import { ChevronDown, Cpu, Settings } from 'lucide-react';
import React, { useState } from 'react';
import { SelectModelDialog } from '../models/SelectModelDialog';
import { ModelOption } from '../../services/ai-service';

interface TopBarProps {
  onSelectModel: (model: string, provider: string) => void;
  selectedModel?: string;
  selectedProvider?: string;
  onOpenSettingsDialog: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onSelectModel, selectedModel, selectedProvider, onOpenSettingsDialog }) => {
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  
  const handleOpenModelDialog = () => {
    setIsModelDialogOpen(true);
  };
  
  const handleCloseModelDialog = () => {
    setIsModelDialogOpen(false);
  };
  
  const handleSelectModel = (model: ModelOption, provider: string) => {
    onSelectModel(model.id, provider);
    setIsModelDialogOpen(false);
  };
  
  return (
    <div className="flex items-center justify-center h-16 gap-8 px-6 bg-white border-b border-gray-200">
      <div className="flex items-center w-1/3 gap-2">
        <button 
          className="btn hover:bg-gray-200 w-full bg-gray-100 border-0 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 flex justify-between"
          onClick={handleOpenModelDialog}
          aria-label="Select AI model"
        >
          <Cpu className="w-5 h-5 p-0.5 text-gray-600" />
          <span className='text-center truncate max-w-[200px]'>{selectedModel}</span>
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <button className="flex items-center justify-center gap-2 px-2 py-1 text-sm text-gray-600 border border-gray-200 rounded-md hover:text-gray-900" onClick={onOpenSettingsDialog}>
        <Settings className="w-5 h-5 p-0.5" />
        <span className='truncate max-w-[200px]'>API</span>
      </button>
      
      <SelectModelDialog
        isOpen={isModelDialogOpen}
        onClose={handleCloseModelDialog}
        onSelectModel={handleSelectModel}
        currentModelId={selectedModel}
        currentProviderName={selectedProvider}
      />
    </div>
  );
};

export default TopBar; 