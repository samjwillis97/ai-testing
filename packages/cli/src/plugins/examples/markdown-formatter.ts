/**
 * Markdown Formatter Plugin
 * A sample CLI plugin that formats output as a markdown table
 */
import { CLIPlugin, CLIPluginType, CLIPluginContext } from '../../types/cli-plugin.types.js';

/**
 * Format data as a markdown table
 */
function formatMarkdownTable(data: unknown): string {
  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    typeof data[0] !== 'object' ||
    data[0] === null
  ) {
    return JSON.stringify(data, null, 2);
  }

  // Get headers from the first object
  const headers = Object.keys(data[0] as Record<string, unknown>);

  // Create header row
  let markdown = `| ${headers.join(' | ')} |\n`;

  // Create separator row
  markdown += `| ${headers.map(() => '---').join(' | ')} |\n`;

  // Create data rows
  for (const item of data) {
    const row = headers.map((header) => {
      const value = (item as Record<string, unknown>)[header];
      return value === null || value === undefined ? '' : String(value);
    });
    markdown += `| ${row.join(' | ')} |\n`;
  }

  return markdown;
}

/**
 * Markdown Formatter Plugin
 */
const markdownFormatterPlugin: CLIPlugin = {
  name: 'markdown-formatter',
  type: CLIPluginType.OUTPUT_FORMATTER,
  version: '1.0.0',
  description: 'Formats output as a markdown table',
  register: (context: CLIPluginContext) => {
    // Register the markdown formatter
    context.registerOutputFormatter('markdown', formatMarkdownTable);
  },
};

export default markdownFormatterPlugin;
