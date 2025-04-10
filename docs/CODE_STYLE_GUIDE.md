# TensorBlock Studio Code Style Guide

This guide outlines the coding conventions and practices used in the TensorBlock Studio project. Following these guidelines ensures code consistency and maintainability across the codebase.

## General Formatting

- Use UTF-8 character encoding for all files
- Use spaces for indentation (2 spaces)
- Insert a final newline at the end of each file
- Trim trailing whitespaces
- Keep lines at a reasonable length (recommended 100 characters)

## TypeScript Guidelines

### Naming Conventions

- Use **camelCase** for variables, functions, and properties
- Use **PascalCase** for classes, interfaces, types, enums, and React components
- Use **UPPERCASE_SNAKE_CASE** for constants
- Prefix interfaces with `I` (e.g., `IUser`)
- Prefix types with `T` (e.g., `TConfig`)
- Prefix enum names with `E` (e.g., `EStatus`)

### Imports and Exports

- Use named exports for utility functions and components
- Use default exports for main component files
- Group imports in the following order:
  1. React and React-related libraries
  2. Third-party libraries
  3. Project modules (with relative paths)
  4. Types and interfaces
  5. Assets (styles, images, etc.)
- Use single quotes for imports

### TypeScript Best Practices

- Use explicit type annotations for function parameters and return types
- Use interfaces for object shapes when possible
- Avoid using `any` type; use more specific types or `unknown` when necessary
- Use TypeScript's built-in utility types when appropriate (e.g., `Partial<T>`, `Pick<T>`)
- Use optional chaining (`?.`) and nullish coalescing (`??`) operators

## React Guidelines

### Component Structure

- Prefer functional components with hooks over class components
- Keep components focused on a single responsibility
- Extract complex logic into custom hooks
- Extract reusable UI elements into separate components
- Use React fragments (`<>...</>`) to avoid unnecessary DOM elements

### Props and State

- Destructure props in function parameters
- Define prop types using TypeScript interfaces
- Use the useState hook for component state
- Use the useEffect hook for side effects
- Follow the React hooks rules (only call hooks at the top level)

### Event Handling

- Use arrow functions for event handlers
- Name event handlers with the format `handle{Event}` (e.g., `handleClick`)
- Pass event handlers as props with the format `on{Event}` (e.g., `onClick`)

## CSS and Styling

- Use Tailwind CSS for styling components
- Follow a mobile-first approach when implementing responsive designs
- Use the `@apply` directive in CSS files only when necessary
- Keep styling consistent with the design system

## Testing

- Write tests for all new features
- Use descriptive test names that explain what is being tested
- Follow the Arrange-Act-Assert pattern in tests
- Mock external dependencies in unit tests

## Git Guidelines

- Write clear, concise commit messages in the imperative mood
- Keep commits focused on a single task or fix
- Reference issue numbers in commit messages when applicable
- Use feature branches for new features and bugfixes

## Documentation

- Add JSDoc comments for functions, interfaces, and classes
- Keep documentation up-to-date with code changes
- Document complex algorithms or business logic with inline comments
- Update the README.md and other documentation files when introducing significant changes

By adhering to these guidelines, we maintain a consistent and high-quality codebase that is easier to understand, maintain, and extend. 