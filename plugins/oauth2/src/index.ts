import { PluginType } from './types';
import { OAuth2Config, DEFAULT_CONFIG, OAuth2TokenData, OAuth2Flow } from './types';

/**
 * OAuth2 Authentication Plugin for SHC
 * 
 * This plugin provides OAuth2 authentication for requests with
 * support for multiple OAuth2 flows and automatic token refresh.
 */
const OAuth2Plugin = {
  name: 'oauth2-plugin',
  version: '1.0.0',
  type: PluginType.AUTH_PROVIDER,
  
  // Plugin configuration
  config: { ...DEFAULT_CONFIG } as OAuth2Config,
  
  // Token storage
  tokenData: null as OAuth2TokenData | null,
  
  // State for authorization code flow
  authState: '',
  
  // Plugin initialization
  async initialize(): Promise<void> {
    console.log(`Initializing ${this.name} v${this.version}`);
    
    // Generate a random state for authorization code flow
    this.authState = Math.random().toString(36).substring(2, 15);
  },
  
  // Plugin configuration
  async configure(config: Partial<OAuth2Config>): Promise<void> {
    // Validate required configuration
    if (!config.clientId) {
      throw new Error('OAuth2 configuration requires clientId');
    }
    
    if (!config.clientSecret) {
      throw new Error('OAuth2 configuration requires clientSecret');
    }
    
    if (!config.tokenUrl) {
      throw new Error('OAuth2 configuration requires tokenUrl');
    }
    
    // Additional validation based on flow
    if (config.flow === 'authorization_code') {
      if (!config.authorizationUrl) {
        throw new Error('authorization_code flow requires authorizationUrl');
      }
      
      if (!config.redirectUri) {
        throw new Error('authorization_code flow requires redirectUri');
      }
    }
    
    // Merge with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      scopes: config.scopes || DEFAULT_CONFIG.scopes || [],
    } as OAuth2Config;
    
    console.log(`Configured ${this.name} with flow: ${this.config.flow}`);
  },
  
  // Plugin cleanup
  async destroy(): Promise<void> {
    console.log(`Shutting down ${this.name}`);
    this.tokenData = null;
  },
  
  // Plugin execution - adds authentication to requests
  async execute(request: any): Promise<any> {
    // Check if we have a valid token
    if (!this.tokenData || this.isTokenExpired()) {
      // No token or expired token, get a new one
      if (this.config.autoRefresh && this.tokenData?.refresh_token) {
        // Refresh the token
        await this.refreshToken();
      } else {
        // Get a new token
        await this.getToken();
      }
    }
    
    // Add the token to the request
    if (this.tokenData) {
      request.headers = request.headers || {};
      request.headers['Authorization'] = `${this.tokenData.token_type} ${this.tokenData.access_token}`;
    }
    
    return request;
  },
  
  // Refresh an expired token
  async refresh(token: string): Promise<OAuth2TokenData> {
    if (!this.tokenData || !this.tokenData.refresh_token) {
      throw new Error('No refresh token available');
    }
    
    return this.refreshToken();
  },
  
  // Validate a token
  async validate(token: string): Promise<boolean> {
    // Simple validation based on expiration
    if (!this.tokenData || this.tokenData.access_token !== token) {
      return false;
    }
    
    return !this.isTokenExpired();
  },
  
  // Provided functions for template resolution
  providedFunctions: {
    // Get the authorization URL for authorization_code flow
    getAuthorizationUrl: {
      execute: async (): Promise<string> => {
        if (OAuth2Plugin.config.flow !== 'authorization_code') {
          throw new Error('getAuthorizationUrl is only available for authorization_code flow');
        }
        
        if (!OAuth2Plugin.config.authorizationUrl) {
          throw new Error('authorizationUrl is not configured');
        }
        
        const params = new URLSearchParams({
          client_id: OAuth2Plugin.config.clientId,
          redirect_uri: OAuth2Plugin.config.redirectUri || '',
          response_type: 'code',
          scope: OAuth2Plugin.config.scopes.join(' '),
          state: OAuth2Plugin.authState,
        });
        
        return `${OAuth2Plugin.config.authorizationUrl}?${params.toString()}`;
      },
      parameters: [],
    },
    
    // Handle the authorization code callback
    handleCallback: {
      execute: async (code: string, state: string): Promise<void> => {
        if (OAuth2Plugin.config.flow !== 'authorization_code') {
          throw new Error('handleCallback is only available for authorization_code flow');
        }
        
        if (state !== OAuth2Plugin.authState) {
          throw new Error('Invalid state parameter');
        }
        
        await OAuth2Plugin.getTokenWithAuthorizationCode(code);
      },
      parameters: ['code', 'state'],
    },
    
    // Get the current token data
    getTokenInfo: {
      execute: async (): Promise<any> => {
        if (!OAuth2Plugin.tokenData) {
          return { status: 'no_token' };
        }
        
        return {
          status: OAuth2Plugin.isTokenExpired() ? 'expired' : 'valid',
          expires_at: OAuth2Plugin.tokenData.expires_at,
          created_at: OAuth2Plugin.tokenData.created_at,
          token_type: OAuth2Plugin.tokenData.token_type,
          scope: OAuth2Plugin.tokenData.scope,
          has_refresh_token: !!OAuth2Plugin.tokenData.refresh_token,
        };
      },
      parameters: [],
    },
    
    // Clear the current token
    clearToken: {
      execute: async (): Promise<void> => {
        OAuth2Plugin.tokenData = null;
      },
      parameters: [],
    },
  },
  
  // Utility methods
  
  /**
   * Check if the current token is expired
   */
  isTokenExpired(): boolean {
    if (!this.tokenData || !this.tokenData.expires_at) {
      return true;
    }
    
    // Add a 30-second buffer to prevent edge cases
    return Date.now() >= (this.tokenData.expires_at - 30000);
  },
  
  /**
   * Get a new token based on the configured flow
   */
  async getToken(): Promise<OAuth2TokenData> {
    switch (this.config.flow) {
      case 'client_credentials':
        return this.getTokenWithClientCredentials();
        
      case 'password':
        throw new Error('Password flow requires username and password parameters');
        
      case 'authorization_code':
        throw new Error('Authorization code flow requires a code from the authorization server');
        
      default:
        throw new Error(`Unsupported OAuth2 flow: ${this.config.flow}`);
    }
  },
  
  /**
   * Get a token using the client credentials flow
   */
  async getTokenWithClientCredentials(): Promise<OAuth2TokenData> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });
    
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
      throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Store the token with expiration
    this.tokenData = {
      ...data,
      created_at: Date.now(),
      expires_at: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined,
    };
    
    return this.tokenData;
  },
  
  /**
   * Get a token using the authorization code flow
   */
  async getTokenWithAuthorizationCode(code: string): Promise<OAuth2TokenData> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri || '',
    });
    
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Store the token with expiration
    this.tokenData = {
      ...data,
      created_at: Date.now(),
      expires_at: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined,
    };
    
    return this.tokenData;
  },
  
  /**
   * Get a token using the password flow
   */
  async getTokenWithPassword(username: string, password: string): Promise<OAuth2TokenData> {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      username,
      password,
    });
    
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
      throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Store the token with expiration
    this.tokenData = {
      ...data,
      created_at: Date.now(),
      expires_at: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined,
    };
    
    return this.tokenData;
  },
  
  /**
   * Refresh an existing token
   */
  async refreshToken(): Promise<OAuth2TokenData> {
    if (!this.tokenData || !this.tokenData.refresh_token) {
      throw new Error('No refresh token available');
    }
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.tokenData.refresh_token,
    });
    
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Store the token with expiration
    this.tokenData = {
      ...data,
      // Keep the refresh token if not provided in the response
      refresh_token: data.refresh_token || this.tokenData.refresh_token,
      created_at: Date.now(),
      expires_at: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined,
    };
    
    return this.tokenData;
  },
};

export default OAuth2Plugin;
