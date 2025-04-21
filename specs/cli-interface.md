# CLI Interface Specification

## Overview
The Command-Line Interface (CLI) for SHC provides a powerful, scriptable way to interact with HTTP services.

## Command Structures
### Direct Request Mode
```
shc [options] <method> <url>
```

### Collection-Based Mode
```
shc [options] <collection_file> <endpoint_name>
```

## Core Features
- Send HTTP requests directly from the terminal
- Execute requests from collection files
- Support for all HTTP methods
- Ability to specify headers, body, and query parameters
- Output response in various formats (JSON, YAML, raw)

## Options
- `-H, --header`: Add custom headers
- `-d, --data`: Specify request body
- `-q, --query`: Add query parameters
- `-o, --output`: Specify output format
- `-v, --verbose`: Detailed logging
- `--config`: Use specific configuration file
- `--env`: Specify environment for collection-based requests

## Collection File Execution
- Load entire API collection from YAML/JSON
- Select specific endpoint by name
- Override collection-level configurations
- Support environment-specific variables
- Dynamic script hook execution

## Authentication
- Support for basic auth
- Bearer token authentication
- Environment variable-based credentials
- Collection-level authentication support

## Use Cases
- API testing
- Scripting
- Quick debugging
- Automation workflows
- Reproducible API interactions

## Integration
- Pipe-friendly output
- Compatible with standard Unix tools
- Supports both ad-hoc and collection-based requests
