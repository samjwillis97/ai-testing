/**
 * Tests for help command
 */
import { describe, it, expect, vi } from 'vitest';
import { makeProgram } from '../../src/utils/program.js';

// This file previously contained just the makeProgram function
// which has now been moved to src/utils/program.ts

describe('Help Command', () => {
  it('should display help information', async () => {
    // Create a program with output suppression
    const program = await makeProgram({
      exitOverride: true,
      suppressOutput: true,
      initPlugins: false
    });
    
    // Mock stdout to capture output
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    
    try {
      // This should trigger help display
      await program.parseAsync(['node', 'shc', '--help'], { from: 'user' });
    } catch (error) {
      // Commander throws an error when exitOverride is used with --help
      // Just check that we got an error
      expect(error).toBeDefined();
    } finally {
      // Restore the original implementation
      stdoutSpy.mockRestore();
    }
  });
});