import { Conversation, FileJsonData, Message, MessageContent, MessageContentType } from "../types/chat";
import { DatabaseIntegrationService } from "./database-integration";
import { v4 as uuidv4 } from 'uuid';
import { FilePart, CoreMessage, TextPart, CoreUserMessage, CoreAssistantMessage, CoreSystemMessage } from "ai";

export class MessageHelper {
  
    public static async addUserMessageToConversation(content: string, conversation: Conversation): Promise<{conversation: Conversation, message: Message}> {
        let latestMessage = MessageHelper.getLastMessage(conversation);

        const dbService = DatabaseIntegrationService.getInstance();

        const userMessage = await dbService.saveChatMessage(
            uuidv4(),
            conversation.conversationId,
            'user',
            MessageHelper.pureTextMessage(content),
            'provider: user',
            'model: user',
            0,
            latestMessage ? latestMessage.messageId : null,
            [],
            -1
        );

        if (latestMessage) {
            latestMessage = MessageHelper.insertMessageIdToFathterMessage(latestMessage, userMessage.messageId);

            console.log('Updated latest message:', latestMessage);

            await dbService.updateChatMessage(latestMessage.messageId, latestMessage, conversation.conversationId);
        }
        
        const shouldUpdateTitle = conversation.messages.size === 1 && Array.from(conversation.messages.values())[0].role === 'system';

        const title = shouldUpdateTitle 
            ? content.substring(0, 30) + (content.length > 30 ? '...' : '') 
            : conversation.title;

        const messages = new Map(conversation.messages);
        messages.set(userMessage.messageId, userMessage);
        if(latestMessage) {
            messages.set(latestMessage.messageId, latestMessage);
        }

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
            MessageHelper.pureTextMessage(newContent),
            'user', // provider
            'user', // model
            0,
            fatherMessage.messageId,
            [],
            -1
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

        const fathterPreferIndex = fatherMessage.preferIndex;

        fatherMessage.childrenMessageIds.splice(fathterPreferIndex + 1, 0, updatedAiResponse.messageId);
        fatherMessage.preferIndex = fathterPreferIndex + 1;

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
        messages.delete(fatherMessage.messageId);
        messages.set(fatherMessage.messageId, fatherMessage);

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
            if(message.preferIndex >= message.childrenMessageIds.length) {
                message.preferIndex = message.childrenMessageIds.length - 1;
            }
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
            content: MessageHelper.pureTextMessage(''),
            timestamp: new Date(),
            provider: provider,
            model: model,
            tokens: 0,
            fatherMessageId: null,
            childrenMessageIds: [],
            preferIndex: -1
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
        const lastMessage = mapedMessages[mapedMessages.length - 1];
        return lastMessage;
    }

    public static async addUserMessageWithFilesToConversation(
        textContent: string, 
        fileContents: MessageContent[],
        conversation: Conversation
    ): Promise<{conversation: Conversation, message: Message}> {
        let latestMessage = MessageHelper.getLastMessage(conversation);

        const dbService = DatabaseIntegrationService.getInstance();

        // Combine text and file contents
        const combinedContent: MessageContent[] = [
            ...MessageHelper.pureTextMessage(textContent),
            ...fileContents
        ];

        const userMessage = await dbService.saveChatMessage(
            uuidv4(),
            conversation.conversationId,
            'user',
            combinedContent,
            'provider: user',
            'model: user',
            0,
            latestMessage ? latestMessage.messageId : null,
            [],
            -1
        );

        if (latestMessage) {
            latestMessage = MessageHelper.insertMessageIdToFathterMessage(latestMessage, userMessage.messageId);

            console.log('Updated latest message:', latestMessage);

            await dbService.updateChatMessage(latestMessage.messageId, latestMessage, conversation.conversationId);
        }
        
        const shouldUpdateTitle = conversation.messages.size === 1 && Array.from(conversation.messages.values())[0].role === 'system';

        const title = shouldUpdateTitle 
            ? textContent.substring(0, 30) + (textContent.length > 30 ? '...' : '') 
            : conversation.title;

        const messages = new Map(conversation.messages);
        messages.set(userMessage.messageId, userMessage);
        if(latestMessage) {
            messages.set(latestMessage.messageId, latestMessage);
        }

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

    public static pureTextMessage(contentText: string): MessageContent[] {
        return [
            {
                type: MessageContentType.Text,
                content: contentText,
                dataJson: ''
            }
        ]
    }

    /**
     * Convert a message content array to a text string (Only text content)
     * @param messageContent - The message content array to convert
     * @returns The text string
     */
    public static MessageContentToText(messageContent: MessageContent[]): string {
        if (!messageContent || messageContent.length === 0) {
            return '';
        }
        
        return messageContent.map(content => { 
            if(content.type === MessageContentType.Text) {
                return content.content;
            }
            return '';
        }).join('');
    }

    public static MessagesContentToOpenAIFormat(msgs: Message[]): CoreMessage[] {
        if (!msgs || msgs.length === 0) {
            return [];
        }

        console.log('before msgs: ', msgs);
        
        const results = msgs.map((msg) => {
            
            if(msg.role === 'user') {
                const userMsg: CoreUserMessage = {
                    role: 'user',
                    content: msg.content.map((content) => {
                        if(content.type === MessageContentType.Text) {
                            const textContent: TextPart = {
                                type: 'text',
                                text: content.content
                            };
                            return textContent;
                        }
                        else if(content.type === MessageContentType.File) {
                            const dataJson: FileJsonData = JSON.parse(content.dataJson) as FileJsonData;

                            console.log('Processing file: ', dataJson.name);

                            const fileContent: FilePart = {
                                type: 'file',
                                data: content.content,
                                mimeType: 'application/pdf',
                                filename: dataJson.name
                            }
                            return fileContent;
                        }
                        
                        const emptyText: TextPart = {
                            type: 'text',
                            text: ''
                        };
                        return emptyText;
                    })
                }

                return userMsg;
            }
            else if(msg.role === 'assistant') {
                let stringContent: string = '';

                for(const content of msg.content) {
                    if(content.type === MessageContentType.Text) {
                        stringContent += content.content;
                    }
                }

                const assistantMsg: CoreAssistantMessage = {
                    role: 'assistant',
                    content: stringContent
                }

                return assistantMsg;
            }
            else if(msg.role === 'system') {
                let stringContent: string = '';

                for(const content of msg.content) {
                    if(content.type === MessageContentType.Text) {
                        stringContent += content.content;
                    }
                }

                const systemMsg: CoreSystemMessage = {
                    role: 'system',
                    content: stringContent
                }

                return systemMsg;
            }
            
        });

        return results.filter((result) => result !== undefined) as CoreMessage[];
    }

    public static insertMessageIdToFathterMessage(fatherMessage: Message, messageId: string): Message {
        if(fatherMessage.childrenMessageIds.length === 0) {
            fatherMessage.childrenMessageIds.push(messageId);
            fatherMessage.preferIndex = 0;
        }
        else if(fatherMessage.preferIndex >= 0 && fatherMessage.preferIndex < fatherMessage.childrenMessageIds.length) {
            fatherMessage.childrenMessageIds.splice(fatherMessage.preferIndex + 1, 0, messageId);
            fatherMessage.preferIndex = fatherMessage.preferIndex + 1;
        }
        else {
            fatherMessage.childrenMessageIds.push(messageId);
            fatherMessage.preferIndex = fatherMessage.childrenMessageIds.length - 1;
        }

        return fatherMessage;
    }
}