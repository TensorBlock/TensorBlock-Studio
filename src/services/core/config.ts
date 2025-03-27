/**
 * Application configuration settings
 */

/**
 * API configuration
 */
export const API_CONFIG = {
  /**
   * OpenAI configuration
   */
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    organizationId: import.meta.env.VITE_OPENAI_ORGANIZATION_ID,
    baseUrl: 'https://api.openai.com/v1',
    defaultTimeout: 60000,
  },
  
  /**
   * Anthropic configuration
   */
  anthropic: {
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    baseUrl: 'https://api.anthropic.com',
    apiVersion: '2023-06-01',
    defaultTimeout: 60000,
  },
  
  /**
   * Google Gemini configuration
   */
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiVersion: 'v1beta',
    defaultTimeout: 60000,
  },
  
  /**
   * Fireworks.ai configuration
   */
  fireworks: {
    apiKey: import.meta.env.VITE_FIREWORKS_API_KEY,
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    defaultTimeout: 60000,
  },
  
  /**
   * Together.ai configuration
   */
  together: {
    apiKey: import.meta.env.VITE_TOGETHER_API_KEY,
    baseUrl: 'https://api.together.xyz/v1',
    defaultTimeout: 60000,
  },
  
  /**
   * OpenRouter configuration
   */
  openrouter: {
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultTimeout: 60000,
  },
  
  /**
   * Custom provider configuration
   */
  custom: {
    apiKey: import.meta.env.VITE_CUSTOM_API_KEY,
    baseUrl: import.meta.env.VITE_CUSTOM_API_URL || 'https://your-custom-api.com/v1',
    apiVersion: import.meta.env.VITE_CUSTOM_API_VERSION,
    defaultTimeout: 60000,
    endpoints: {
      completions: import.meta.env.VITE_CUSTOM_ENDPOINT_COMPLETIONS || '/completions',
      chatCompletions: import.meta.env.VITE_CUSTOM_ENDPOINT_CHAT || '/chat/completions',
      models: import.meta.env.VITE_CUSTOM_ENDPOINT_MODELS || '/models',
    }
  },
  
  /**
   * Default HTTP request configuration
   */
  http: {
    defaultTimeout: 30000,
    retries: {
      max: 3,
      initialDelayMs: 1000,
      backoffFactor: 2,
      maxDelayMs: 10000,
    }
  }
};

/**
 * Feature flags configuration
 */
export const FEATURES = {
  enableImageGeneration: true,
  enableAdvancedOptions: true,
  debugMode: import.meta.env.DEV,
};

/**
 * Get API key with validation
 * @param key API key to validate
 * @returns Validated key or undefined if invalid
 */
export function getValidatedApiKey(key?: string): string | undefined {
  if (!key) return undefined;
  
  const trimmedKey = key.trim();
  return trimmedKey.length > 0 ? trimmedKey : undefined;
} 