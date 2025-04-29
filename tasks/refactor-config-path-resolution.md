# Task: Refactor Configuration Path Resolution

## Overview
Move the configuration path resolution and collection management functionality from the CLI package to the core package, as specified in the core package specification.

## Background
Currently, the CLI package has its own implementation of configuration path resolution and collection management, which has led to inconsistencies when using different configuration files. According to our updated specifications, these responsibilities should be handled by the core package to ensure consistent behavior across all interfaces.

## Requirements

1. Move the following functionality from CLI to core package:
   - Configuration file loading and parsing
   - Path resolution for collections and other resources
   - Collection directory management

2. Update the core package's ConfigManager implementation to:
   - Properly resolve relative paths in configuration files
   - Handle path resolution relative to configuration file location
   - Provide consistent path resolution across different operating systems

3. Update the CLI package to:
   - Use the core package's ConfigManager for all configuration-related operations
   - Delegate path resolution to the core package
   - Remove duplicate functionality

4. Add comprehensive tests for:
   - Path resolution with relative paths
   - Path resolution with absolute paths
   - Path resolution relative to configuration file location
   - Collection directory resolution

## Implementation Details

### Files to Refactor in CLI Package
- `/packages/cli/src/utils/config.ts`: Remove path resolution logic and delegate to core
- `/packages/cli/src/utils/collections.ts`: Use core package's collection management

### Files to Update/Create in Core Package
- `/packages/core/src/config-manager.ts`: Add path resolution functionality
- `/packages/core/src/services/collection-manager.ts`: Enhance with proper path resolution

### Testing
- Add tests for path resolution in different scenarios
- Ensure backward compatibility with existing configurations
- Test with both relative and absolute paths

## Acceptance Criteria
- All CLI commands work correctly with both relative and absolute paths in configuration files
- Collection management works consistently regardless of configuration file location
- All tests pass with good coverage
- No duplicate functionality between CLI and core packages

## Priority
High - This refactoring is important to prevent future issues with path resolution and ensure consistent behavior across all interfaces.
