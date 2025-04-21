# CLI Interface Specification

## Overview
The Command-Line Interface (CLI) for SHC provides a powerful, scriptable way to interact with HTTP services.

## Core Features
- Send HTTP requests directly from the terminal
- Support for all HTTP methods
- Ability to specify headers, body, and query parameters
- Output response in various formats (JSON, YAML, raw)

## Command Structure
```
shc [options] <method> <url>
```

## Options
- `-H, --header`: Add custom headers
- `-d, --data`: Specify request body
- `-q, --query`: Add query parameters
- `-o, --output`: Specify output format
- `-v, --verbose`: Detailed logging
- `--config`: Use specific configuration file

## Authentication
- Support for basic auth
- Bearer token authentication
- Environment variable-based credentials

## Use Cases
- API testing
- Scripting
- Quick debugging
- Automation workflows

## Integration
- Pipe-friendly output
- Compatible with standard Unix tools
