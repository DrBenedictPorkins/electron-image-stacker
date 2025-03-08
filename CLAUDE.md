# CLAUDE.md - Guidelines for Electron Image Stacker

## Build Commands
- `npm start` - Start the Electron application
- `npm install` - Install dependencies

## Code Style Guidelines

### General
- Use 4-space indentation
- Use ES6+ syntax
- Keep functions small and focused
- Follow the principle of separation of concerns

### Naming Conventions
- Use camelCase for variables and functions
- Use descriptive names that indicate purpose
- Use BEM-like naming for CSS classes

### Error Handling
- Use try/catch blocks for error-prone operations
- Log meaningful error messages
- Display user-friendly error messages in the UI

### Code Organization
- Keep renderer.js for UI-related code
- Keep main.js for Electron main process code
- Use preload.js for exposing APIs to renderer
- Separate concerns between UI and business logic

### Design Pattern
- Follow event-driven architecture pattern
- Use IPC for main/renderer process communication