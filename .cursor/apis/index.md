# TensorBlock Studio API Documentation

TensorBlock Studio is a modern chat application designed to interface with various AI providers. This documentation outlines the API structure and functionality across the codebase.

## Modules

- [Core Service](./core-service.md) - Base abstractions and interfaces for the application services
- [AI Service](./ai-service.md) - Service for interacting with AI providers
- [Provider Services](./provider-services.md) - Implementations for various AI providers (OpenAI, Anthropic, etc.)
- [Settings Service](./settings-service.md) - Service for managing user settings
- [Database Service](./database-service.md) - Service for data persistence using IndexedDB
- [Chat Service](./chat-service.md) - Service for managing chat conversations
- [Components](./components.md) - React UI components used in the application
- [Pages](./pages.md) - Main application views/pages
- [Types](./types.md) - TypeScript type definitions used across the application

## Architecture Overview

TensorBlock Studio follows a modular design pattern with service-oriented architecture:

1. **User Interface Layer**: React components and pages for user interaction
2. **Service Layer**: Core services that handle business logic
3. **Data Layer**: Database services for data persistence
4. **Provider Layer**: Integrations with different AI providers

The application uses a singleton pattern for services and maintains a unidirectional data flow for state management. 