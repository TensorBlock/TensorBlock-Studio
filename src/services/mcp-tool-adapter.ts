import { MCPServerSettings } from "../types/settings";
import { MCPService } from "./mcp-service";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { experimental_createMCPClient as createMCPClient, MCPTransport } from 'ai';
import { StreamControlHandler } from "./streaming-control";

/**
 * Interface for the MCP client
 */
interface MCPClient {
  tools: () => Promise<Record<string, ToolDefinition>>;
  close: () => Promise<void>;
}

/**
 * Interface for tool parameters
 */
interface ToolParameter {
  type: string;
  description?: string;
  properties?: Record<string, ToolParameter>;
  items?: ToolParameter;
  enum?: string[];
  required?: string[];
}

/**
 * Interface for tool definition
 */
interface ToolDefinition {
  description: string;
  parameters: ToolParameter;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Service for adapting MCP servers to AI SDK tools
 */
export class MCPToolAdapter {
  private static instance: MCPToolAdapter;
  private mcpService: MCPService;
  private activeClients: Map<string, MCPClient> = new Map();

  private constructor() {
    this.mcpService = MCPService.getInstance();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): MCPToolAdapter {
    if (!MCPToolAdapter.instance) {
      MCPToolAdapter.instance = new MCPToolAdapter();
    }
    return MCPToolAdapter.instance;
  }

  /**
   * Get tools for a specific MCP server
   */
  public async getToolsForServer(serverId: string, streamController: StreamControlHandler): Promise<Record<string, ToolDefinition>> {
    const server = this.mcpService.getMCPServer(serverId);
    
    if (!server) {
      throw new Error(`MCP server with ID ${serverId} not found`);
    }
    
    // Check if it's the special image generation MCP server
    if (server.isImageGeneration) {
      return this.getImageGenerationTools();
    }
    
    // Create MCP client for the server
    const client = await this.createMCPClient(server);
    
    // Keep track of the client for later closing
    this.activeClients.set(serverId, client);
    
    // Set up clean up when streaming finishes
    streamController.getAbortSignal().addEventListener('abort', () => {
      this.closeClient(serverId);
    });
    
    // Get the tools from the client
    const tools = await client.tools();
    
    return tools;
  }

  /**
   * Create an MCP client for a server
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async createMCPClient(server: MCPServerSettings): Promise<MCPClient> {
    // let transport: MCPTransport;
    
    // if (server.type === 'sse') {
    //   transport = {
    //     type: 'sse' as const,
    //     url: server.url,
    //     headers: server.headers
    //   };
    // } else if (server.type === 'streamableHttp') {
    //   // This would typically use the StreamableHTTPClientTransport
    //   // But we'll use the basic transport for now
    //   transport = {
    //     type: 'sse' as const,
    //     url: server.url,
    //     headers: server.headers
    //   };
    // } else {
    //   throw new Error(`MCP transport type ${server.type} not yet supported`);
    // }
    
    // const client = await createMCPClient({
    //   transport: transport
    // });
    
    return null as unknown as MCPClient;
  }

  /**
   * Close an MCP client
   */
  public async closeClient(serverId: string): Promise<void> {
    const client = this.activeClients.get(serverId);
    
    if (client) {
      await client.close();
      this.activeClients.delete(serverId);
    }
  }

  /**
   * Get tools for the image generation service
   */
  private getImageGenerationTools(): Record<string, ToolDefinition> {
    // Create a simple tool for image generation
    return {
      generate_image: {
        description: 'Generate an image from a text prompt',
        parameters: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The text prompt to generate an image from'
            },
            size: {
              type: 'string',
              enum: ['1:1', '1:2', '3:2', '3:4', '16:9', '9:16'],
              description: 'The aspect ratio of the image to generate, defaults to 1:1'
            },
            style: {
              type: 'string',
              enum: ['vivid', 'natural'],
              description: 'The style of the image, either "vivid" or "natural", defaults to "vivid"'
            }
          },
          required: ['prompt']
        },
        execute: async (params: Record<string, unknown>) => {
          try {
            const images = await this.mcpService.handleImageGeneration(params.prompt as string, params.size as string, params.style as 'vivid' | 'natural');
            
            // Return the first image
            if (images && images.length > 0) {
              return {
                images: images
              };
            }
            
            return {
              error: 'No images generated'
            };
          } catch (error) {
            return {
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      },
      help: {
        description: 'Get help about the image generation service',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: async () => {
          return {
            message: 'This is an image generation service that uses OpenAI\'s DALL-E 3 model. To generate an image, call the generate_image tool with a prompt.'
          };
        }
      }
    };
  }
} 