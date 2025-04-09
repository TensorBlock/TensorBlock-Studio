/**
 * Application configuration settings
 */

/**
 * APP configuration
 */
export const APP_CONFIG = {  
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