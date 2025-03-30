# Settings Service API

The Settings Service module provides functionality for managing user settings, including API keys and provider configurations.

## `SettingsService` Class

Singleton service for managing user settings.

```typescript
export class SettingsService {
  private static instance: SettingsService;
  private settings: UserSettings;

  // Singleton Access
  public static getInstance(): SettingsService;
  private constructor();

  // Settings Management
  private loadSettings(): UserSettings;
  private saveSettings(): void;
  public getSettings(): UserSettings;
  public updateSettings(newSettings: Partial<UserSettings>): UserSettings;
  public resetSettings(): void;

  // API Key Management
  public getApiKey(provider?: string): string;
  public setApiKey(apiKey: string, provider?: string): void;

  // Provider Settings Management
  public getProviderSettings(provider?: string): ProviderSettings;
  public updateProviderSettings(settings: Partial<ProviderSettings>, provider?: string): void;

  // Model Selection
  public getSelectedModel(): string;
  public setSelectedModel(model: string): void;

  // Provider Selection
  public getSelectedProvider(): string;
  public setSelectedProvider(provider: string): void;
}
```

## Interfaces

### `ProviderSettings`

Provider-specific settings interface.

```typescript
export interface ProviderSettings {
  apiKey: string;
  organizationId?: string;
  apiVersion?: string;
  baseUrl?: string;
  // Custom provider endpoints
  completionsEndpoint?: string;
  chatCompletionsEndpoint?: string;
  modelsEndpoint?: string;
  // Models and capabilities
  models?: string[];
  capabilities?: string[];
}
```

### `UserSettings`

User settings interface.

```typescript
export interface UserSettings {
  providers: {
    [key: string]: ProviderSettings;
  };
  selectedProvider: string;
  selectedModel: string;
}
```

## Constants

```typescript
const DEFAULT_SETTINGS: UserSettings = {
  providers: {
    OpenAI: {
      apiKey: '',
      organizationId: '',
    },
    Anthropic: {
      apiKey: '',
      apiVersion: '2023-06-01',
    },
    Gemini: {
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com',
      apiVersion: 'v1',
    },
    Fireworks: {
      apiKey: '',
      baseUrl: 'https://api.fireworks.ai/inference/v1',
    },
    Together: {
      apiKey: '',
      baseUrl: 'https://api.together.xyz/v1',
    },
    OpenRouter: {
      apiKey: '',
      baseUrl: 'https://openrouter.ai/api/v1',
    },
    Custom: {
      apiKey: '',
      baseUrl: '',
      completionsEndpoint: '/completions',
      chatCompletionsEndpoint: '/chat/completions',
      modelsEndpoint: '/models',
      models: ['default-model'],
      capabilities: ['TextCompletion', 'ChatCompletion']
    }
  },
  selectedProvider: 'OpenAI',
  selectedModel: 'gpt-3.5-turbo',
};

const SETTINGS_STORAGE_KEY = 'tensorblock_settings';
export const SETTINGS_CHANGE_EVENT = 'tensorblock_settings_change';
```

## Events

The Settings Service dispatches a custom event when settings are changed:

```typescript
window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, {
  detail: { ...this.settings }
}));
```

## Usage Examples

### Getting the Settings Service Instance

```typescript
const settingsService = SettingsService.getInstance();
```

### Updating API Key

```typescript
settingsService.setApiKey('your-api-key-here', 'OpenAI');
```

### Getting Provider Settings

```typescript
const openAISettings = settingsService.getProviderSettings('OpenAI');
```

### Changing Selected Provider

```typescript
settingsService.setSelectedProvider('Anthropic');
```

### Updating Provider Settings

```typescript
settingsService.updateProviderSettings({
  baseUrl: 'https://custom-api-endpoint.com',
  apiVersion: '2024-01-01'
}, 'Custom');
``` 