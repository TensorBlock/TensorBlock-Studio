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