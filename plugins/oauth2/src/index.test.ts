import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OAuth2Plugin from './index';
import { OAuth2Flow } from './types';

describe('OAuth2Plugin', () => {
  // Mock console.log and fetch
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const fetchSpy = vi.spyOn(global, 'fetch');
  
  beforeEach(() => {
    // Reset mocks before each test
    consoleSpy.mockClear();
    fetchSpy.mockClear();
    
    // Reset plugin state
    OAuth2Plugin.tokenData = null;
    OAuth2Plugin.authState = 'test-state';
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should have correct metadata', () => {
    expect(OAuth2Plugin.name).toBe('oauth2-plugin');
    expect(OAuth2Plugin.version).toBe('1.0.0');
  });
  
  it('should initialize correctly', async () => {
    await OAuth2Plugin.initialize();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initializing oauth2-plugin'));
    expect(OAuth2Plugin.authState).toBeTruthy();
  });
  
  it('should validate configuration for client credentials flow', async () => {
    const config = {
      flow: 'client_credentials' as OAuth2Flow,
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      tokenUrl: 'https://example.com/token',
      scopes: ['read', 'write'],
    };
    
    await OAuth2Plugin.configure(config);
    
    expect(OAuth2Plugin.config.flow).toBe('client_credentials');
    expect(OAuth2Plugin.config.clientId).toBe('test-client-id');
    expect(OAuth2Plugin.config.clientSecret).toBe('test-client-secret');
    expect(OAuth2Plugin.config.tokenUrl).toBe('https://example.com/token');
    expect(OAuth2Plugin.config.scopes).toEqual(['read', 'write']);
    expect(OAuth2Plugin.config.autoRefresh).toBe(true);
  });
  
  it('should validate configuration for authorization code flow', async () => {
    const config = {
      flow: 'authorization_code' as OAuth2Flow,
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      authorizationUrl: 'https://example.com/authorize',
      tokenUrl: 'https://example.com/token',
      redirectUri: 'https://app.example.com/callback',
      scopes: ['read', 'write'],
    };
    
    await OAuth2Plugin.configure(config);
    
    expect(OAuth2Plugin.config.flow).toBe('authorization_code');
    expect(OAuth2Plugin.config.authorizationUrl).toBe('https://example.com/authorize');
    expect(OAuth2Plugin.config.redirectUri).toBe('https://app.example.com/callback');
  });
  
  it('should throw error for missing required configuration', async () => {
    const config = {
      flow: 'client_credentials' as OAuth2Flow,
      // Missing clientId and clientSecret
      tokenUrl: 'https://example.com/token',
    };
    
    await expect(OAuth2Plugin.configure(config)).rejects.toThrow('requires clientId');
  });
  
  it('should throw error for missing authorization code flow configuration', async () => {
    const config = {
      flow: 'authorization_code' as OAuth2Flow,
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      tokenUrl: 'https://example.com/token',
      // Missing authorizationUrl and redirectUri
    };
    
    await expect(OAuth2Plugin.configure(config)).rejects.toThrow('requires authorizationUrl');
  });
  
  it('should get token with client credentials flow', async () => {
    await OAuth2Plugin.configure({
      flow: 'client_credentials',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      tokenUrl: 'https://example.com/token',
      scopes: ['read', 'write'],
    });
    
    // Mock successful token response
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    } as Response);
    
    const request = {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: {},
    };
    
    const result = await OAuth2Plugin.execute(request);
    
    // Should have called fetch to get token
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/token',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('grant_type=client_credentials'),
      })
    );
    
    // Should have added token to request
    expect(result.headers['Authorization']).toBe('Bearer test-access-token');
    
    // Should have stored token data
    expect(OAuth2Plugin.tokenData).toMatchObject({
      access_token: 'test-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    });
    
    // Should have calculated expiration
    expect(OAuth2Plugin.tokenData?.expires_at).toBeGreaterThan(Date.now());
  });
  
  it('should refresh token when expired', async () => {
    await OAuth2Plugin.configure({
      flow: 'client_credentials',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      tokenUrl: 'https://example.com/token',
    });
    
    // Set expired token
    OAuth2Plugin.tokenData = {
      access_token: 'expired-token',
      token_type: 'Bearer',
      refresh_token: 'test-refresh-token',
      created_at: Date.now() - 4000000, // 4000 seconds ago
      expires_at: Date.now() - 400000, // 400 seconds ago
    };
    
    // Mock successful refresh response
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    } as Response);
    
    const request = {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: {},
    };
    
    const result = await OAuth2Plugin.execute(request);
    
    // Should have called fetch to refresh token
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/token',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('grant_type=refresh_token'),
      })
    );
    
    // Should have added new token to request
    expect(result.headers['Authorization']).toBe('Bearer new-access-token');
    
    // Should have updated token data
    expect(OAuth2Plugin.tokenData?.access_token).toBe('new-access-token');
    
    // Should have kept refresh token
    expect(OAuth2Plugin.tokenData?.refresh_token).toBe('test-refresh-token');
  });
  
  it('should generate authorization URL for authorization code flow', async () => {
    await OAuth2Plugin.configure({
      flow: 'authorization_code',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      authorizationUrl: 'https://example.com/authorize',
      tokenUrl: 'https://example.com/token',
      redirectUri: 'https://app.example.com/callback',
      scopes: ['read', 'write'],
    });
    
    const url = await OAuth2Plugin.providedFunctions.getAuthorizationUrl.execute();
    
    expect(url).toContain('https://example.com/authorize');
    expect(url).toContain('client_id=test-client-id');
    expect(url).toContain('redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback');
    expect(url).toContain('response_type=code');
    expect(url).toContain('scope=read%20write');
    expect(url).toContain(`state=${OAuth2Plugin.authState}`);
  });
  
  it('should handle authorization code callback', async () => {
    await OAuth2Plugin.configure({
      flow: 'authorization_code',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      authorizationUrl: 'https://example.com/authorize',
      tokenUrl: 'https://example.com/token',
      redirectUri: 'https://app.example.com/callback',
    });
    
    // Mock successful token response
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
      }),
    } as Response);
    
    await OAuth2Plugin.providedFunctions.handleCallback.execute('test-code', 'test-state');
    
    // Should have called fetch to get token
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/token',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('grant_type=authorization_code'),
        body: expect.stringContaining('code=test-code'),
      })
    );
    
    // Should have stored token data
    expect(OAuth2Plugin.tokenData).toMatchObject({
      access_token: 'test-access-token',
      token_type: 'Bearer',
      refresh_token: 'test-refresh-token',
    });
  });
  
  it('should reject callback with invalid state', async () => {
    await OAuth2Plugin.configure({
      flow: 'authorization_code',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      authorizationUrl: 'https://example.com/authorize',
      tokenUrl: 'https://example.com/token',
      redirectUri: 'https://app.example.com/callback',
    });
    
    await expect(
      OAuth2Plugin.providedFunctions.handleCallback.execute('test-code', 'invalid-state')
    ).rejects.toThrow('Invalid state parameter');
  });
  
  it('should validate tokens', async () => {
    // Valid token
    OAuth2Plugin.tokenData = {
      access_token: 'valid-token',
      token_type: 'Bearer',
      created_at: Date.now(),
      expires_at: Date.now() + 3600000, // 1 hour from now
    };
    
    expect(await OAuth2Plugin.validate('valid-token')).toBe(true);
    expect(await OAuth2Plugin.validate('invalid-token')).toBe(false);
    
    // Expired token
    OAuth2Plugin.tokenData = {
      access_token: 'expired-token',
      token_type: 'Bearer',
      created_at: Date.now() - 7200000, // 2 hours ago
      expires_at: Date.now() - 3600000, // 1 hour ago
    };
    
    expect(await OAuth2Plugin.validate('expired-token')).toBe(false);
  });
  
  it('should provide token info', async () => {
    // No token
    OAuth2Plugin.tokenData = null;
    let info = await OAuth2Plugin.providedFunctions.getTokenInfo.execute();
    expect(info.status).toBe('no_token');
    
    // Valid token
    OAuth2Plugin.tokenData = {
      access_token: 'valid-token',
      token_type: 'Bearer',
      refresh_token: 'refresh-token',
      scope: 'read write',
      created_at: Date.now(),
      expires_at: Date.now() + 3600000, // 1 hour from now
    };
    
    info = await OAuth2Plugin.providedFunctions.getTokenInfo.execute();
    expect(info.status).toBe('valid');
    expect(info.token_type).toBe('Bearer');
    expect(info.scope).toBe('read write');
    expect(info.has_refresh_token).toBe(true);
    
    // Expired token
    OAuth2Plugin.tokenData = {
      access_token: 'expired-token',
      token_type: 'Bearer',
      created_at: Date.now() - 7200000, // 2 hours ago
      expires_at: Date.now() - 3600000, // 1 hour ago
    };
    
    info = await OAuth2Plugin.providedFunctions.getTokenInfo.execute();
    expect(info.status).toBe('expired');
  });
  
  it('should clear token', async () => {
    OAuth2Plugin.tokenData = {
      access_token: 'test-token',
      token_type: 'Bearer',
      created_at: Date.now(),
    };
    
    await OAuth2Plugin.providedFunctions.clearToken.execute();
    expect(OAuth2Plugin.tokenData).toBeNull();
  });
});
