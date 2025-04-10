# Contributing to TensorBlock Studio

Thank you for your interest in contributing to TensorBlock Studio! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

All contributors are expected to adhere to our code of conduct, which promotes a welcoming and inclusive environment for everyone.

## Getting Started

### Setting Up the Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** to your local machine:
   ```bash
   git clone https://github.com/yourusername/TensorBlock-Studio.git
   cd TensorBlock-Studio
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Add any required API keys or configuration values

### Development Workflow

1. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
2. **Make your changes** following our [Code Style Guide](CODE_STYLE_GUIDE.md)
3. **Run the development server**:
   ```bash
   npm run dev
   ```
4. **Test your changes** to ensure they work as expected

## Submitting Changes

### Pull Requests

1. **Commit your changes** with clear, descriptive commit messages:
   ```bash
   git commit -m "Add: implementation of feature X"
   ```
2. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Open a Pull Request** against the main repository:
   - Provide a clear title and description
   - Reference any related issues
   - Fill out the pull request template

### Pull Request Guidelines

- Keep PRs focused on a single feature or bugfix
- Make sure your code follows our [Code Style Guide](CODE_STYLE_GUIDE.md)
- All tests must pass
- Update documentation for any changes to APIs or features
- Include screenshots or GIFs for UI changes when possible

## Development Standards

### Testing

- Write tests for new features and bugfixes
- Ensure all existing tests pass before submitting a PR
- Run tests locally with:
  ```bash
  npm run test
  ```

### Documentation

- Update documentation when changing or adding features
- Document new components and functions with JSDoc comments
- Update README.md if your changes affect how users interact with the application

### Code Quality

- Follow the TypeScript and React best practices outlined in our [Code Style Guide](CODE_STYLE_GUIDE.md)
- Use ESLint to ensure code quality:
  ```bash
  npm run lint
  ```

## Feature Requests and Bug Reports

- Use the GitHub issue tracker to report bugs or request features
- Check for existing issues before creating a new one
- Provide detailed steps to reproduce bugs
- Include information about your environment (OS, browser, etc.)

## Project Structure

```
├── app/ # Electron main process files
├── docs/ # Documentation
├── src/
│   ├── components/ # React components
│   ├── services/ # Application services
│   ├── styles/ # Global styles
│   └── types/ # TypeScript type definitions
```

## Communication

- Use GitHub issues for bug reports and feature requests
- Join our community discussions for general questions and ideas

Thank you for contributing to TensorBlock Studio! 