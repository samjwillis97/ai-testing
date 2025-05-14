import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { PluginManagerImpl } from '../../../src/services/plugin-manager';
import { SHCPlugin } from '../../../src/types/plugin.types';

describe('Plugin Loading from Local Path Integration Tests', () => {
  // Define the path to the logging plugin
  const loggingPluginPath = path.resolve(
    process.cwd(),
    '../../plugins/logging/dist/index.js'
  );

  // Ensure the logging plugin is built before running tests
  beforeAll(async () => {
    // Check if the logging plugin is built
    try {
      await fs.access(loggingPluginPath);
    } catch (error) {
      throw new Error(
        `Logging plugin not found at ${loggingPluginPath}. Please build the plugin first with 'cd ../../plugins/logging && pnpm run build'.`
      );
    }
  });

  it('should load a plugin from an absolute local path', async () => {
    // Create a new plugin manager for this test
    const pluginManager = new PluginManagerImpl();
    
    try {
      // Register the plugin from the absolute path
      await pluginManager.registerFromConfig({
        name: 'logging-plugin',
        path: loggingPluginPath,
      });

      // Verify the plugin was loaded correctly
      const plugin = pluginManager.getPlugin('logging-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('logging-plugin');
      expect(plugin?.version).toBe('1.0.0');
      expect(plugin?.type).toBe('request-preprocessor');
    } finally {
      // Clean up
      await pluginManager.destroy();
    }
  });

  it('should load a plugin with dependencies from a local path', async () => {
    // Create a new plugin manager for this test
    const pluginManager = new PluginManagerImpl();
    
    try {
      // Register the plugin from the absolute path with configuration
      await pluginManager.registerFromConfig({
        name: 'logging-plugin',
        path: loggingPluginPath,
        config: {
          level: 'debug',
          output: {
            type: 'console',
            options: {},
          },
          format: {
            timestamp: true,
            includeHeaders: true,
            includeBody: true,
            maskSensitiveData: true,
          },
        },
      });

      // Verify the plugin was loaded correctly
      const plugin = pluginManager.getPlugin('logging-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('logging-plugin');
      expect(plugin?.version).toBe('1.0.0');
      
      // Verify the plugin configuration was applied
      if (plugin && 'config' in plugin) {
        const typedPlugin = plugin as SHCPlugin & { 
          config: {
            level: string;
            format: {
              includeBody: boolean;
              timestamp: boolean;
              includeHeaders: boolean;
              maskSensitiveData: boolean;
            };
          } 
        };
        expect(typedPlugin.config.level).toBe('debug');
        expect(typedPlugin.config.format.includeBody).toBe(true);
      }
    } finally {
      // Clean up
      await pluginManager.destroy();
    }
  });

  it('should handle errors when loading a plugin from a non-existent path', async () => {
    // Create a new plugin manager for this test
    const pluginManager = new PluginManagerImpl();
    
    try {
      // Try to register a plugin from a non-existent path
      await expect(
        pluginManager.registerFromConfig({
          name: 'non-existent-plugin',
          path: '/path/to/non-existent-plugin.js',
        })
      ).rejects.toThrow('Failed to load plugin from path');
    } finally {
      // Clean up
      await pluginManager.destroy();
    }
  });

  it('should handle errors when loading a plugin with invalid structure', async () => {
    // Create a new plugin manager for this test
    const pluginManager = new PluginManagerImpl();
    
    // Create a temporary file with invalid plugin structure
    const tempDir = path.resolve(process.cwd(), 'temp');
    const invalidPluginPath = path.join(tempDir, 'invalid-plugin.js');
    
    try {
      // Create temp directory if it doesn't exist
      await fs.mkdir(tempDir, { recursive: true });
      
      // Write an invalid plugin to the file
      await fs.writeFile(
        invalidPluginPath,
        'module.exports = { name: "invalid-plugin" };' // Missing required properties
      );
      
      // Try to register the invalid plugin
      await expect(
        pluginManager.registerFromConfig({
          name: 'invalid-plugin',
          path: invalidPluginPath,
        })
      ).rejects.toThrow('Invalid plugin structure');
    } finally {
      // Clean up the temporary file
      try {
        await fs.unlink(invalidPluginPath);
        await fs.rmdir(tempDir);
      } catch (error) {
        // Ignore cleanup errors
      }
      
      // Clean up plugin manager
      await pluginManager.destroy();
    }
  });

  it('should handle relative paths correctly', async () => {
    // Create a new plugin manager for this test
    const pluginManager = new PluginManagerImpl();
    
    try {
      // Get the relative path to the logging plugin
      const cwd = process.cwd();
      const relativePluginPath = path.relative(
        cwd,
        loggingPluginPath
      );
      
      // Register the plugin from the relative path
      await pluginManager.registerFromConfig({
        name: 'logging-plugin',
        path: relativePluginPath,
      });
      
      // Verify the plugin was loaded correctly
      const plugin = pluginManager.getPlugin('logging-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('logging-plugin');
      expect(plugin?.version).toBe('1.0.0');
    } finally {
      // Clean up
      await pluginManager.destroy();
    }
  });
});
