import { Conversation, Message } from "../types/chat";
import { DatabaseIntegrationService } from "./database-integration";
import { v4 as uuidv4 } from 'uuid';

export class MessageHelper {
  
    public static async addUserMessageToConversation(content: string, conversation: Conversation): Promise<Conversation> {

        const latestMessage = Array.from(conversation.messages.values()).length > 0 ? Array.from(conversation.messages.values())[Array.from(conversation.messages.values()).length - 1] : null;

        const dbService = DatabaseIntegrationService.getInstance();

        const userMessage = await dbService.saveChatMessage(
            uuidv4(),
            conversation.id,
            'user',
            content,
            'provider: user',
            'model: user',
            0,
            latestMessage ? latestMessage.messageId : null,
            [],
            0
        );

        if (latestMessage) {
            latestMessage.childrenMessageIds.push(userMessage.messageId);
            latestMessage.preferIndex = latestMessage.childrenMessageIds.length - 1;
            await dbService.updateChatMessage(latestMessage.messageId, latestMessage, conversation.id);
        }
        
        const shouldUpdateTitle = Array.from(conversation.messages.values()).length === 1 && Array.from(conversation.messages.values())[0].role === 'system';

        const title = shouldUpdateTitle 
            ? content.substring(0, 30) + (content.length > 30 ? '...' : '') 
            : conversation.title;

        const updatedConversation = {
            ...conversation,
            title,
            messages: new Map([
                ...Array.from(conversation.messages.entries()), 
                [userMessage.messageId, userMessage]
            ]),
            updatedAt: new Date()
        };

        await dbService.updateConversation(updatedConversation);

        return updatedConversation;
    }
    
    public static async insertUserMessageToConversation(fatherMessage: Message, newContent: string, conversation: Conversation): Promise<Conversation> {

        const dbService = DatabaseIntegrationService.getInstance();

        const userMessage = await dbService.saveChatMessage(
            uuidv4(),
            conversation.id,
            'user',
            newContent,
            'user', // provider
            'user', // model
            0,
            fatherMessage.messageId,
            [],
            0
        );

        fatherMessage.childrenMessageIds.push(userMessage.messageId);
        fatherMessage.preferIndex = fatherMessage.childrenMessageIds.length - 1;
        await dbService.updateChatMessage(fatherMessage.messageId, fatherMessage, conversation.id);

        const updatedConversation = {
            ...conversation,
            messages: new Map([
                ...Array.from(conversation.messages.entries()), 
                [userMessage.messageId, userMessage]
            ]),
            updatedAt: new Date()
        };

        await dbService.updateConversation(updatedConversation);

        return updatedConversation;
    }

    public static async addAssistantMessageToConversation(aiResponse: Message, conversation: Conversation): Promise<Conversation> {

        const updatedConversation = MessageHelper.removeAllPlaceholderMessage(conversation);

        const latestMessage = Array.from(updatedConversation.messages.values()).length > 0 ? Array.from(updatedConversation.messages.values())[Array.from(updatedConversation.messages.values()).length - 1] : null;
        
        const updatedAiResponse: Message = {
            ...aiResponse,
            fatherMessageId: latestMessage?.messageId || null,
        }

        const dbService = DatabaseIntegrationService.getInstance();

        if(latestMessage) {
            latestMessage.childrenMessageIds.push(updatedAiResponse.messageId);
            latestMessage.preferIndex = latestMessage.childrenMessageIds.length - 1;
            await dbService.updateChatMessage(latestMessage.messageId, latestMessage, conversation.id);
        }

        await dbService.saveChatMessage(
            updatedAiResponse.messageId,
            updatedAiResponse.conversationId,
            updatedAiResponse.role,
            updatedAiResponse.content,
            updatedAiResponse.provider,
            updatedAiResponse.model,
            updatedAiResponse.tokens,
            updatedAiResponse.fatherMessageId,
            updatedAiResponse.childrenMessageIds,
            updatedAiResponse.preferIndex
        );

        const finalConversation: Conversation = {
            ...updatedConversation,
            messages: new Map([
                ...Array.from(updatedConversation.messages.entries()), 
                [aiResponse.messageId, aiResponse]
            ]),
            updatedAt: new Date()
        };

        await dbService.updateConversation(finalConversation);

        return finalConversation;
    }
    
    public static removeAllPlaceholderMessage(conversation: Conversation): Conversation {
        // Remove all messages with messageId starting with 'streaming-'
        const filteredMessages = Array.from(conversation.messages.values()).filter(message => !message.messageId.startsWith('streaming-'));
        
        for(const message of filteredMessages) {
            message.childrenMessageIds = message.childrenMessageIds.filter(id => !id.startsWith('streaming-'));
            message.preferIndex = message.childrenMessageIds.length - 1;
        }
        
        return {
            ...conversation,
            messages: new Map(filteredMessages.map(message => [message.messageId, message]))
        };
    }

    public static getPlaceholderMessage(model: string, provider: string, conversationId: string): Message {
        return {
            messageId: 'streaming-' + Date.now(),
            conversationId: conversationId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            provider: provider,
            model: model,
            tokens: 0,
            fatherMessageId: null,
            childrenMessageIds: [],
            preferIndex: 0
        };
    }

    public static mapMessagesTreeToList(conversation: Conversation, isFilterSystemMessages: boolean = true): Message[] {

        const messages = isFilterSystemMessages 
            ? (Array.from(conversation?.messages.values()).filter(m => m.role !== 'system') || []) 
            : (Array.from(conversation?.messages.values()) || []);

        if(messages.length === 0) return [];

        const constructedMessageList: Message[] = [];
        let currentMessage: Message | null = messages[0];

        while(currentMessage !== null) {
        
            const copyMessage = {...currentMessage};

            constructedMessageList.push(copyMessage);

            const nextIndex: number = currentMessage.preferIndex;
            
            const isNextIndexValid: boolean = nextIndex >= 0 && nextIndex < currentMessage.childrenMessageIds.length;

            currentMessage = isNextIndexValid 
                ? messages.find(m => m.messageId === currentMessage!.childrenMessageIds[nextIndex]) || null
                : null;
        }

        return constructedMessageList;
            
    }
}