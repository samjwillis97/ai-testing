# Task: Fix Collection Paths Inconsistency

## Overview
Resolve the inconsistency between how collection paths are stored and used across the CLI and core packages, which is causing errors when directories are incorrectly treated as collection files.

## Status
⏳ **PENDING** - May 8, 2025

## Background
Currently, there's an inconsistency in how collection paths are handled:
- In multiple places (`config.ts` in CLI package and `config-manager.ts` in core package), directory paths are being added to `config.collections.paths`
- However, in the client's `loadCollectionsFromConfig` method, this array is expected to contain file paths, not directory paths
- This is causing errors when running commands like `pnpm run dev collection -v httpbin get-request`
- The error occurs because the client tries to load collections from what it expects to be file paths, but receives directory paths instead

## Requirements

1. ⬜️ Implement a consistent approach to handling collection paths:
   - Clearly separate file paths from directory paths in the configuration
   - Ensure all components use these paths correctly
   - Update type definitions to reflect the new structure

2. ⬜️ Update all affected code to use the new approach:
   - Modify the CLI package's collection handling
   - Update the core package's ConfigManager
   - Fix the client's collection loading logic

3. ⬜️ Add validation to prevent incorrect path types:
   - Add checks to ensure directories aren't treated as files
   - Validate paths before attempting to load collections
   - Provide clear error messages when validation fails

4. ⬜️ Update tests:
   - Ensure all tests pass with the new implementation
   - Add tests for the new validation logic
   - Test edge cases like mixed file and directory paths

## Chosen Solution: Separate Files and Directories in Configuration

We will implement a cleaner, more explicit approach by separating files and directories in the configuration structure:

```typescript
collections?: {
  items?: Collection[];
  files?: string[];       // Only file paths
  directories?: string[]; // Only directory paths (including the main collection directory)
}
```

**Key Changes:**
- Remove the redundant `directory` property (singular) since we now have `directories` (plural)
- Clearly separate file paths from directory paths
- No need for backward compatibility - all code will be updated to use the new structure

## Implementation Details

### Files to Create/Update

- `/packages/core/src/types/client.types.ts`:
  - Update the SHCConfig interface to use the new collection structure
  - Remove the old `paths` and `directory` properties
  - Add JSDoc comments to explain the purpose of each property

- `/packages/core/src/services/client.ts`:
  - Update `loadCollectionsFromConfig` to handle both `files` and `directories` arrays
  - Add validation to ensure paths are of the correct type
  - Update error messages to be more specific about path types
  - Modify code that currently uses `config.collections.directory`

- `/packages/core/src/config-manager.ts`:
  - Update methods that add collection paths to use the appropriate array
  - Modify `loadCollectionsFromDirectory` to add to `directories` instead of `paths`
  - Remove code that sets the `directory` property
  - Update any event emissions that reference the old structure

- `/packages/cli/src/utils/config.ts`:
  - Update the `manuallyLoadCollections` function to use the new structure
  - Add validation for path types
  - Update code that references `collections.directory`

### Specific Changes Required

1. **Client.ts Changes**:
   - Modify `loadCollectionsFromConfig` to iterate through both `files` and `directories` arrays
   - Update code that uses `config.collections.directory` to use the first entry in `directories` or iterate through all entries
   - Update error handling to reflect the new structure

2. **ConfigManager.ts Changes**:
   - Update `loadCollectionsFromDirectory` to add to `directories` instead of `paths`
   - Remove code that sets `directory` property
   - Update event emissions like 'collections:loaded:path' to reflect the new structure

3. **Collection Manager Integration**:
   - Update the collection manager to work with the new structure
   - Ensure methods that load collections handle both file and directory sources

## Expected Benefits

1. **Improved Reliability**: Eliminate errors caused by path type confusion
2. **Better Type Safety**: Explicit typing for different path types
3. **Clearer Code Intent**: Separate arrays make the purpose of each path clear
4. **Improved Error Messages**: Better validation leads to more helpful errors
5. **Consistent Behavior**: All components will handle paths consistently
6. **Simplified API**: Removing the redundant `directory` property makes the API cleaner

## Dependencies
- None

## Notes
- Since we don't need backward compatibility, we can make these changes directly
- All code that references the old structure will be updated
- Documentation should be updated to reflect the new structure
