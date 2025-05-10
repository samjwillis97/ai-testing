# Authentication Plugin

## Overview

The Authentication Plugin provides a flexible authentication framework for the SHC client. It supports multiple authentication methods including Basic, Bearer, API Key, and custom schemes, with the ability to integrate with external authentication providers.

## Features

- Multiple authentication schemes
- Header, query, and cookie-based authentication
- Dynamic credential resolution
- Integration with external auth providers
- Request signing support

## Configuration

```typescript
interface AuthConfig {
  type: 'basic' | 'bearer' | 'apiKey' | 'custom';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
    key?: string;
    value?: string;
  };
  location?: 'header' | 'query' | 'cookie';
  name?: string;
  template?: string;
  provider?: string;
  signRequest?: boolean;
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | | Authentication type |
| `credentials` | object | | Authentication credentials |
| `credentials.username` | string | | Username for Basic auth |
| `credentials.password` | string | | Password for Basic auth |
| `credentials.token` | string | | Token for Bearer auth |
| `credentials.key` | string | | Key name for API Key auth |
| `credentials.value` | string | | Value for API Key auth |
| `location` | string | `'header'` | Location for auth data (header, query, or cookie) |
| `name` | string | | Name of the header, query param, or cookie |
| `template` | string | | Template for custom auth schemes |
| `provider` | string | | Name of external auth provider |
| `signRequest` | boolean | `false` | Whether to sign the request |

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

export class AuthPlugin implements Plugin {
  private config: AuthConfig;
  private providers: Map<string, AuthProvider> = new Map();
  private logger: any;
  
  constructor() {
    // Default configuration
    this.config = {
      type: 'basic',
      location: 'header',
      signRequest: false,
    };
  }
  
  /**
   * Initialize the plugin
   */
  async onInit(context: PluginContext): Promise<void> {
    this.logger = context.logger;
    
    // Register as authentication provider registry
    if (context.registerAuthProviderRegistry) {
      context.registerAuthProviderRegistry(this);
    }
    
    this.logger?.info('Auth plugin initialized');
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
    
    this.logger?.info('Auth plugin configured');
  }
  
  /**
   * Process request before it is sent
   */
  async onRequest(request: RequestConfig): Promise<RequestConfig> {
    // Check if authentication is needed for this request
    if (!this.shouldAuthenticate(request)) {
      return request;
    }
    
    // Apply authentication
    try {
      return await this.applyAuthentication(request);
    } catch (error) {
      this.logger?.error('Failed to apply authentication', error);
      throw error;
    }
  }
  
  /**
   * Process response after it is received
   */
  async onResponse(response: Response<any>, request: RequestConfig): Promise<Response<any>> {
    // Handle authentication errors
    if (response.status === 401) {
      this.logger?.warn('Authentication failed');
      
      // Add metadata about auth failure
      response.meta = response.meta || {};
      response.meta.authFailed = true;
    }
    
    return response;
  }
  
  /**
   * Clean up when plugin is destroyed
   */
  async onDestroy(): Promise<void> {
    this.logger?.info('Auth plugin destroyed');
  }
  
  /**
   * Register an authentication provider
   */
  registerProvider(name: string, provider: AuthProvider): void {
    this.providers.set(name, provider);
    this.logger?.info(`Registered auth provider: ${name}`);
  }
  
  /**
   * Get an authentication provider
   */
  getProvider(name: string): AuthProvider | undefined {
    return this.providers.get(name);
  }
  
  /**
   * Check if a request should be authenticated
   */
  private shouldAuthenticate(request: RequestConfig): boolean {
    // Check if request already has authentication
    if (request.auth) {
      return false;
    }
    
    // Check if request has auth metadata
    if (request.meta?.skipAuth) {
      return false;
    }
    
    // Check if authentication is configured
    if (!this.config.type) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Apply authentication to a request
   */
  private async applyAuthentication(request: RequestConfig): Promise<RequestConfig> {
    // Use external provider if specified
    if (this.config.provider) {
      return this.applyProviderAuthentication(request);
    }
    
    // Apply built-in authentication schemes
    switch (this.config.type) {
      case 'basic':
        return this.applyBasicAuth(request);
      case 'bearer':
        return this.applyBearerAuth(request);
      case 'apiKey':
        return this.applyApiKeyAuth(request);
      case 'custom':
        return this.applyCustomAuth(request);
      default:
        throw new Error(`Unsupported authentication type: ${this.config.type}`);
    }
  }
  
  /**
   * Apply authentication using an external provider
   */
  private async applyProviderAuthentication(request: RequestConfig): Promise<RequestConfig> {
    const provider = this.providers.get(this.config.provider!);
    
    if (!provider) {
      throw new Error(`Auth provider not found: ${this.config.provider}`);
    }
    
    // Get authentication headers from provider
    const authHeaders = await provider.getAuthHeader(request);
    
    // Apply headers to request
    request.headers = {
      ...request.headers,
      ...authHeaders,
    };
    
    // Sign request if needed
    if (this.config.signRequest && provider.signRequest) {
      request = await provider.signRequest(request);
    }
    
    return request;
  }
  
  /**
   * Apply Basic authentication
   */
  private applyBasicAuth(request: RequestConfig): RequestConfig {
    if (!this.config.credentials?.username) {
      throw new Error('Username is required for Basic authentication');
    }
    
    // Create Basic auth header
    const username = this.config.credentials.username;
    const password = this.config.credentials.password || '';
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    
    // Apply authentication based on location
    return this.applyAuthData(request, 'Authorization', `Basic ${token}`);
  }
  
  /**
   * Apply Bearer authentication
   */
  private applyBearerAuth(request: RequestConfig): RequestConfig {
    if (!this.config.credentials?.token) {
      throw new Error('Token is required for Bearer authentication');
    }
    
    // Create Bearer auth header
    const token = this.config.credentials.token;
    
    // Apply authentication based on location
    return this.applyAuthData(request, 'Authorization', `Bearer ${token}`);
  }
  
  /**
   * Apply API Key authentication
   */
  private applyApiKeyAuth(request: RequestConfig): RequestConfig {
    if (!this.config.credentials?.key) {
      throw new Error('Key is required for API Key authentication');
    }
    
    if (!this.config.credentials?.value) {
      throw new Error('Value is required for API Key authentication');
    }
    
    // Get key and value
    const key = this.config.credentials.key;
    const value = this.config.credentials.value;
    
    // Apply authentication based on location
    return this.applyAuthData(request, key, value);
  }
  
  /**
   * Apply custom authentication
   */
  private applyCustomAuth(request: RequestConfig): RequestConfig {
    if (!this.config.template) {
      throw new Error('Template is required for custom authentication');
    }
    
    // Get template and credentials
    const template = this.config.template;
    const credentials = this.config.credentials || {};
    
    // Replace placeholders in template
    let value = template;
    
    for (const [key, val] of Object.entries(credentials)) {
      value = value.replace(`{${key}}`, val);
    }
    
    // Apply authentication based on location
    return this.applyAuthData(request, this.config.name || 'Authorization', value);
  }
  
  /**
   * Apply authentication data to a request
   */
  private applyAuthData(request: RequestConfig, key: string, value: string): RequestConfig {
    switch (this.config.location) {
      case 'header':
        // Apply as header
        request.headers = request.headers || {};
        request.headers[key] = value;
        break;
      case 'query':
        // Apply as query parameter
        request.params = request.params || {};
        request.params[key] = value;
        break;
      case 'cookie':
        // Apply as cookie
        request.headers = request.headers || {};
        
        // Append to existing cookies if any
        const cookies = request.headers['Cookie'] || '';
        request.headers['Cookie'] = cookies ? `${cookies}; ${key}=${value}` : `${key}=${value}`;
        break;
      default:
        throw new Error(`Unsupported auth location: ${this.config.location}`);
    }
    
    return request;
  }
  
  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.type) {
      throw new Error('Authentication type is required');
    }
    
    if (this.config.type === 'basic' && !this.config.credentials?.username) {
      throw new Error('Username is required for Basic authentication');
    }
    
    if (this.config.type === 'bearer' && !this.config.credentials?.token) {
      throw new Error('Token is required for Bearer authentication');
    }
    
    if (this.config.type === 'apiKey') {
      if (!this.config.credentials?.key) {
        throw new Error('Key is required for API Key authentication');
      }
      
      if (!this.config.credentials?.value) {
        throw new Error('Value is required for API Key authentication');
      }
    }
    
    if (this.config.type === 'custom' && !this.config.template) {
      throw new Error('Template is required for custom authentication');
    }
    
    if (this.config.provider && !this.providers.has(this.config.provider)) {
      this.logger?.warn(`Auth provider not found: ${this.config.provider}`);
    }
  }
}

/**
 * Authentication provider interface
 */
export interface AuthProvider {
  getAuthHeader(request: RequestConfig): Promise<Record<string, string>>;
  signRequest?(request: RequestConfig): Promise<RequestConfig>;
}
```

## Usage Example

### Basic Authentication

```typescript
import { createSHCClient } from '@shc/core';
import { AuthPlugin } from '@shc/plugins/auth';

// Create client with auth plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new AuthPlugin(),
      config: {
        type: 'basic',
        credentials: {
          username: 'user',
          password: 'pass',
        },
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

### Bearer Token Authentication

```typescript
import { createSHCClient } from '@shc/core';
import { AuthPlugin } from '@shc/plugins/auth';

// Create client with auth plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new AuthPlugin(),
      config: {
        type: 'bearer',
        credentials: {
          token: 'your-token',
        },
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

### API Key Authentication

```typescript
import { createSHCClient } from '@shc/core';
import { AuthPlugin } from '@shc/plugins/auth';

// Create client with auth plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new AuthPlugin(),
      config: {
        type: 'apiKey',
        credentials: {
          key: 'X-API-Key',
          value: 'your-api-key',
        },
        location: 'header',
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

### Custom Authentication

```typescript
import { createSHCClient } from '@shc/core';
import { AuthPlugin } from '@shc/plugins/auth';

// Create client with auth plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new AuthPlugin(),
      config: {
        type: 'custom',
        name: 'Authorization',
        template: 'CustomScheme key="{key}", timestamp="{timestamp}"',
        credentials: {
          key: 'your-api-key',
          timestamp: Date.now().toString(),
        },
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

## Integration with External Auth Providers

The Auth Plugin can integrate with external authentication providers, such as the OAuth2 Plugin:

```typescript
import { createSHCClient } from '@shc/core';
import { AuthPlugin } from '@shc/plugins/auth';
import { OAuth2Plugin } from '@shc/plugins/oauth2';

// Create OAuth2 plugin
const oauth2Plugin = new OAuth2Plugin();

// Create auth plugin
const authPlugin = new AuthPlugin();

// Create client with both plugins
const client = createSHCClient({
  plugins: [
    {
      plugin: oauth2Plugin,
      config: {
        flow: 'client_credentials',
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
        tokenUrl: 'https://auth.example.com/token',
        scopes: ['read', 'write'],
      },
    },
    {
      plugin: authPlugin,
      config: {
        provider: 'oauth2',
      },
    },
  ],
});

// Register OAuth2 plugin as auth provider
authPlugin.registerProvider('oauth2', oauth2Plugin);

// Make authenticated request
client.get('https://api.example.com/users')
  .then(response => {
    console.log('Request succeeded');
  })
  .catch(error => {
    console.error('Request failed', error);
  });
```

## Advanced Usage

### Request Signing

For APIs that require request signing, you can implement a custom auth provider:

```typescript
import { createSHCClient } from '@shc/core';
import { AuthPlugin, AuthProvider } from '@shc/plugins/auth';
import * as crypto from 'crypto';

// Create custom auth provider for AWS-style request signing
class AwsAuthProvider implements AuthProvider {
  private accessKey: string;
  private secretKey: string;
  private region: string;
  private service: string;
  
  constructor(accessKey: string, secretKey: string, region: string, service: string) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.region = region;
    this.service = service;
  }
  
  async getAuthHeader(request: RequestConfig): Promise<Record<string, string>> {
    // Return basic headers needed for AWS auth
    return {
      'X-Amz-Date': this.getAmzDate(),
    };
  }
  
  async signRequest(request: RequestConfig): Promise<RequestConfig> {
    // Implement AWS Signature V4 signing process
    // This is a simplified example
    
    const datetime = this.getAmzDate();
    const date = datetime.substring(0, 8);
    
    // Create canonical request
    const method = request.method?.toUpperCase() || 'GET';
    const path = new URL(request.url || '').pathname || '/';
    const query = new URL(request.url || '').search || '';
    
    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${date}/${this.region}/${this.service}/aws4_request`;
    const stringToSign = [
      algorithm,
      datetime,
      credentialScope,
      this.hash(this.createCanonicalRequest(method, path, query, request)),
    ].join('\n');
    
    // Calculate signature
    const signature = this.calculateSignature(this.secretKey, date, this.region, this.service, stringToSign);
    
    // Add authorization header
    request.headers = request.headers || {};
    request.headers['Authorization'] = [
      `${algorithm} Credential=${this.accessKey}/${credentialScope}`,
      `SignedHeaders=host;x-amz-date`,
      `Signature=${signature}`,
    ].join(', ');
    
    return request;
  }
  
  private getAmzDate(): string {
    return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
  }
  
  private hash(data: string): string {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }
  
  private createCanonicalRequest(method: string, path: string, query: string, request: RequestConfig): string {
    // Simplified implementation
    return [
      method,
      path,
      query,
      'host:' + new URL(request.url || '').host,
      'x-amz-date:' + this.getAmzDate(),
      '',
      'host;x-amz-date',
      this.hash(request.data || ''),
    ].join('\n');
  }
  
  private calculateSignature(secretKey: string, date: string, region: string, service: string, stringToSign: string): string {
    // Simplified implementation
    const kDate = crypto.createHmac('sha256', 'AWS4' + secretKey).update(date).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    return crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  }
}

// Create auth plugin
const authPlugin = new AuthPlugin();

// Create AWS auth provider
const awsAuthProvider = new AwsAuthProvider(
  'your-access-key',
  'your-secret-key',
  'us-east-1',
  's3'
);

// Register AWS auth provider
authPlugin.registerProvider('aws', awsAuthProvider);

// Create client with auth plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: authPlugin,
      config: {
        provider: 'aws',
        signRequest: true,
      },
    },
  ],
});

// Make authenticated request to AWS
client.get('https://s3.amazonaws.com/your-bucket/your-object')
  .then(response => {
    console.log('Request succeeded');
  })
  .catch(error => {
    console.error('Request failed', error);
  });
```

### Dynamic Credentials

For scenarios where credentials need to be dynamically resolved:

```typescript
import { createSHCClient } from '@shc/core';
import { AuthPlugin } from '@shc/plugins/auth';

// Create credential provider
class CredentialProvider {
  async getCredentials(): Promise<{ username: string; password: string }> {
    // In a real implementation, this might load from a secure store
    // or an external service
    return {
      username: 'user-' + Date.now(),
      password: 'generated-password',
    };
  }
}

const credentialProvider = new CredentialProvider();

// Create client with auth plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new AuthPlugin(),
      config: {
        type: 'basic',
        // Initial credentials will be updated before each request
        credentials: {
          username: '',
          password: '',
        },
      },
    },
  ],
});

// Intercept requests to update credentials
client.interceptors.request.use(async (config) => {
  // Get fresh credentials
  const credentials = await credentialProvider.getCredentials();
  
  // Update auth plugin configuration
  await client.configurePlugin('AuthPlugin', {
    credentials,
  });
  
  return config;
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

## Implementation Requirements

The Auth Plugin implementation must follow these requirements:

1. **Security**:
   - Secure handling of credentials
   - Protection against credential leakage
   - Support for secure authentication methods

2. **Flexibility**:
   - Support for multiple authentication schemes
   - Extensible provider system
   - Configurable authentication behavior

3. **Interoperability**:
   - Seamless integration with other plugins
   - Support for standard authentication protocols
   - Compatibility with various API styles

4. **Performance**:
   - Efficient credential management
   - Minimal overhead for authentication
   - Optimized request signing

5. **Reliability**:
   - Graceful handling of authentication failures
   - Proper error reporting
   - Robust credential validation

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
