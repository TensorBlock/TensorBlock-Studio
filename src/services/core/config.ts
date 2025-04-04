/**
 * Application configuration settings
 */

/**
 * API configuration
 */
export const API_CONFIG = { 
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