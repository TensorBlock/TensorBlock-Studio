/**
 * Provider-specific settings interface
 */
export interface ProviderSettings {
  apiKey: string;
  organizationId?: string;
  apiVersion?: string;
  baseUrl?: string;
  // Custom provider endpoints
  completionsEndpoint?: string;
  chatCompletionsEndpoint?: string;
  modelsEndpoint?: string;
  // Models and capabilities
  models?: string[];
  capabilities?: string[];
  // Add more provider-specific settings as needed
}

/**
 * User settings interface
 */
export interface UserSettings {
  providers: {
    [key: string]: ProviderSettings;
  };
  selectedProvider: string;
  selectedModel: string;
  useStreaming: boolean;
  webSearchEnabled: boolean;
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: UserSettings = {
  providers: {
    OpenAI: {
      apiKey: '',
      organizationId: '',
    },
    Anthropic: {
      apiKey: '',
      apiVersion: '2023-06-01',
    },
    Gemini: {
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com',
      apiVersion: 'v1',
    },
    Fireworks: {
      apiKey: '',
      baseUrl: 'https://api.fireworks.ai/inference/v1',
    },
    Together: {
      apiKey: '',
      baseUrl: 'https://api.together.xyz/v1',
    },
    OpenRouter: {
      apiKey: '',
      baseUrl: 'https://openrouter.ai/api/v1',
    },
    Custom: {
      apiKey: '',
      baseUrl: '',
      completionsEndpoint: '/completions',
      chatCompletionsEndpoint: '/chat/completions',
      modelsEndpoint: '/models',
      models: ['default-model'],
      capabilities: ['TextCompletion', 'ChatCompletion']
    }
  },
  selectedProvider: 'OpenAI',
  selectedModel: 'gpt-3.5-turbo',
  useStreaming: true,
  webSearchEnabled: true,
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
        const parsedSettings = JSON.parse(storedSettings);
        
        // Handle migration from old settings format
        if (!parsedSettings.providers && parsedSettings.apiKey) {
          return {
            providers: {
              OpenAI: {
                apiKey: parsedSettings.apiKey || '',
                organizationId: '',
              },
              Anthropic: {
                apiKey: '',
                apiVersion: '2023-06-01',
              }
            },
            selectedProvider: parsedSettings.selectedProvider || DEFAULT_SETTINGS.selectedProvider,
            selectedModel: parsedSettings.selectedModel || DEFAULT_SETTINGS.selectedModel,
            useStreaming: parsedSettings.useStreaming !== undefined ? parsedSettings.useStreaming : DEFAULT_SETTINGS.useStreaming,
            webSearchEnabled: parsedSettings.webSearchEnabled !== undefined ? parsedSettings.webSearchEnabled : DEFAULT_SETTINGS.webSearchEnabled,
          };
        }
        
        return {
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
        };
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
   * Get API key for the specified provider or the currently selected provider
   */
  public getApiKey(provider?: string): string {
    const providerKey = provider || this.settings.selectedProvider;
    return this.settings.providers[providerKey]?.apiKey || '';
  }

  /**
   * Update API key for a specific provider
   */
  public setApiKey(apiKey: string, provider?: string): void {
    const providerKey = provider || this.settings.selectedProvider;
    
    if (!this.settings.providers[providerKey]) {
      this.settings.providers[providerKey] = { apiKey };
    } else {
      this.settings.providers[providerKey].apiKey = apiKey;
    }
    
    this.saveSettings();
  }

  /**
   * Get whether web search is enabled
   */
  public getWebSearchEnabled(): boolean {
    return this.settings.webSearchEnabled;
  }

  /**
   * Set whether web search is enabled
   */
  public setWebSearchEnabled(webSearchEnabled: boolean): void {
    this.settings.webSearchEnabled = webSearchEnabled;
    this.saveSettings();
  }

  /**
   * Get provider-specific settings
   */
  public getProviderSettings(provider?: string): ProviderSettings {
    const providerKey = provider || this.settings.selectedProvider;
    return this.settings.providers[providerKey] || { apiKey: '' };
  }

  /**
   * Update provider-specific settings
   */
  public updateProviderSettings(settings: Partial<ProviderSettings>, provider?: string): void {
    const providerKey = provider || this.settings.selectedProvider;
    
    if (!this.settings.providers[providerKey]) {
      this.settings.providers[providerKey] = {
        apiKey: '',
        ...settings
      };
    } else {
      this.settings.providers[providerKey] = {
        ...this.settings.providers[providerKey],
        ...settings
      };
    }
    
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
   * Get selected provider
   */
  public getSelectedProvider(): string {
    return this.settings.selectedProvider;
  }

  /**
   * Set selected provider
   */
  public setSelectedProvider(provider: string): void {
    this.settings.selectedProvider = provider;
    this.saveSettings();
  }

  /**
   * Reset all settings to defaults
   */
  public resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }

  /**
   * Get whether streaming is enabled
   */
  public getUseStreaming(): boolean {
    return this.settings.useStreaming;
  }

  /**
   * Set whether streaming is enabled
   */
  public setUseStreaming(useStreaming: boolean): void {
    this.settings.useStreaming = useStreaming;
    this.saveSettings();
  }
} 