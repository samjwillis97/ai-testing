# SHC Implementation Status Checklist

This checklist is derived from the specifications in the `specs/` directory. Each item must be implemented and verified for compliance before it is checked off.

## Monorepo & Architecture
- [ ] Turborepo setup and configuration (`turbo.json`)
- [ ] Monorepo structure: `packages/core`, `packages/web-ui`, `packages/cli`, `packages/neovim-ui`
- [ ] Shared `configs/` and example `apps/`
- [ ] pnpm workspace configuration and best practices
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
    - [ ] Plugin loading works without requiring global git or pnpm
      - [ ] Core package bundles or manages required binaries/dependencies
      - [ ] Programmatic APIs or embedded binaries are used when possible
      - [ ] Clear error/fallback if global tools are missing and unavoidable
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