import { AiServiceProvider } from '../core/ai-service-provider';
import { OpenAIService } from './openai-service';
import { AnthropicService } from './anthropic-service';
import { FireworksService } from './fireworks-service';
import { ForgeService } from './forge-service';
import { TogetherService } from './together-service';
import { GeminiService } from './gemini-service';
import { OpenRouterService } from './openrouter-service';
import { CustomService } from './custom-service';

/**
 * Factory for creating provider instances
 */
export class ProviderFactory {
  /**
   * Get a provider instance
   */
  public static getNewProvider(providerID: string): AiServiceProvider {

    // Create provider based on name
    switch (providerID) {
      case 'TensorBlock':
        return new ForgeService();
      case 'OpenAI':
        return new OpenAIService();
      case 'Anthropic':
        return new AnthropicService();
      case 'Gemini':
        return new GeminiService();
      case 'Fireworks.ai':
        return new FireworksService();
      case 'Together.ai':
        return new TogetherService();
      case 'OpenRouter':
        return new OpenRouterService();
      default:
        return new CustomService(providerID);
    }
  }
}