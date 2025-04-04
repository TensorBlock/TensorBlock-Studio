import { ChevronDown, Cpu, Settings } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SelectModelDialog } from '../models/SelectModelDialog';
import { AIService, ModelOption } from '../../services/ai-service';
import { SettingsService } from '../../services/settings-service';

interface TopBarProps {
  onSelectModel: (model: string, provider: string) => void;
  onOpenSettingsDialog: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onSelectModel, onOpenSettingsDialog }) => {
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedModelName, setSelectedModelName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');

  useEffect(() => {
    const settingsService = SettingsService.getInstance();
    setSelectedModel(settingsService.getSelectedModel());
    AIService.getInstance().getModelsForProvider(settingsService.getSelectedProvider()).then((models) => {
      const model = models.find((model) => model.id === settingsService.getSelectedModel());
      if (model) {
        setSelectedModelName(model.name);
      }
    });
    setSelectedProvider(settingsService.getSelectedProvider());
  }, [SettingsService.getInstance().getSelectedModel(), SettingsService.getInstance().getSelectedProvider()]);

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
          <span className='text-center truncate max-w-[200px]'>{selectedModelName}</span>
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
        currentProviderId={selectedProvider}
      />
    </div>
  );
};

export default TopBar; 