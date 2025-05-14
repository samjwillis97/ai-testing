# CLI Commands Specification

## Overview

This document specifies the command structure for the CLI package (@shc/cli). It outlines the available commands, their options, arguments, and behaviors.

## Command Architecture

The CLI uses Commander.js to define and manage commands. Each command follows a consistent structure and naming convention.

### Command Structure

```typescript
interface Command {
  name: string;
  description: string;
  arguments?: CommandArgument[];
  options?: CommandOption[];
  action: (args: any, options: any) => Promise<void>;
  subcommands?: Command[];
}

interface CommandArgument {
  name: string;
  description: string;
  required?: boolean;
  variadic?: boolean;
  default?: any;
}

interface CommandOption {
  flags: string;
  description: string;
  default?: any;
  required?: boolean;
  choices?: string[];
}
```

## Root Command

The root command provides general information and version details.

```
shc [options] [command]
```

### Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `-v, --version` | Display version information | |
| `-h, --help` | Display help for command | |
| `--config <path>` | Path to config file | `./shc.config.yaml` |
| `--quiet` | Output only response data without formatting or status information | `false` |
| `--no-color` | Disable colored output | |

## Request Commands

### Execute Request

```
shc request [options] <url>
```

Executes an HTTP request to the specified URL.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `url` | Target URL for the request | Yes |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-X, --method <method>` | HTTP method to use | `GET` |
| `-H, --header <header>` | HTTP header (can be used multiple times) | |
| `-d, --data <data>` | Request body data | |
| `-f, --form <form>` | Form data (can be used multiple times) | |
| `-q, --query <query>` | Query parameter (can be used multiple times) | |
| `-u, --auth <auth>` | Authentication in format username:password | |
| `-t, --timeout <ms>` | Request timeout in milliseconds | `30000` |
| `-o, --output <file>` | Write response to file | |
| `-F, --format <format>` | Response format (json, text, raw) | `auto` |
| `--follow-redirects` | Follow redirects | `true` |
| `--max-redirects <count>` | Maximum number of redirects to follow | `5` |
| `--proxy <url>` | Use proxy for request | |
| `--no-verify` | Disable SSL verification | |
| `--var-set <namespace>=<value>` | Override variable set for this request | |

### Import Collection

```
shc request import [options] <file>
```

Imports a request collection from a file.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `file` | Path to collection file | Yes |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format <format>` | Collection format (yaml, json) | `auto` |
| `--merge` | Merge with existing collections | `false` |

### Export Collection

```
shc request export [options] <collection> <file>
```

Exports a request collection to a file.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `collection` | Collection name or ID | Yes |
| `file` | Path to output file | Yes |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format <format>` | Collection format (yaml, json) | `yaml` |
| `--pretty` | Pretty-print output | `true` |

## Collection Commands

### List Collections

```
shc collection list [options]
```

Lists all available collections.

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format <format>` | Output format (table, json) | `table` |
| `--filter <filter>` | Filter collections by name | |

### Create Collection

```
shc collection create [options] <name>
```

Creates a new collection.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `name` | Collection name | Yes |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--description <desc>` | Collection description | |
| `--base-url <url>` | Base URL for collection | |

### Execute Collection

```
shc collection run [options] <collection>
```

Executes all requests in a collection.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `collection` | Collection name or ID | Yes |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--environment <env>` | Environment to use | `default` |
| `--delay <ms>` | Delay between requests in milliseconds | `0` |
| `--parallel` | Run requests in parallel | `false` |
| `--output <file>` | Write results to file | |
| `--format <format>` | Output format (json, yaml, html) | `json` |
| `--var-set <namespace>=<value>` | Override variable set for this collection run | |

## Environment Commands

### List Environments

```
shc env list [options]
```

Lists all available environments.

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format <format>` | Output format (table, json) | `table` |

### Create Environment

```
shc env create [options] <name>
```

Creates a new environment.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `name` | Environment name | Yes |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--description <desc>` | Environment description | |
| `--variables <vars>` | Environment variables (JSON string) | |
| `--from <env>` | Copy from existing environment | |

### Set Environment Variable

```
shc env set [options] <environment> <name> <value>
```

Sets an environment variable.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `environment` | Environment name | Yes |
| `name` | Variable name | Yes |
| `value` | Variable value | Yes |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--secret` | Mark as secret variable | `false` |

## Plugin Commands

### List Plugins

```
shc plugin list [options]
```

Lists all installed plugins.

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format <format>` | Output format (table, json) | `table` |
| `--show-disabled` | Show disabled plugins | `false` |

### Install Plugin

```
shc plugin install [options] <source>
```

Installs a plugin from a source.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `source` | Plugin source (npm package, git URL, or local path) | Yes |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--name <name>` | Custom name for the plugin | |
| `--disable` | Install but do not enable the plugin | `false` |

### Enable/Disable Plugin

```
shc plugin enable <name>
shc plugin disable <name>
```

Enables or disables a plugin.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `name` | Plugin name | Yes |

### Remove Plugin

```
shc plugin remove [options] <name>
```

Removes an installed plugin.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `name` | Plugin name | Yes |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--force` | Force removal even if dependencies exist | `false` |

## Configuration Commands

### View Configuration

```
shc config view [options] [path]
```

Views the current configuration.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `path` | Configuration path to view | No |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format <format>` | Output format (yaml, json) | `yaml` |
| `--show-secrets` | Show secret values | `false` |

### Manage Variable Sets

```
shc config var-set [command]
```

Manages variable sets in the configuration.

#### Subcommands

##### List Variable Sets

```
shc config var-set list [options]
```

Lists all available variable sets.

###### Options

| Option | Description | Default |
|--------|-------------|----------|
| `--format <format>` | Output format (table, json) | `table` |

### Set Configuration

```
shc config set <path> <value>
```

Sets a configuration value.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `path` | Configuration path | Yes |
| `value` | Configuration value | Yes |

### Reset Configuration

```
shc config reset [options] [path]
```

Resets configuration to default values.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `path` | Configuration path to reset | No |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--force` | Skip confirmation prompt | `false` |

## Utility Commands

### Generate Completions

```
shc completion [options] <shell>
```

Generates shell completion script.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `shell` | Shell type (bash, zsh, fish) | Yes |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--output <file>` | Output file | |

### Validate Configuration

```
shc validate [options] <file>
```

Validates a configuration file.

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `file` | Path to configuration file | Yes |

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--strict` | Enable strict validation | `false` |

## Implementation Requirements

All command implementations must follow these requirements:

1. **Consistent Error Handling**:
   - Use the centralized logging system
   - Provide clear error messages
   - Include suggestions for resolution when possible

2. **Input Validation**:
   - Validate all user inputs
   - Provide helpful validation error messages
   - Use appropriate default values

3. **Output Formatting**:
   - Support multiple output formats (table, JSON, YAML)
   - Consistent styling with Chalk
   - Progress indication for long-running operations

4. **Testing**:
   - Unit tests for command logic
   - Integration tests for command execution
   - Test coverage meeting project requirements

5. **Documentation**:
   - Clear command descriptions
   - Comprehensive help text
   - Examples for common use cases
