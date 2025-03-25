import { SettingsService } from './settings-service';

// Define the ModelOption interface locally to avoid circular dependencies
export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

interface OpenAIPermission {
  id: string;
  object: string;
  created: number;
  allow_create_engine: boolean;
  allow_sampling: boolean;
  allow_logprobs: boolean;
  allow_search_indices: boolean;
  allow_view: boolean;
  allow_fine_tuning: boolean;
  organization: string;
  group: string | null;
  is_blocking: boolean;
}

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  permission: OpenAIPermission[];
  root: string;
  parent: string | null;
  description?: string;
}

interface OpenAIResponse {
  data: OpenAIModel[];
  object: string;
}

interface ProviderModel {
  id: string;
  name?: string;
  description?: string;
}

interface ProviderResponse {
  data: ProviderModel[];
}

export class ModelCacheService {
  private static instance: ModelCacheService;
  private models: ModelOption[] = [];
  private isLoading: boolean = false;
  private lastFetchTime: Record<string, number> = {};
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds
  private readonly STORAGE_KEY = 'model_cache';
  
  private constructor() {
    this.loadFromStorage();
  }
  
  public static getInstance(): ModelCacheService {
    if (!ModelCacheService.instance) {
      ModelCacheService.instance = new ModelCacheService();
    }
    return ModelCacheService.instance;
  }
  
  private loadFromStorage(): void {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (cached) {
        const { models, lastFetchTime } = JSON.parse(cached);
        this.models = models || [];
        this.lastFetchTime = lastFetchTime || {};
      }
    } catch (error) {
      console.error('Error loading models from storage:', error);
    }
  }
  
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        models: this.models,
        lastFetchTime: this.lastFetchTime
      }));
    } catch (error) {
      console.error('Error saving models to storage:', error);
    }
  }
  
  public async getAllModels(): Promise<ModelOption[]> {
    // Start a refresh if the cache is empty or stale
    if (this.models.length === 0) {
      this.refreshModels();
    } else {
      // Check if any provider needs refreshing and do it in the background
      const settingsService = SettingsService.getInstance();
      const settings = settingsService.getSettings();
      
      Object.keys(settings.providers).forEach(provider => {
        if (settings.providers[provider]?.apiKey && this.shouldRefreshProvider(provider)) {
          this.refreshModelsForProvider(provider);
        }
      });
    }
    
    return this.models;
  }
  
  private shouldRefreshProvider(provider: string): boolean {
    const lastFetch = this.lastFetchTime[provider] || 0;
    return Date.now() - lastFetch > this.CACHE_TTL;
  }
  
  public async refreshModels(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      const settingsService = SettingsService.getInstance();
      const settings = settingsService.getSettings();
      
      const providers = Object.keys(settings.providers).filter(
        provider => settings.providers[provider]?.apiKey
      );
      
      // Refresh models for all providers with API keys
      await Promise.all(providers.map(provider => this.refreshModelsForProvider(provider)));
      
    } catch (error) {
      console.error('Error refreshing models:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  private async refreshModelsForProvider(provider: string): Promise<void> {
    try {
      const settingsService = SettingsService.getInstance();
      const providerSettings = settingsService.getProviderSettings(provider);
      
      if (!providerSettings.apiKey) {
        return;
      }
      
      // Remove existing models for this provider
      this.models = this.models.filter(model => model.provider !== provider);
      
      // Fetch models based on provider type
      let newModels: ModelOption[] = [];
      
      switch (provider) {
        case 'OpenAI':
          newModels = await this.fetchOpenAIModels(providerSettings.apiKey, providerSettings.organizationId);
          break;
        case 'Anthropic':
          newModels = await this.fetchAnthropicModels();
          break;
        case 'Gemini':
          newModels = await this.fetchGeminiModels();
          break;
        case 'Together':
          newModels = await this.fetchTogetherModels(providerSettings.apiKey);
          break;
        case 'Fireworks':
          newModels = await this.fetchFireworksModels(providerSettings.apiKey);
          break;
        case 'OpenRouter':
          newModels = await this.fetchOpenRouterModels(providerSettings.apiKey);
          break;
        case 'Custom':
          // Custom provider will use whatever models were defined in settings
          if (providerSettings.models) {
            newModels = providerSettings.models.map(modelId => ({
              id: modelId,
              name: modelId.split('/').pop() || modelId,
              provider: 'Custom'
            }));
          }
          break;
      }
      
      // Add new models to the cache
      this.models = [...this.models, ...newModels];
      
      // Update last fetch time
      this.lastFetchTime[provider] = Date.now();
      
      // Save to storage
      this.saveToStorage();
      
    } catch (error) {
      console.error(`Error refreshing models for provider ${provider}:`, error);
    }
  }
  
  // Provider-specific model fetching methods
  
  private async fetchOpenAIModels(apiKey: string, orgId?: string): Promise<ModelOption[]> {
    try {
      const headers: HeadersInit = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      if (orgId) {
        headers['OpenAI-Organization'] = orgId;
      }
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const data = await response.json() as OpenAIResponse;
      
      // Filter to only include chat models
      const chatModels = data.data
        .filter((model) => 
          model.id.includes('gpt') || 
          model.id.includes('text-davinci') ||
          model.id.includes('claude')
        )
        .map((model) => ({
          id: model.id,
          name: model.id,
          provider: 'OpenAI',
          description: model.description
        }));
        
      return chatModels;
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      return [];
    }
  }
  
  private async fetchAnthropicModels(): Promise<ModelOption[]> {
    // Anthropic doesn't have a models endpoint at the time of writing
    // So we'll use a predefined list
    return [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        description: 'Most powerful Claude model for highly complex tasks'
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        description: 'Ideal balance of intelligence and speed'
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'Anthropic',
        description: 'Fastest, most compact Claude model'
      },
      {
        id: 'claude-2.1',
        name: 'Claude 2.1',
        provider: 'Anthropic',
        description: 'Previous generation Claude model'
      },
      {
        id: 'claude-2.0',
        name: 'Claude 2.0',
        provider: 'Anthropic',
        description: 'Previous generation Claude model'
      },
      {
        id: 'claude-instant-1.2',
        name: 'Claude Instant 1.2',
        provider: 'Anthropic',
        description: 'Faster, but less capable legacy model'
      }
    ];
  }
  
  private async fetchGeminiModels(): Promise<ModelOption[]> {
    // Gemini has a fixed set of models for now
    return [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'Gemini',
        description: 'Best for text generation tasks across many use cases'
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        provider: 'Gemini',
        description: 'Best for multimodal tasks (text and vision)'
      },
      {
        id: 'gemini-ultra',
        name: 'Gemini Ultra',
        provider: 'Gemini',
        description: 'Most capable Gemini model'
      }
    ];
  }
  
  private async fetchTogetherModels(apiKey: string): Promise<ModelOption[]> {
    try {
      const response = await fetch('https://api.together.xyz/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Together API error: ${response.status}`);
      }
      
      const data = await response.json() as ProviderResponse;
      
      return data.data.map((model) => ({
        id: model.id,
        name: model.name || model.id,
        provider: 'Together',
        description: model.description
      }));
    } catch (error) {
      console.error('Error fetching Together models:', error);
      return [];
    }
  }
  
  private async fetchFireworksModels(apiKey: string): Promise<ModelOption[]> {
    try {
      const response = await fetch('https://api.fireworks.ai/inference/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Fireworks API error: ${response.status}`);
      }
      
      const data = await response.json() as ProviderResponse;
      
      return data.data.map((model) => ({
        id: model.id,
        name: model.name || model.id,
        provider: 'Fireworks',
        description: model.description
      }));
    } catch (error) {
      console.error('Error fetching Fireworks models:', error);
      return [];
    }
  }
  
  private async fetchOpenRouterModels(apiKey: string): Promise<ModelOption[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.href,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }
      
      const data = await response.json() as ProviderResponse;
      
      return data.data.map((model) => ({
        id: model.id,
        name: model.name || model.id,
        provider: 'OpenRouter',
        description: model.description
      }));
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return [];
    }
  }
  
  public clearCache(): void {
    this.models = [];
    this.lastFetchTime = {};
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  public isModelFetchingInProgress(): boolean {
    return this.isLoading;
  }
} 