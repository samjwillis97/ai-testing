# Monorepo Architecture Specification

## Overview

This document outlines the monorepo architecture for the SHC project, utilizing Turborepo for efficient build orchestration and package management.

## Repository Structure

```
shc/
├── packages/
│   ├── core/           # Core package (@shc/core)
│   ├── web-ui/         # Web UI package (@shc/web-ui)
│   ├── cli/            # CLI package (@shc/cli)
│   └── neovim-ui/      # Neovim UI package (@shc/neovim-ui)
├── apps/               # Example applications and integration tests
├── configs/            # Shared configuration files
└── turbo.json         # Turborepo configuration
```

## Package Architecture

### Core Package
- Location: `packages/core`
- Package Name: `@shc/core`
- Purpose: Provides core functionality consumed by all UI packages
- Specification: [Core Package Specification](./core-package.md)
- Dependencies: Minimal external dependencies for maximum compatibility

### UI Packages

#### Web UI
- Location: `packages/web-ui`
- Package Name: `@shc/web-ui`
- Framework: Next.js
- Specification: [Web UI Specification](./web-ui.md)
- Dependencies:
  - `@shc/core`
  - React ecosystem packages

#### CLI Interface
- Location: `packages/cli`
- Package Name: `@shc/cli`
- Framework: Commander.js
- Specification: [CLI Interface Specification](./cli-interface.md)
- Dependencies:
  - `@shc/core`
  - CLI-specific utilities

#### Neovim UI
- Location: `packages/neovim-ui`
- Package Name: `@shc/neovim-ui`
- Framework: Neovim Plugin API
- Specification: [Neovim UI Specification](./neovim-ui.md)
- Dependencies:
  - `@shc/core`
  - Neovim-specific packages

## Build System

### Turborepo Configuration

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts", "test/**/*.tsx"]
    }
  }
}
```

## Workspace Configuration

### PNPM Workspace

The PNPM workspace configuration enables package management and dependency sharing across the monorepo. It allows packages to reference and depend on each other using workspace protocol (`workspace:*`).

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'  # All packages under packages directory
  - 'apps/*'      # All applications under apps directory
  - 'configs/*'   # Shared configuration packages
```

#### Workspace Benefits
- Symlinks packages instead of copying, saving disk space
- Ensures consistent dependency versions across packages
- Enables parallel installation and updates
- Prevents dependency hoisting issues
- Supports local package development and testing

#### Package References
Local packages can be referenced in `package.json` using the workspace protocol:

```json
{
  "dependencies": {
    "@shc/core": "workspace:*",     // Latest version
    "@shc/web-ui": "workspace:^1.0.0" // Specific version range
  }
}
```

#### Workspace Scripts
PNPM provides workspace-specific commands:
```bash
# Run command in all packages
pnpm -r build

# Run command in packages that have changed
pnpm -r --filter=[origin/main] build

# Run command in specific package and its dependencies
pnpm --filter @shc/web-ui... build
```

## Development Workflow

### Package Development
1. Core package changes must be backward compatible
2. UI packages can be developed independently
3. Version bumps follow semantic versioning
4. Changes affecting multiple packages require coordination

### Build Pipeline
1. Core package builds first
2. UI packages build in parallel after core
3. Integration tests run after all packages build
4. Documentation generates after successful builds

## Dependency Management

### Shared Dependencies
- React and related packages
- TypeScript configuration
- ESLint rules
- Testing frameworks

### Version Control
- Package versions managed independently
- Core package changes trigger dependent package updates
- Changesets used for version management

## CI/CD Integration

### Pipeline Stages
1. Install dependencies
2. Build packages
3. Run tests
4. Lint code
5. Generate documentation
6. Deploy (if on main branch)

### Caching Strategy
- Turborepo's remote caching enabled
- Dependency cache shared across builds
- Build artifacts cached per package

## Best Practices

### Monorepo Guidelines
1. Keep packages focused and minimal
2. Share code through core package
3. Maintain consistent coding standards
4. Document cross-package dependencies
5. Use workspace protocols for local dependencies

### Performance Considerations
1. Optimize build caching
2. Minimize duplicate dependencies
3. Use efficient workspace commands
4. Implement selective testing 