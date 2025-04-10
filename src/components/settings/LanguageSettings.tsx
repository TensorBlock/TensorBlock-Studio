import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export const LanguageSettings = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' }
  ];
  
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setCurrentLanguage(langCode);
  };

  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  return (
    <div className="p-4 mb-4 border border-gray-200 rounded-md dark:border-gray-700">
      <h2 className="mb-4 text-lg font-semibold">{t('settings.language')}</h2>
      <div className="flex flex-col space-y-2">
        {languages.map((lang) => (
          <label key={lang.code} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="language"
              value={lang.code}
              checked={currentLanguage === lang.code}
              onChange={() => handleLanguageChange(lang.code)}
              className="w-4 h-4 text-blue-600 form-radio"
            />
            <span>{lang.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}; 