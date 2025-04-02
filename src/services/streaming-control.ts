import { LanguageModelUsage } from "ai";
import { Conversation, Message } from "../types/chat";
import { v4 as uuidv4 } from 'uuid';

export class StreamControlHandler {
    public targetConverstation: Conversation;
    public abortController: AbortController;
    public onChunkCallback: (updatedConversation: Conversation) => void;
    public onFinishCallback: (aiResponse: Message | null) => void;

    private currentTotalTokens: number = 0;

    constructor(targetConversation: Conversation, onChunkCallback: (updatedConversation: Conversation) => void, onFinishCallback: (aiResponse: Message | null) => void) {
        this.targetConverstation = targetConversation;
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

        const messageIndex = Array.from(this.targetConverstation.messages.values()).length - 1;
        const updatedMessages = Array.from(this.targetConverstation.messages.values());
        
        // Update the streaming message content
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          content: streamingFullText
        };

        // Update in memory
        const updatedStreamingConv = {
          ...this.targetConverstation,
          messages: new Map(updatedMessages.map(message => [message.messageId, message]))
        };

        this.targetConverstation = updatedStreamingConv;

        this.onChunkCallback(updatedStreamingConv);
    }

    public onFinish(usage: LanguageModelUsage | null) {
        const lastMessage = Array.from(this.targetConverstation.messages.values())[Array.from(this.targetConverstation.messages.values()).length - 1];
        const finalMessage: Message = {
            messageId: uuidv4(),
            content: lastMessage.content,
            conversationId: this.targetConverstation.id,
            role: 'assistant',
            timestamp: new Date(),
            provider: lastMessage.provider,
            model: lastMessage.model,
            tokens: usage?.completionTokens || 0,
            fatherMessageId: lastMessage.fatherMessageId,
            childrenMessageIds: lastMessage.childrenMessageIds,
            preferIndex: lastMessage.preferIndex
        }
        this.onFinishCallback(finalMessage);
    }
}
