import { LanguageModelUsage } from "ai";
import { Conversation, Message, MessageContent, MessageContentType } from "../types/chat";
import { v4 as uuidv4 } from 'uuid';
import { MessageHelper } from "./message-helper";
import { CustomToolCall, ToolCallStatus } from "../types/tool-call";

export class StreamControlHandler {
    public targetConverstation: Conversation;
    public abortController: AbortController;
    public onChunkCallback: (updatedConversation: Conversation) => void;
    public onFinishCallback: (aiResponse: Message | null) => void;

    private placeholderMessage: Message;
    private fullText: string = '';
    private toolCallsInProgress: Map<string, CustomToolCall> = new Map();
    private imageContents: MessageContent[] = [];

    constructor(
        targetConversation: Conversation, 
        placeholderMessage: Message,
        onChunkCallback: (updatedConversation: Conversation) => void, 
        onFinishCallback: (aiResponse: Message | null) => void
    ) {
        this.targetConverstation = targetConversation;
        this.placeholderMessage = placeholderMessage;
        this.abortController = new AbortController();
        this.onChunkCallback = onChunkCallback;
        this.onFinishCallback = onFinishCallback;
    }

    public async abort() {
        this.abortController.abort();
        this.onFinish(null);
    }

    public getAbortSignal() {
        return this.abortController.signal;
    }

    public onChunk(streamingFullText: string) {
        // Update the placeholder message with the new content
        if (!this.targetConverstation) return;

        this.fullText = streamingFullText;
        
        const updatedMessages = new Map(this.targetConverstation.messages);
        updatedMessages.set(this.placeholderMessage.messageId, {
            ...this.placeholderMessage,
            content: MessageHelper.pureTextMessage(streamingFullText)
        });

        const updatedConversation = {
            ...this.targetConverstation,
            messages: updatedMessages
        };

        this.targetConverstation = updatedConversation;

        this.onChunkCallback(updatedConversation);
    }

    public onToolCall(toolName: string, toolId: string, args: Record<string, unknown>) {
        // Create and store the tool call
        const toolCall: CustomToolCall = {
            id: toolId,
            name: toolName,
            args: args,
            status: ToolCallStatus.CALLED
        };
        
        this.toolCallsInProgress.set(toolId, toolCall);

        // Update the message to include information about the tool call
        let toolCallText = this.fullText;
        
        // Append a message about the tool call in progress
        if (toolName === 'generate_image') {
            const imagePrompt = args?.prompt as string;
            if (imagePrompt) {
                toolCallText += `\n\nGenerating image with prompt: "${imagePrompt}"`;
            } else {
                toolCallText += `\n\nGenerating image...`;
            }
        } else {
            toolCallText += `\n\nExecuting tool call: ${toolName}`;
        }

        const updatedMessages = new Map(this.targetConverstation.messages);
        updatedMessages.set(this.placeholderMessage.messageId, {
            ...this.placeholderMessage,
            content: MessageHelper.pureTextMessage(toolCallText)
        });

        const updatedConversation = {
            ...this.targetConverstation,
            messages: updatedMessages
        };

        this.targetConverstation = updatedConversation;
        this.onChunkCallback(updatedConversation);
    }

    public onToolCallInProgress(toolCallId: string) {
        const toolCall = this.toolCallsInProgress.get(toolCallId);
        if (!toolCall) return;
        
        toolCall.status = ToolCallStatus.IN_PROGRESS;
        this.toolCallsInProgress.set(toolCallId, toolCall);
    }

    public onToolCallResult(toolCallId: string, result: unknown) {
        const toolCall = this.toolCallsInProgress.get(toolCallId);
        if (!toolCall) return;

        // Update tool call status
        toolCall.status = ToolCallStatus.COMPLETED;
        toolCall.result = result;
        this.toolCallsInProgress.set(toolCallId, toolCall);

        // Handle image generation results
        if (toolCall.name === 'generate_image' && (result as {images?: string[]})?.images) {
            const images = (result as {images: string[]}).images;
            if (Array.isArray(images)) {
                // Store the images for later inclusion in the final message
                for (const imageData of images) {
                    if (typeof imageData === 'string') {
                        this.imageContents.push({
                            type: MessageContentType.Image,
                            content: imageData,
                            dataJson: JSON.stringify({ format: 'base64' })
                        });
                    }
                }
            }
        }

        // Update message with tool call result info
        let updatedText = this.fullText;
        
        // Don't append result text for image generation, as we'll show the images directly
        if (toolCall.name !== 'generate_image') {
            updatedText += `\n\nTool result: ${JSON.stringify(result)}`;
        }

        const updatedMessages = new Map(this.targetConverstation.messages);
        updatedMessages.set(this.placeholderMessage.messageId, {
            ...this.placeholderMessage,
            content: MessageHelper.pureTextMessage(updatedText)
        });

        const updatedConversation = {
            ...this.targetConverstation,
            messages: updatedMessages
        };

        this.targetConverstation = updatedConversation;
        this.onChunkCallback(updatedConversation);
    }

    public onToolCallError(toolCallId: string, error: Error) {
        const toolCall = this.toolCallsInProgress.get(toolCallId);
        if (!toolCall) return;

        // Update tool call status
        toolCall.status = ToolCallStatus.ERROR;
        toolCall.error = error;
        this.toolCallsInProgress.set(toolCallId, toolCall);

        // Update message with error info
        let errorText = this.fullText;
        
        if (toolCall.name === 'generate_image') {
            errorText += `\n\nError generating image: ${error.message}`;
        } else {
            errorText += `\n\nError in tool call ${toolCall.name}: ${error.message}`;
        }

        const updatedMessages = new Map(this.targetConverstation.messages);
        updatedMessages.set(this.placeholderMessage.messageId, {
            ...this.placeholderMessage,
            content: MessageHelper.pureTextMessage(errorText)
        });

        const updatedConversation = {
            ...this.targetConverstation,
            messages: updatedMessages
        };

        this.targetConverstation = updatedConversation;
        this.onChunkCallback(updatedConversation);
    }

    public onFinish(usage: LanguageModelUsage | null) {
        const finalMessageContent = [...MessageHelper.pureTextMessage(this.fullText)];
        
        // Add any image contents to the final message
        if (this.imageContents.length > 0) {
            finalMessageContent.push(...this.imageContents);
        }

        const finalMessage: Message = {
            messageId: uuidv4(),
            content: finalMessageContent,
            conversationId: this.targetConverstation.conversationId,
            role: 'assistant',
            timestamp: new Date(),
            provider: this.placeholderMessage.provider,
            model: this.placeholderMessage.model,
            tokens: usage?.completionTokens || 0,
            fatherMessageId: this.placeholderMessage.fatherMessageId,
            childrenMessageIds: this.placeholderMessage.childrenMessageIds,
            preferIndex: this.placeholderMessage.preferIndex
        }
        this.onFinishCallback(finalMessage);
    }
}
