# Pages API

The Pages module contains the main application views that users interact with. These pages are responsible for orchestrating components and services to provide complete functionality.

## `ChatPage`

The main chat interface page where users can interact with the AI.

```typescript
import { FC, useState, useEffect } from 'react';
import { ChatService } from '../services/chat-service';
import { AIService } from '../services/ai-service';

interface ChatPageProps {
  initialSelectedModel?: string;
  apiKey?: string;
}

export const ChatPage: FC<ChatPageProps> = ({ initialSelectedModel, apiKey }) => {
  // Component state and implementation
};
```

### Features

- Displays conversation history
- Provides message input for user interactions
- Shows loading states during AI responses
- Handles conversation management (create, select, delete)
- Provides options for regenerating responses
- Manages settings specific to the current conversation

### Component Structure

```
ChatPage
├── ConversationSidebar
│   ├── ConversationList
│   │   └── ConversationItem
│   └── NewChatButton
├── ChatArea
│   ├── ChatHeader
│   ├── ChatMessageList
│   │   └── ChatMessage
│   └── ChatInput
└── SettingsButton (opens settings modal)
```

### State Management

The ChatPage uses the ChatService to manage conversations and the AIService for AI interactions:

```typescript
// Inside ChatPage component
const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
const [messages, setMessages] = useState<Message[]>([]);
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  const chatService = ChatService.getInstance();
  const unsubscribe = chatService.subscribe(() => {
    const state = chatService.getState();
    // Update component state based on service state
  });
  
  return () => unsubscribe();
}, []);
```

## `SettingsPage`

The settings page where users can configure API keys and other preferences.

```typescript
import { FC, useState, useEffect } from 'react';
import { SettingsService } from '../services/settings-service';
import { AIService } from '../services/ai-service';

interface SettingsPageProps {
  onClose?: () => void;
}

export const SettingsPage: FC<SettingsPageProps> = ({ onClose }) => {
  // Component state and implementation
};
```

### Features

- Manages API keys for different providers
- Allows selection of default provider and model
- Provides interface for custom provider configuration
- Validates settings and displays error messages
- Persists user preferences

### Component Structure

```
SettingsPage
├── ProviderTabs
│   ├── OpenAISettings
│   ├── AnthropicSettings
│   ├── GeminiSettings
│   ├── FireworksSettings
│   ├── TogetherSettings
│   ├── OpenRouterSettings
│   └── CustomSettings
├── ModelSelector
└── FooterActions
```

### Settings Management

The SettingsPage uses the SettingsService to manage user preferences:

```typescript
// Inside SettingsPage component
const [selectedProvider, setSelectedProvider] = useState('');
const [apiKey, setApiKey] = useState('');
const [selectedModel, setSelectedModel] = useState('');

useEffect(() => {
  const settingsService = SettingsService.getInstance();
  setSelectedProvider(settingsService.getSelectedProvider());
  setApiKey(settingsService.getApiKey(selectedProvider));
  setSelectedModel(settingsService.getSelectedModel());
  
  const handleSettingsChange = () => {
    // Update component state based on settings changes
  };
  
  window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
  return () => window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
}, [selectedProvider]);
```

## Routing/Navigation Pattern

The application uses a simple navigation pattern where:

1. The main application renders the ChatPage by default
2. The SettingsPage is shown as a modal overlay when requested
3. No URL-based routing is used; navigation state is managed in-memory

## Page Integration with Core Services

Pages integrate with the core services to:

1. Fetch and display data
2. Handle user actions
3. Update application state
4. Manage error conditions

Each page is responsible for orchestrating the components and services needed to provide a complete user experience. 