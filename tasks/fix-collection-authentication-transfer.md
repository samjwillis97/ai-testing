# Task: Fix Collection Authentication Transfer to Requests

## Overview
Fix a bug in the core package where authentication configurations from collections are not properly transferred to request configurations, preventing auth provider plugins from working correctly with collection-based requests.

## Status
⏳ **PENDING** - May 8, 2025

## Background
The current implementation of the collection manager in the core package does not properly transfer the authentication configuration from collections to request configurations. This prevents auth provider plugins from being used with collection-based requests, as the authentication information is lost during the request preparation process.

## Requirements

1. ⬜ Fix Authentication Transfer in Collection Manager:
   - Update the `prepareRequestConfig` method in `CollectionManagerImpl` to include authentication information
   - Ensure request-level authentication takes precedence over collection-level authentication
   - Maintain proper TypeScript typing throughout the implementation

2. ⬜ Add Tests for Authentication Transfer:
   - Create unit tests to verify authentication is properly transferred from collections to requests
   - Test both collection-level and request-level authentication scenarios
   - Ensure auth provider plugins receive the correct authentication configuration

3. ⬜ Update Documentation:
   - Document the authentication inheritance behavior in relevant files
   - Update any examples that demonstrate authentication with collections

## Implementation Details

### Files to Update in Core Package
- `/packages/core/src/services/collection-manager.ts`:
  - Update `prepareRequestConfig` method to include authentication in the request configuration
  - Add logic to prefer request-level authentication over collection-level authentication

```typescript
// Example implementation for prepareRequestConfig method
private async prepareRequestConfig(
  collection: Collection,
  request: Request,
  options?: ExecuteOptions
): Promise<RequestConfig> {
  // Start with the base URL from the collection
  const baseURL = collection.baseUrl || '';

  // Combine variables from global and collection variable sets
  const variables = await this.resolveVariables(collection, options?.variableOverrides);

  // Resolve template strings in the request
  const resolvedRequest = await this.resolveRequestTemplates(request, variables);

  // Create the request configuration
  const requestConfig: RequestConfig = {
    url: `${baseURL}${resolvedRequest.path}`,
    method: resolvedRequest.method,
    headers: resolvedRequest.headers,
    query: resolvedRequest.query,
    body: resolvedRequest.body,
    timeout: options?.timeout,
    // Add authentication - prefer request-level auth over collection-level auth
    authentication: resolvedRequest.authentication || collection.authentication,
  };

  return requestConfig;
}
```

### Testing
- Create tests in `/packages/core/tests/services/collection-manager.test.ts` to verify:
  - Collection-level authentication is properly transferred to requests
  - Request-level authentication overrides collection-level authentication
  - Authentication configuration is properly passed to auth provider plugins

## Acceptance Criteria
- ✅ Authentication configuration from collections is properly transferred to request configurations
- ✅ Request-level authentication correctly overrides collection-level authentication
- ✅ Auth provider plugins receive the correct authentication configuration
- ✅ All tests pass with good coverage
- ✅ Documentation is updated to reflect the authentication inheritance behavior

## Priority
High - This is a critical bug fix that prevents auth provider plugins from working correctly with collection-based requests, which is a core feature of the application.

## Notes
- This fix is necessary for custom auth provider plugins to work correctly with collection-based requests
- The current implementation works for direct requests but fails for collection-based requests
- This issue was discovered when attempting to create a custom auth provider plugin
- The fix should maintain backward compatibility with existing code
