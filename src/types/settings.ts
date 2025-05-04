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
  // Image generation settings
  imageGenerationEnabled?: boolean;
  imageGenerationProvider?: string;
  imageGenerationModel?: string;
  // General settings
  startWithSystem?: boolean;
  startupToTray?: boolean;
  closeToTray?: boolean;
  proxyMode?: 'system' | 'custom' | 'none';
  customProxyUrl?: string;
  sendErrorReports?: boolean;
  mcpServers?: Record<string, MCPServerSettings>;
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

/**
 * Base MCP Server settings interface
 */
export interface MCPServerSettings {
  id: string;
  name: string;
  type: 'sse' | 'stdio' | 'streamableHttp';
  description?: string;
  isDefault?: boolean;
  isImageGeneration?: boolean;
  
  // Common fields
  url?: string;   // Used by sse and streamableHttp
  headers?: Record<string, string>;  // Used by sse and streamableHttp
  
  // Stdio specific fields
  command?: string;  // Used by stdio
  args?: string[];   // Used by stdio
  env?: Record<string, string>;  // Used by stdio
  
  // Timeout (in seconds)
  timeout?: number;  // Used by all types
}
