# @shc/cli

SHC Command Line Interface - A powerful HTTP client for the command line.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [Direct HTTP Requests](#direct-http-requests)
  - [Collection Requests](#collection-requests)
  - [List Command](#list-command)
  - [Completion Command](#completion-command)
- [Configuration](#configuration)
  - [Configuration File](#configuration-file)
  - [Environment Variables](#environment-variables)
  - [Command-line Options](#command-line-options)
  - [Path Resolution](#path-resolution)
- [Collections](#collections)
  - [Collection Format](#collection-format)
  - [Collection Examples](#collection-examples)
- [Plugins](#plugins)
  - [Plugin Types](#plugin-types)
  - [Creating Plugins](#creating-plugins)
  - [Loading Plugins](#loading-plugins)
- [Shell Completions](#shell-completions)
- [Output Formats](#output-formats)
- [Development](#development)
  - [Building](#building)
  - [Testing](#testing)
  - [Linting](#linting)

## Installation

### Global Installation

```bash
# Install globally with pnpm
pnpm add -g @shc/cli

# Verify installation
shc --version
```

### Local Installation

```bash
# Install in your project
pnpm add @shc/cli

# Run using npx
pnpm exec shc --version
```

### From Source

```bash
# Clone the repository
git clone https://github.com/your-org/shc.git
cd shc

# Install dependencies
pnpm install

# Build the packages
pnpm build

# Run the CLI
pnpm --filter @shc/cli exec shc get https://example.com
```

## Quick Start

```bash
# Make a GET request
shc get https://example.com

# Make a POST request with JSON data
shc post https://api.example.com/users -H "Content-Type: application/json" -d '{"name": "John Doe"}'

# Use a collection
shc collection httpbin get-request

# List available collections
shc list collections

# Enable shell completion (Bash)
source <(shc completion bash)
```

## Commands

### Direct HTTP Requests

The CLI supports all standard HTTP methods:

```bash
# GET request
shc get https://example.com

# POST request with data
shc post https://example.com/api -d '{"key": "value"}'

# PUT request
shc put https://example.com/api/resource/1 -d '{"updated": true}'

# PATCH request
shc patch https://example.com/api/resource/1 -d '{"status": "active"}'

# DELETE request
shc delete https://example.com/api/resource/1

# HEAD request
shc head https://example.com

# OPTIONS request
shc options https://example.com
```

#### Options for Direct Requests

- `-H, --header <header...>` - Add header (key:value)
- `-q, --query <query...>` - Add query parameter (key=value)
- `-d, --data <data>` - Request body (JSON or string)
- `-u, --auth <auth>` - Authentication (format: type:credentials)
- `-t, --timeout <ms>` - Request timeout in milliseconds
- `-o, --output <format>` - Output format (json, yaml, raw, table)
- `-v, --verbose` - Verbose output
- `-s, --silent` - Silent mode
- `--no-color` - Disable colors

### Collection Requests

Execute requests stored in collection files:

```bash
# Execute a request from a collection
shc collection httpbin get-request

# Alias for collection command
shc c httpbin get-request

# Override request parameters
shc collection httpbin get-request -H "Accept: application/json" -q "param=value"
```

#### Options for Collection Requests

- `--collection-dir <dir>` - Collection directory
- `-H, --header <header...>` - Add or override header
- `-q, --query <query...>` - Add or override query parameter
- `-d, --data <data>` - Override request body
- `-u, --auth <auth>` - Override authentication
- `-t, --timeout <ms>` - Request timeout in milliseconds
- `-o, --output <format>` - Output format (json, yaml, raw, table)
- `-v, --verbose` - Verbose output
- `-s, --silent` - Silent mode
- `--no-color` - Disable colors

### List Command

List collections and requests:

```bash
# List all collections
shc list collections

# List requests in a collection
shc list requests httpbin

# Alias for list command
shc ls collections
```

### Completion Command

Generate shell completion scripts:

```bash
# Generate Bash completion script
shc completion bash > ~/.shc-completion.bash
echo 'source ~/.shc-completion.bash' >> ~/.bashrc

# Generate Zsh completion script
shc completion zsh > ~/.zsh/_shc

# Generate Fish completion script
shc completion fish > ~/.config/fish/completions/shc.fish
```

## Configuration

The CLI uses the `@shc/core` package's `ConfigManager` for all configuration-related operations.

### Configuration File

Configuration is loaded from:

1. Default configuration file (`shc.config.yaml` or `shc.config.json` in the current directory)
2. Custom configuration file specified with the `--config` option

Example configuration file (YAML):

```yaml
# shc.config.yaml
storage:
  collections:
    path: "./collections"

client:
  baseUrl: "https://api.example.com"
  timeout: 5000
  headers:
    User-Agent: "SHC-CLI/0.1.0"

cli:
  defaultFormat: "json"
  plugins:
    - name: "json-visualizer"
      path: "./plugins/json-visualizer"
    - name: "rate-limiter"
      package: "@shc/cli-plugin-rate-limiter"
      version: "1.0.0"
```

Example configuration file (JSON):

```json
{
  "storage": {
    "collections": {
      "path": "./collections"
    }
  },
  "client": {
    "baseUrl": "https://api.example.com",
    "timeout": 5000,
    "headers": {
      "User-Agent": "SHC-CLI/0.1.0"
    }
  },
  "cli": {
    "defaultFormat": "json",
    "plugins": [
      {
        "name": "json-visualizer",
        "path": "./plugins/json-visualizer"
      },
      {
        "name": "rate-limiter",
        "package": "@shc/cli-plugin-rate-limiter",
        "version": "1.0.0"
      }
    ]
  }
}
```

### Environment Variables

Environment variables can be used in configuration files using the `${env.VAR_NAME}` syntax:

```yaml
client:
  baseUrl: "${env.API_BASE_URL}"
  headers:
    Authorization: "Bearer ${env.API_TOKEN}"
```

### Command-line Options

Command-line options override configuration file settings:

```bash
# Override config file
shc get https://example.com --config custom-config.yaml

# Set individual config values
shc get https://example.com --set client.timeout=10000 --set client.headers.Accept=application/json

# Specify environment
shc get https://example.com --env production
```

### Path Resolution

Paths in the configuration (such as collection directories) are resolved as follows:

- Absolute paths are used as-is
- Relative paths are resolved relative to:
  - The configuration file's directory (if a config file is specified)
  - The current working directory (if no config file is specified)

## Collections

Collections are a way to organize and store HTTP requests for reuse. They are stored as YAML or JSON files in the collections directory.

### Collection Format

Collections can be defined in two formats:

#### Object-based Format

```yaml
# collections/example.yaml
baseUrl: https://api.example.com
requests:
  get-users:
    method: GET
    path: /users
    description: Get all users
    headers:
      Accept: application/json
  
  create-user:
    method: POST
    path: /users
    description: Create a new user
    headers:
      Content-Type: application/json
    data:
      name: John Doe
      email: john@example.com
```

#### Array-based Format

```yaml
# collections/example.yaml
baseUrl: https://api.example.com
requests:
  - id: get-users
    name: Get Users
    method: GET
    path: /users
    description: Get all users
    headers:
      Accept: application/json
  
  - id: create-user
    name: Create User
    method: POST
    path: /users
    description: Create a new user
    headers:
      Content-Type: application/json
    data:
      name: John Doe
      email: john@example.com
```

### Collection Examples

#### Basic HTTP Collection

```yaml
# collections/httpbin.yaml
baseUrl: https://httpbin.org
requests:
  get-request:
    method: GET
    path: /get
    description: Simple GET request
  
  post-request:
    method: POST
    path: /post
    description: Simple POST request
    headers:
      Content-Type: application/json
    data:
      key: value
  
  auth-request:
    method: GET
    path: /basic-auth/user/pass
    description: Basic auth request
    auth:
      type: basic
      username: user
      password: pass
```

## Plugins

The CLI supports plugins to extend its functionality. Plugins can add new commands, output formatters, response visualizers, and shell completions.

### Plugin Types

- **Output Formatters**: Format response data in different ways
- **Custom Commands**: Add new commands to the CLI
- **Shell Completions**: Provide tab completion for different shells
- **Response Visualizers**: Visualize response data in different ways

### Creating Plugins

A basic plugin structure:

```typescript
// my-plugin.js
import { CLIPlugin, CLIPluginType, CLIPluginContext } from '@shc/cli';

const myPlugin: CLIPlugin = {
  name: 'my-plugin',
  type: CLIPluginType.OUTPUT_FORMATTER,
  version: '1.0.0',
  description: 'My custom plugin',
  register: (context: CLIPluginContext) => {
    // Register an output formatter
    context.registerOutputFormatter('custom', (data) => {
      return `Custom format: ${JSON.stringify(data, null, 2)}`;
    });
    
    // Register a custom command
    context.registerCommand('hello', async (args, options) => {
      console.log(`Hello, ${args[0] || 'World'}!`);
    });
  }
};

export default myPlugin;
```

### Loading Plugins

Plugins can be loaded from:

1. NPM packages
2. Local paths
3. Git repositories
4. Global plugin directory (`~/.shc/cli-plugins`)
5. Project-specific plugin directory (`./cli-plugins`)

Configure plugins in the configuration file:

```yaml
cli:
  plugins:
    - name: my-formatter
      path: ./plugins/my-formatter
    
    - name: npm-plugin
      package: shc-cli-plugin-name
      version: 1.0.0
    
    - name: git-plugin
      git: https://github.com/user/shc-plugin.git
      ref: main
```

## Shell Completions

The CLI provides tab completion for Bash, Zsh, and Fish shells.

### Bash Completion

```bash
# Generate and source the completion script
source <(shc completion bash)

# Or save it to a file
shc completion bash > ~/.shc-completion.bash
echo 'source ~/.shc-completion.bash' >> ~/.bashrc
```

### Zsh Completion

```bash
# Generate and save the completion script
shc completion zsh > ~/.zsh/_shc

# Make sure the directory is in your fpath
echo 'fpath=(~/.zsh $fpath)' >> ~/.zshrc
echo 'autoload -Uz compinit && compinit' >> ~/.zshrc
```

### Fish Completion

```bash
# Generate and save the completion script
shc completion fish > ~/.config/fish/completions/shc.fish
```

## Output Formats

The CLI supports multiple output formats:

- **json**: Pretty-printed JSON (default)
- **yaml**: YAML format
- **raw**: Raw response body
- **table**: Tabular format for structured data

```bash
# Output as JSON (default)
shc get https://example.com

# Output as YAML
shc get https://example.com -o yaml

# Output as raw text
shc get https://example.com -o raw

# Output as table
shc get https://example.com -o table
```

## Development

### Building

```bash
# Build the package
pnpm build
```

### Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Linting

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Check formatting
pnpm prettier

# Fix formatting issues
pnpm prettier:fix
```

### Type Checking

```bash
# Run type checker
pnpm typecheck
