import { HttpClient } from '@shc/core';
import chalk from 'chalk';
import { Spinner } from '../utils/spinner.js';
import { loadPlugin } from '../plugins.js';
import { createConfig } from '../config.js';
import type { PluginConfig } from '../plugins.js';

interface SendOptions {
  method?: string;
  header?: string[];
  data?: string;
  plugins?: Record<string, Record<string, unknown>>;
}

export async function send(url: string, options: SendOptions = {}) {
  const spinner = new Spinner('Sending request...');
  spinner.start();

  try {
    const config = await createConfig();
    const client = new HttpClient();

    // Load configured plugins
    if (config.store.plugins) {
      for (const pluginConfig of config.store.plugins) {
        try {
          const plugin = await loadPlugin(pluginConfig);
          if (plugin) {
            client.use(plugin);
          }
        } catch (error) {
          console.warn(chalk.yellow(`Warning: Failed to load plugin ${pluginConfig.name}`));
          if (error instanceof Error) {
            console.warn(chalk.yellow(error.message));
          }
        }
      }
    }

    // Load plugins from options
    if (options.plugins) {
      for (const [name, config] of Object.entries(options.plugins)) {
        try {
          const pluginConfig: PluginConfig = {
            name,
            config
          };
          const plugin = await loadPlugin(pluginConfig);
          if (plugin) {
            client.use(plugin);
          }
        } catch (error) {
          console.warn(chalk.yellow(`Warning: Failed to load plugin ${name}`));
          if (error instanceof Error) {
            console.warn(chalk.yellow(error.message));
          }
        }
      }
    }

    // Construct headers from options
    const headers: Record<string, string> = {};
    if (options.header) {
      for (const header of options.header) {
        const [key, value] = header.split(':').map(s => s.trim());
        headers[key] = value;
      }
    }

    // Parse JSON data if provided
    let parsedData: unknown;
    if (options.data) {
      try {
        parsedData = JSON.parse(options.data);
      } catch (error) {
        throw new Error('Invalid JSON data provided');
      }
    }

    const response = await client.request({
      method: options.method || 'GET',
      url,
      headers,
      data: parsedData
    });

    spinner.succeed('Request successful');
    console.log('\nResponse:');
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('\nBody:', JSON.stringify(response.data, null, 2));
    if (response.duration) {
      console.log('\nDuration:', `${response.duration}ms`);
    }

  } catch (error) {
    spinner.fail('Request failed');
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
    process.exit(1);
  }
}
