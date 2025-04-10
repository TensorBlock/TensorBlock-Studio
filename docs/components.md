# UI Components

The UI components are organized by their functional areas. Below is the documentation for the main components in the application.

## Chat Components

Located in `src/components/chat/`

### ChatMessageArea

**Path**: `src/components/chat/ChatMessageArea.tsx`

**Description**: Renders the chat conversation area with messages and input field.

**Props**:
- `activeConversation`: Current conversation
- `isLoading`: Loading status
- `error`: Error message if any
- `onSendMessage`: Callback for sending messages
- `onStopStreaming`: Callback to stop message streaming
- `onRegenerateResponse`: Callback to regenerate AI responses
- `onEditMessage`: Callback to edit messages
- `isCurrentlyStreaming`: Status of current streaming
- `selectedProvider`: Currently selected AI provider
- `selectedModel`: Currently selected AI model

**Key Features**:
- Displays conversation messages
- Handles message input and submission
- Supports stopping streaming responses
- Allows editing messages
- Supports message regeneration
- Shows web search toggle when available
- Auto-adjusts textarea height based on content

### MarkdownContent

**Path**: `src/components/chat/MarkdownContent.tsx`

**Description**: Renders markdown content with syntax highlighting.

## Layout Components

Located in `src/components/layout/`

### Layout components provide the overall structure for the application including:
- Main application layout
- Sidebars
- Headers and navigation

## UI Components

Located in `src/components/ui/`

### MessageToolboxMenu

**Path**: `src/components/ui/MessageToolboxMenu.tsx`

**Description**: Provides a toolbar for message actions like copy, edit, regenerate.

**Props**:
- `actions`: Available actions for the message
- `onAction`: Callback when an action is selected

### ProviderIcon

**Path**: `src/components/ui/ProviderIcon.tsx`

**Description**: Renders an icon for an AI provider.

**Props**:
- `provider`: Provider identifier

## Settings Components

Located in `src/components/settings/`

**Description**: Components for managing user settings and preferences.

**Key Features**:
- Provider API key management
- Model selection
- Interface customization
- Web search configuration

## Models Components

Located in `src/components/models/`

**Description**: Components for model selection and management.

**Key Features**:
- Model selection interface
- Model information display
- Provider-specific settings

## Pages Components

Located in `src/components/pages/`

**Description**: Top-level page components for routing.

**Pages**:
- Chat page
- Settings page
- About page

## Core Components

Located in `src/components/core/`

**Description**: Core application components such as:
- Application initialization
- Error boundaries
- Context providers 