# Task: Refactor Configuration Path Resolution

## Overview
Move the configuration path resolution and collection management functionality from the CLI package to the core package, as specified in the core package specification.

## Status
✅ **COMPLETED** - April 29, 2025

## Background
Currently, the CLI package has its own implementation of configuration path resolution and collection management, which has led to inconsistencies when using different configuration files. According to our updated specifications, these responsibilities should be handled by the core package to ensure consistent behavior across all interfaces.

## Requirements

1. ✅ Move the following functionality from CLI to core package:
   - Configuration file loading and parsing
   - Path resolution for collections and other resources
   - Collection directory management

2. ✅ Update the core package's ConfigManager implementation to:
   - Properly resolve relative paths in configuration files
   - Handle path resolution relative to configuration file location
   - Provide consistent path resolution across different operating systems

3. ✅ Update the CLI package to:
   - Use the core package's ConfigManager for all configuration-related operations
   - Delegate path resolution to the core package
   - Remove duplicate functionality

4. ✅ Add comprehensive tests for:
   - Path resolution with relative paths
   - Path resolution with absolute paths
   - Path resolution relative to configuration file location
   - Collection directory resolution

## Implementation Details

### Files Refactored in CLI Package
- `/packages/cli/src/utils/config.ts`: 
  - Removed `createClientConfig` function
  - Updated `getCollectionDir` to properly handle path resolution based on config file location
  - Added `createConfigManagerFromOptions` to use the core package's ConfigManager

- `/packages/cli/src/commands/direct-request.ts` and `/packages/cli/src/commands/collection-request.ts`:
  - Updated to use `createConfigManagerFromOptions` instead of `createClientConfig`

### Files to Update/Create in Core Package
- `/packages/core/src/config-manager.ts`: Add path resolution functionality
- `/packages/core/src/services/collection-manager.ts`: Enhance with proper path resolution

### Testing
- Updated tests in `/packages/cli/tests/commands/list.test.ts` to properly mock the ConfigManager
- All tests now pass successfully

## Acceptance Criteria
- ✅ All CLI commands work correctly with both relative and absolute paths in configuration files
- ✅ Collection management works consistently regardless of configuration file location
- ✅ All tests pass with good coverage
- ✅ No duplicate functionality between CLI and core packages

## Priority
High - This refactoring is important to prevent future issues with path resolution and ensure consistent behavior across all interfaces.

## Notes
- The refactoring centralizes configuration management in the core package, eliminating duplication and ensuring consistency.
- Path resolution now properly handles both absolute and relative paths, with relative paths being resolved relative to the config file location when a config file is specified.
- The CLI package now delegates all configuration management to the core package, following the principle of separation of concerns.
