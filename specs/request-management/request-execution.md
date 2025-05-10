# Request Execution Specification

## Overview

This document specifies the execution flow and lifecycle of HTTP requests in the SHC system. It defines how requests are processed, executed, and how responses are handled across different interfaces.

## Request Execution Flow

The request execution process follows these steps:

1. **Request Preparation**
   - Load request definition
   - Resolve templates and variables
   - Apply environment-specific configurations
   - Apply authentication

2. **Plugin Processing**
   - Run pre-request plugins
   - Apply request transformations
   - Handle request validation

3. **HTTP Execution**
   - Send the HTTP request
   - Handle network-level errors
   - Manage timeouts and cancellation

4. **Response Processing**
   - Parse response data
   - Apply response transformations
   - Run post-response plugins

5. **Result Handling**
   - Store response in history
   - Execute tests and validations
   - Trigger callbacks and events

## Request Execution Interface

The request execution is handled by the `RequestExecutor` interface:

```typescript
interface RequestExecutor {
  // Execute a request by ID
  executeById(requestId: string, options?: ExecutionOptions): Promise<Response>;
  
  // Execute a request object
  execute(request: Request, options?: ExecutionOptions): Promise<Response>;
  
  // Cancel an ongoing request
  cancel(requestId: string): Promise<void>;
  
  // Get execution status
  getStatus(requestId: string): RequestStatus;
  
  // Subscribe to execution events
  subscribe(event: ExecutionEvent, callback: ExecutionCallback): () => void;
}

interface ExecutionOptions {
  // Environment to use for execution
  environment?: string;
  
  // Variable set overrides for this specific request execution
  // Each key is a variable set namespace and each value is the name of the value to activate
  // Example: { "api": "production", "auth": "admin" }
  // These overrides have the highest precedence in the variable resolution hierarchy
  variableSets?: Record<string, string>;
  
  // Authentication override
  auth?: Authentication;
  
  // Timeout in milliseconds
  timeout?: number;
  
  // Whether to follow redirects
  followRedirects?: boolean;
  
  // Maximum number of redirects to follow
  maxRedirects?: number;
  
  // Whether to validate SSL certificates
  validateSSL?: boolean;
  
  // Proxy configuration
  proxy?: ProxyConfig;
  
  // Request transformation function
  transformRequest?: RequestTransformer;
  
  // Response transformation function
  transformResponse?: ResponseTransformer;
}

type ExecutionEvent = 
  | 'request:start'
  | 'request:end'
  | 'request:error'
  | 'request:cancel'
  | 'response:received'
  | 'plugin:before'
  | 'plugin:after';

type ExecutionCallback = (data: any) => void;

interface RequestStatus {
  id: string;
  state: 'pending' | 'executing' | 'completed' | 'error' | 'cancelled';
  startTime?: number;
  endTime?: number;
  progress?: number;
  error?: Error;
  response?: Response;
}
```

## Template Resolution

Before execution, templates in the request are resolved using the template engine:

```typescript
// Original request with templates
const request = {
  url: '/users/${variables.userId}',
  headers: {
    'Authorization': 'Bearer ${variables.token}',
    'X-Request-ID': '${uuid()}'
  },
  query_params: {
    timestamp: '${timestamp()}'
  }
};

// Resolved request
const resolvedRequest = {
  url: '/users/123',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'X-Request-ID': '550e8400-e29b-41d4-a716-446655440000'
  },
  query_params: {
    timestamp: '1620000000000'
  }
};
```

## Authentication

Authentication is applied during request preparation:

```typescript
// Request with authentication
const request = {
  url: '/users',
  method: 'GET',
  auth: {
    type: 'bearer',
    token: '${variables.token}'
  }
};

// After authentication is applied
const authenticatedRequest = {
  url: '/users',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
};
```

## Plugin Processing

Plugins can modify requests and responses during execution:

```typescript
// Plugin system processing
async function executeWithPlugins(request: Request): Promise<Response> {
  // Apply request plugins
  let processedRequest = request;
  for (const plugin of plugins) {
    if (plugin.onRequest) {
      processedRequest = await plugin.onRequest(processedRequest);
    }
  }
  
  // Execute HTTP request
  let response = await httpClient.execute(processedRequest);
  
  // Apply response plugins
  let processedResponse = response;
  for (const plugin of plugins) {
    if (plugin.onResponse) {
      processedResponse = await plugin.onResponse(processedResponse, processedRequest);
    }
  }
  
  return processedResponse;
}
```

## Request Execution in Different Interfaces

### CLI Execution

```typescript
// CLI request execution
async function executeRequestFromCLI(requestId: string, options: any): Promise<void> {
  const executor = new RequestExecutor();
  
  // Show spinner
  const spinner = ora('Executing request...').start();
  
  try {
    // Execute request
    const response = await executor.executeById(requestId, options);
    
    // Stop spinner
    spinner.succeed('Request completed');
    
    // Display response
    displayResponse(response);
  } catch (error) {
    // Handle error
    spinner.fail('Request failed');
    displayError(error);
  }
}
```

### Web UI Execution

```typescript
// Web UI request execution
function ExecuteRequestButton({ requestId, options }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  
  const executeRequest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const executor = new RequestExecutor();
      const result = await executor.executeById(requestId, options);
      setResponse(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Button onClick={executeRequest} disabled={loading}>
        {loading ? 'Executing...' : 'Execute'}
      </Button>
      
      {response && <ResponseViewer response={response} />}
      {error && <ErrorDisplay error={error} />}
    </>
  );
}
```

### Neovim UI Execution

```typescript
// Neovim UI request execution
function executeRequestInNeovim(requestId: string, options: any): void {
  // Create status line
  nvim.command('echohl MoreMsg');
  nvim.command('echo "Executing request..."');
  nvim.command('echohl None');
  
  // Execute request
  const executor = new RequestExecutor();
  executor.executeById(requestId, options)
    .then(response => {
      // Display response in buffer
      createResponseBuffer(response);
      
      // Show success message
      nvim.command('echohl MoreMsg');
      nvim.command(`echo "Request completed with status ${response.status}"`);
      nvim.command('echohl None');
    })
    .catch(error => {
      // Show error message
      nvim.command('echohl ErrorMsg');
      nvim.command(`echo "Request failed: ${error.message}"`);
      nvim.command('echohl None');
    });
}
```

## Response Handling

After a request is executed, the response is processed and made available to the user:

```typescript
interface Response {
  // Response status code
  status: number;
  
  // Response status text
  statusText: string;
  
  // Response headers
  headers: Record<string, string>;
  
  // Response body
  data: any;
  
  // Response size in bytes
  size?: number;
  
  // Response time in milliseconds
  time?: number;
  
  // Original request
  request?: Request;
  
  // Response metadata
  meta?: Record<string, any>;
}
```

## Request History

Executed requests are stored in the request history:

```typescript
interface RequestHistoryEntry {
  // Unique ID for the history entry
  id: string;
  
  // Request ID
  requestId: string;
  
  // Collection ID
  collectionId: string;
  
  // Timestamp of execution
  timestamp: number;
  
  // Request object
  request: Request;
  
  // Response object
  response?: Response;
  
  // Execution duration in milliseconds
  duration?: number;
  
  // Environment used for execution
  environment?: string;
  
  // Variable sets used for execution
  variableSets?: Record<string, string>;
}
```

## Request Cancellation

Long-running requests can be cancelled:

```typescript
// Cancel a request
async function cancelRequest(requestId: string): Promise<void> {
  const executor = new RequestExecutor();
  await executor.cancel(requestId);
}
```

## Error Handling

Errors during request execution are handled and presented to the user:

```typescript
interface RequestError extends Error {
  // Error code
  code?: string;
  
  // Original request
  request?: Request;
  
  // Partial response (if available)
  response?: Partial<Response>;
  
  // Whether the error is retryable
  retryable?: boolean;
  
  // Suggested retry delay in milliseconds
  retryDelay?: number;
}
```

## Implementation Requirements

The request execution implementation must follow these requirements:

1. **Performance**:
   - Efficient template resolution
   - Minimal overhead for plugin processing
   - Optimized HTTP client configuration

2. **Reliability**:
   - Robust error handling
   - Graceful timeout management
   - Proper cancellation support

3. **Flexibility**:
   - Support for different HTTP clients
   - Extensible plugin system
   - Customizable execution options

4. **Security**:
   - Secure handling of credentials
   - Protection against request forgery
   - Validation of SSL certificates

5. **Usability**:
   - Clear error messages
   - Detailed execution status
   - Comprehensive response information

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
