import { AIServiceCapability } from './capabilities';

/**
 * User settings interface
 */
export interface UserSettings {
  providers: Record<string, ProviderSettings>;
  selectedProvider: string;
  selectedModel: string;
  useStreaming: boolean;
  webSearchEnabled: boolean;
  enableWebSearch_Preview: boolean;
  // General settings
  startWithSystem?: boolean;
  startupToTray?: boolean;
  closeToTray?: boolean;
  proxyMode?: 'system' | 'custom' | 'none';
  customProxyUrl?: string;
  sendErrorReports?: boolean;
}

/**
 * Provider-specific settings interface
 */
export interface ProviderSettings {
  providerId: string;
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
  customProvider: boolean;
}

export interface ModelSettings {
  modelRefUUID: string;
  modelId: string;
  modelName: string;
  modelCategory: string;
  modelDescription: string;
  modelCapabilities: AIServiceCapability[];
}
