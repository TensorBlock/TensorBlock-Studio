import React from 'react';

interface ChatSettingsProps {
  useStreaming: boolean;
  onStreamingChange: (enabled: boolean) => void;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  onSaveSettings: () => void;
}

export const ChatSettings: React.FC<ChatSettingsProps> = ({
  useStreaming,
  onStreamingChange,
  saveStatus,
  onSaveSettings
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Title area removed - settings are auto-saved */}

      <div className="flex-1">
        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="mb-4 text-lg font-medium">Response Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="use-streaming"
                checked={useStreaming}
                onChange={(e) => onStreamingChange(e.target.checked)}
                onBlur={() => onSaveSettings()}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="use-streaming" className="ml-2 text-sm font-medium text-gray-700">
                Enable Streaming Responses
              </label>
            </div>
            <p className="text-xs text-gray-500">
              When enabled, AI responses will appear incrementally as they're generated,
              rather than waiting for the complete response. This provides a more
              interactive experience but may use slightly more resources.
            </p>
          </div>
        </div>
      </div>
      
      {saveStatus === 'success' && (
        <div className="py-2 mt-2 text-sm text-center text-green-600 rounded bg-green-50">
          Settings saved successfully!
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="py-2 mt-2 text-sm text-center text-red-600 rounded bg-red-50">
          Error saving settings. Please try again.
        </div>
      )}
    </div>
  );
};

export default ChatSettings;
