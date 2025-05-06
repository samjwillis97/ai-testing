# Quiet Mode

## Overview

Quiet mode is a feature in the SHC CLI that outputs only the response data without any formatting, decorations, or status information. This mode is particularly useful for scripting and automation scenarios where you need to process the output programmatically or pipe it to other command-line tools.

## Usage

To enable quiet mode, use the `--quiet` flag with any command:

```bash
shc get https://api.example.com/data --quiet
```

This will output only the response data in the format specified by the `-o` or `--output` flag (defaults to JSON).

## Examples

### Basic Usage

```bash
# Get data in quiet mode with JSON output (default)
shc get https://api.example.com/data --quiet

# Get data in quiet mode with YAML output
shc get https://api.example.com/data --quiet -o yaml

# Get data in quiet mode with raw output
shc get https://api.example.com/data --quiet -o raw

# Execute a collection request in quiet mode
shc collection my-collection my-request --quiet
```

### Piping to Other Tools

One of the main use cases for quiet mode is to pipe the output to other command-line tools for further processing:

```bash
# Pipe JSON output to jq for filtering
shc get https://api.example.com/data --quiet | jq '.items[0].name'

# Pipe YAML output to yq for filtering
shc get https://api.example.com/users --quiet -o yaml | yq '.users[].email'

# Pipe raw output to grep for filtering
shc get https://api.example.com/text --quiet -o raw | grep "important"
```

### Error Handling

In quiet mode, errors are still reported but in a minimal format:

- For JSON output format, errors are output as `{"error": "Error message"}`
- For YAML output format, errors are output as `error: Error message`
- For other output formats, errors are output as `Error: Error message`

This makes it easier to handle errors programmatically in scripts.

## Comparison with Other Output Modes

SHC CLI provides several output modes to suit different needs:

| Mode | Flag | Description | Use Case |
|------|------|-------------|----------|
| Normal | (default) | Formatted output with status and data | Interactive use |
| Verbose | `--verbose` | Detailed output with headers and status | Debugging |
| Silent | `--silent` | Minimal output with no decorations | Less noisy output |
| Quiet | `--quiet` | Response data only, no status or formatting | Scripting and automation |

## Configuration

Quiet mode works with any output format (`json`, `yaml`, `raw`, or `table`), allowing you to get the response data in the format that best suits your needs:

```bash
# Use quiet mode with JSON output (default)
shc get https://api.example.com/data --quiet

# Use quiet mode with YAML output
shc get https://api.example.com/data --quiet --output yaml

# Use quiet mode with raw output
shc get https://api.example.com/data --quiet --output raw

# Use quiet mode with table output
shc get https://api.example.com/data --quiet --output table
```

## Combining with Variable Sets

Quiet mode can be combined with variable set overrides for flexible scripting:

```bash
# Use production API with quiet mode
shc get https://api.example.com/data --quiet --var-set api=production

# Use staging API with quiet mode
shc get https://api.example.com/data --quiet --var-set api=staging
```

This allows you to create powerful scripts that can work with different environments while still producing clean, machine-readable output.
