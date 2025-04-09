import { LanguageModelUsage } from "ai";
import { Conversation, Message } from "../types/chat";
import { v4 as uuidv4 } from 'uuid';
import { MessageHelper } from "./message-helper";

export class StreamControlHandler {
    public targetConverstation: Conversation;
    public abortController: AbortController;
    public onChunkCallback: (updatedConversation: Conversation) => void;
    public onFinishCallback: (aiResponse: Message | null) => void;

    private placeholderMessage: Message;
    private fullText: string = '';

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

    public onFinish(usage: LanguageModelUsage | null) {
        const finalMessage: Message = {
            messageId: uuidv4(),
            content: MessageHelper.pureTextMessage(this.fullText),
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
