import { ChevronDown, Cpu, Minimize2, Minus, Settings, Square, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SelectModelDialog } from '../models/SelectModelDialog';
import { AIService, ModelOption } from '../../services/ai-service';
import { SettingsService } from '../../services/settings-service';
import tensorBlockLogo from '/logos/TensorBlock_logo_dark.svg';

interface TopBarProps {
  onSelectModel: (model: string, provider: string) => void;
  onOpenSettingsDialog: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onSelectModel, onOpenSettingsDialog }) => {
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedModelName, setSelectedModelName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);

  // Check if window is maximized on mount
  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electron && window.electron.isMaximized) {
        const maximized = await window.electron.isMaximized();
        setIsMaximized(maximized);
      }
    };
    
    checkMaximized();

    window.electron.onWindowMaximizedChange((_event, maximized) => {
      setIsMaximized(maximized);
    });
  }, []);

  // Window control handlers
  const handleMinimize = () => {
    if (window.electron && window.electron.minimize) {
      window.electron.minimize();
    }
  };

  const handleMaximize = async () => {
    if (!window.electron) return;
    
    if (isMaximized && window.electron.unmaximize) {
      await window.electron.unmaximize();
      setIsMaximized(false);
    } else if (window.electron.maximize) {
      await window.electron.maximize();
      setIsMaximized(true);
    }
  };

  const handleClose = () => {
    if (window.electron && window.electron.closeApp) {
      window.electron.closeApp();
    }
  };

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
    <div className="flex items-center justify-between h-16 bg-main-background app-region-drag">
      {/* Logo area */}
      <div className="w-[68px] aspect-square flex items-center justify-center h-16">
        <div className="flex items-center justify-center w-10 h-10">
          <img 
            src={tensorBlockLogo} 
            alt="TensorBlock Logo" 
            className="w-8 h-8"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 16h.01" /><path d="M8 16h.01" /><path d="M12 8v8" /></svg>';
            }}
          />
        </div>
      </div>

      <div className='flex items-center justify-center gap-8 w-full'>
        <div className="flex items-center w-1/3 gap-2">
          <button 
            className="btn hover:bg-gray-200 w-full bg-gray-100 border-0 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 flex justify-between app-region-no-drag"
            onClick={handleOpenModelDialog}
            aria-label="Select AI model"
          >
            <Cpu className="w-5 h-5 p-0.5 text-gray-600" />
            <span className='text-center truncate max-w-[200px]'>{selectedModelName}</span>
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <button className="flex items-center justify-center gap-2 px-2 py-1 text-sm text-gray-600 border border-gray-200 rounded-md hover:text-gray-900 app-region-no-drag" onClick={onOpenSettingsDialog}>
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

      <div className='flex items-start justify-center gap-1 h-full'>
        <button 
          className='btn hover:bg-gray-200 bg-transparent border-0 px-3 py-1.5 text-sm font-medium text-gray-600 flex justify-center items-center app-region-no-drag'
          onClick={handleMinimize}
        >
          <Minus className='w-5 h-5' />
        </button>

        <button
          className='btn hover:bg-gray-200 bg-transparent border-0 px-3 py-1.5 text-sm font-medium text-gray-600 flex justify-center items-center app-region-no-drag'
          onClick={handleMaximize}
        >
          {isMaximized ? <Minimize2 className='w-5 h-5' /> : <Square className='w-5 h-5 p-0.5' />}
        </button>

        <button
          className='btn hover:bg-red-500 bg-transparent border-0 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-white flex justify-center items-center app-region-no-drag'
          onClick={handleClose}
        >
          <X className='w-5 h-5' />
        </button>
      </div>
    </div>
  );
};

export default TopBar; 