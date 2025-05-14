# OAuth2 Authentication Plugin

## Overview

The OAuth2 Authentication Plugin showcases authentication provider implementation within the SHC plugin system. This plugin provides comprehensive OAuth 2.0 authentication support for HTTP requests, handling token acquisition, storage, and automatic refresh.

## Features

- Multiple OAuth2 flow support
- Token management
- Automatic token refresh
- Scope handling
- State management

## Configuration

```typescript
interface OAuth2Config {
  flow: 'authorization_code' | 'client_credentials' | 'password';
  clientId: string;
  clientSecret: string;
  authorizationUrl?: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri?: string;
  autoRefresh: boolean;
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `flow` | string | `'client_credentials'` | OAuth2 flow type |
| `clientId` | string | | OAuth2 client ID |
| `clientSecret` | string | | OAuth2 client secret |
| `authorizationUrl` | string | | Authorization URL (required for authorization_code flow) |
| `tokenUrl` | string | | Token URL |
| `scopes` | string[] | `[]` | OAuth2 scopes to request |
| `redirectUri` | string | | Redirect URI (required for authorization_code flow) |
| `autoRefresh` | boolean | `true` | Whether to automatically refresh expired tokens |

## Implementation

### Plugin Class

```typescript
import { 
  Plugin, 
  PluginConfig, 
  RequestConfig, 
  Response, 
  PluginContext,
  AuthProvider
} from '@shc/core';

export class OAuth2Plugin implements Plugin, AuthProvider {
  private config: OAuth2Config;
  private token: OAuth2Token | null = null;
  private refreshPromise: Promise<OAuth2Token> | null = null;
  private logger: any;
  
  constructor() {
    // Default configuration
    this.config = {
      flow: 'client_credentials',
      clientId: '',
      clientSecret: '',
      tokenUrl: '',
      scopes: [],
      autoRefresh: true,
    };
  }
  
  /**
   * Initialize the plugin
   */
  async onInit(context: PluginContext): Promise<void> {
    this.logger = context.logger;
    
    // Register as auth provider
    if (context.registerAuthProvider) {
      context.registerAuthProvider('oauth2', this);
    }
    
    this.logger?.info('OAuth2 plugin initialized');
  }
  
  /**
   * Configure the plugin
   */
  async onConfigure(config: PluginConfig): Promise<void> {
    // Merge configuration
    this.config = {
      ...this.config,
      ...config,
    };
    
    // Validate configuration
    this.validateConfig();
    
    this.logger?.info('OAuth2 plugin configured');
  }
  
  /**
   * Process request before it is sent
   */
  async onRequest(request: RequestConfig): Promise<RequestConfig> {
    // Check if authentication is needed for this request
    if (!this.shouldAuthenticate(request)) {
      return request;
    }
    
    // Get token (acquire or refresh if needed)
    const token = await this.getToken();
    
    // Add authorization header
    request.headers = request.headers || {};
    request.headers['Authorization'] = `${token.token_type} ${token.access_token}`;
    
    return request;
  }
  
  /**
   * Process response after it is received
   */
  async onResponse(response: Response<any>, request: RequestConfig): Promise<Response<any>> {
    // Check if response indicates an authentication error
    if (response.status === 401 && this.config.autoRefresh) {
      // Clear token to force refresh on next request
      this.token = null;
      
      // Try to get a new token
      try {
        const token = await this.getToken(true);
        
        // Retry the request with the new token
        request.headers = request.headers || {};
        request.headers['Authorization'] = `${token.token_type} ${token.access_token}`;
        
        // Throw a special error to indicate that the request should be retried
        throw new RetryRequestError(request);
      } catch (error) {
        if (error instanceof RetryRequestError) {
          throw error;
        }
        
        // If token refresh fails, continue with the original response
        this.logger?.error('Failed to refresh token', error);
      }
    }
    
    return response;
  }
  
  /**
   * Clean up when plugin is destroyed
   */
  async onDestroy(): Promise<void> {
    this.logger?.info('OAuth2 plugin destroyed');
  }
  
  /**
   * Implement AuthProvider interface
   */
  async getAuthHeader(request: RequestConfig): Promise<Record<string, string>> {
    const token = await this.getToken();
    return {
      'Authorization': `${token.token_type} ${token.access_token}`
    };
  }
  
  /**
   * Check if a request should be authenticated
   */
  private shouldAuthenticate(request: RequestConfig): boolean {
    // Check if request already has an Authorization header
    if (request.headers && request.headers['Authorization']) {
      return false;
    }
    
    // Check if request has auth metadata
    if (request.meta?.skipAuth) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get OAuth2 token (acquire or refresh if needed)
   */
  async getToken(forceRefresh: boolean = false): Promise<OAuth2Token> {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    // Check if we have a valid token
    if (!forceRefresh && this.token && !this.isTokenExpired()) {
      return this.token;
    }
    
    // Acquire or refresh token
    this.refreshPromise = this.acquireToken();
    
    try {
      this.token = await this.refreshPromise;
      return this.token;
    } finally {
      this.refreshPromise = null;
    }
  }
  
  /**
   * Acquire a new OAuth2 token
   */
  private async acquireToken(): Promise<OAuth2Token> {
    switch (this.config.flow) {
      case 'authorization_code':
        return this.acquireTokenWithAuthorizationCode();
      case 'password':
        return this.acquireTokenWithPassword();
      case 'client_credentials':
      default:
        return this.acquireTokenWithClientCredentials();
    }
  }
  
  /**
   * Acquire token using client credentials flow
   */
  private async acquireTokenWithClientCredentials(): Promise<OAuth2Token> {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.config.clientId);
    params.append('client_secret', this.config.clientSecret);
    
    if (this.config.scopes.length > 0) {
      params.append('scope', this.config.scopes.join(' '));
    }
    
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to acquire token: ${response.status} ${response.statusText}`);
    }
    
    const token = await response.json();
    
    // Add received time and calculate expiration
    token.received_at = Date.now();
    if (token.expires_in) {
      token.expires_at = token.received_at + (token.expires_in * 1000);
    }
    
    return token;
  }
  
  /**
   * Acquire token using password flow
   */
  private async acquireTokenWithPassword(): Promise<OAuth2Token> {
    if (!this.config.username || !this.config.password) {
      throw new Error('Username and password are required for password flow');
    }
    
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', this.config.clientId);
    params.append('client_secret', this.config.clientSecret);
    params.append('username', this.config.username);
    params.append('password', this.config.password);
    
    if (this.config.scopes.length > 0) {
      params.append('scope', this.config.scopes.join(' '));
    }
    
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to acquire token: ${response.status} ${response.statusText}`);
    }
    
    const token = await response.json();
    
    // Add received time and calculate expiration
    token.received_at = Date.now();
    if (token.expires_in) {
      token.expires_at = token.received_at + (token.expires_in * 1000);
    }
    
    return token;
  }
  
  /**
   * Acquire token using authorization code flow
   */
  private async acquireTokenWithAuthorizationCode(): Promise<OAuth2Token> {
    if (!this.config.authorizationUrl || !this.config.redirectUri) {
      throw new Error('Authorization URL and redirect URI are required for authorization code flow');
    }
    
    if (!this.config.authorizationCode) {
      // Generate authorization URL
      const authUrl = this.getAuthorizationUrl();
      
      // Throw error with authorization URL
      throw new AuthorizationRequiredError(authUrl);
    }
    
    // Exchange authorization code for token
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', this.config.clientId);
    params.append('client_secret', this.config.clientSecret);
    params.append('code', this.config.authorizationCode);
    params.append('redirect_uri', this.config.redirectUri);
    
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to acquire token: ${response.status} ${response.statusText}`);
    }
    
    const token = await response.json();
    
    // Add received time and calculate expiration
    token.received_at = Date.now();
    if (token.expires_in) {
      token.expires_at = token.received_at + (token.expires_in * 1000);
    }
    
    return token;
  }
  
  /**
   * Get authorization URL for authorization code flow
   */
  private getAuthorizationUrl(): string {
    const url = new URL(this.config.authorizationUrl!);
    
    // Add query parameters
    url.searchParams.append('client_id', this.config.clientId);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('redirect_uri', this.config.redirectUri!);
    
    if (this.config.scopes.length > 0) {
      url.searchParams.append('scope', this.config.scopes.join(' '));
    }
    
    // Generate and store state parameter
    const state = this.generateState();
    url.searchParams.append('state', state);
    
    return url.toString();
  }
  
  /**
   * Generate state parameter for authorization code flow
   */
  private generateState(): string {
    const state = Math.random().toString(36).substring(2, 15);
    this.config.state = state;
    return state;
  }
  
  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.token || !this.token.expires_at) {
      return true;
    }
    
    // Add buffer time (30 seconds) to ensure token is still valid for the request
    const bufferTime = 30 * 1000;
    return Date.now() + bufferTime >= this.token.expires_at;
  }
  
  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.clientId) {
      throw new Error('Client ID is required');
    }
    
    if (!this.config.clientSecret) {
      throw new Error('Client secret is required');
    }
    
    if (!this.config.tokenUrl) {
      throw new Error('Token URL is required');
    }
    
    if (this.config.flow === 'authorization_code') {
      if (!this.config.authorizationUrl) {
        throw new Error('Authorization URL is required for authorization code flow');
      }
      
      if (!this.config.redirectUri) {
        throw new Error('Redirect URI is required for authorization code flow');
      }
    }
    
    if (this.config.flow === 'password') {
      if (!this.config.username) {
        throw new Error('Username is required for password flow');
      }
      
      if (!this.config.password) {
        throw new Error('Password is required for password flow');
      }
    }
  }
  
  /**
   * Set authorization code for authorization code flow
   */
  setAuthorizationCode(code: string, state?: string): void {
    // Verify state if provided
    if (state && this.config.state && state !== this.config.state) {
      throw new Error('Invalid state parameter');
    }
    
    this.config.authorizationCode = code;
    
    // Clear token to force acquisition with the new code
    this.token = null;
  }
}

/**
 * OAuth2 token interface
 */
interface OAuth2Token {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  
  // Additional properties added by the plugin
  received_at?: number;
  expires_at?: number;
}

/**
 * Error thrown when authorization is required
 */
class AuthorizationRequiredError extends Error {
  constructor(public authorizationUrl: string) {
    super('Authorization required');
    this.name = 'AuthorizationRequiredError';
  }
}

/**
 * Error thrown to indicate that a request should be retried
 */
class RetryRequestError extends Error {
  constructor(public request: RequestConfig) {
    super('Retry request');
    this.name = 'RetryRequestError';
  }
}
```

## Usage Example

### Client Credentials Flow

```typescript
import { createSHCClient } from '@shc/core';
import { OAuth2Plugin } from '@shc/plugins/oauth2';

// Create client with OAuth2 plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new OAuth2Plugin(),
      config: {
        flow: 'client_credentials',
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
        tokenUrl: 'https://auth.example.com/token',
        scopes: ['read', 'write'],
        autoRefresh: true,
      },
    },
  ],
});

// Make authenticated request
client.get('https://api.example.com/users')
  .then(response => {
    console.log('Request succeeded');
  })
  .catch(error => {
    console.error('Request failed', error);
  });
```

### Password Flow

```typescript
import { createSHCClient } from '@shc/core';
import { OAuth2Plugin } from '@shc/plugins/oauth2';

// Create client with OAuth2 plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new OAuth2Plugin(),
      config: {
        flow: 'password',
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
        tokenUrl: 'https://auth.example.com/token',
        username: 'user@example.com',
        password: 'password123',
        scopes: ['read', 'write'],
        autoRefresh: true,
      },
    },
  ],
});

// Make authenticated request
client.get('https://api.example.com/users')
  .then(response => {
    console.log('Request succeeded');
  })
  .catch(error => {
    console.error('Request failed', error);
  });
```

### Authorization Code Flow

```typescript
import { createSHCClient } from '@shc/core';
import { OAuth2Plugin } from '@shc/plugins/oauth2';

// Create OAuth2 plugin
const oauth2Plugin = new OAuth2Plugin();

// Create client with OAuth2 plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: oauth2Plugin,
      config: {
        flow: 'authorization_code',
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
        authorizationUrl: 'https://auth.example.com/authorize',
        tokenUrl: 'https://auth.example.com/token',
        redirectUri: 'http://localhost:8080/callback',
        scopes: ['read', 'write'],
        autoRefresh: true,
      },
    },
  ],
});

// Try to make authenticated request
client.get('https://api.example.com/users')
  .then(response => {
    console.log('Request succeeded');
  })
  .catch(error => {
    // Check if authorization is required
    if (error.name === 'AuthorizationRequiredError') {
      console.log('Please visit this URL to authorize:', error.authorizationUrl);
      
      // After user authorizes and is redirected, get the code from the URL
      // and set it in the plugin
      const code = 'authorization-code-from-redirect';
      oauth2Plugin.setAuthorizationCode(code);
      
      // Retry the request
      return client.get('https://api.example.com/users');
    }
    
    console.error('Request failed', error);
  })
  .then(response => {
    if (response) {
      console.log('Request succeeded after authorization');
    }
  })
  .catch(error => {
    console.error('Request failed after authorization', error);
  });
```

## Integration with Other Plugins

The OAuth2 Plugin can be used in combination with other plugins. When multiple plugins are used, the order of plugin registration determines the order of execution:

```typescript
import { createSHCClient } from '@shc/core';
import { OAuth2Plugin } from '@shc/plugins/oauth2';
import { LoggingPlugin } from '@shc/plugins/logging';

// Create client with multiple plugins
const client = createSHCClient({
  plugins: [
    {
      plugin: new LoggingPlugin(),
      config: {
        // Logging plugin configuration
      },
    },
    {
      plugin: new OAuth2Plugin(),
      config: {
        // OAuth2 plugin configuration
      },
    },
  ],
});
```

In this example, the Logging Plugin will be executed before the OAuth2 Plugin for requests, and after the OAuth2 Plugin for responses. This means:

1. Request flow: LoggingPlugin.onRequest -> OAuth2Plugin.onRequest -> HTTP Request
2. Response flow: HTTP Response -> OAuth2Plugin.onResponse -> LoggingPlugin.onResponse

## Advanced Usage

### Using as an Auth Provider

The OAuth2 Plugin implements the AuthProvider interface, which allows it to be used with the SHC client's auth configuration:

```typescript
import { createSHCClient } from '@shc/core';
import { OAuth2Plugin } from '@shc/plugins/oauth2';

// Create OAuth2 plugin
const oauth2Plugin = new OAuth2Plugin();

// Create client with OAuth2 plugin as auth provider
const client = createSHCClient({
  plugins: [
    {
      plugin: oauth2Plugin,
      config: {
        // OAuth2 plugin configuration
      },
    },
  ],
  auth: {
    type: 'oauth2',
  },
});
```

### Manually Refreshing Tokens

You can manually refresh the OAuth2 token if needed:

```typescript
import { createSHCClient } from '@shc/core';
import { OAuth2Plugin } from '@shc/plugins/oauth2';

// Create OAuth2 plugin
const oauth2Plugin = new OAuth2Plugin();

// Create client with OAuth2 plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: oauth2Plugin,
      config: {
        // OAuth2 plugin configuration
      },
    },
  ],
});

// Manually refresh token
async function refreshToken() {
  try {
    const token = await oauth2Plugin.getToken(true);
    console.log('Token refreshed successfully');
    return token;
  } catch (error) {
    console.error('Failed to refresh token', error);
    throw error;
  }
}
```

## Implementation Requirements

The OAuth2 Plugin implementation must follow these requirements:

1. **Security**:
   - Secure handling of client secrets and tokens
   - Proper validation of state parameters
   - Protection against token leakage

2. **Reliability**:
   - Graceful handling of token expiration
   - Proper error handling for auth failures
   - Resilient token refresh mechanism

3. **Configurability**:
   - Support for all major OAuth2 flows
   - Flexible scope configuration
   - Runtime configuration changes

4. **Performance**:
   - Efficient token management
   - Minimal overhead for authenticated requests
   - Proper caching of tokens

5. **Compatibility**:
   - Compliance with OAuth2 specifications
   - Support for various OAuth2 providers
   - Interoperability with other plugins

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
