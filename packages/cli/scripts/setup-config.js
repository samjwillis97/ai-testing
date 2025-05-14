#!/usr/bin/env node
/**
 * Setup script to create the default configuration directory and file
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default configuration template
const defaultConfig = `# SHC Configuration
version: '1.0.0'
name: 'Default SHC Configuration'

# Core settings
core:
  http:
    timeout: 30000
    max_redirects: 5
    retry:
      attempts: 3
      backoff: 'exponential'
    tls:
      verify: true
  logging:
    level: 'info'
    format: 'text'
    output: 'console'

# Variable sets
variable_sets:
  global: {}
  collection_defaults: {}

# Plugins configuration
plugins:
  auth: []
  preprocessors: []
  transformers: []

# Storage settings
storage:
  collections:
    type: 'file'
    path: './collections'
`;

async function main() {
  try {
    // Get home directory
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
      console.error('Could not determine home directory');
      process.exit(1);
    }

    // Create config directory
    const configDir = path.join(homeDir, '.config', 'shc');
    try {
      await fs.mkdir(configDir, { recursive: true });
      console.log(`Created directory: ${configDir}`);
    } catch (error) {
      console.error(`Failed to create directory: ${error.message}`);
      process.exit(1);
    }

    // Create config file
    const configPath = path.join(configDir, 'config.yaml');
    try {
      // Check if file already exists
      try {
        await fs.access(configPath);
        console.log(`Config file already exists at: ${configPath}`);
        console.log('To overwrite, use --force flag');
        
        // Check if force flag is provided
        if (!process.argv.includes('--force')) {
          process.exit(0);
        }
      } catch {
        // File doesn't exist, continue
      }
      
      // Write config file
      await fs.writeFile(configPath, defaultConfig);
      console.log(`Created config file: ${configPath}`);
    } catch (error) {
      console.error(`Failed to create config file: ${error.message}`);
      process.exit(1);
    }

    console.log('Configuration setup complete!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();
