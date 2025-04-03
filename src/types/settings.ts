import { AIServiceCapability } from "./capabilities";

/**
 * Provider-specific settings interface
 */
export interface ProviderSettings {
    providerName: string;
    apiKey: string;
    organizationId?: string;
    apiVersion?: string;
    baseUrl?: string;
    // Custom provider endpoints
    chatCompletionsEndpoint?: string;
    modelsEndpoint?: string;
    // Models and capabilities
    models?: ModelSettings[];
    // Add more provider-specific settings as needed
  }
  
/**
 * User settings interface
 */
export interface UserSettings {
    providers: {
        [key: string]: ProviderSettings;
    };
    selectedProvider: string;
    selectedModel: string;
    useStreaming: boolean;
    webSearchEnabled: boolean;
}

export interface ModelSettings {
    modelId: string;
    modelName: string;
    modelDescription: string;
    modelCapabilities: AIServiceCapability[];

}
