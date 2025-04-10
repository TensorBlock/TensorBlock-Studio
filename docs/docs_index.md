# TensorBlock Studio API Documentation

This documentation provides a comprehensive overview of the TensorBlock Studio application architecture, modules, and APIs.

## Documentation Structure

- [Overview](overview.md) - Architecture and system overview
- [Components](components.md) - UI components documentation
- [Services](services.md) - Core services documentation
- [Types](types.md) - Data types and interfaces
- [Code Style Guide](CODE_STYLE_GUIDE.md) - Coding standards and best practices
- [Contributing Guide](CONTRIBUTING.md) - Guidelines for contributing to the project

## Project Overview

TensorBlock Studio is a web-based chat application that interfaces with various AI providers. It provides a convenient interface for managing conversations, integrating with AI services, and customizing user experience through settings.

Key features:
- Chat interface with AI providers
- Message streaming support  
- Conversation management (folders, history)
- Settings customization
- Web search capabilities
- Database integration

## Architecture

The application follows a modular architecture with several key components:

1. **UI Components** - React-based UI components for rendering the application interface
2. **Services** - Core business logic and integration services
3. **Types** - Shared data types and interfaces
4. **Database** - Local database for persistent storage

The application uses a singleton pattern for service instances and maintains separation between UI components and business logic. 