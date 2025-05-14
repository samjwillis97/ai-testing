# CLI Package (@shc/cli) Specification

## Overview

The CLI package provides a command-line interface for the SHC project, allowing users to execute HTTP requests, manage collections, and configure the application from the terminal. Built on top of @shc/core, it offers a comprehensive set of commands for working with HTTP requests.

## Specification Documents

- [Commands](./commands.md) - Detailed specification of the CLI commands and their options
- [Logging](./logging.md) - Specification of the centralized logging system
- [Completions](./completions.md) - Shell completion system specification
- [Integration](./integration.md) - How the CLI integrates with the Core package

## Core Features

### Command Structure

- Request execution commands
- Collection management commands
- Configuration commands
- Plugin management commands
- Environment and variable management
- Import/export functionality

### Logging System

- Centralized logging with Pino
- Log level-based approach (DEBUG, INFO, WARN, ERROR)
- Integrated spinner utility
- Consistent output formatting

### Shell Completions

- Dynamic completion generation
- Support for Bash, Zsh, and Fish shells
- Command and option autocompletion
- Context-aware suggestions

### Core Integration

- HTTP client integration
- Configuration management
- Plugin system integration
- Collection management

### Responsibility Boundaries

The CLI package **must not** re-implement functionality that belongs to the core package, including:

- Configuration reading, parsing, or handling
- Variable sets management or resolution
- Plugin system core implementation
- Template resolution or substitution
- Collection data structure or management
- HTTP client implementation

Instead, the CLI package should use the APIs provided by the core package for these features.

### CLI-Specific Plugin Handling

The only exception to the above rule is for CLI-specific visualization plugins that are exclusively relevant to the command-line interface. These plugins should:

- Still use the core plugin system architecture
- Only implement UI/visualization aspects specific to the CLI
- Not duplicate any core functionality

## Dependencies

- @shc/core: Core HTTP client and extension system
- Commander.js: Command-line interface framework
- Pino: Logging library
- Ora: Terminal spinner
- Inquirer: Interactive prompts
- Chalk: Terminal styling

## Implementation Requirements

All implementations must follow the TypeScript best practices as defined in the project rules, including:

- Proper typing for all functions and methods
- Appropriate error handling
- Consistent async/await patterns
- Proper use of generics and type constraints
- Comprehensive test coverage (minimum 80% for statements, functions, and lines)
