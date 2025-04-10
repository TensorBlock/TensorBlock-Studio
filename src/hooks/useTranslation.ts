import { useTranslation as useReactI18nTranslation } from 'react-i18next';
import { i18nHelper } from '../services/i18n-helper';

/**
 * Custom hook for using translations in React components
 * Extends the react-i18next hook with additional functionality
 */
export const useTranslation = () => {
  // Use the base react-i18next hook
  const reactI18n = useReactI18nTranslation();
  
  return {
    // Spread the original hook properties
    ...reactI18n,
    
    // Additional helper methods
    getCurrentLanguage: i18nHelper.getCurrentLanguage,
    exists: i18nHelper.exists,

    // Method to format dates according to current locale
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => {
      return date.toLocaleDateString(i18nHelper.getCurrentLanguage(), options);
    },
    
    // Method to format numbers according to current locale
    formatNumber: (num: number, options?: Intl.NumberFormatOptions) => {
      return num.toLocaleString(i18nHelper.getCurrentLanguage(), options);
    }
  };
};

export default useTranslation; 