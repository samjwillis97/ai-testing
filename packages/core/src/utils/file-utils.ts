import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Supported file formats
 */
export type FileFormat = 'json' | 'yaml' | 'yml' | 'unknown';

/**
 * Determine the format of a file based on its extension
 * @param filePath Path to the file
 * @returns The file format
 */
export function getFileFormat(filePath: string): FileFormat {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.json':
      return 'json';
    case '.yaml':
      return 'yaml';
    case '.yml':
      return 'yml';
    default:
      return 'unknown';
  }
}

/**
 * Check if a file exists
 * @param filePath Path to the file
 * @returns True if the file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read and parse a file as JSON or YAML
 * @param filePath Path to the file
 * @returns The parsed content
 * @throws If the file cannot be read or parsed
 */
export async function readAndParseFile<T>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const format = getFileFormat(filePath);
    
    switch (format) {
      case 'json':
        return JSON.parse(content) as T;
      case 'yaml':
      case 'yml':
        return yaml.load(content) as T;
      default:
        throw new Error(`Unsupported file format: ${format}. Supported formats are: json, yaml, yml`);
    }
  } catch (error) {
    throw new Error(
      `Failed to read and parse file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Find files with specific extensions in a directory
 * @param dirPath Path to the directory
 * @param extensions Array of file extensions to look for (without the dot)
 * @returns Array of file paths
 */
export async function findFilesByExtension(
  dirPath: string, 
  extensions: string[] = ['json', 'yaml', 'yml']
): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    
    return files
      .filter(file => {
        const ext = path.extname(file).toLowerCase().substring(1);
        return extensions.includes(ext);
      })
      .map(file => path.join(dirPath, file));
  } catch (error) {
    throw new Error(
      `Failed to find files in directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Try to find a file with different extensions
 * @param basePath Base path without extension
 * @param extensions Array of extensions to try (with the dot)
 * @returns Path to the first file found, or null if none found
 */
export async function findFileWithExtensions(
  basePath: string,
  extensions: string[] = ['.json', '.yaml', '.yml']
): Promise<string | null> {
  for (const ext of extensions) {
    const filePath = `${basePath}${ext}`;
    if (await fileExists(filePath)) {
      return filePath;
    }
  }
  
  return null;
}
