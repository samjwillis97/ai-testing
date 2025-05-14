# Core Package (@shc/core) Specification

## Overview

The core package (@shc/core) is the foundation of SHC, providing HTTP client functionality, extension system, configuration management, and supporting features for other packages. It is the **exclusive provider** of configuration reading/parsing, variable sets management, plugin system implementation, and template resolution functionality for the entire SHC ecosystem.

### Exclusive Responsibilities

The following functionality **must only** be implemented in the core package and **never** duplicated in other packages:

- Configuration reading, parsing, and handling
- Variable sets management and resolution
- Plugin system implementation and core plugin management
- Template resolution and substitution
- Collection data structure and management
- HTTP client implementation

All other packages (@shc/cli, @shc/web-ui, @shc/neovim-ui) must rely on the core package for these features to ensure consistency and maintainability across the ecosystem.

## Technical Specifications

- Language: TypeScript
- Base HTTP library: Axios
- Module system: ES Modules with dual CJS support
  - Primary: ES Modules for modern environments
  - Secondary: CommonJS build for legacy support
  - Build tool: Rollup for dual-format compilation
  - Rationale:
    - Maximizes compatibility across Next.js and CLI environments
    - Enables modern ESM features while maintaining backwards compatibility
    - Allows gradual adoption in existing projects
    - Provides better tree-shaking and build optimization
- Package manager: pnpm (exclusively, as per project requirements)
- Testing framework: Vitest
- Documentation: TypeDoc

## Specification Documents

The core package specification is divided into the following documents:

1. [Functional Specification](./functional-spec.md) - Overview of the package's functionality and features
2. API Specifications:
   - [HTTP Client API](./api/http-client.md) - HTTP client functionality and request/response handling
   - [Configuration Management API](./api/config-manager.md) - Configuration loading, validation, and management
   - [Plugin System API](./api/plugin-system.md) - Plugin architecture, loading, and lifecycle management
   - [Template Engine API](./api/template-engine.md) - Template resolution and dynamic configuration
   - [Collection Management API](./api/collection-manager.md) - Collection handling and storage

## Quality Standards

The core package adheres to the following quality standards:

- Test coverage thresholds:
  - Statements: 80% minimum coverage
  - Branches: 65% minimum coverage
  - Functions: 80% minimum coverage
  - Lines: 80% minimum coverage
- TypeScript strict mode enabled
- ESLint for code quality enforcement
- Prettier for consistent code formatting
- Comprehensive documentation with examples

## Implementation Requirements

All implementations must follow the TypeScript best practices as defined in the project rules, including:

- Proper typing for all functions and methods
- Appropriate error handling
- Consistent async/await patterns
- Proper use of generics and type constraints
- Comprehensive test coverage
