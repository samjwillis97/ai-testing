# CLI Package (@shc/cli) Specification

## Overview

The Command-Line Interface package provides a powerful, scriptable interface for interacting with HTTP services. Built on top of @shc/core.

## Dependencies

- @shc/core: Core HTTP client and extension system
- Commander.js: CLI framework
- Inquirer: Interactive prompts
- chalk: Terminal styling
- ora: Spinner indicators
- boxen: Terminal boxes

## Command Structure

### Direct Request Mode

```bash
shc [options] <method> <url>
```

### Collection Mode

```bash
shc [options] <collection> <request>
```

### Interactive Mode

```bash
shc interactive
```

## Core Features

### Request Execution

- Direct HTTP request execution
- Collection-based request running
- Environment-aware execution
- Variable substitution
- Authentication handling

### Collection Management

- Collection file operations
- Request organization
- Environment configuration
- Variable management
- Authentication setup

### Interactive Features

- Request builder TUI
- Collection browser
- Environment selector
- Variable editor
- Response viewer
- Full-screen mode (TUI takes up the entire terminal without leaving command history)

## Command Options

### Global Options

- `-c, --config <path>`: Config file path
- `-e, --env <name>`: Environment name
- `-v, --verbose`: Verbose output
- `-s, --silent`: Silent mode
- `--no-color`: Disable colors

### Request Options

- `-H, --header <header>`: Add header
- `-d, --data <data>`: Request body
- `-q, --query <query>`: Query parameter
- `-u, --auth <auth>`: Authentication
- `-o, --output <format>`: Output format

### Collection Options

- `--collection-dir <dir>`: Collection directory
- `--save`: Save request to collection
- `--export <path>`: Export collection
- `--import <path>`: Import collection

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

- JSON (default)
- YAML
- Raw
- Table
- Custom formats via plugins

## Integration Features

- Pipe support (stdin/stdout)
- Shell completion
- Exit codes
- Environment variables
- Config file support

## Extension Support

- Custom commands
- Output formatters
- Authentication providers
- Request transformers
- Response handlers

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
