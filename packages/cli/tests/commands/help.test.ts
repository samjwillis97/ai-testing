// ------------------------------------------------------------------------------
// Command line processing. Returning new object to allow multiple calls for testing.
import { Command } from 'commander';

export function makeProgram(options?: { exitOverride?: boolean, suppressOutput?: boolean }): Command {
    const program = new Command();
  
    // Configuration
    if (options?.exitOverride) {
      program.exitOverride();
    }
    if (options?.suppressOutput) {
      program.configureOutput({
        writeOut: () => {},
        writeErr: () => {}
      });
    }
  
    return program;
}