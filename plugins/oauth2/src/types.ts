/**
 * OAuth2 flow types
 */
export type OAuth2Flow = 'authorization_code' | 'client_credentials' | 'password';

/**
 * OAuth2 token response
 */
export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * OAuth2 token data
 */
export interface OAuth2TokenData extends OAuth2TokenResponse {
  expires_at?: number;
  created_at: number;
}

/**
 * OAuth2 plugin configuration
 */
export interface OAuth2Config {
  /**
   * OAuth2 flow type
   */
  flow: OAuth2Flow;
  
  /**
   * OAuth2 client ID
   */
  clientId: string;
  
  /**
   * OAuth2 client secret
   */
  clientSecret: string;
  
  /**
   * OAuth2 authorization URL (required for authorization_code flow)
   */
  authorizationUrl?: string;
  
  /**
   * OAuth2 token URL
   */
  tokenUrl: string;
  
  /**
   * OAuth2 scopes
   */
  scopes: string[];
  
  /**
   * OAuth2 redirect URI (required for authorization_code flow)
   */
  redirectUri?: string;
  
  /**
   * Automatically refresh tokens when they expire
   * @default true
   */
  autoRefresh: boolean;
}

/**
 * Default configuration for the OAuth2 plugin
 */
export const DEFAULT_CONFIG: Partial<OAuth2Config> = {
  flow: 'client_credentials',
  scopes: [],
  autoRefresh: true,
};

/**
 * Plugin type enum
 */
export enum PluginType {
  REQUEST_PREPROCESSOR = 'request-preprocessor',
  RESPONSE_TRANSFORMER = 'response-transformer',
  AUTH_PROVIDER = 'auth-provider',
}
