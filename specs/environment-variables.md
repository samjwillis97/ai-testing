# Environment Variables System

## Overview

A comprehensive environment variable system integrated into @shc/core for managing dynamic configurations across all packages.

## Core Features

### Variable Types

- String values
- Number values
- Boolean values
- Secret values (encrypted)
- JSON objects
- Arrays
- References to other variables

### Scope Levels

- Global scope
- Collection scope
- Request scope
- Plugin scope
- Runtime scope

### Variable Resolution

- Hierarchical resolution
- Environment-specific overrides
- Default values
- Fallback chains
- Circular reference detection

### Security Features

- Encrypted storage for secrets
- Access control per scope
- Masking in logs
- Secure transmission
- Audit logging

### Integration Points

#### Core Package (@shc/core)

- Variable parsing engine
- Storage mechanisms
- Security controls
- API for other packages

#### Web UI (@shc/web-ui)

- Environment editor
- Variable management interface
- Secret input handling
- Value preview

#### CLI (@shc/cli)

- Environment selection
- Variable override flags
- Secret input prompts
- Environment file handling

### File Format

```yaml
name: Development
description: Development environment configuration
variables:
  # Simple values
  API_URL: 'http://localhost:3000'
  DEBUG: true

  # Structured data
  database:
    host: 'localhost'
    port: 5432
    credentials:
      username: 'dev_user'
      password: '{{ secrets.DB_PASSWORD }}'

  # Arrays
  allowed_origins:
    - 'http://localhost:8080'
    - 'http://127.0.0.1:8080'

  # References
  api_endpoint: '{{ variables.API_URL }}/v1'

secrets:
  DB_PASSWORD: 'encrypted:abc123...'
```

## Management Features

- Create/update/delete environments
- Import/export configurations
- Variable validation
- Type checking
- Reference validation
- Secret rotation

## Best Practices

- Environment naming conventions
- Secret management workflow
- Variable organization
- Documentation requirements
- Security guidelines
