# SHC Implementation Status Checklist

This checklist is derived from the specifications in the `specs/` directory. Each item must be implemented and verified for compliance before it is checked off.

## Monorepo & Architecture
- [ ] Turborepo setup and configuration (`turbo.json`)
- [ ] Monorepo structure: `packages/core`, `packages/web-ui`, `packages/cli`, `packages/neovim-ui`
- [ ] Shared `configs/` and example `apps/`
- [ ] pnpm workspace configuration and best practices
- [ ] CI/CD pipeline with pnpm and coverage enforcement

## Core Package (`@shc/core`)
- [ ] HTTP client API (Axios-based, ESM + CJS build)
  - [ ] `request`, `get`, `post`, `put`, `delete`, `patch`, `head`, `options` methods
  - [ ] Default header, timeout, base URL configuration
  - [ ] Event handling (`on`, `off`)
- [ ] Plugin system
  - [ ] Plugin registration, removal, and lifecycle management
  - [ ] RequestPreprocessorPlugin
    - [ ] Interface definition
    - [ ] Registration and application in request pipeline
    - [ ] Configuration and option handling
    - [ ] Unit/integration tests
  - [ ] ResponseTransformerPlugin
    - [ ] Interface definition
    - [ ] Registration and application in response pipeline
    - [ ] Configuration and option handling
    - [ ] Unit/integration tests
  - [ ] AuthProviderPlugin
    - [ ] Interface definition
    - [ ] Registration and usage in authentication pipeline
    - [ ] Configuration and option handling
    - [ ] Unit/integration tests
  - [ ] Plugin events and error handling
  - [ ] Plugin loading mechanisms
    - [ ] Load plugin from npm package
      - [ ] Implementation of npm plugin loader
      - [ ] Error handling for npm plugins
      - [ ] Tests for npm plugin loading
    - [ ] Load plugin from local path
      - [ ] Implementation of path plugin loader
      - [ ] Error handling for path plugins
      - [ ] Tests for path plugin loading
    - [ ] Load plugin from git repository
      - [ ] Implementation of git plugin loader
      - [ ] Error handling for git plugins
      - [ ] Tests for git plugin loading
- [ ] Configuration management
  - [ ] YAML/JSON config loading
  - [ ] Variable sets, environment, and secret management
  - [ ] Template engine for `${namespace.function(args)}`
  - [ ] Schema validation (Zod)
- [ ] Collection management
  - [ ] Collection file parsing (YAML/JSON)
  - [ ] Request/collection CRUD operations
  - [ ] Variable set overrides, authentication, and plugin config
- [ ] Request management
  - [ ] Request execution pipeline
  - [ ] Request/response hooks
  - [ ] Request/response validation and transformation
- [ ] Test suite (Vitest + coverage thresholds)
- [ ] TypeDoc documentation

## Base Plugins
- [ ] Request/response logging plugin
- [ ] Request rate limiting plugin
- [ ] Response cache plugin
- [ ] Auth provider plugin (OAuth2, API Key, etc.)
- [ ] Plugin configuration and best practices

## CLI Package (`@shc/cli`)
- [ ] Direct request mode
- [ ] Collection mode
- [ ] Interactive mode (TUI)
- [ ] Request execution (all HTTP methods)
- [ ] Collection and environment management
- [ ] Variable and authentication management
- [ ] Response viewer and output formatting
- [ ] Command options and flags
- [ ] Test suite

## Web UI Package (`@shc/web-ui`)
- [ ] Request management interface (builder, history, preview)
- [ ] Collection editor (tree navigation, import/export)
- [ ] Environment and variable management UI
- [ ] Request builder components (method, URL, headers, body, etc.)
- [ ] Response viewer (status, headers, body, metrics)
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
- [ ] YAML/JSON config file support
- [ ] Core, variable sets, logging, plugins, security policies
- [ ] Environment and secret management
- [ ] Schema validation and error reporting

## General
- [ ] TypeScript strict mode and best practices
- [ ] Coverage thresholds: Statements 80%, Branches 65%, Functions 80%, Lines 80%
- [ ] Linting and formatting
- [ ] Documentation for all public APIs and features

---

**Legend:**
- [ ] = Not started / In progress
- [x] = Complete

*Update this checklist as features are implemented or specifications change.*