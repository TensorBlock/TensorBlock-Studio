import { AiServiceProvider } from '../core/ai-service-provider';
import { OpenAIService } from './openai-service';
import { AnthropicService } from './anthropic-service';
import { FireworksService } from './fireworks-service';
import { ForgeService } from './forge-service';
import { AIProvider } from '../../types/ai-providers';
import { TogetherService } from './together-service';
import { GeminiService } from './gemini-service';
import { OpenRouterService } from './openrouter-service';

/**
 * Factory for creating provider instances
 */
export class ProviderFactory {
  /**
   * Get a provider instance
   */
  public static getNewProvider(name: AIProvider): AiServiceProvider | undefined {

    let provider: AiServiceProvider | undefined;
    
    // Create provider based on name
    switch (name) {
      case 'TensorBlock':
        provider = new ForgeService();
        break;
      case 'OpenAI':
        provider = new OpenAIService();
        break;
      case 'Anthropic':
        provider = new AnthropicService();
        break;
      case 'Gemini':
        provider = new GeminiService();
        break;
      case 'Fireworks.ai':
        provider = new FireworksService();
        break;
      case 'Together.ai':
        provider = new TogetherService();
        break;
      case 'OpenRouter':
        provider = new OpenRouterService();
        break;
      case 'Custom':
        // Custom provider will be implemented separately
        break;
    }
    
    return provider;
  }
}