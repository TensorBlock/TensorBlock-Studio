import { useState, useCallback, useRef, useEffect } from 'react';
import { AiServiceManager } from '../services/ai-service-manager';
import { ChatMessage, CompletionOptions } from '../services/core/ai-service-provider';
import { SettingsService, SETTINGS_CHANGE_EVENT } from '../services/settings-service';

/**
 * Status of an AI request
 */
export type AIRequestStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * State interface for AI operations
 */
interface AIState {
  status: AIRequestStatus;
  error: Error | null;
}

/**
 * Custom hook for interacting with AI services
 */
export function useAI() {
  const [state, setState] = useState<AIState>({
    status: 'idle',
    error: null
  });
  
  // Use useRef to keep the service manager instance stable across renders
  const serviceManagerRef = useRef(AiServiceManager.getInstance());
  
  // Set API key from settings
  useEffect(() => {
    // Configure AI services with settings
    const configureApiKey = () => {
      const settingsService = SettingsService.getInstance();
      const apiKey = settingsService.getApiKey();
      
      if (apiKey) {
        // We need to reinitialize the OpenAI service with the new API key
        serviceManagerRef.current.configureService('OpenAI', {
          apiKey
        });
      }
    };
    
    // Configure initially
    configureApiKey();
    
    // Setup event listener for settings changes
    const handleSettingsChange = () => {
      configureApiKey();
    };
    
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    return () => window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
  }, []);

  /**
   * Start a new AI request
   */
  const startRequest = useCallback(() => {
    setState({
      status: 'loading',
      error: null
    });
  }, []);

  /**
   * Handle request success
   */
  const handleSuccess = useCallback(() => {
    setState({
      status: 'success',
      error: null
    });
  }, []);

  /**
   * Handle request error
   */
  const handleError = useCallback((error: Error) => {
    console.error('AI request error:', error);
    setState({
      status: 'error',
      error
    });
  }, []);

  /**
   * Get a text completion from the AI
   */
  const getCompletion = useCallback(async (
    prompt: string, 
    options?: Partial<CompletionOptions>
  ): Promise<string | null> => {
    startRequest();
    
    try {
      const provider = serviceManagerRef.current.getTextCompletionProvider();
      
      if (!provider) {
        throw new Error('No text completion provider available');
      }
      
      const result = await provider.getCompletion(prompt, {
        model: options?.model || provider.availableModels[0],
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
        topP: options?.topP,
        frequencyPenalty: options?.frequencyPenalty,
        presencePenalty: options?.presencePenalty,
        stop: options?.stop,
        user: options?.user,
      });
      
      handleSuccess();
      return result;
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error during completion');
      handleError(error);
      return null;
    }
  }, [startRequest, handleSuccess, handleError]);

  /**
   * Get a chat completion from the AI
   */
  const getChatCompletion = useCallback(async (
    messages: ChatMessage[], 
    options?: Partial<CompletionOptions>
  ): Promise<ChatMessage | null> => {
    startRequest();
    
    try {
      const provider = serviceManagerRef.current.getChatCompletionProvider();
      
      if (!provider) {
        throw new Error('No chat completion provider available');
      }
      
      const result = await provider.getChatCompletion(messages, {
        model: options?.model || provider.availableModels[0],
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
        topP: options?.topP,
        frequencyPenalty: options?.frequencyPenalty,
        presencePenalty: options?.presencePenalty,
        stop: options?.stop,
        user: options?.user,
      });
      
      handleSuccess();
      return result;
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error during chat completion');
      handleError(error);
      return null;
    }
  }, [startRequest, handleSuccess, handleError]);

  /**
   * Generate an image from the AI
   */
  const generateImage = useCallback(async (
    prompt: string,
    options?: {
      size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
      style?: 'vivid' | 'natural';
      quality?: 'standard' | 'hd';
    }
  ): Promise<string[] | null> => {
    startRequest();
    
    try {
      const openai = serviceManagerRef.current.getOpenAI();
      
      if (!openai) {
        throw new Error('OpenAI provider not available');
      }
      
      const images = await openai.generateImage(prompt, {
        size: options?.size,
        style: options?.style,
        quality: options?.quality,
      });
      
      handleSuccess();
      return images;
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error during image generation');
      handleError(error);
      return null;
    }
  }, [startRequest, handleSuccess, handleError]);

  return {
    status: state.status,
    error: state.error,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    getCompletion,
    getChatCompletion,
    generateImage,
    // Expose the service manager for advanced usage
    serviceManager: serviceManagerRef.current,
  };
} 