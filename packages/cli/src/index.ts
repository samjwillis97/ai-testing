#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { request } from '@shc/core';

const program = new Command();

program
  .name('shc')
  .description('SHC Command Line Interface')
  .version('0.1.0');

program
  .argument('<method>', 'HTTP method (get, post, put, delete, etc)')
  .argument('<url>', 'Request URL')
  .action(async (method: string, url: string) => {
    const spinner = ora(`Sending ${method.toUpperCase()} request to ${url}`).start();
    try {
      const resp = await request({ method, url });
      spinner.succeed(chalk.green('Response received:'));
      console.log(chalk.cyan(JSON.stringify(resp.data, null, 2)));
      process.exit(0);
    } catch (err: unknown) {
      spinner.fail(chalk.red('Request failed:'));
      if (err instanceof Error) {
        console.error(err.message);
      } else {
        console.error(String(err));
      }
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
