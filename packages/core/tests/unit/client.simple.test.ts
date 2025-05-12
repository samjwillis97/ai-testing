import { describe, it, expect, vi } from 'vitest';
import { SHCClient } from '../../src/services/client';
import { PluginType } from '../../src/types/plugin.types';

describe('SHCClient', () => {
  describe('create', () => {
    it('should create a new client instance', async () => {
      const client = await SHCClient.create({
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

    it('should create a new client instance with default configuration if none provided', async () => {
      const client = await SHCClient.create();
      expect(client).toBeDefined();
    });
  });

  describe('Plugin management', () => {
    it('should throw an error when registering a plugin without a name', async () => {
      const client = await SHCClient.create();
      const mockPlugin = {
        name: '',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: async () => ({}),
      };

      expect(() => client.use(mockPlugin)).toThrow('Plugin must have a name');
    });

    it('should register and remove a plugin', async () => {
      const client = await SHCClient.create();
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: async () => ({}),
      };

      // Register the plugin
      client.use(mockPlugin);

      // Verify the plugin is registered
      expect((client as any).plugins.get('test-plugin')).toBe(mockPlugin);

      // Remove the plugin
      client.removePlugin('test-plugin');

      // Verify the plugin is removed
      expect((client as any).plugins.has('test-plugin')).toBe(false);
    });
  });

  describe('Event handling', () => {
    it('should register and remove event handlers', async () => {
      const client = await SHCClient.create();
      const mockHandler = vi.fn();

      // Should not throw when registering an event handler
      expect(() => client.on('request', mockHandler)).not.toThrow();

      // Should not throw when removing an event handler
      expect(() => client.off('request', mockHandler)).not.toThrow();
    });
  });

  describe('Configuration methods', () => {
    it('should set default headers, timeout, and baseURL', async () => {
      const client = await SHCClient.create();

      // Verify that the methods don't throw exceptions
      expect(() => client.setDefaultHeader('Content-Type', 'application/json')).not.toThrow();
      expect(() => client.setTimeout(10000)).not.toThrow();
      expect(() => client.setBaseURL('https://api.example.com')).not.toThrow();
    });
  });
});
