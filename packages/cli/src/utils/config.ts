/**
 * Configuration utilities
 */
import path from 'path';
import os from 'os';

/**
 * Get effective options by merging CLI options with config file
 */
export async function getEffectiveOptions(
  options: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // TODO: Load config file if specified
  return options;
}

/**
 * Get collection directory path
 */
export async function getCollectionDir(options: Record<string, unknown>): Promise<string> {
  if (options.collectionDir) {
    return options.collectionDir as string;
  }

  // Default to ~/.shc/collections
  const homeDir = os.homedir();
  return path.join(homeDir, '.shc', 'collections');
}
