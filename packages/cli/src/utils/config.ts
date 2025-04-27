/**
 * Configuration utilities
 */
import path from 'path';
import os from 'os';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import { existsSync } from 'fs';

/**
 * Get effective options by merging CLI options with config file
 */
export async function getEffectiveOptions(
  options: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const configPath = options.config as string;
  let configData: Record<string, unknown> = {};

  if (configPath) {
    try {
      if (!existsSync(configPath)) {
        throw new Error(`Config file not found: ${configPath}`);
      }

      const fileContent = await fs.readFile(configPath, 'utf-8');
      const extension = path.extname(configPath).toLowerCase();
      
      if (extension === '.yaml' || extension === '.yml') {
        configData = yaml.load(fileContent) as Record<string, unknown>;
      } else if (extension === '.json') {
        configData = JSON.parse(fileContent);
      } else {
        throw new Error(`Unsupported config file format: ${extension}`);
      }

      console.log(`Config loaded from: ${configPath}`);
    } catch (error) {
      console.error(`Failed to load config file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Merge config with CLI options (CLI options take precedence)
  return {
    ...configData,
    ...options,
  };
}

/**
 * Get collection directory path
 */
export async function getCollectionDir(options: Record<string, unknown>): Promise<string> {
  if (options.collectionDir) {
    return options.collectionDir as string;
  }

  // Check if storage.collections.path is defined in the config
  if (options.storage && 
      typeof options.storage === 'object' && 
      (options.storage as Record<string, unknown>).collections && 
      typeof (options.storage as Record<string, unknown>).collections === 'object' &&
      ((options.storage as Record<string, unknown>).collections as Record<string, unknown>).path) {
    return ((options.storage as Record<string, unknown>).collections as Record<string, unknown>).path as string;
  }

  // Default to ~/.shc/collections
  const homeDir = os.homedir();
  return path.join(homeDir, '.shc', 'collections');
}
