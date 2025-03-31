import { Conversation, Message } from "../types/chat";
import { v4 as uuidv4 } from 'uuid';

export class StreamControlHandler {
    public targetConverstation: Conversation;
    public abortController: AbortController;
    public onChunkCallback: (updatedConversation: Conversation) => void;
    public onFinishCallback: (aiResponse: Message | null) => void;

    constructor(targetConversation: Conversation, onChunkCallback: (updatedConversation: Conversation) => void, onFinishCallback: (aiResponse: Message | null) => void) {
        this.targetConverstation = targetConversation;
        this.abortController = new AbortController();
        this.onChunkCallback = onChunkCallback;
        this.onFinishCallback = onFinishCallback;
    }

    public abort() {
        this.abortController.abort();
        this.onFinish();
    }

    public getAbortSignal() {
        return this.abortController.signal;
    }

    public static getPlaceholderMessage(model: string, provider: string, conversationId: string): Message {
        return {
            messageId: 'streaming-' + Date.now(),
            conversationId: conversationId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            provider: provider,
            model: model
        };
    }


    public onChunk(streamingFullText: string) {
        // Update the placeholder message with the new content
        if (!this.targetConverstation) return;

        const messageIndex = this.targetConverstation.messages.length - 1;
        const updatedMessages = [...this.targetConverstation.messages];
        
        // Update the streaming message content
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          content: streamingFullText
        };

        // Update in memory
        const updatedStreamingConv = {
          ...this.targetConverstation,
          messages: updatedMessages
        };

        this.targetConverstation = updatedStreamingConv;

        this.onChunkCallback(updatedStreamingConv);
    }

    public onFinish() {
        const lastMessage = this.targetConverstation.messages[this.targetConverstation.messages.length - 1];
        const finalMessage: Message = {
            messageId: uuidv4(),
            content: lastMessage.content,
            conversationId: this.targetConverstation.id,
            role: 'assistant',
            timestamp: new Date(),
            provider: lastMessage.provider,
            model: lastMessage.model,
        }
        this.onFinishCallback(finalMessage);
    }
}
