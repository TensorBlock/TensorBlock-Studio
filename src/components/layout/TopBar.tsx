import React from 'react';
import { LayoutGrid } from 'lucide-react';

interface TopBarProps {
  onSelectModel: (model: string) => void;
  selectedModel?: string;
}

const TopBar: React.FC<TopBarProps> = ({ onSelectModel, selectedModel }) => {
  return (
    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-5 h-5 text-gray-600" />
        <select 
          className="bg-gray-100 border-0 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700"
          onChange={(e) => onSelectModel(e.target.value)}
          value={selectedModel || ''}
        >
          <option value="">Select a Model to Load</option>
          <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
          <option value="gpt-4">GPT-4</option>
        </select>
      </div>
      <button className="text-sm text-gray-600 hover:text-gray-900">API</button>
    </div>
  );
};

export default TopBar; 