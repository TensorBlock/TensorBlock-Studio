import React from 'react';
import { useTranslation } from 'react-i18next';

interface ChatSettingsProps {
  useWebSearch: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  onSaveSettings: () => void;
}

export const ChatSettings: React.FC<ChatSettingsProps> = ({
  useWebSearch,
  onWebSearchChange,
  onSaveSettings
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full p-4">
      {/* Title area removed - settings are auto-saved */}

      <div className="flex-1">
        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="mb-4 text-lg font-medium">{t('settings.webSearch_title')}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="use-web-search"
                checked={useWebSearch}
                onChange={(e) => onWebSearchChange(e.target.checked)}
                onBlur={() => onSaveSettings()}
                className="w-4 h-4 checkbox-input"
              />
              <label htmlFor="use-web-search" className="ml-2 text-sm font-medium text-gray-700">
                {t('settings.webSearch_toggle_label')}
              </label>
            </div>
            <p className="text-xs text-gray-500">
              {t('settings.webSearch_description')}
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default ChatSettings;
