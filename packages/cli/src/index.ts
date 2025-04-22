#!/usr/bin/env node

import { Command } from 'commander'
import { send } from './commands/send.js'
import { collections } from './commands/collections.js'

const program = new Command()

program
  .name('shc')
  .description('Sam\'s HTTP Client - A versatile HTTP client CLI')
  .version('0.1.0')

program
  .command('send')
  .description('Send an HTTP request')
  .argument('<url>', 'URL to send request to')
  .option('-X, --method <method>', 'HTTP method', 'GET')
  .option('-H, --header <header...>', 'HTTP headers')
  .option('-d, --data <data>', 'Request body data')
  .action(send)

program
  .command('collections')
  .description('Manage request collections')
  .addCommand(collections)

program.parse() 