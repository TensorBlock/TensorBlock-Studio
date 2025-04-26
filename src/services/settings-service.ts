import { AIServiceCapability } from "../types/capabilities";
import { UserSettings, ProviderSettings, ModelSettings } from "../types/settings";
import { DatabaseService } from "./database";
import { v4 as uuidv4 } from 'uuid';


/**
 * Default settings
 */
const DEFAULT_SETTINGS: UserSettings = {
  providers: {
    // ['TensorBlock']: {
    //   providerId: 'TensorBlock',
    //   providerName: 'TensorBlock',
    //   apiKey: '',
    //   baseUrl: 'http://54.177.123.202:8000/v1',
    //   customProvider: false,
    //   models:[
    //     {
    //       modelName: 'GPT-4o',
    //       modelId: 'gpt-4o',
    //       modelCategory: 'GPT 4',
    //       modelDescription: 'GPT-4o is the latest and most powerful model from OpenAI.',
    //       modelCapabilities: [AIServiceCapability.TextCompletion, AIServiceCapability.WebSearch],
    //       modelRefUUID: uuidv4(),
    //     },
    //   ]
    // },
    ['OpenAI']: {
      providerId: 'OpenAI',
      providerName: 'OpenAI',
      apiKey: '',
      organizationId: '',
      customProvider: false,
      models:[
        {
          modelName: 'GPT-4o',
          modelId: 'gpt-4o',
          modelCategory: 'GPT 4',
          modelDescription: 'GPT-4o is the latest and most powerful model from OpenAI.',
          modelCapabilities: [AIServiceCapability.TextCompletion, AIServiceCapability.WebSearch],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'GPT-4o-mini',
          modelId: 'gpt-4o-mini',
          modelCategory: 'GPT 4',
          modelDescription: 'GPT-4o-mini is the latest and most powerful model from OpenAI.',
          modelCapabilities: [AIServiceCapability.TextCompletion, AIServiceCapability.WebSearch],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'GPT-4-turbo',
          modelId: 'gpt-4-turbo',
          modelCategory: 'GPT 4',
          modelDescription: 'GPT-4-turbo is the latest and most powerful model from OpenAI.',
          modelCapabilities: [AIServiceCapability.TextCompletion, AIServiceCapability.WebSearch],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'GPT-3.5-turbo',
          modelId: 'gpt-3.5-turbo',
          modelCategory: 'GPT 3.5',
          modelDescription: 'GPT-3.5-turbo is the latest and most powerful model from OpenAI.',
          modelCapabilities: [AIServiceCapability.TextCompletion, AIServiceCapability.WebSearch],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'DALL-E 3',
          modelId: 'dall-e-3',
          modelCategory: 'Image Generation',
          modelDescription: 'DALL-E 3 is OpenAI\'s advanced image generation model.',
          modelCapabilities: [AIServiceCapability.ImageGeneration],
          modelRefUUID: uuidv4(),
        },
      ]
    },
    ['Anthropic']: {
      providerId: 'Anthropic',
      providerName: 'Anthropic',
      apiKey: '',
      apiVersion: '2023-06-01',
      customProvider: false,
      models:[
        {
          modelName: 'Claude-3-5-sonnet-20241022',
          modelId: 'claude-3-5-sonnet-20241022',
          modelCategory: 'Claude 3.5',
          modelDescription: 'Claude-3-5-sonnet-20241022 is the latest and most powerful model from Anthropic.',
          modelCapabilities: [AIServiceCapability.TextCompletion, AIServiceCapability.WebSearch],
          modelRefUUID: uuidv4(),
        },
      ]
    },
    ['Gemini']: {
      providerId: 'Gemini',
      providerName: 'Gemini',
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com',
      apiVersion: 'v1',
      customProvider: false,
      models:[
        {
          modelName: 'Gemini-1.5-flash-latest',
          modelId: 'gemini-1.5-flash-latest',
          modelCategory: 'Gemini 1.5',
          modelDescription: 'Gemini-1.5-flash-latest is the latest and most powerful model from Gemini.',
          modelCapabilities: [AIServiceCapability.TextCompletion, AIServiceCapability.WebSearch],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'Gemini-1.5-pro-latest',
          modelId: 'gemini-1.5-pro-latest',
          modelCategory: 'Gemini 1.5',
          modelDescription: 'Gemini-1.5-pro-latest is the latest and most powerful model from Gemini.',
          modelCapabilities: [AIServiceCapability.TextCompletion, AIServiceCapability.WebSearch],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'Gemini-2.0-flash-001',
          modelId: 'gemini-2.0-flash-001',
          modelCategory: 'Gemini 2.0',
          modelDescription: 'Gemini-2.0-flash-001 is the latest and most powerful model from Gemini.',
          modelCapabilities: [AIServiceCapability.TextCompletion, AIServiceCapability.WebSearch],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'Gemini-2.5-pro-exp-03-25',
          modelId: 'gemini-2.5-pro-exp-03-25',
          modelCategory: 'Gemini 2.5',
          modelDescription: 'Gemini-2.5-pro-exp-03-25 is the latest and most powerful model from Gemini.',
          modelCapabilities: [AIServiceCapability.TextCompletion, AIServiceCapability.WebSearch],
          modelRefUUID: uuidv4(),
        },
      ]
    },
    ['Fireworks.ai']: {
      providerId: 'Fireworks.ai',
      providerName: 'Fireworks',
      apiKey: '',
      baseUrl: 'https://api.fireworks.ai/inference/v1',
      customProvider: false,
      models:[
        {
          modelName: 'DeepSeek-R1',
          modelId: 'accounts/fireworks/models/deepseek-r1',
          modelCategory: 'DeepSeek',
          modelDescription: 'DeepSeek-R1 is the latest and most powerful model from Fireworks.',
          modelCapabilities: [AIServiceCapability.TextCompletion],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'DeepSeek-V3',
          modelId: 'accounts/fireworks/models/deepseek-v3',
          modelCategory: 'DeepSeek',
          modelDescription: 'DeepSeek-V3 is the latest and most powerful model from Fireworks.',
          modelCapabilities: [AIServiceCapability.TextCompletion],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'Qwen2P5-Coder-32B-Instruct',
          modelId: 'accounts/fireworks/models/qwen2p5-coder-32b-instruct',
          modelCategory: 'Qwen',
          modelDescription: 'Qwen2P5-Coder-32B-Instruct is the latest and most powerful model from Fireworks.',
          modelCapabilities: [AIServiceCapability.TextCompletion],
          modelRefUUID: uuidv4(),
        },
      ]
    },
    ['Together.ai']: {
      providerId: 'Together.ai',
      providerName: 'Together',
      apiKey: '',
      baseUrl: 'https://api.together.xyz/v1',
      customProvider: false,
      models:[
        {
          modelName: 'Llama-3.1-70B-Instruct-Turbo',
          modelId: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
          modelCategory: 'Llama 3.1',
          modelDescription: 'Llama-3.1-70B-Instruct-Turbo is the latest and most powerful model from Together.',
          modelCapabilities: [AIServiceCapability.TextCompletion],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'Llama-3.1-8B-Instruct-Turbo',
          modelId: 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
          modelCategory: 'Llama 3.1',
          modelDescription: 'Llama-3.1-8B-Instruct-Turbo is the latest and most powerful model from Together.',
          modelCapabilities: [AIServiceCapability.TextCompletion],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'DeepSeek-V3',
          modelId: 'deepseek-ai/DeepSeek-V3',
          modelCategory: 'DeepSeek',
          modelDescription: 'DeepSeek-V3 is the latest and most powerful model from Together.',
          modelCapabilities: [AIServiceCapability.TextCompletion],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'Qwen2.5-72B-Instruct-Turbo',
          modelId: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
          modelCategory: 'Qwen',
          modelDescription: 'Qwen2.5-72B-Instruct-Turbo is the latest and most powerful model from Together.',
          modelCapabilities: [AIServiceCapability.TextCompletion],
          modelRefUUID: uuidv4(),
        },
      ]
    },
    ['OpenRouter']: {
      providerId: 'OpenRouter',
      providerName: 'OpenRouter',
      apiKey: '',
      baseUrl: 'https://openrouter.ai/api/v1',
      customProvider: false,
      models:[
        {
          modelName: 'DeepSeek-V3',
          modelId: 'deepseek/deepseek-v3-base:free',
          modelCategory: 'DeepSeek',
          modelDescription: 'DeepSeek-V3 is the latest and most powerful model from OpenRouter.',
          modelCapabilities: [AIServiceCapability.TextCompletion],
          modelRefUUID: uuidv4(),
        },
        {
          modelName: 'Qwen2.5-VL-3B-Instruct',
          modelId: 'qwen/qwen2.5-vl-3b-instruct:free',
          modelCategory: 'Qwen',
          modelDescription: 'Qwen2.5-VL-3B-Instruct is the latest and most powerful model from OpenRouter.',
          modelCapabilities: [AIServiceCapability.TextCompletion],
          modelRefUUID: uuidv4(),
        },
      ]
    }
  },
  selectedProvider: '',
  selectedModel: '',
  useStreaming: true,
  webSearchEnabled: false,
  enableWebSearch_Preview: false,
};

/**
 * Custom event name for settings changes
 */
export const SETTINGS_CHANGE_EVENT = 'tensorblock_settings_change';

/**
 * Service for managing user settings
 */
export class SettingsService {
  public isInitialized: boolean = false;
  private static instance: SettingsService;
  private settings: UserSettings;
  private dbService: DatabaseService;

  private constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.dbService = new DatabaseService();
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
   * Initialize the service and load settings
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize database
      await this.dbService.initialize();
      
      // Load settings
      await this.loadSettings();
      
      this.addAllDefaultProviders();

      this.addDefaultModels();

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing settings service:', error);
      // Fall back to default settings
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  private addAllDefaultProviders() {
    for(const provider in DEFAULT_SETTINGS.providers) {
      if(!this.settings.providers[provider]) {
        this.settings.providers[provider] = {
          ...DEFAULT_SETTINGS.providers[provider],
        };
      }
    }
  }

  private addDefaultModels() {
    for(const provider in this.settings.providers) {
      if(!this.settings.providers[provider].models) {
        this.settings.providers[provider].models = DEFAULT_SETTINGS.providers[provider].models;
      }

      if(provider === 'OpenAI') {

        this.settings.providers[provider].models!.push({
          modelName: 'DALL-E 3',
          modelId: 'dall-e-3',
          modelCategory: 'Image Generation',
          modelDescription: 'DALL-E 3 is OpenAI\'s advanced image generation model.',
          modelCapabilities: [AIServiceCapability.ImageGeneration],
          modelRefUUID: uuidv4(),
        });
      }
    }
  }

  /**
   * Load settings from database
   */
  private async loadSettings(): Promise<void> {
    try {
      // First try to get settings from database
      const dbSettings = await this.dbService.getSettings();
      
      if (dbSettings) {
        this.settings = {
          ...DEFAULT_SETTINGS,
          ...dbSettings
        };
        return;
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save settings to database
   */
  public async saveSettings(): Promise<void> {
    try {
      await this.dbService.saveSettings(this.settings);
      
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
  public async updateSettings(newSettings: Partial<UserSettings>): Promise<UserSettings> {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    await this.saveSettings();
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
   * Get models for the specified provider or the currently selected provider
   */
  public getModels(provider?: string): ModelSettings[] {
    const providerKey = provider || this.settings.selectedProvider;
    return this.settings.providers[providerKey]?.models || [];
  }

  /**
   * Set API key for a specific provider
   */
  public async setApiKey(apiKey: string, provider?: string): Promise<void> {
    const providerKey = provider || this.settings.selectedProvider;
    
    if (!this.settings.providers[providerKey]) {
      return;
    } else {
      this.settings.providers[providerKey].apiKey = apiKey;
    }
    
    await this.saveSettings();
  }

  /**
   * Get whether web search is enabled
   */
  public getWebSearchActive(): boolean {
    return this.settings.webSearchEnabled && this.settings.enableWebSearch_Preview;
  }

  /**
   * Get whether web search is enabled
   */
  public getWebSearchPreviewEnabled(): boolean {
    return this.settings.enableWebSearch_Preview;
  }

  /**
   * Set whether web search is enabled
   */
  public async setWebSearchEnabled(webSearchEnabled: boolean): Promise<void> {
    this.settings.webSearchEnabled = webSearchEnabled;
    await this.saveSettings();
  }

  /**
   * Get provider-specific settings
   */
  public getProviderSettings(provider: string): ProviderSettings {
    if(this.settings.providers[provider]) {
      return this.settings.providers[provider];
    } else {
      return {
        ...DEFAULT_SETTINGS.providers[provider],
        providerId: provider,
        providerName: provider,
      };
    }
  }

  /**
   * Update provider-specific settings
   */
  public async updateProviderSettings(newSettings: Partial<ProviderSettings>, providerKey: string): Promise<void> {   
    console.log('Provider settings: ', newSettings);

    if (!this.settings.providers[providerKey]) {
      this.settings.providers[providerKey] = {
        ...newSettings,
        providerId: newSettings.providerId !== undefined ? newSettings.providerId : '',
        providerName: newSettings.providerName !== undefined ? newSettings.providerName : '',
        apiKey: newSettings.apiKey !== undefined ? newSettings.apiKey : '',
        customProvider: newSettings.customProvider !== undefined ? newSettings.customProvider : false,
      };
    } else {
      this.settings.providers[providerKey] = {
        ...newSettings,
        ...this.settings.providers[providerKey],
      };
    }
    
    console.log('Settings: ', this.settings);

    await this.saveSettings();
  }

  public async deleteProvider(providerKey: string): Promise<void> {
    if (!this.settings.providers[providerKey]) return;

    delete this.settings.providers[providerKey];
    
    await this.saveSettings();
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
  public async setSelectedModel(model: string): Promise<void> {
    this.settings.selectedModel = model;
    await this.saveSettings();
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
  public async setSelectedProvider(provider: string): Promise<void> {
    this.settings.selectedProvider = provider;
    await this.saveSettings();
  }

  /**
   * Reset all settings to defaults
   */
  public async resetSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.saveSettings();
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
  public async setUseStreaming(useStreaming: boolean): Promise<void> {
    this.settings.useStreaming = useStreaming;
    await this.saveSettings();
  }
} 