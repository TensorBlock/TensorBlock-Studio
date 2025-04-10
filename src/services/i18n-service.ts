import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations directly
import enTranslation from '../public/locales/en/translation.json';
import zhTranslation from '../public/locales/zh/translation.json';

// Initialize i18n
const initI18n = () => {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      resources: {
        en: {
          translation: enTranslation
        },
        zh: {
          translation: zhTranslation
        }
      }
    });
  
  return i18n;
};

export default initI18n; 