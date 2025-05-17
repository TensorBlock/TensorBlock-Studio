import { MCPServerSettings } from "../types/settings";
import { SettingsService } from "./settings-service";
import { v4 as uuidv4 } from 'uuid';
import { AIService } from "./ai-service";
import { OPENAI_PROVIDER_NAME } from "./providers/openai-service";

/**
 * Service for managing MCP servers
 */
export class MCPService {
  private static instance: MCPService;
  private settingsService: SettingsService;
  private aiService: AIService;

  private constructor() {
    this.settingsService = SettingsService.getInstance();
    this.aiService = AIService.getInstance();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService.instance;
  }

  /**
   * Get all MCP servers
   */
  public getMCPServers(): Record<string, MCPServerSettings> {
    return this.settingsService.getMCPServers();
  }

  /**
   * Get a specific MCP server by ID
   */
  public getMCPServer(id: string): MCPServerSettings | undefined {
    return this.settingsService.getMCPServer(id);
  }

  /**
   * Create a new MCP server
   * @param params - Server parameters depending on the type
   */
  public async createMCPServer(params: {
    name: string;
    type: 'sse' | 'stdio' | 'streamableHttp';
    description?: string;
    url?: string;
    headers?: Record<string, string>;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    timeout?: number;
  }): Promise<MCPServerSettings> {
    const id = uuidv4();
    
    const server: MCPServerSettings = {
      id,
      name: params.name,
      type: params.type,
      description: params.description,
      isDefault: false
    };

    // Add type-specific parameters
    if (params.type === 'sse' || params.type === 'streamableHttp') {
      server.url = params.url;
      server.headers = params.headers;
    } else if (params.type === 'stdio') {
      server.command = params.command;
      server.args = params.args;
      server.env = params.env;
    }

    // Add timeout parameter (common to all types)
    if (params.timeout) {
      server.timeout = params.timeout;
    }
    
    await this.settingsService.addOrUpdateMCPServer(server);
    return server;
  }

  /**
   * Update an MCP server
   */
  public async updateMCPServer(server: MCPServerSettings): Promise<void> {
    await this.settingsService.addOrUpdateMCPServer(server);
  }

  /**
   * Delete an MCP server
   */
  public async deleteMCPServer(id: string): Promise<void> {
    await this.settingsService.deleteMCPServer(id);
  }

  /**
   * Handle image generation with the DALL-E model
   * This is a special handler for the default image generation MCP server
   */
  public async handleImageGeneration(prompt: string, size?: string, style?: 'vivid' | 'natural'): Promise<string[] | Uint8Array<ArrayBufferLike>[]> {
    const openaiService = this.aiService.getProvider(OPENAI_PROVIDER_NAME);
    
    if (!openaiService) {
      throw new Error("OpenAI service not available");
    }
    
    // Map size to OpenAI dimensions
    const sizeMap: Record<string, `${number}x${number}`> = {
      "1:1": "1024x1024",
      "1:2": "512x1024",
      "3:2": "1024x768",
      "3:4": "768x1024",
      "16:9": "1792x1024",
      "9:16": "1024x1792"
    };
    
    // Generate the image
    const images = await openaiService.getImageGeneration(prompt, {
      size: sizeMap[size || '1:1'] || "1024x1024",
      style: style || "vivid"
    });
    
    return images;
  }
} 