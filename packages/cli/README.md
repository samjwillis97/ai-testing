# @shc/cli

A command-line interface tool for managing and sending HTTP collections.

## Installation

```bash
# Using pnpm (recommended)
pnpm add @shc/cli

# Global installation
pnpm add -g @shc/cli
```

## Usage

The CLI can be invoked using the `shc` command:

```bash
shc [command] [options]
```

### Available Commands

#### Collections
Manage your HTTP collections:

```bash
# List all collections
shc collections list

# Create a new collection
shc collections create

# Delete a collection
shc collections delete <collection-name>
```

#### Send
Send HTTP requests:

```bash
# Send a request
shc send <request-name>
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- pnpm (v8 or higher)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Available Scripts

- `pnpm build` - Build the CLI
- `pnpm dev` - Watch mode for development
- `pnpm test` - Run tests with coverage
- `pnpm lint` - Lint the source code

### Project Structure

```
cli/
├── src/              # Source code
│   ├── commands/     # CLI commands
│   ├── config.ts     # Configuration management
│   ├── storage.ts    # Data storage utilities
│   └── index.ts      # CLI entry point
├── tests/            # Test files
├── dist/             # Compiled output
└── coverage/         # Test coverage reports
```

## Dependencies

- `@shc/core` - Core functionality
- `commander` - Command-line interface framework
- `inquirer` - Interactive command-line user interfaces
- `conf` - Configuration management
- `chalk` - Terminal string styling
- `ora` - Elegant terminal spinners

## Configuration

The CLI stores its configuration and data in the user's home directory. The configuration can be accessed and modified through the CLI commands.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 