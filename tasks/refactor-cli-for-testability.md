# Task: Refactor CLI Package for Testability

## Overview
Refactor the CLI package to improve testability by creating a `makeProgram()` function that will allow creating a Commander program for use in unit testing.

## Status
⏳ **IN PROGRESS** - April 30, 2025

## Background
Currently, the CLI package has inconsistent approaches to testing. Some test files create their own Commander instances, while others use child processes to test the CLI. This leads to fragmented testing approaches and makes it difficult to write comprehensive unit tests for CLI commands. A unified approach to creating testable Commander programs would improve test coverage and maintainability.

## Requirements

1. ⬜ Create a utility function called `makeProgram()` that:
   - Creates a new Commander program instance
   - Configures it with all standard CLI options (config, verbose, silent, etc.)
   - Initializes plugins as part of the program creation process
   - Allows customization of program behavior for testing
   - Supports mocking of console output and process exit
   - Can be used consistently across all CLI tests

2. ⬜ Refactor the main CLI entry point to:
   - Use the `makeProgram()` function to create the Commander program
   - Separate program creation from program execution
   - Make the CLI more modular and testable

3. ⬜ Update all existing tests to:
   - Use the new `makeProgram()` function
   - Follow a consistent testing pattern
   - Avoid using child processes when unit tests are sufficient

4. ⬜ Add comprehensive tests for:
   - Global CLI options
   - Command registration
   - Plugin command registration
   - Error handling

## Implementation Details

### Files to Create/Update
- `/packages/cli/src/utils/program.ts`: 
  - Create a new utility file with the `makeProgram()` function
  - Include options for customizing program behavior
  - Add support for testing-specific configurations
  - Implement plugin initialization within the function

- `/packages/cli/src/index.ts`:
  - Refactor to use the new `makeProgram()` function
  - Separate program creation from execution
  - Maintain all existing functionality
  - Remove duplicate plugin initialization code

- `/packages/cli/tests/utils/test-helpers.ts`:
  - Create test helpers that use `makeProgram()` for consistent test setup
  - Add utilities for capturing console output and mocking process.exit

### Testing Updates
- Update all command test files to use the new `makeProgram()` function
- Ensure consistent test patterns across all command tests
- Add tests for global CLI options and error handling

## Implementation Plan

1. **Phase 1: Create the `makeProgram()` Function**
   - Create the utility function in a new file
   - Ensure it supports all necessary options for testing
   - Add comprehensive tests for the function itself

2. **Phase 2: Refactor Main CLI Entry Point**
   - Update the main CLI entry point to use `makeProgram()`
   - Ensure all existing functionality is maintained
   - Add tests to verify the refactored entry point

3. **Phase 3: Update Existing Tests**
   - Update all command tests to use the new function
   - Ensure consistent testing patterns
   - Verify all tests pass with the new approach

4. **Phase 4: Add New Tests**
   - Add tests for previously untested functionality
   - Ensure good test coverage for all CLI features
   - Document the new testing approach

## Acceptance Criteria
- ⬜ The `makeProgram()` function is implemented and well-tested
- ⬜ The main CLI entry point uses the new function
- ⬜ All existing tests are updated to use the new approach
- ⬜ Test coverage for the CLI package is maintained or improved
- ⬜ All tests pass with the new implementation

## Priority
Critical - This refactoring will improve testability and maintainability of the CLI package, but doesn't affect end-user functionality.

## Notes
- The existing `makeProgram()` function in `help.test.ts` can serve as a starting point, but needs to be expanded to support all CLI features.
- The refactoring should maintain backward compatibility with existing CLI behavior.
- This refactoring aligns with the project's goal of improving test coverage and code quality.
