# System Overview

## Application Architecture

TensorBlock Studio is built using React and TypeScript with a component-based architecture. The application is divided into several key modules:

### Core Modules

1. **UI Components**
   - Located in `src/components/`
   - Responsible for rendering UI elements and handling user interactions
   - Organized by functionality (chat, layout, pages, settings, ui)

2. **Services**
   - Located in `src/services/`
   - Provide core business logic and API integration
   - Implement the singleton pattern for global state management
   - Handle data transformation, API requests, and state updates

3. **Types**
   - Located in `src/types/`
   - Define interfaces and types used throughout the application
   - Ensure type safety and code consistency

4. **Styles**
   - Located in `src/styles/`
   - Define styling for components and UI elements

### Data Flow

The application follows a unidirectional data flow:

1. User interactions trigger component events
2. Component events call service methods
3. Services perform business logic and update state
4. Updated state flows back to components for rendering
5. Components render based on the latest state

### State Management

The application uses a combination of:

1. **Service Singletons** - For global application state
2. **React Hooks** - For component-level state
3. **Context API** - For passing state down the component tree

### Core Services

The application is built around several core services:

- **ChatService** - Manages conversations and message handling
- **AIService** - Interfaces with AI providers
- **SettingsService** - Manages user preferences and application settings
- **DatabaseIntegrationService** - Handles local data persistence

### API Integration

The application integrates with various AI providers through a provider abstraction layer:

- Provider interfaces are defined in `src/services/core/ai-service-provider.ts`
- Concrete provider implementations are located in `src/services/providers/`
- The `ProviderFactory` creates provider instances based on configuration

### User Interface

The UI is organized into several main sections:

- Chat interface for conversations
- Settings panel for customization
- Conversation management sidebar
- Model selection controls

### Database Integration

The application uses local storage for persistent data:

- Conversations and messages are stored locally
- User settings are persisted between sessions
- Database operations are encapsulated in the DatabaseIntegrationService 