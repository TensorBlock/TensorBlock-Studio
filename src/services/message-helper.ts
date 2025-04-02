import { Conversation, Message } from "../types/chat";
import { DatabaseIntegrationService } from "./database-integration";
import { v4 as uuidv4 } from 'uuid';

export class MessageHelper {
  
    public static async addUserMessageToConversation(content: string, conversation: Conversation): Promise<{conversation: Conversation, message: Message}> {

        const latestMessage = MessageHelper.getLastMessage(conversation);

        const dbService = DatabaseIntegrationService.getInstance();

        const userMessage = await dbService.saveChatMessage(
            uuidv4(),
            conversation.conversationId,
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
            await dbService.updateChatMessage(latestMessage.messageId, latestMessage, conversation.conversationId);
        }
        
        const shouldUpdateTitle = conversation.messages.size === 1 && Array.from(conversation.messages.values())[0].role === 'system';

        const title = shouldUpdateTitle 
            ? content.substring(0, 30) + (content.length > 30 ? '...' : '') 
            : conversation.title;


        const messages = new Map(conversation.messages);
        messages.set(userMessage.messageId, userMessage);

        const updatedConversation = {
            ...conversation,
            title,
            messages,
            updatedAt: new Date()
        };

        await dbService.updateConversation(updatedConversation);

        return {
            conversation: updatedConversation,
            message: userMessage
        };
    }
    
    public static async insertUserMessageToConversation(fatherMessage: Message, newContent: string, conversation: Conversation): Promise<{conversation: Conversation, message: Message}> {

        const dbService = DatabaseIntegrationService.getInstance();

        const userMessage = await dbService.saveChatMessage(
            uuidv4(),
            conversation.conversationId,
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
        await dbService.updateChatMessage(fatherMessage.messageId, fatherMessage, conversation.conversationId);

        const messages = new Map(conversation.messages);
        messages.set(userMessage.messageId, userMessage);

        const updatedConversation = {
            ...conversation,
            messages,
            updatedAt: new Date()
        };

        await dbService.updateConversation(updatedConversation);

        return {
            conversation: updatedConversation,
            message: userMessage
        };
    }

    public static async insertAssistantMessageToConversation(fatherMessage: Message, aiResponse: Message, conversation: Conversation): Promise<Conversation> {

        const updatedConversation = MessageHelper.removeAllPlaceholderMessage(conversation);

        const dbService = DatabaseIntegrationService.getInstance();

        const updatedAiResponse: Message = {
            ...aiResponse,
            fatherMessageId: fatherMessage.messageId,
        }

        fatherMessage.childrenMessageIds.push(updatedAiResponse.messageId);
        fatherMessage.preferIndex = fatherMessage.childrenMessageIds.length - 1;
        await dbService.updateChatMessage(fatherMessage.messageId, fatherMessage, conversation.conversationId);

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

        const messages = new Map(updatedConversation.messages);
        messages.set(updatedAiResponse.messageId, updatedAiResponse);

        const finalConversation: Conversation = {
            ...updatedConversation,
            messages,
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

    /**
     * Map the messages tree to a list of messages
     * @param conversation - The conversation to map
     * @param isFilterSystemMessages - Whether to filter system messages (default: true)
     * @param stopAtMessageId - The message id to stop at (inclusive) (optional)
     * @returns The list of messages
     */
    public static mapMessagesTreeToList(conversation: Conversation, isFilterSystemMessages: boolean = true, stopAtMessageId: string | null = null): Message[] {

        const messages = conversation.messages;

        if(messages.size === 0) return [];
        if(conversation.firstMessageId === null) return [];
        if(!messages.has(conversation.firstMessageId)) return [];

        const constructedMessageList: Message[] = [];
        let currentMessage: Message | null = messages.get(conversation.firstMessageId)!;

        while(currentMessage !== null) {

            if(!isFilterSystemMessages || currentMessage.role !== 'system') {
                const copyMessage = {...currentMessage};

                constructedMessageList.push(copyMessage);
            }
                
            if(stopAtMessageId !== null && currentMessage.messageId === stopAtMessageId) {
                break;
            }

            const nextIndex: number = currentMessage.preferIndex;

            const isNextIndexValid: boolean = nextIndex >= 0 && nextIndex < currentMessage.childrenMessageIds.length;

            currentMessage = isNextIndexValid 
                ? messages.get(currentMessage!.childrenMessageIds[nextIndex]) || null
                : null;
        }

        return constructedMessageList;
            
    }

    public static getLastMessage(conversation: Conversation): Message | null {
        if(conversation.messages.size === 0) return null;

        const mapedMessages = MessageHelper.mapMessagesTreeToList(conversation, false, null);
        console.log('Maped messages:', mapedMessages);
        return mapedMessages[mapedMessages.length - 1];
    }
}