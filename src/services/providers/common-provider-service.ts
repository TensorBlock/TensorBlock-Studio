import { generateText, streamText, Provider, type LanguageModelUsage, type ToolSet } from 'ai';
import { Message, MessageRole } from '../../types/chat';
import { AiServiceProvider, CompletionOptions } from '../core/ai-service-provider';
import { SettingsService } from '../settings-service';
import { StreamControlHandler } from '../streaming-control';
import { v4 as uuidv4 } from 'uuid';
import { MessageHelper } from '../message-helper';
import { AIServiceCapability, mapModelCapabilities } from '../../types/capabilities';
import { ModelSettings } from '../../types/settings';
import { LanguageModelV1, ToolChoice } from 'ai';

// Define an interface for tool results to fix the 'never' type errors
interface ToolResult {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

// Define type for the execute function for tools
type ToolExecuteFunction = (args: Record<string, unknown>) => Promise<unknown>;

// Define interface for tools with execute function
interface ToolWithExecute {
  execute: ToolExecuteFunction;
  [key: string]: unknown;
}

/**
 * Implementation of OpenAI service provider using the AI SDK
 */
export class CommonProviderHelper implements AiServiceProvider {
  private settingsService: SettingsService;
  public ProviderInstance: Provider;
  private _apiKey: string = '';
  private apiModels: ModelSettings[] = [];

  private providerName: string;
  private createProviderFunction: (apiKey: string) => Provider;


  /**
   * Create a new OpenAI service provider
   */
  constructor(
    providerName: string,
    createProviderFunction: (apiKey: string) => Provider) 
  {
    this.providerName = providerName;
    this.createProviderFunction = createProviderFunction;

    this.settingsService = SettingsService.getInstance();
    const providerSettings = this.settingsService.getProviderSettings(providerName);
    
    this._apiKey = providerSettings.apiKey || '';
    
    this.ProviderInstance = this.createClient();
  }

  /**
   * Create the OpenAI client with current settings
   */
  private createClient() {
    // console.log(`Creating ${this.providerName} client`);
    // console.log(this._apiKey);
    return this.createProviderFunction(this._apiKey);
  }

  /**
   * Get the name of the service provider
   */
  get name(): string {
    return this.providerName;
  }

  /**
   * Get the ID of the service provider
   */
  get id(): string {
    return this.providerName;
  }

  /**
   * Get the available models for this provider
   */
  get availableModels(): ModelSettings[] | undefined {
    return this.apiModels.length > 0 
      ? this.apiModels 
      : [];
  }

  set availableModels(models: ModelSettings[]) {
    this.apiModels = models;
  }

  /**
   * Fetch the list of available models from OpenAI
   */
  public async fetchAvailableModels(): Promise<ModelSettings[]> {
    return this.apiModels;
  }

  /**
   * Get the capabilities of a model with this provider
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getModelCapabilities(model: string): AIServiceCapability[] {
    return mapModelCapabilities(
      false,
      false,
      false,
      false,
      true
    );
  }

  /**
   * Update the API key for OpenAI
   */
  public updateApiKey(apiKey: string): void {
    this._apiKey = apiKey;
    this.recreateClient();
  }

  /**
   * Setup authentication for OpenAI
   */
  public recreateClient(): void {
    // console.log(`Updating ${this.providerName} client`);
    // console.log(this._apiKey);
    this.ProviderInstance = this.createClient();
  }

  /**
   * Check if the service has a valid API key
   */
  public hasValidApiKey(): boolean {
    return !!this._apiKey && this._apiKey.length > 0;
  }

  /**
   * Get a streaming chat completion
   */
  public async getChatCompletion(
    messages: Message[],
    options: CompletionOptions,
    streamController: StreamControlHandler
  ): Promise<Message> {
    if (!this.hasValidApiKey()) {
      throw new Error(`No API key provided for ${options.provider}`);
    }

    const modelInstance = this.ProviderInstance.languageModel(options.model);

    return CommonProviderHelper.getChatCompletionByModel(modelInstance, messages, options, streamController);
  }

  public static async getChatCompletionByModel(
    modelInstance: LanguageModelV1,
    messages: Message[],
    options: CompletionOptions,
    streamController: StreamControlHandler,
    tools: ToolSet | undefined = undefined,
    toolChoice: ToolChoice<ToolSet> | undefined = undefined
  ): Promise<Message> {
    try {
      const formattedMessages = await MessageHelper.MessagesContentToOpenAIFormat(messages);

      console.log('formattedMessages: ', formattedMessages);

      let fullText = '';

      if (options.stream) {
        console.log(`Streaming ${options.provider}/${options.model} response`);
        
        // Prepare tools for AI SDK format if they exist
        const toolsForStream = tools || options.tools as unknown as ToolSet;
        
        const result = streamText({
          model: modelInstance,
          abortSignal: streamController.getAbortSignal(),
          messages: formattedMessages,
          temperature: options.temperature,
          maxTokens: options.max_tokens,
          topP: options.top_p,
          frequencyPenalty: options.frequency_penalty,
          presencePenalty: options.presence_penalty,
          tools: toolsForStream,
          toolChoice: toolChoice,
          toolCallStreaming: true,
          onFinish: (result: { usage: LanguageModelUsage }) => {
            console.log('OpenAI streaming chat completion finished');
            streamController.onFinish(result.usage);
          },
          onError: (error) => {
            console.error(`${options.provider}/${options.model} streaming chat completion error:`, error);
            throw new Error(`${options.provider}/${options.model} streaming chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        });

        // Track tool calls that are in progress for building arguments
        const toolCallsInProgress = new Map<string, { name: string, argsText: string }>();
        
        for await (const streamPart of result.fullStream) {
          const type = streamPart.type;
          switch(type) {
            case 'tool-call-streaming-start': {
              // Initialize a new tool call
              const toolCallId = streamPart.toolCallId;
              const toolName = streamPart.toolName;
              
              toolCallsInProgress.set(toolCallId, {
                name: toolName,
                argsText: ''
              });
              
              // Notify about tool call start with empty args for now
              streamController.onToolCall(toolName, toolCallId, {});
              break;
            }
            
            case 'tool-call-delta': {
              // Add to the arguments being built
              const toolCallId = streamPart.toolCallId;
              const argsTextDelta = streamPart.argsTextDelta;
              
              const toolCall = toolCallsInProgress.get(toolCallId);
              if (toolCall) {
                toolCall.argsText += argsTextDelta;
                toolCallsInProgress.set(toolCallId, toolCall);
              }
              break;
            }
            
            case 'tool-call': {
              // Complete tool call with full arguments
              const toolCallId = streamPart.toolCallId;
              const toolName = streamPart.toolName;
              const args = streamPart.args;
              
              // Mark as in progress
              streamController.onToolCallInProgress(toolCallId);
              
              // Check if this is an image generation tool
              if (toolName === 'generate_image' && args.prompt) {
                try {
                  // Handle image generation
                  const imageGenService = options.provider === 'openai' 
                    ? modelInstance 
                    : null;
                  
                  if (imageGenService) {
                    // Execute the tool call - this would typically happen through the tools execute function
                    // but for demonstration we're handling it here
                    const result = { images: ['generated_image_placeholder'] };
                    streamController.onToolCallResult(toolCallId, result);
                  } else {
                    streamController.onToolCallError(
                      toolCallId, 
                      new Error(`Image generation not supported for provider ${options.provider}`)
                    );
                  }
                } catch (error) {
                  streamController.onToolCallError(
                    toolCallId, 
                    error instanceof Error ? error : new Error('Unknown error in image generation')
                  );
                }
              } else if (options.tools) {
                // Use a safer way to check for and execute tools
                const toolsMap = options.tools as Record<string, unknown>;
                const tool = toolsMap[toolName] as ToolWithExecute | undefined;
                
                if (tool && typeof tool.execute === 'function') {
                  // Execute other tool calls if they have an execute function
                  try {
                    const result = await tool.execute(args);
                    streamController.onToolCallResult(toolCallId, result);
                  } catch (error) {
                    streamController.onToolCallError(
                      toolCallId, 
                      error instanceof Error ? error : new Error(`Error executing tool ${toolName}`)
                    );
                  }
                }
              }
              
              break;
            }
            
            case 'text-delta': {
              const textDelta = streamPart.textDelta;
              fullText += textDelta;
              streamController.onChunk(fullText);
              break;
            }
          }
        }
      }
      else {
        console.log(`Generating ${options.provider}/${options.model} response`);
        
        // Prepare tools for AI SDK format if they exist
        const toolsForGenerate = tools || options.tools as unknown as ToolSet;
        
        const { text, usage, toolResults } = await generateText({
          model: modelInstance,
          messages: formattedMessages,
          temperature: options.temperature,
          maxTokens: options.max_tokens,
          topP: options.top_p,
          frequencyPenalty: options.frequency_penalty,
          presencePenalty: options.presence_penalty,
          tools: toolsForGenerate,
          toolChoice: toolChoice,
          maxSteps: 3, // Allow multiple steps for tool calls
        });

        console.log('toolResults: ', toolResults);
        
        // Process tool results
        if (toolResults && toolResults.length > 0) {
          const typedToolResults = toolResults as unknown as ToolResult[];
          
          for (const toolResult of typedToolResults) {
            // First notify about the tool call
            streamController.onToolCall(toolResult.name, toolResult.id, toolResult.args);
            
            // Then mark as in progress
            streamController.onToolCallInProgress(toolResult.id);
            
            // Then provide the result
            if (toolResult.name === 'generate_image' && 
                typeof toolResult.result === 'object' && 
                toolResult.result !== null &&
                'images' in toolResult.result) {
              const resultWithImages = toolResult.result as {images: string[]};
              const images = resultWithImages.images;
              if (Array.isArray(images)) {
                streamController.onToolCallResult(toolResult.id, { images });
              }
            } else {
              streamController.onToolCallResult(toolResult.id, toolResult.result);
            }
          }
        }

        fullText = text;
        streamController.onChunk(fullText);
        streamController.onFinish(usage);
      }

      return {
        messageId: uuidv4(),
        conversationId: messages[0].conversationId,
        role: 'assistant' as MessageRole,
        content: MessageHelper.pureTextMessage(fullText),
        timestamp: new Date(),
        provider: options.provider,
        model: options.model,
        tokens: 0,
        fatherMessageId: null,
        childrenMessageIds: [],
        preferIndex: -1
      };

    } catch (error) {
      // If the error is an AbortError, we don't need to log it
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      console.error(`${options.provider}/${options.model} chat completion error:`, error);
      throw new Error(`${options.provider}/${options.model} chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate an image
   */
  public async getImageGeneration(
    prompt: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: {
      size?: `${number}x${number}`;
      style?: string;
      quality?: string;
    } = {}
  ): Promise<string[]> {
    throw new Error('Not implemented');

    // If you want to implement this later, the code would go here
  }
} 