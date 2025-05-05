# SHC Implementation Status Checklist

This checklist is derived from the specifications in the `specs/` directory. Each item must be implemented and verified for compliance before it is checked off.

## Current Goals

- [x] Get the plugins working with the CLI client via. adding a path pluggin to the config and loading it, validate that it works
- [x] Refactor configuration path resolution and collection management from CLI to core package (see tasks/refactor-config-path-resolution.md)
- [x] Implement missing CLI features according to specification (see tasks/implement-missing-cli-features.md)
- [x] Refactor CLI package for testability with a makeProgram() function (see tasks/refactor-cli-for-testability.md)
- [x] Improve CLI package test coverage to meet project thresholds (see tasks/improve-cli-test-coverage.md)
- [ ] Implement variable set override per request functionality (see tasks/implement-variable-set-override-per-request.md)

## Monorepo & Architecture
- [x] Turborepo setup and configuration (`turbo.json`)
- [-] Monorepo structure: `packages/core`, `packages/web-ui`, `packages/cli`, `packages/neovim-ui`
- [-] Shared `configs/` and example `apps/`
- [x] A working config in the `configs` directory that can be used for demoing, should talk to httpbin and other public API's
- [x] pnpm workspace configuration and best practices
- [ ] CI/CD pipeline with pnpm and coverage enforcement

## Core Package (`@shc/core`)
- [x] HTTP client API (Axios-based, ESM + CJS build)
  - [x] `request`, `get`, `post`, `put`, `delete`, `patch`, `head`, `options` methods
  - [x] Default header, timeout, base URL configuration
  - [x] Event handling (`on`, `off`)
- [x] Plugin system
  - [x] Plugin registration, removal, and lifecycle management
  - [x] RequestPreprocessorPlugin
    - [x] Interface definition
    - [x] Registration and application in request pipeline
    - [x] Configuration and option handling
    - [x] Unit/integration tests
  - [x] ResponseTransformerPlugin
    - [x] Interface definition
    - [x] Registration and application in response pipeline
    - [x] Configuration and option handling
    - [x] Unit/integration tests
  - [x] AuthProviderPlugin
    - [x] Interface definition
    - [x] Registration and usage in authentication pipeline
    - [x] Configuration and option handling
    - [x] Unit/integration tests
  - [x] Plugin events and error handling
  - [x] Plugin loading mechanisms
    - [x] Load plugin from npm package
      - [x] Implementation of npm plugin loader
      - [x] Error handling for npm plugins
      - [x] Tests for npm plugin loading
    - [x] Load plugin from local path
      - [x] Implementation of path plugin loader
      - [x] Error handling for path plugins
      - [x] Tests for path plugin loading
    - [x] Load plugin from git repository
      - [x] Implementation of git plugin loader
      - [x] Error handling for git plugins
      - [x] Tests for git plugin loading
    - [x] Plugin loading works without requiring global git or pnpm
      - [x] Core package bundles or manages required binaries/dependencies
      - [x] Programmatic APIs or embedded binaries are used when possible
      - [x] Clear error/fallback if global tools are missing and unavoidable
    - [x] Thorough plugin installation tests (future real-world plugins)
      - [ ] Test loading from npm (with dependencies, various entrypoints)
      - [x] Test loading from git (with dependencies, various entrypoints, refs)
      - [ ] Test loading from local path (absolute/relative, with dependencies)
      - [x] Test error handling for invalid plugins and missing dependencies
- [x] Configuration management
  - [x] YAML/JSON config loading
  - [x] Variable sets, environment, and secret management
  - [x] Template engine for `${namespace.function(args)}`
  - [x] Schema validation (Zod)
- [x] Collection management
  - [x] Collection file parsing (YAML/JSON)
  - [x] Request/collection CRUD operations
  - [x] Variable set overrides, authentication, and plugin config
- [x] Request management
  - [x] Request execution pipeline
  - [x] Request/response hooks
  - [x] Request/response validation and transformation
- [x] Test suite (Vitest + coverage thresholds)
- [x] TypeDoc documentation

## Base Plugins
- [x] Request/response logging plugin
  - [x] Core functionality implementation
  - [x] ESLint setup and passing
  - [x] Prettier setup and passing
  - [x] Vitest setup with test coverage and passing
  - [x] Build configuration and working
- [x] Request rate limiting plugin
  - [x] Core functionality implementation
  - [x] ESLint setup and passing
  - [x] Prettier setup and passing
  - [x] Vitest setup with test coverage
  - [x] Build configuration and working
- [ ] Response cache plugin
  - [ ] Core functionality implementation
  - [ ] ESLint setup and passing
  - [ ] Prettier setup and passing
  - [ ] Vitest setup with test coverage and passing
  - [ ] Build configuration and working
- [ ] Auth provider plugin (OAuth2, API Key, etc.)
  - [ ] Core functionality implementation
  - [ ] ESLint setup and passing
  - [ ] Prettier setup and passing
  - [ ] Vitest setup with test coverage and passing
  - [ ] Build configuration and working
- [x] Plugin configuration and best practices

## CLI Package (`@shc/cli`)
- [x] Direct request mode
  - [x] HTTP method and URL execution
  - [x] Header, data, query, and auth options
- [x] Collection mode
  - [x] Run requests from collections
  - [x] Support for environment variables
- [x] List command
  - [x] List collections
  - [x] List requests within collections
- [x] Global options
  - [x] Config file path
  - [x] Set config values
  - [x] Verbose/silent modes
  - [x] Output format selection
  - [x] Color control
- [x] Request execution (all HTTP methods)
- [x] Collection and environment management
- [x] Variable and authentication management
- [x] Response viewer and output formatting
  - [x] Built-in formatters (JSON, YAML, Raw, Table)
  - [x] Support for custom formatters via plugins
- [x] Command options and flags
- [-] Autocomplete & Tab Completion
  - [x] Collection name completion
  - [x] Request name completion within collections
  - [x] Dynamic suggestions based on available collections/requests
  - [x] Multi-level completion with Tab cycling
  - [-] Shell compatibility (bash, zsh, fish)
- [x] CLI Extension System
  - [x] Plugin loading mechanisms
    - [x] Load from npm packages
    - [x] Load from local paths
    - [x] Load from git repositories
    - [x] Auto-discovery from plugin directories
  - [x] Plugin types
    - [x] Output formatter plugins
    - [x] Custom command plugins
    - [x] Shell completion plugins
    - [x] Response visualizer plugins
  - [x] Plugin configuration in CLI config
  - [x] Plugin lifecycle management
  - [x] Integration with core package plugins
- [-] Integration features
  - [x] Pipe support (stdin/stdout)
  - [-] Shell completion
  - [x] Exit codes
  - [x] Environment variables
- [x] Test suite

## Web UI Package (`@shc/web-ui`)
- [ ] Request management interface (builder, history, preview)
- [ ] Collection editor (tree navigation, import/export)
- [ ] Environment and variable management UI
- [ ] Request builder components (method, URL, headers, body, etc.)
- [ ] Response viewer (status, headers, body)
- [ ] Extension marketplace and plugin management UI
- [ ] Responsive design, dark/light theme, accessibility
- [ ] Keyboard shortcuts
- [ ] Test suite

## Neovim UI Package (`@shc/neovim-ui`)
- [ ] Request explorer (tree view, search)
- [ ] Request editor (method, URL, headers, body)
- [ ] Response viewer (status, headers, body)
- [ ] Collection and variable set management
- [ ] Environment and plugin management
- [ ] Request execution and response display
- [ ] Lua API integration
- [ ] Test suite

## Request Management
- [ ] Collection file format compliance (YAML/JSON)
- [ ] Request/collection organization, categorization, and tagging
- [ ] Search and filter capabilities
- [ ] Request property support (method, path, headers, query, body, auth)
- [ ] Response handling rules

## Configuration System
- [x] YAML/JSON config file support
- [x] Core, variable sets, logging, plugins, security policies
- [x] Environment and secret management
- [x] Schema validation and error reporting

## General
- [ ] TypeScript strict mode and best practices
- [ ] Coverage thresholds: Statements 80%, Branches 65%, Functions 80%, Lines 80%
- [ ] Linting and formatting
- [ ] Documentation for all public APIs and features

---

**Legend:**
- [ ] = Not started 
- [-] = In progress
- [x] = Complete

*Update this checklist as features are implemented or specifications change.*