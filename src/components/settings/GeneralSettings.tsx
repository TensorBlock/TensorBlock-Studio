import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface GeneralSettingsProps {
  startWithSystem: boolean;
  startupToTray: boolean;
  closeToTray: boolean;
  proxyMode: 'system' | 'custom' | 'none';
  sendErrorReports: boolean;
  onSettingChange: (key: string, value: unknown) => void;
  onSaveSettings: () => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  startWithSystem,
  startupToTray,
  closeToTray,
  proxyMode,
  sendErrorReports,
  onSettingChange,
  onSaveSettings
}) => {
  const { t } = useTranslation();
  const [customProxyUrl, setCustomProxyUrl] = useState<string>('');

  const handleProxyModeChange = (mode: 'system' | 'custom' | 'none') => {
    onSettingChange('proxyMode', mode);
    onSaveSettings();
  };

  const handleToggleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange(key, e.target.checked);
    onSaveSettings();
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1">
        <h3 className="mb-6 text-xl font-semibold">{t('settings.general')}</h3>
        
        {/* Startup Settings */}
        <div className="p-4 mb-4 settings-section">
          <h3 className="mb-4 text-lg font-medium settings-section-title">{t('settings.startup')}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="start-with-system"
                checked={startWithSystem}
                onChange={handleToggleChange('startWithSystem')}
                className="w-4 h-4 checkbox-input"
              />
              <label htmlFor="start-with-system" className="ml-2 text-sm font-medium settings-toggle-label">
                {t('settings.startWithSystem')}
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="startup-to-tray"
                checked={startupToTray}
                onChange={handleToggleChange('startupToTray')}
                className="w-4 h-4 checkbox-input"
              />
              <label htmlFor="startup-to-tray" className="ml-2 text-sm font-medium settings-toggle-label">
                {t('settings.startupToTray')}
              </label>
            </div>
          </div>
        </div>
        
        {/* Tray Settings */}
        <div className="p-4 mb-4 settings-section">
          <h3 className="mb-4 text-lg font-medium settings-section-title">{t('settings.trayOptions')}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="close-to-tray"
                checked={closeToTray}
                onChange={handleToggleChange('closeToTray')}
                className="w-4 h-4 checkbox-input"
              />
              <label htmlFor="close-to-tray" className="ml-2 text-sm font-medium settings-toggle-label">
                {t('settings.closeToTray')}
              </label>
            </div>
          </div>
        </div>
        
        {/* Network Settings */}
        <div className="p-4 mb-4 settings-section">
          <h3 className="mb-4 text-lg font-medium settings-section-title">{t('settings.networkProxy')}</h3>
          
          <div className="p-3 space-y-4 settings-radio-group">
            <div className="flex items-center">
              <input
                type="radio"
                id="proxy-system"
                name="proxy-mode"
                checked={proxyMode === 'system'}
                onChange={() => handleProxyModeChange('system')}
                className="w-4 h-4 text-blue-600 form-radio"
              />
              <label htmlFor="proxy-system" className={`ml-2 text-sm font-medium ${proxyMode === 'system' ? 'settings-radio-item-active' : 'settings-radio-item'}`}>
                {t('settings.systemProxy')}
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="proxy-custom"
                name="proxy-mode"
                checked={proxyMode === 'custom'}
                onChange={() => handleProxyModeChange('custom')}
                className="w-4 h-4 text-blue-600 form-radio"
              />
              <label htmlFor="proxy-custom" className={`ml-2 text-sm font-medium ${proxyMode === 'custom' ? 'settings-radio-item-active' : 'settings-radio-item'}`}>
                {t('settings.customProxy')}
              </label>
            </div>
            
            {proxyMode === 'custom' && (
              <div className="pl-6 mt-2">
                <input
                  type="text"
                  value={customProxyUrl}
                  onChange={(e) => setCustomProxyUrl(e.target.value)}
                  onBlur={() => {
                    onSettingChange('customProxyUrl', customProxyUrl);
                    onSaveSettings();
                  }}
                  placeholder="http://proxy.example.com:8080"
                  className="w-full p-2 input-box"
                />
              </div>
            )}
            
            <div className="flex items-center">
              <input
                type="radio"
                id="proxy-none"
                name="proxy-mode"
                checked={proxyMode === 'none'}
                onChange={() => handleProxyModeChange('none')}
                className="w-4 h-4 text-blue-600 form-radio"
              />
              <label htmlFor="proxy-none" className={`ml-2 text-sm font-medium ${proxyMode === 'none' ? 'settings-radio-item-active' : 'settings-radio-item'}`}>
                {t('settings.noProxy')}
              </label>
            </div>
          </div>
        </div>
        
        {/* Privacy Settings */}
        <div className="p-4 mb-4 settings-section">
          <h3 className="mb-4 text-lg font-medium settings-section-title">{t('settings.privacy')}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="send-error-reports"
                checked={sendErrorReports}
                onChange={handleToggleChange('sendErrorReports')}
                className="w-4 h-4 checkbox-input"
              />
              <label htmlFor="send-error-reports" className="ml-2 text-sm font-medium settings-toggle-label">
                {t('settings.sendErrorReports')}
              </label>
            </div>
            <p className="text-xs settings-toggle-description">
              {t('settings.sendErrorReports_description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings; 