import React, { useState, useEffect } from 'react';
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
  onSettingChange,
  onSaveSettings
}) => {
  const { t, i18n } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isWindows, setIsWindows] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  
  // Check if running on Windows platform
  useEffect(() => {
    const checkPlatform = async () => {
      if (window.electron && window.electron.getPlatform) {
        const platform = await window.electron.getPlatform();
        setIsWindows(platform === 'win32');
      }
    };
    
    checkPlatform();
  }, []);

  // Update currentLanguage when i18n.language changes
  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  // const handleProxyModeChange = (mode: 'system' | 'custom' | 'none') => {
  //   onSettingChange('proxyMode', mode);
  //   onSaveSettings();
  // };

  const handleToggleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange(key, e.target.checked);
    onSaveSettings();
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setCurrentLanguage(langCode);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh_CN', name: '简体中文' },
    { code: 'zh_TW', name: '繁體中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'es', name: 'Español' }
  ];

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
        
        {/* Language Settings */}
        <div className="p-4 mb-4 settings-section">
          <h3 className="mb-4 text-lg font-medium settings-section-title">{t('settings.language')}</h3>
          
          <div className="space-y-4">
            {languages.map((lang) => (
              <div key={lang.code} className="flex items-center">
                <input
                  type="radio"
                  id={`lang-${lang.code}`}
                  name="language"
                  value={lang.code}
                  checked={currentLanguage === lang.code}
                  onChange={() => handleLanguageChange(lang.code)}
                  className="w-4 h-4 text-blue-600 form-radio"
                />
                <label htmlFor={`lang-${lang.code}`} className="ml-2 text-sm font-medium settings-toggle-label">
                  {lang.name}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Network Proxy and Privacy sections are hidden as requested */}
      </div>
    </div>
  );
};

export default GeneralSettings; 