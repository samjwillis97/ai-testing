# Task: Implement Centralized Logging System with Pino

## Overview
Create a centralized logging system using Pino to replace direct console.log usage throughout the CLI package, making it easier to implement and control features like silent/quiet modes and providing more consistent output management. This system will focus exclusively on logging (status messages, errors, warnings, etc.) and will remain separate from the output formatter that handles actual command results.

## Status
📋 **PLANNED** - May 6, 2025

## Background
The CLI package currently uses direct `console.log` calls in many places, which makes it difficult to:
1. Implement consistent silent/quiet modes across all commands
2. Control log levels (debug, info, warn, error)
3. Format log messages consistently
4. Redirect log output to different destinations
5. Test log-generating code

This was highlighted when implementing the quiet mode feature, which requires careful control over what gets output to the console and when.

## Requirements

1. Create a Logger Class/Module using Pino:
   - Implement different log levels (debug, info, warn, error, silent)
   - Support silent and quiet modes
   - Allow for colored output when appropriate
   - Support multiple output streams using pino-multi-stream
   - Enable log redirection (stdout, stderr, file)
   - Provide context-aware logging (command name, operation)

2. Replace Direct Console Usage for Logs Only:
   - Replace all direct `console.log`, `console.error`, etc. calls used for status messages, warnings, and errors with the new logger
   - Ensure proper log levels are used for different types of messages
   - Maintain existing log formatting where appropriate
   - **IMPORTANT**: Do NOT modify the output formatter that handles command results - it should continue to print directly to stdout

3. Maintain Clear Separation of Concerns:
   - Logger: Handles status messages, errors, warnings, debug information
   - Output Formatter: Handles actual command results and data output
   - The output formatter will continue to print directly to stdout and should not use the logger

4. Integrate with Output Options:
   - Connect logger settings with command-line options (--silent, --quiet, --verbose)
   - Support per-command logging configuration
   - Allow global logging configuration via config file

5. Add Testing Support:
   - Make logger output capturable in tests
   - Provide mocking capabilities for testing
   - Add tests for different logging scenarios

## Implementation Details

### Files to Create/Update in CLI Package

- `/packages/cli/src/utils/logger.ts`:
  - Implement a wrapper around Pino
  - Define log levels and output formatting
  - Provide configuration options

- Update all files using direct console.log for logging purposes:
  - `/packages/cli/src/commands/*.ts`
  - `/packages/cli/src/utils/*.ts`
  - Replace direct console usage with logger calls

### Technical Approach

1. **Logger Implementation with Pino**:
   ```typescript
   import pino from 'pino';
   import pinoms from 'pino-multi-stream';

   export enum LogLevel {
     DEBUG = 'debug',
     INFO = 'info',
     WARN = 'warn',
     ERROR = 'error',
     SILENT = 'silent'
   }

   export interface LoggerOptions {
     level: LogLevel;
     quiet: boolean;
     color: boolean;
     output?: NodeJS.WriteStream;
     errorOutput?: NodeJS.WriteStream;
   }

   export class Logger {
     private logger: pino.Logger;

     constructor(options: Partial<LoggerOptions> = {}) {
       // Default options
       const level = options.quiet ? 'error' : (options.level || 'info');
       
       if (options.quiet) {
         // In quiet mode, only log errors to stderr
         this.logger = pino({
           level: 'error',
           // Disable non-error logs completely
           silent: level === 'silent'
         }, options.errorOutput || process.stderr);
       } else {
         // Configure streams for multi-transport
         const streams: pinoms.Streams = [];
         
         // Add pretty console output if color is enabled
         if (options.color) {
           streams.push({
             level: level,
             stream: pino.transport({
               target: 'pino-pretty',
               options: {
                 colorize: true,
                 translateTime: true,
                 ignore: 'pid,hostname'
               }
             })
           });
         } else {
           // Basic stdout stream
           streams.push({
             level: level,
             stream: options.output || process.stdout
           });
         }
         
         // Always log errors to stderr
         streams.push({
           level: 'error',
           stream: options.errorOutput || process.stderr
         });
         
         // Create multi-stream logger
         this.logger = pinoms({
           streams,
           // Use level on the logger, not just on the stream
           level: level,
           // Disable logs completely if silent
           silent: level === 'silent'
         });
       }
     }

     debug(message: string, ...args: any[]): void {
       this.logger.debug(message, ...args);
     }

     info(message: string, ...args: any[]): void {
       this.logger.info(message, ...args);
     }

     warn(message: string, ...args: any[]): void {
       this.logger.warn(message, ...args);
     }

     error(message: string, ...args: any[]): void {
       this.logger.error(message, ...args);
     }

     // Factory methods
     static fromCommandOptions(options: any): Logger {
       return new Logger({
         level: options.verbose ? LogLevel.DEBUG : LogLevel.INFO,
         quiet: options.quiet,
         color: options.color !== false
       });
     }
   }

   // Create a global logger instance with default settings
   export const globalLogger = new Logger();

   // Allow reconfiguration
   export function configureGlobalLogger(options: Partial<LoggerOptions>): void {
     // Create a new global logger with updated options
   }
   ```

2. **Integration with Commands (for logs only)**:
   ```typescript
   // Before
   console.log(chalk.gray(`Loading collections from ${collectionDir}...`));

   // After
   const logger = Logger.fromCommandOptions(options);
   logger.info(`Loading collections from ${collectionDir}...`);
   ```

3. **Clear Separation from Output Formatter**:
   ```typescript
   // Output formatter continues to write directly to stdout
   // This code remains unchanged
   export function formatOutput(data: any, options: OutputOptions): string {
     // Format the actual command output data
     return formattedData;
   }

   export function printResponse(response: any, options: OutputOptions): void {
     // Format and print the response directly to stdout
     const formatted = formatOutput(response.data, options);
     process.stdout.write(formatted);
   }
   ```

### Package Dependencies

```json
{
  "dependencies": {
    "pino": "^8.14.1",
    "pino-multi-stream": "^6.0.0"
  },
  "devDependencies": {
    "pino-pretty": "^10.0.0"
  }
}
```

## Testing Strategy

1. **Unit Tests**:
   - Test logger with different configurations
   - Verify correct log message formatting
   - Test silent and quiet modes
   - Test color handling

2. **Integration Tests**:
   - Test logger integration with commands
   - Verify log capture in tests
   - Test with different command-line options

3. **Mock Testing**:
   ```typescript
   test('logger respects quiet mode', () => {
     // Create a writable stream to capture output
     const outputStream = new stream.Writable();
     let output = '';
     outputStream._write = (chunk, encoding, callback) => {
       output += chunk.toString();
       callback();
     };
     
     const logger = new Logger({
       quiet: true,
       output: outputStream
     });
     
     logger.info('This should not be output');
     logger.error('Errors should still show in quiet mode');
     
     // Parse the JSON output (Pino outputs JSON by default)
     const logLines = output.trim().split('\n').map(line => JSON.parse(line));
     
     // Verify only error logs appear
     expect(logLines.length).toBe(1);
     expect(logLines[0].level).toBe(50); // Pino error level
     expect(logLines[0].msg).toBe('Errors should still show in quiet mode');
   });
   ```

## Implementation Plan

1. **Phase 1: Core Logger Implementation**
   - Create the logger.ts file with Pino implementation
   - Add necessary dependencies to package.json
   - Create basic tests for logger functionality

2. **Phase 2: Command Integration**
   - Identify all console.log usages in the codebase
   - Replace with appropriate logger calls
   - Update command option handling to configure logger

3. **Phase 3: Testing & Documentation**
   - Add comprehensive tests for logger behavior
   - Document logger usage in README
   - Create examples for common logging patterns

## Expected Benefits

1. **Consistency**: Uniform logging approach across the codebase
2. **Configurability**: Easy to configure logging behavior globally or per-command
3. **Testability**: Improved testing of log-generating code
4. **Maintainability**: Centralized control over log formatting and behavior
5. **Feature Support**: Makes implementing features like quiet mode much simpler
6. **Clear Separation**: Maintains separation between logging and output formatting
7. **Reliability**: Using a battle-tested logging library reduces bugs and edge cases
8. **Performance**: Pino's focus on performance ensures minimal overhead

## Acceptance Criteria

1. All direct console usage for logging purposes is replaced with the new logger
2. Logger supports all required log levels and configurations
3. Silent and quiet modes work consistently across all log messages
4. Output formatter remains separate and continues to print directly to stdout
5. Tests verify logger behavior in different scenarios
6. Documentation is updated to reflect the new logging system
7. Existing functionality and log formatting is preserved where appropriate
8. Performance impact is minimal, especially in normal operation mode

## Dependencies

- Pino logging library
- pino-multi-stream for multiple output destinations
- pino-pretty for formatted console output (dev dependency)
- Existing output utilities in the CLI package
- Command-line option parsing for logger configuration

## Related Tasks

- Implement CLI quiet mode
- Improve CLI test coverage
