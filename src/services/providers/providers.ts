import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createFireworks } from '@ai-sdk/fireworks';
import { createTogetherAI } from '@ai-sdk/togetherai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AiServiceProvider } from '../core/ai-service-provider';
import { OpenAIService } from './openai-service';
import { AnthropicService } from './anthropic-service';
import { SettingsService } from '../settings-service';
import { AIProvider } from '../../components/settings';

/**
 * Factory for creating provider instances
 */
export class ProviderFactory {
  private static providers = new Map<AIProvider, AiServiceProvider>();
  
  /**
   * Get a provider instance
   */
  public static getProvider(name: AIProvider): AiServiceProvider | undefined {
    // Return cached provider if available
    if (this.providers.has(name)) {
      return this.providers.get(name);
    }
    
    let provider: AiServiceProvider | undefined;
    
    // Create provider based on name
    switch (name) {
      case 'OpenAI':
        provider = new OpenAIService();
        break;
      case 'Anthropic':
        provider = new AnthropicService();
        break;
      case 'Gemini':
        // Will be implemented with other providers
        break;
      case 'Fireworks':
        // Will be implemented with other providers
        break;
      case 'Together':
        // Will be implemented with other providers
        break;
      case 'OpenRouter':
        // Will be implemented with other providers
        break;
      case 'Custom':
        // Custom provider will be implemented separately
        break;
    }
    
    // Cache provider if created
    if (provider) {
      this.providers.set(name, provider);
    }
    
    return provider;
  }
  
  /**
   * Create an SDK client instance for a specific provider
   */
  public static createSdkClient(name: ProviderName, model: string) {
    const settingsService = SettingsService.getInstance();
    const settings = settingsService.getProviderSettings(name);
    
    switch (name) {
      case 'OpenAI':
        return createOpenAI({
          apiKey: settings.apiKey,
          baseURL: settings.baseUrl,
          organization: settings.organizationId,
          compatibility: 'strict'
        })(model);
        
      case 'Anthropic':
        return createAnthropic({
          apiKey: settings.apiKey,
          baseURL: settings.baseUrl
        })(model);
        
      case 'Gemini':
        return createGoogleGenerativeAI({
          apiKey: settings.apiKey
        })(model);
        
      case 'Fireworks':
        return createFireworks({
          apiKey: settings.apiKey,
          baseURL: settings.baseUrl || 'https://api.fireworks.ai/inference/v1'
        })(model);
        
      case 'Together':
        return createTogetherAI({
          apiKey: settings.apiKey,
          baseURL: settings.baseUrl || 'https://api.together.xyz/v1'
        })(model);
        
      case 'OpenRouter':
        return createOpenRouter({
          apiKey: settings.apiKey,
          baseURL: settings.baseUrl || 'https://openrouter.ai/api/v1'
        })(model);
        
      default:
        throw new Error(`Provider ${name} is not supported`);
    }
  }
  
  /**
   * Refresh all providers (e.g. after settings change)
   */
  public static refreshProviders(): void {
    // Clear provider cache to force recreation with new settings
    this.providers.clear();
  }
}