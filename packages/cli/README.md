# @shc/cli

SHC Command Line Interface

## Usage

```
pnpm build
pnpm --filter @shc/cli exec shc get https://example.com
```

## Configuration

The CLI uses the `@shc/core` package's `ConfigManager` for all configuration-related operations. Configuration is loaded from:

1. Default configuration file (`shc.config.yaml` or `shc.config.json` in the current directory)
2. Custom configuration file specified with the `--config` option
3. Command-line options that override configuration file settings

### Path Resolution

Paths in the configuration (such as collection directories) are resolved as follows:

- Absolute paths are used as-is
- Relative paths are resolved relative to:
  - The configuration file's directory (if a config file is specified)
  - The current working directory (if no config file is specified)

## Development

- Build: `pnpm build`
- Test: `pnpm test`
- Lint: `pnpm lint`
