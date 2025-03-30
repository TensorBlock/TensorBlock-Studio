# Components API

The Components module contains React UI components used throughout the application. These are organized into different categories based on their functionality.

## Layout Components

Components responsible for the overall application layout.

### `MainLayout`

Main layout wrapper that provides the application structure.

```typescript
import { FC, ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  // Component implementation
};

export default MainLayout;
```

## Chat Components

Components for the chat interface.

### `ChatMessageList`

Displays a list of chat messages.

```typescript
interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatMessageList: FC<ChatMessageListProps> = ({ messages, isLoading }) => {
  // Component implementation
};
```

### `ChatInput`

Input component for composing messages.

```typescript
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: FC<ChatInputProps> = ({ onSendMessage, disabled, placeholder }) => {
  // Component implementation
};
```

### `ChatMessage`

Individual chat message display.

```typescript
interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

const ChatMessage: FC<ChatMessageProps> = ({ message, isLatest }) => {
  // Component implementation
};
```

## Settings Components

Components for managing application settings.

### `ApiKeyInput`

Input for managing API keys.

```typescript
interface ApiKeyInputProps {
  provider: string;
  value: string;
  onChange: (value: string) => void;
}

const ApiKeyInput: FC<ApiKeyInputProps> = ({ provider, value, onChange }) => {
  // Component implementation
};
```

### `ModelSelector`

Component for selecting AI models.

```typescript
interface ModelSelectorProps {
  models: ModelOption[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  isLoading?: boolean;
}

const ModelSelector: FC<ModelSelectorProps> = ({ models, selectedModel, onSelectModel, isLoading }) => {
  // Component implementation
};
```

### `ProviderSelector`

Component for selecting AI providers.

```typescript
interface ProviderSelectorProps {
  providers: string[];
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
}

const ProviderSelector: FC<ProviderSelectorProps> = ({ providers, selectedProvider, onSelectProvider }) => {
  // Component implementation
};
```

## UI Components

Generic UI components used throughout the application.

### `Button`

Customized button component.

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: FC<ButtonProps> = ({ variant, size, isLoading, children, ...props }) => {
  // Component implementation
};
```

### `Modal`

Modal dialog component.

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  // Component implementation
};
```

## Core Components

Components for core application functionality.

### `DatabaseInitializer`

Component that initializes the database before rendering children.

```typescript
interface DatabaseInitializerProps {
  children: ReactNode;
}

const DatabaseInitializer: FC<DatabaseInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const dbService = new DatabaseService();
        await dbService.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err as Error);
      }
    };

    initialize();
  }, []);

  if (error) {
    return <div>Error initializing database: {error.message}</div>;
  }

  if (!isInitialized) {
    return <div>Initializing database...</div>;
  }

  return <>{children}</>;
};
```

## Component Organization

Components are organized in directories by their purpose:

```
src/components/
  ├── chat/        - Chat-related components
  ├── core/        - Core application components
  ├── layout/      - Layout components
  ├── models/      - Model-related components
  ├── settings/    - Settings components
  └── ui/          - Reusable UI components
```

## Component Patterns

Components follow these patterns:

1. **Props Interfaces**: Each component has a clearly defined props interface
2. **Functional Components**: Components are implemented as functional components with React hooks
3. **Composition**: Complex components are composed of smaller, reusable components
4. **Context Usage**: Components use React Context for accessing global state when needed 