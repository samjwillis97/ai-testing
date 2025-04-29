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

#### Command Options

- `--collection-dir <dir>`: Collection directory

### List

List mode allows you to list the collections and requests available in the config.

```bash
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
