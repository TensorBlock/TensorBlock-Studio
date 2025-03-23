# TensorBlock Studio

An Electron-based desktop application for interacting with various AI models via API.

## Features

- Chat with AI via OpenAI's API
- Extensible architecture for adding multiple AI service providers
- Built with React, Vite, TypeScript, and TailwindCSS
- Electron for cross-platform desktop support

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/TensorBlock/TensorBlock-Studio.git
   cd tensorblock-studio
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory (based on `.env.example`):
   ```
   cp .env.example .env
   ```

4. Add your OpenAI API key to the `.env` file:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

### Development

Run the application in development mode:

```
npm run dev
```

### Building for Production

Build the application for production:

```
npm run build:prod
```

Package the application for your current platform:

```
npm run electron:build:current_platform
```

## Architecture

The AI service architecture is designed to be modular and extensible, allowing for easy integration of additional AI providers.

### Core Components

- **Http Client**: A robust HTTP client built on axios with automatic retry, rate limit tracking, and other features.
- **AI Service Provider**: Base class for all AI service providers with common functionality.
- **AI Service Manager**: Central manager for registering and accessing all AI service providers.

### Adding a New AI Provider

1. Create a new provider class in `src/services/providers/`:

```typescript
// example-provider.ts
import { 
  AiServiceProvider, 
  AIServiceCapability, 
  AiServiceConfig, 
  ChatMessage, 
  CompletionOptions 
} from '../core/ai-service-provider';

export class ExampleProvider extends AiServiceProvider {
  constructor(config?: Partial<AiServiceConfig>) {
    super({
      baseURL: 'https://api.example.com',
      apiKey: config?.apiKey || import.meta.env.VITE_EXAMPLE_API_KEY,
      ...config,
    });
  }

  get name(): string {
    return 'Example Provider';
  }

  get capabilities(): AIServiceCapability[] {
    return [
      AIServiceCapability.TextCompletion,
      AIServiceCapability.ChatCompletion,
    ];
  }

  get availableModels(): string[] {
    return ['example-model-1', 'example-model-2'];
  }

  protected async completionImplementation(prompt: string, options: CompletionOptions): Promise<string> {
    // Implement provider-specific completion logic
  }

  protected async chatCompletionImplementation(messages: ChatMessage[], options: CompletionOptions): Promise<ChatMessage> {
    // Implement provider-specific chat completion logic
  }
}
```

2. Register the provider in `src/services/ai-service-manager.ts`:

```typescript
import { ExampleProvider } from './providers/example-provider';

private registerDefaultProviders(): void {
  // Existing providers...
  
  // Add new provider
  const exampleApiKey = import.meta.env.VITE_EXAMPLE_API_KEY;
  if (exampleApiKey) {
    this.registerProvider(new ExampleProvider());
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See the LICENSE file for details. 