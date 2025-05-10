# Sam's HTTP Client (SHC) Specifications

## Overview

This document provides an overview of the specifications for Sam's HTTP Client (SHC), a versatile, pluggable HTTP client application built as a monorepo.

## Repository Structure

The application is organized as a monorepo with the following packages:

### @shc/core

Core functionality including:

- HTTP client implementation
- Extension/plugin system
- Configuration management
- Variable sets management
- Collection management
- Request/response pipeline
- Authentication system

### @shc/web-ui

Modern web interface built on React, providing:

- Request builder and manager
- Collection management
- Variable set configuration
- Response visualization

### @shc/cli

Command-line interface offering:

- Direct request execution
- Collection-based operations
- Interactive TUI mode
- Shell integration

### @shc/neovim-ui

Neovim-based interface providing:

- Native Neovim integration
- Vim-style keybindings and navigation
- Collection and variable set management
- Advanced response manipulation
- Plugin system integration

### Base Plugins

A collection of core plugins providing essential functionality:

- Request/Response Logging
- Request Rate Limiting
- Response Caching
- Request Retry
- OAuth2 Authentication
- Response Transform
- Request Template

These plugins are maintained in the `/plugins` directory at the root of the repository, with each plugin in its own subdirectory.

## Specification Index

| Package        | Description                                | Link                                     |
| -------------- | ------------------------------------------ | ---------------------------------------- |
| @shc/core      | Core HTTP client and foundational features | [Core Package](/specs/core/)             |
| @shc/web-ui    | Web user interface                         | [Web UI](/specs/web-ui.md)               |
| @shc/cli       | Command-line interface                     | [CLI Interface](/specs/cli-interface.md) |
| @shc/neovim-ui | Neovim-based interface                     | [Neovim UI](/specs/neovim-ui.md)         |
| Base Plugins   | Core plugin implementations                | [Base Plugins](/specs/base-plugins.md)   |

## Supporting Specifications

| Component             | Description                           | Link                                                     |
| --------------------- | ------------------------------------- | -------------------------------------------------------- |
| Monorepo Architecture | Monorepo structure and configuration  | [Monorepo](/specs/monorepo.md)                           |
| Configuration         | Global configuration and variable sets | [Configuration](/specs/configuration.md)                 |
| Request Management    | Collection and request organization   | [Request Management](/specs/request-management.md)       |

## Package Dependencies

```mermaid
graph TD
    Core[@shc/core]
    Web[@shc/web-ui]
    CLI[@shc/cli]
    Neovim[@shc/neovim-ui]
    Plugins[Base Plugins]

    Web --> Core
    CLI --> Core
    Neovim --> Core
    Plugins -.-> Core
```

## Core Features

### HTTP Client

- Standard HTTP method support (GET, POST, PUT, DELETE, etc.)
- Request customization (headers, query params, body)
- Response handling and parsing
- Advanced features (SSL/TLS, redirects, retries)

### Variable Sets

- Global and collection-specific variable sets
- Value switching for different contexts
- Collection-level overrides
- Template resolution and substitution

### Plugin System

- Pluggable architecture for core components
- Standard interfaces for extensions
- Request/response pipeline hooks
- Multiple plugin sources (npm, local, git)
- Plugin lifecycle management

### Collection Management

- Request organization and grouping
- Variable set integration
- Request templating
- Collection-level configuration

### Configuration

- YAML/JSON configuration format
- Environment variable support
- Plugin configuration
- Storage configuration
- Core settings management
