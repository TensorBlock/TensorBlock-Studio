import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations directly
import enTranslation from '../locales/en/translation.json';
import zhCNTranslation from '../locales/zh-CN/translation.json';
import zhTWTranslation from '../locales/zh-TW/translation.json';
import jaTranslation from '../locales/ja/translation.json';
import koTranslation from '../locales/ko/translation.json';
import esTranslation from '../locales/es/translation.json';

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
        zh_CN: {
          translation: zhCNTranslation
        },
        zh_TW: {
          translation: zhTWTranslation
        },
        ja: {
          translation: jaTranslation
        },
        ko: {
          translation: koTranslation
        },
        es: {
          translation: esTranslation
        }
      }
    });
  
  return i18n;
};

export default initI18n; 