import { describe, it, expect, vi } from 'vitest';
import { SHCClient } from '../../src/services/client';
import { PluginType } from '../../src/types/plugin.types';

describe('SHCClient', () => {
  describe('create', () => {
    it('should create a new client instance', () => {
      const client = SHCClient.create({
        baseURL: 'https://api.example.com',
        timeout: 5000,
      });

      // Verify that the client is an object with the expected methods
      expect(client).toBeDefined();
      expect(typeof client.request).toBe('function');
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
      expect(typeof client.put).toBe('function');
      expect(typeof client.delete).toBe('function');
      expect(typeof client.patch).toBe('function');
      expect(typeof client.head).toBe('function');
      expect(typeof client.options).toBe('function');
      expect(typeof client.setDefaultHeader).toBe('function');
      expect(typeof client.setTimeout).toBe('function');
      expect(typeof client.setBaseURL).toBe('function');
      expect(typeof client.use).toBe('function');
      expect(typeof client.removePlugin).toBe('function');
      expect(typeof client.on).toBe('function');
      expect(typeof client.off).toBe('function');
    });

    it('should create a new client instance with default configuration if none provided', () => {
      const client = SHCClient.create();
      expect(client).toBeDefined();
    });
  });

  describe('Plugin management', () => {
    it('should throw an error when registering a plugin without a name', () => {
      const client = SHCClient.create();
      const mockPlugin = {
        name: '',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: async () => ({}),
      };

      expect(() => client.use(mockPlugin)).toThrow('Plugin must have a name');
    });

    it('should register and remove a plugin', () => {
      const client = SHCClient.create();
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: async () => ({}),
      };

      // Should not throw when registering a valid plugin
      expect(() => client.use(mockPlugin)).not.toThrow();

      // Should not throw when removing a registered plugin
      expect(() => client.removePlugin('test-plugin')).not.toThrow();
    });
  });

  describe('Event handling', () => {
    it('should register and remove event handlers', () => {
      const client = SHCClient.create();
      const mockHandler = vi.fn();

      // Should not throw when registering an event handler
      expect(() => client.on('request', mockHandler)).not.toThrow();

      // Should not throw when removing an event handler
      expect(() => client.off('request', mockHandler)).not.toThrow();
    });
  });

  describe('Configuration methods', () => {
    it('should have configuration methods', () => {
      const client = SHCClient.create();

      // Should not throw when setting configuration
      expect(() => client.setDefaultHeader('Content-Type', 'application/json')).not.toThrow();
      expect(() => client.setTimeout(10000)).not.toThrow();
      expect(() => client.setBaseURL('https://api.example.com')).not.toThrow();
    });
  });
});
