import React from 'react';

interface ModelManagementProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export const ModelManagement: React.FC<ModelManagementProps> = ({
  selectedModel,
  onModelChange,
}) => {
  const models = [
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo (16k)', provider: 'OpenAI' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Model Management</h2>
      </div>
      
      <div className="flex-1">
        <h3 className="mb-2 text-lg font-medium">Default Model</h3>
        <p className="mb-4 text-sm text-gray-600">
          Select the model you want to use by default for new conversations.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {models.map((model) => (
            <div 
              key={model.id} 
              className={`p-4 border rounded-lg ${
                selectedModel === model.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  id={`model-${model.id}`}
                  name="model"
                  value={model.id}
                  checked={selectedModel === model.id}
                  onChange={() => onModelChange(model.id)}
                  className="w-4 h-4 mt-1 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <label
                    htmlFor={`model-${model.id}`}
                    className="block font-medium text-gray-700"
                  >
                    {model.name}
                  </label>
                  <span className="text-xs text-gray-500">
                    Provider: {model.provider}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelManagement; 