/**
 * Tests for CLI Plugin Initialization
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SHCConfig, ConfigManager } from '@shc/core';
import { initializePlugins } from '../../src/plugins/index';
import { cliPluginManager } from '../../src/plugins/plugin-manager';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import axios from 'axios';
import * as childProcess from 'child_process';

// Mock axios
vi.mock('axios');

// Mock child_process.execSync for git and npm commands
vi.mock('child_process', () => ({
  execSync: vi.fn((command) => {
    if (command.includes('git clone')) {
      return Buffer.from('Successfully cloned repository');
    }
    if (command.includes('npm install') || command.includes('pnpm add')) {
      return Buffer.from('Successfully installed package');
    }
    return Buffer.from('');
  })
}));

// Create a temporary directory for test config files
const TEST_DIR = path.join(os.tmpdir(), 'shc-cli-plugin-test-' + Date.now());
const TEST_CONFIG_PATH = path.join(TEST_DIR, 'config.yaml');

// Create test config file content with plugins
const TEST_CONFIG_CONTENT = `
api:
  baseUrl: https://api.example.com
  timeout: 2000
cli:
  plugins:
    - name: test-plugin
      package: '@shc/test-plugin'
      version: '1.0.0'
      enabled: true
    - name: disabled-plugin
      package: '@shc/disabled-plugin'
      enabled: false
    - name: path-plugin
      path: './plugins/path-plugin'
      enabled: true
    - name: git-plugin
      git: 'https://github.com/example/git-plugin.git'
      ref: 'main'
      enabled: true
`;

// Create test config file content without plugins
const TEST_CONFIG_NO_PLUGINS_CONTENT = `
api:
  baseUrl: https://api.example.com
  timeout: 2000
cli:
  defaultFormat: json
`;

// Create test config file content with empty plugins
const TEST_CONFIG_EMPTY_PLUGINS_CONTENT = `
api:
  baseUrl: https://api.example.com
  timeout: 2000
cli:
  plugins: []
`;

describe('Plugin Initialization', () => {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };
  
  // Spy on cliPluginManager methods
  const setSilentModeSpy = vi.spyOn(cliPluginManager, 'setSilentMode');
  const loadPluginsSpy = vi.spyOn(cliPluginManager, 'loadPlugins');
  
  beforeEach(() => {
    // Create test directory and config file
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    
    // Write test config file
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_CONTENT);
    
    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
    console.info = vi.fn();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock loadPlugins to prevent actual plugin loading
    loadPluginsSpy.mockImplementation(async () => {});
    
    // Create a mock plugin module that can be loaded
    const mockPluginPath = path.join(TEST_DIR, 'plugins');
    if (!fs.existsSync(mockPluginPath)) {
      fs.mkdirSync(mockPluginPath, { recursive: true });
    }
    
    // Create a mock path plugin
    const mockPathPluginDir = path.join(mockPluginPath, 'path-plugin');
    if (!fs.existsSync(mockPathPluginDir)) {
      fs.mkdirSync(mockPathPluginDir, { recursive: true });
      fs.writeFileSync(
        path.join(mockPathPluginDir, 'index.js'),
        `
        module.exports = {
          name: 'path-plugin',
          version: '1.0.0',
          description: 'Test path plugin',
          register: (context) => {
            // Register plugin functionality
          }
        };
        `
      );
    }
  });
  
  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    
    // Restore console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    
    // Restore original implementations
    vi.restoreAllMocks();
  });
  
  it('should initialize plugins with normal mode', async () => {
    // Initialize plugins with silent mode disabled
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });
    
    // Verify that silent mode was set correctly
    expect(setSilentModeSpy).toHaveBeenCalledWith(false);
    
    // Verify that loadPlugins was called
    expect(loadPluginsSpy).toHaveBeenCalled();
  });
  
  it.skip('should initialize plugins with silent mode', async () => {
    // Initialize plugins with silent mode enabled
    await initializePlugins({ silent: true, config: TEST_CONFIG_PATH });
    
    // Verify that silent mode was set correctly
    expect(setSilentModeSpy).toHaveBeenCalledWith(true);
    
    // Verify that loadPlugins was called
    expect(loadPluginsSpy).toHaveBeenCalled();
  });
  
  it('should handle errors during plugin initialization', async () => {
    // Make loadPlugins throw an error
    loadPluginsSpy.mockRejectedValueOnce(new Error('Test error'));
    
    // Initialize plugins
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });
    
    // Verify that the error was logged
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should handle missing plugin configuration', async () => {
    // Create a config file without plugins section
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_NO_PLUGINS_CONTENT);
    
    // Initialize plugins
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });
    
    // Verify that loadPlugins was not called
    expect(loadPluginsSpy).not.toHaveBeenCalled();
  });
  
  it('should handle empty plugin configuration', async () => {
    // Create a config file with empty plugins array
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_EMPTY_PLUGINS_CONTENT);
    
    // Initialize plugins
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });
    
    // Verify that loadPlugins was not called
    expect(loadPluginsSpy).not.toHaveBeenCalled();
  });
  
  it.skip('should filter disabled plugins', async () => {
    // Initialize plugins
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });
    
    // Verify that loadPlugins was called with only enabled plugins
    expect(loadPluginsSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'test-plugin', enabled: true }),
        expect.objectContaining({ name: 'path-plugin', enabled: true }),
        expect.objectContaining({ name: 'git-plugin', enabled: true })
      ])
    );
    
    // Get the plugins passed to loadPlugins
    const pluginsArg = loadPluginsSpy.mock.calls[0][0] as Array<any>;
    
    // Verify that disabled plugins are not included
    const disabledPlugin = pluginsArg.find(plugin => plugin.name === 'disabled-plugin');
    expect(disabledPlugin).toBeUndefined();
  });
});
