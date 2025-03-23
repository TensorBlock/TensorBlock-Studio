/**
 * User settings interface
 */
export interface UserSettings {
  apiKey: string;
  selectedModel: string;
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: UserSettings = {
  apiKey: '',
  selectedModel: 'gpt-3.5-turbo',
};

/**
 * Storage key for settings
 */
const SETTINGS_STORAGE_KEY = 'tensorblock_settings';

/**
 * Custom event name for settings changes
 */
export const SETTINGS_CHANGE_EVENT = 'tensorblock_settings_change';

/**
 * Service for managing user settings
 */
export class SettingsService {
  private static instance: SettingsService;
  private settings: UserSettings;

  private constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  /**
   * Load settings from storage
   */
  private loadSettings(): UserSettings {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        return JSON.parse(storedSettings);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Save settings to storage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      
      // Dispatch custom event for settings change
      window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, {
        detail: { ...this.settings }
      }));
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  }

  /**
   * Get all settings
   */
  public getSettings(): UserSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: Partial<UserSettings>): UserSettings {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    this.saveSettings();
    return { ...this.settings };
  }

  /**
   * Get API key
   */
  public getApiKey(): string {
    return this.settings.apiKey;
  }

  /**
   * Update API key
   */
  public setApiKey(apiKey: string): void {
    this.settings.apiKey = apiKey;
    this.saveSettings();
  }

  /**
   * Get selected model
   */
  public getSelectedModel(): string {
    return this.settings.selectedModel;
  }

  /**
   * Update selected model
   */
  public setSelectedModel(model: string): void {
    this.settings.selectedModel = model;
    this.saveSettings();
  }

  /**
   * Clear all settings
   */
  public resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }
} 