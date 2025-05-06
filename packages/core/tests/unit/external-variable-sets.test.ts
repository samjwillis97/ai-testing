import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createConfigManager } from '../../src/config-manager';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Define interfaces for our test variable sets
interface ApiVariableSet {
  api: {
    description: string;
    default_value: string;
    active_value: string;
    values: {
      [key: string]: {
        url: string;
        timeout?: number;
        debug?: boolean;
      };
    };
  };
}

interface AuthVariableSet {
  auth: {
    description: string;
    default_value: string;
    active_value: string;
    values: {
      [key: string]: {
        token?: string;
        setting?: string;
      };
    };
  };
}

interface DevVars {
  url: string;
  api_key: string;
  debug: boolean;
}

interface ProdVars {
  url: string;
  api_key: string;
  debug: boolean;
}

describe('External Variable Sets', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = path.join(os.tmpdir(), `shc-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should load variable sets from external files', async () => {
    // Create test files
    const configPath = path.join(tempDir, 'config.yaml');
    const variableSetPath = path.join(tempDir, 'variables.yaml');

    // Create variable set file
    await fs.writeFile(
      variableSetPath,
      `
api:
  description: "API configuration for testing"
  default_value: "test"
  active_value: "test"
  values:
    test:
      url: "https://test-api.example.com"
      timeout: 2000
      debug: true
    `
    );

    // Create config file with reference to external variable set
    await fs.writeFile(
      configPath,
      `
version: "1.0.0"
name: "Test Config"
variable_sets:
  global:
    file: "${variableSetPath.replace(/\\/g, '/')}"
    `
    );

    // Load the config
    const configManager = createConfigManager();
    await configManager.loadFromFile(configPath);

    // Verify the variable set was loaded
    const globalVars = configManager.get<ApiVariableSet>('variable_sets.global');
    expect(globalVars).toHaveProperty('api');
    expect(globalVars.api).toHaveProperty('values.test.url', 'https://test-api.example.com');
  });

  it('should load variable sets from glob patterns', async () => {
    // Create test files
    const configPath = path.join(tempDir, 'config.yaml');
    const varsDir = path.join(tempDir, 'vars');
    await fs.mkdir(varsDir, { recursive: true });

    // Create multiple variable set files - using the same structure in each file
    await fs.writeFile(
      path.join(varsDir, 'api.yaml'),
      `
api:
  description: "API configuration"
  default_value: "dev"
  active_value: "dev"
  values:
    dev:
      url: "https://dev-api.example.com"
    `
    );

    await fs.writeFile(
      path.join(varsDir, 'auth.yaml'),
      `
auth:
  description: "Auth configuration"
  default_value: "default"
  active_value: "default"
  values:
    default:
      token: "test-token"
    `
    );

    // Create config file with glob reference
    const globPattern = path.join(varsDir, '*.yaml').replace(/\\/g, '/');
    await fs.writeFile(
      configPath,
      `
version: "1.0.0"
name: "Test Config"
variable_sets:
  global:
    glob: "${globPattern}"
    `
    );

    // Load the config
    const configManager = createConfigManager();
    await configManager.loadFromFile(configPath);

    // Get the variable sets and log for debugging
    const allVars = configManager.get('variable_sets');
    console.log('All variable sets:', JSON.stringify(allVars, null, 2));

    // Get the global variable set
    const globalVars = configManager.get('variable_sets.global');
    console.log('Global variable set:', JSON.stringify(globalVars, null, 2));

    // Test with individual assertions
    expect(globalVars).toBeDefined();
    expect(typeof globalVars).toBe('object');

    // Check if it has the expected properties
    if (globalVars && typeof globalVars === 'object') {
      const typedGlobalVars = globalVars as Record<string, unknown>;
      expect(typedGlobalVars).toHaveProperty('api');
      expect(typedGlobalVars).toHaveProperty('auth');

      const apiVars = typedGlobalVars.api as ApiVariableSet['api'];
      const authVars = typedGlobalVars.auth as AuthVariableSet['auth'];

      expect(apiVars.values.dev.url).toBe('https://dev-api.example.com');
      expect(authVars.values.default.token).toBe('test-token');
    }
  });

  it('should handle named variable sets from external files', async () => {
    // Create test files
    const configPath = path.join(tempDir, 'config.yaml');
    const devVarsPath = path.join(tempDir, 'dev-vars.yaml');
    const prodVarsPath = path.join(tempDir, 'prod-vars.yaml');

    // Create variable set files
    await fs.writeFile(
      devVarsPath,
      `
url: "https://dev.example.com"
api_key: "dev-key"
debug: true
    `
    );

    await fs.writeFile(
      prodVarsPath,
      `
url: "https://prod.example.com"
api_key: "prod-key"
debug: false
    `
    );

    // Create config file with named variable sets
    await fs.writeFile(
      configPath,
      `
version: "1.0.0"
name: "Test Config"
variable_sets:
  global: {}
  collection_defaults: {}
  development:
    file: "${devVarsPath.replace(/\\/g, '/')}"
  production:
    file: "${prodVarsPath.replace(/\\/g, '/')}"
    `
    );

    // Load the config
    const configManager = createConfigManager();
    await configManager.loadFromFile(configPath);

    // Verify named variable sets were loaded
    const devVars = configManager.get<DevVars>('variable_sets.development');
    const prodVars = configManager.get<ProdVars>('variable_sets.production');

    expect(devVars).toHaveProperty('url', 'https://dev.example.com');
    expect(devVars).toHaveProperty('api_key', 'dev-key');
    expect(devVars).toHaveProperty('debug', true);

    expect(prodVars).toHaveProperty('url', 'https://prod.example.com');
    expect(prodVars).toHaveProperty('api_key', 'prod-key');
    expect(prodVars).toHaveProperty('debug', false);
  });

  it('should handle errors for missing files', async () => {
    // Create test files
    const configPath = path.join(tempDir, 'config.yaml');
    const nonExistentPath = path.join(tempDir, 'does-not-exist.yaml');

    // Create config file with reference to non-existent file
    await fs.writeFile(
      configPath,
      `
version: "1.0.0"
name: "Test Config"
variable_sets:
  global:
    file: "${nonExistentPath.replace(/\\/g, '/')}"
    `
    );

    // Load the config should throw an error
    const configManager = createConfigManager();

    // Use a try/catch to verify the error is thrown
    let errorThrown = false;
    try {
      await configManager.loadFromFile(configPath);
    } catch (error) {
      errorThrown = true;
      expect(error).toBeDefined();
      expect((error as Error).message).toContain('File not found');
    }

    expect(errorThrown).toBe(true);
  });

  it('should maintain backward compatibility with inline variable sets', async () => {
    // Create test file
    const configPath = path.join(tempDir, 'config.yaml');

    // Create config file with inline variable sets
    await fs.writeFile(
      configPath,
      `
version: "1.0.0"
name: "Test Config"
variable_sets:
  global:
    api:
      description: "API configuration"
      default_value: "dev"
      active_value: "dev"
      values:
        dev:
          url: "https://dev-api.example.com"
    `
    );

    // Load the config
    const configManager = createConfigManager();
    await configManager.loadFromFile(configPath);

    // Verify inline variable sets still work
    const globalVars = configManager.get<ApiVariableSet>('variable_sets.global');
    expect(globalVars).toHaveProperty('api');
    expect(globalVars.api.values.dev.url).toBe('https://dev-api.example.com');
  });

  it('should support mixing inline and file-based variable sets', async () => {
    // Create test files
    const configPath = path.join(tempDir, 'config.yaml');
    const externalVarsPath = path.join(tempDir, 'external-vars.yaml');

    // Create external variable set file
    await fs.writeFile(
      externalVarsPath,
      `
external:
  description: "External variable set"
  default_value: "default"
  active_value: "default"
  values:
    default:
      setting: "from-file"
    `
    );

    // Create config file with both inline and external variable sets
    await fs.writeFile(
      configPath,
      `
version: "1.0.0"
name: "Test Config"
variable_sets:
  global:
    inline:
      description: "Inline variable set"
      default_value: "default"
      active_value: "default"
      values:
        default:
          setting: "from-inline"
  external_vars:
    file: "${externalVarsPath.replace(/\\/g, '/')}"
    `
    );

    // Load the config
    const configManager = createConfigManager();
    await configManager.loadFromFile(configPath);

    // Verify both inline and external variable sets work
    interface InlineVars {
      inline: {
        description: string;
        default_value: string;
        active_value: string;
        values: {
          default: {
            setting: string;
          };
        };
      };
    }

    interface ExternalVars {
      external: {
        description: string;
        default_value: string;
        active_value: string;
        values: {
          default: {
            setting: string;
          };
        };
      };
    }

    const globalVars = configManager.get<InlineVars>('variable_sets.global');
    const externalVars = configManager.get<ExternalVars>('variable_sets.external_vars');

    expect(globalVars).toHaveProperty('inline');
    expect(globalVars.inline.values.default.setting).toBe('from-inline');

    expect(externalVars).toHaveProperty('external');
    expect(externalVars.external.values.default.setting).toBe('from-file');
  });
});
