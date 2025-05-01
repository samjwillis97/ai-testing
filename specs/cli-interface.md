# CLI Package (@shc/cli) Specification

## Overview

The Command-Line Interface package provides a powerful, scriptable interface for interacting with HTTP services. Built on top of @shc/core.

## Dependencies

- @shc/core: Core HTTP client and extension system
- Commander.js: CLI framework
- chalk: Terminal styling
- ora: Spinner indicators
- boxen: Terminal boxes

## Core Features

### Request Execution

- Direct HTTP request execution
- Collection-based request running
- Environment-aware execution
- Variable substitution
- Authentication handling

## Command Structure

### Global Options

Applied to every command of SHC

- `-c, --config <path>`: Config file path
- `-V, --set <key>=<value>`: Set config value, (i.e. --set storage.collections.path="./collections")
- `-v, --verbose`: Verbose output
- `-s, --silent`: Silent mode
- `-o, --output <format>`: Output format
- `--no-color`: Disable colors

### Direct Request Mode

Direct request mode allows you to make a single HTTP request to a specified URL.

```bash
shc [options] <method> <url>
```

#### Command Options

- `-H, --header <header>`: Add header
- `-d, --data <data>`: Request body
- `-q, --query <query>`: Query parameter
- `-u, --auth <auth>`: Authentication

### Collection Request Mode

Collection request mode allows you to run a specific request from a collection that is loaded from the config or directly via. a flag

```bash
shc [options] <collection> <request>
```

### List

List mode allows you to list available requests.

```bash
shc [options] list
shc [options] list collections
shc [options] list requests <collection>
```

## Autocomplete & Tab Completion

The CLI provides intelligent autocomplete for commands and arguments using Tab completion. This enhances usability and speeds up workflows by suggesting valid options in context.

### Supported Autocomplete Features

- **Collection & Request Completion**: When using collection mode (`shc [options] <collection> <request>`), pressing Tab will:
  - Suggest available collection names at the `<collection>` position.
  - Suggest request names within the selected collection at the `<request>` position.
- **Dynamic Suggestions**: Autocomplete suggestions update based on the current context and available collections/requests.
- **Multi-level Completion**: Supports Tab cycling through multiple matches.
- **Fallbacks**: If no match is found, standard shell completion behavior applies.

### Implementation Notes
- Integrates with the CLI parser to provide completions for both built-in and user-defined collections/requests.
- Designed for compatibility with common shells (bash, zsh, fish).
- Future extensibility for plugin-provided completions.

## Output Formats

- **JSON** (default): Structured JSON output
- **YAML**: YAML formatted output
- **Raw**: Unformatted raw response content
- **Table**: Tabular format for array data
- **Custom formats**: Via output formatter plugins

## Extension Support

The CLI package provides its own extension system for CLI-specific functionality, separate from the core package's plugin system. This allows for extending the CLI's capabilities without affecting the core HTTP client.

### CLI Extension Types

- **Output Formatters**: Custom output formats beyond the built-in ones (JSON, YAML, Raw, Table)
- **Custom Commands**: Additional commands that can be added to the CLI
- **Shell Completions**: Enhanced completion providers for specific shells
- **Response Visualizers**: Special handlers for displaying certain response types

### CLI Plugin Architecture

The CLI package supports loading plugins from multiple sources, following the same pattern as the core package:

#### Plugin Source Types

1. **NPM Package Plugin**:
```yaml
cli:
  plugins:
    - name: "markdown-formatter"
      package: "shc-cli-plugin-markdown"
      version: "^1.0.0"
      config:
        theme: "github"
        codeHighlight: true
```

2. **Local Path Plugin**:
```yaml
cli:
  plugins:
    - name: "csv-formatter"
      path: "./plugins/csv-formatter"
      config:
        delimiter: ","
        headers: true
```

3. **Git Repository Plugin**:
```yaml
cli:
  plugins:
    - name: "html-formatter"
      git: "https://github.com/example/shc-cli-plugin-html.git"
      ref: "main"
      config:
        prettyPrint: true
        inlineCSS: false
```

#### Plugin Discovery

In addition to explicitly configured plugins, the CLI will also discover plugins from:

1. Global plugin directory (`~/.shc/cli-plugins`)
2. Project-specific plugin directory (relative to config file)

#### Plugin Requirements

Each CLI plugin must have:
- A `plugin.json` or `package.json` with `shcCliPlugin` section
- Type designation (`output-formatter`, `command`, etc.)
- Required metadata (name, version, description)
- Implementation files

### Core Plugin Integration

The CLI also integrates with the core package's plugin system for:
- Authentication providers
- Request transformers
- Response handlers

This integration allows the CLI to leverage the core package's plugin ecosystem while maintaining its own extensions for CLI-specific functionality.

### Output Formatter Plugin API

Output formatter plugins must implement:
```typescript
interface OutputFormatter {
  format: string;            // Format identifier
  formatOutput: (data: unknown, options: OutputOptions) => string;
  description: string;       // Format description
}
```

## Integration Features

- Pipe support (stdin/stdout)
- Shell completion
- Exit codes
- Environment variables
- Config file support

## Development

- TypeScript-based
- Modular command structure
- Plugin architecture
- Comprehensive testing
- CI/CD integration

## Documentation

- Man pages
- Command help
- Examples
- API documentation
- Plugin development guide
