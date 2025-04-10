# Services

The services provide the core business logic for the application. They are implemented using the singleton pattern for global access.

## ChatService

**Path**: `src/services/chat-service.ts`

**Description**: Manages chat conversations and message handling.

**Key Methods**:
- `getInstance()`: Returns the singleton instance
- `initialize()`: Initializes the service
- `loadConversations()`: Loads all conversations from the database
- `loadConversation(conversationId)`: Loads a specific conversation
- `createConversation(title)`: Creates a new conversation
- `sendMessage(content, conversationId, isStreaming, conversationUpdate)`: Sends a message with streaming support
- `editMessage(messageId, conversationId, newContent, isStreaming, conversationUpdate)`: Edits a message
- `regenerateAiMessage(messageId, conversationId, isStreaming, conversationUpdate)`: Regenerates an AI response
- `stopStreaming(conversationId)`: Stops the current streaming message
- `isCurrentlyStreaming(conversationId)`: Checks if streaming is active
- `getCurrentProviderModelCapabilities()`: Gets capabilities of current provider/model combination

**Usage Example**:
```typescript
const chatService = ChatService.getInstance();
await chatService.initialize();
const conversations = await chatService.loadConversations();
```

## AIService

**Path**: `src/services/ai-service.ts`

**Description**: Provides integration with AI providers.

**Key Methods**:
- `getInstance()`: Returns the singleton instance
- `getProvider(name)`: Gets a provider by name
- `getAllProviders()`: Gets all registered providers
- `getChatCompletion(messages, options, streamController)`: Gets a streaming chat completion
- `generateImage(prompt, options)`: Generates an image from a prompt
- `getCachedAllModels()`: Gets all models from cache
- `getModelsForProvider(providerName)`: Gets models for a specific provider
- `refreshModels()`: Refreshes the model cache

**Usage Example**:
```typescript
const aiService = AIService.getInstance();
const provider = aiService.getProvider('openai');
const models = await aiService.getModelsForProvider('openai');
```

## SettingsService

**Path**: `src/services/settings-service.ts`

**Description**: Manages application settings and user preferences.

**Key Methods**:
- `getInstance()`: Returns the singleton instance
- `getSettings()`: Gets all settings
- `saveSettings(settings)`: Saves settings
- `getSelectedProvider()`: Gets the currently selected provider
- `setSelectedProvider(provider)`: Sets the selected provider
- `getSelectedModel()`: Gets the currently selected model
- `setSelectedModel(model)`: Sets the selected model
- `getProviderSettings(provider)`: Gets settings for a specific provider
- `setProviderApiKey(provider, apiKey)`: Sets the API key for a provider
- `getWebSearchActive()`: Gets the web search status
- `setWebSearchEnabled(enabled)`: Enables/disables web search

**Usage Example**:
```typescript
const settingsService = SettingsService.getInstance();
const selectedProvider = settingsService.getSelectedProvider();
await settingsService.setSelectedModel('gpt-4');
```

## DatabaseIntegrationService

**Path**: `src/services/database-integration.ts`

**Description**: Provides database integration for persistent storage.

**Key Methods**:
- `getInstance()`: Returns the singleton instance
- `initialize()`: Initializes the database connection
- `loadConversationsList()`: Loads the list of all conversations
- `loadConversation(conversationId)`: Loads a specific conversation with messages
- `createConversation(title)`: Creates a new conversation
- `updateConversation(conversation)`: Updates a conversation
- `deleteConversation(conversationId)`: Deletes a conversation
- `updateChatMessage(messageId, message, conversationId)`: Updates a message
- `loadFoldersList()`: Loads all conversation folders
- `createFolder(folder)`: Creates a new folder
- `updateFolder(folderId, folder)`: Updates a folder
- `deleteFolder(folderId)`: Deletes a folder

**Usage Example**:
```typescript
const dbService = DatabaseIntegrationService.getInstance();
await dbService.initialize();
const conversations = await dbService.loadConversationsList();
```

## MessageHelper

**Path**: `src/services/message-helper.ts`

**Description**: Provides utility functions for message handling.

**Key Methods**:
- `mapMessagesTreeToList(conversation, includeSystemMessages)`: Maps message tree to flat list
- `addUserMessageToConversation(content, conversation)`: Adds a user message to conversation
- `insertAssistantMessageToConversation(userMessage, aiResponse, conversation)`: Inserts AI response
- `getPlaceholderMessage(model, provider, conversationId)`: Creates a placeholder message for streaming

**Usage Example**:
```typescript
const messages = MessageHelper.mapMessagesTreeToList(conversation, false);
const { conversation: updated, message: userMsg } = await MessageHelper.addUserMessageToConversation(content, conversation);
```

## StreamControlHandler

**Path**: `src/services/streaming-control.ts`

**Description**: Handles streaming control for AI responses.

**Key Methods**:
- `constructor(conversation, placeholderMessage, onChunk, onFinish)`: Initializes a handler
- `getAbortSignal()`: Gets the abort signal for cancellation
- `abortStreaming()`: Aborts the current streaming
- `handleChunk(chunk)`: Handles a streaming chunk
- `finalizeStreaming()`: Finalizes the streaming process

**Usage Example**:
```typescript
const streamController = new StreamControlHandler(
  conversation,
  placeholderMessage,
  (updated) => { /* handle chunk */ },
  (aiResponse) => { /* handle final response */ }
);
```

## Provider System

**Path**: `src/services/providers/`

**Description**: Provider implementations for different AI services.

The provider system uses a factory pattern to create provider instances:

**ProviderFactory**:
- `getNewProvider(providerName)`: Creates a new provider instance

**Provider Interface**:
- `getChatCompletion(messages, options, streamController)`: Gets chat completion
- `getAvailableModels()`: Gets available models for the provider

**Implemented Providers**:
- OpenAI
- Anthropic
- Custom providers 