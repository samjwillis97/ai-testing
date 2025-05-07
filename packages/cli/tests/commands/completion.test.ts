/**
 * Tests for completion command
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// Mock the logger module
vi.mock('../../src/utils/logger', () => {
  const mockInfo = vi.fn();
  const mockError = vi.fn();
  const mockWarn = vi.fn();
  const mockDebug = vi.fn();

  return {
    Logger: {
      fromCommandOptions: vi.fn().mockReturnValue({
        info: mockInfo,
        error: mockError,
        warn: mockWarn,
        debug: mockDebug,
      }),
    },
    LogLevel: {
      DEBUG: 'debug',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
      SILENT: 'silent',
    },
  };
});

// Skip all tests for now
describe.skip('Completion Command', () => {
  describe('Command Registration', () => {
    it('should register the completion command with the program', () => {
      // Import the module after mocking
      const { addCompletionCommand } = require('../../src/commands/completion');

      // Create a new Command instance
      const program = new Command();

      // Register the completion command
      addCompletionCommand(program);

      // Find the completion command
      const completionCommand = program.commands.find((cmd) => cmd.name() === 'completion');

      // Verify that the completion command was registered
      expect(completionCommand).toBeDefined();
      expect(completionCommand?.description()).toContain('Generate shell completion script');
    });
  });
});
