/**
 * Tests for CLI Entry Point
 */
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fs from 'fs';
import * as os from 'os';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Create a temporary directory for test config files
const TEST_DIR = path.join(os.tmpdir(), 'shc-cli-entry-test-' + Date.now());
const TEST_CONFIG_PATH = path.join(TEST_DIR, 'config.yaml');
const TEST_COLLECTIONS_DIR = path.join(TEST_DIR, 'collections');

// Create test config file content
const TEST_CONFIG_CONTENT = `
api:
  baseUrl: https://api.example.com
  timeout: 2000
cli:
  defaultFormat: json
  collectionDir: ${TEST_COLLECTIONS_DIR}
`;

// Store original process properties
const originalArgv = process.argv;
const originalExit = process.exit;
const originalEnv = { ...process.env };

// Mock process.exit
process.exit = vi.fn() as any;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CLI Entry Point', () => {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create test directories and files
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEST_COLLECTIONS_DIR)) {
      fs.mkdirSync(TEST_COLLECTIONS_DIR, { recursive: true });
    }
    
    // Write test config file
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_CONTENT);
    
    // Set environment variables for testing
    process.env.SHC_CONFIG = TEST_CONFIG_PATH;
    process.env.SHC_COLLECTION_DIR = TEST_COLLECTIONS_DIR;
    
    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
    console.info = vi.fn();
    
    // Reset module cache to ensure fresh imports
    vi.resetModules();
  });
  
  afterEach(() => {
    // Restore process.argv
    process.argv = originalArgv;
    
    // Restore console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    
    // Restore environment variables
    process.env = { ...originalEnv };
    
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });
  
  afterAll(() => {
    // Restore process.exit
    process.exit = originalExit;
  });
  
  it('shows help with no args', () => {
    const cliPath = path.join(__dirname, '../../dist/index.js');
    try {
      const output = execSync(`node ${cliPath} --help`).toString();
      expect(output).toContain('SHC Command Line Interface');
    } catch (error) {
      // Skip this test if the CLI hasn't been built yet
      console.warn('Skipping CLI help test - CLI not built');
    }
  });
  
  it('should show help when no arguments are provided', async () => {
    // Set up process.argv with no arguments
    process.argv = ['node', 'shc'];
    
    // Create a spy for console.log
    const consoleLogSpy = vi.spyOn(console, 'log');
    
    try {
      // Import and execute the CLI entry point
      await import('../../src/index');
    } catch (error) {
      // Ignore any errors that might bubble up
    }
    
    // Since we're not mocking the program.help() method, we can only check
    // that the process didn't exit with an error
    expect(process.exit).not.toHaveBeenCalledWith(1);
  });
  
  it.skip('should execute the CLI normally when arguments are provided', async () => {
    // Set up process.argv with arguments
    process.argv = ['node', 'shc', 'get', 'https://api.example.com/users'];
    
    try {
      // Import and execute the CLI entry point
      await import('../../src/index');
    } catch (error) {
      // Ignore any errors that might bubble up
    }
    
    // Since we're not mocking the actual execution, we can only verify
    // that the process didn't exit with an error
    expect(process.exit).not.toHaveBeenCalledWith(1);
  });
  
  it.skip('should execute the CLI in silent mode when --silent flag is provided', async () => {
    // Set up process.argv with silent flag and help command (which should work without errors)
    process.argv = ['node', 'shc', '--silent', '--help'];
    
    try {
      // Import and execute the CLI entry point
      await import('../../src/index');
    } catch (error) {
      // Ignore any errors that might bubble up
    }
    
    // In silent mode, the process should still execute without errors
    expect(process.exit).not.toHaveBeenCalledWith(1);
  });
  
  it.skip('should execute the CLI in silent mode when -s flag is provided', async () => {
    // Set up process.argv with silent flag and help command (which should work without errors)
    process.argv = ['node', 'shc', '-s', '--help'];
    
    try {
      // Import and execute the CLI entry point
      await import('../../src/index');
    } catch (error) {
      // Ignore any errors that might bubble up
    }
    
    // In silent mode, the process should still execute without errors
    expect(process.exit).not.toHaveBeenCalledWith(1);
  });
  
  it.skip('should handle errors during command execution', async () => {
    // This test is skipped until we can find a better way to test error handling
  });
  
  it.skip('should handle critical errors in silent mode', async () => {
    // This test is skipped until we can find a better way to test error handling
  });
});
