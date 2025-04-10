import i18n from 'i18next';

/**
 * Helper functions for internationalization
 */
export const i18nHelper = {
  /**
   * Translates a key
   * @param key The translation key to use
   * @param options Additional options for the translation
   * @returns The translated string
   */
  t: (key: string, options?: object): string => {
    return i18n.t(key, { ...options, defaultValue: key });
  },

  /**
   * Changes the current language
   * @param lang The language code to change to
   */
  changeLanguage: (lang: string): void => {
    i18n.changeLanguage(lang);
  },

  /**
   * Gets the current language
   * @returns The current language code
   */
  getCurrentLanguage: (): string => {
    return i18n.language;
  },

  /**
   * Check if a key exists in the translations
   * @param key The key to check
   * @returns True if the key exists
   */
  exists: (key: string): boolean => {
    return i18n.exists(key);
  }
};

export default i18nHelper; 