/**
 * Tests for output formatting utilities
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatOutput, formatResponse, printResponse, printError } from '../../src/utils/output.js';
import { OutputOptions } from '../../src/types.js';

// Mock chalk to prevent color output in tests
vi.mock('chalk', () => ({
  default: {
    bold: (text: string) => text,
    red: (text: string) => text,
    green: (text: string) => text,
    gray: (text: string) => text,
    dim: (text: string) => text,
  },
  bold: (text: string) => text,
  red: (text: string) => text,
  green: (text: string) => text,
  gray: (text: string) => text,
  dim: (text: string) => text,
}));

// Mock boxen to prevent box output in tests
vi.mock('boxen', () => ({
  default: (text: string) => text,
}));

describe('Output Formatting', () => {
  let consoleLogSpy: vi.SpyInstance;
  let consoleErrorSpy: vi.SpyInstance;
  let stdoutWriteSpy: vi.SpyInstance;
  let stderrWriteSpy: vi.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrWriteSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  describe('formatOutput', () => {
    it('should return formatted data when quiet is true', () => {
      const options: OutputOptions = {
        quiet: false,
        format: 'json' as OutputOptions['format'],
        color: true,
        verbose: false,
      };
      const result = formatOutput({ test: 'data' }, options);
      expect(result).toBe(JSON.stringify({ test: 'data' }, null, 2));
    });

    it('should format JSON output', () => {
      const options: OutputOptions = {
        format: 'json',
        color: true,
        verbose: false,
        quiet: false,
      };
      const data = { test: 'data', nested: { value: 123 } };
      const result = formatOutput(data, options);
      expect(result).toBe(JSON.stringify(data, null, 2));
    });

    it('should format YAML output', () => {
      const options: OutputOptions = {
        format: 'yaml',
        color: true,
        verbose: false,
        quiet: false,
      };
      const data = { test: 'data', nested: { value: 123 } };
      const result = formatOutput(data, options);
      expect(result).toContain('test: data');
      expect(result).toContain('nested:');
      expect(result).toContain('value: 123');
    });

    it('should format raw output for strings', () => {
      const options: OutputOptions = {
        format: 'raw',
        color: true,
        verbose: false,
        quiet: false,
      };
      const result = formatOutput('test string', options);
      expect(result).toBe('test string');
    });

    it('should format raw output for objects', () => {
      const options: OutputOptions = {
        format: 'raw',
        color: true,
        verbose: false,
        quiet: false,
      };
      const data = { test: 'data' };
      const result = formatOutput(data, options);
      expect(result).toBe(JSON.stringify(data, null, 2));
    });

    it('should format table output for arrays of objects', () => {
      const options: OutputOptions = {
        format: 'table',
        color: true,
        verbose: false,
        quiet: false,
      };
      const data = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];
      const result = formatOutput(data, options);
      expect(result).toContain('id');
      expect(result).toContain('name');
      expect(result).toContain('1');
      expect(result).toContain('Test 1');
      expect(result).toContain('2');
      expect(result).toContain('Test 2');
    });

    it('should handle non-array data for table format', () => {
      const options: OutputOptions = {
        format: 'table',
        color: true,
        verbose: false,
        quiet: false,
      };
      const data = { test: 'data' };
      const result = formatOutput(data, options);
      expect(result).toBe(JSON.stringify(data, null, 2));
    });
  });

  describe('formatResponse', () => {
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { result: 'success' },
    };

    it('should return formatted data when quiet is true', () => {
      const options: OutputOptions = {
        quiet: true,
        format: 'json' as OutputOptions['format'],
        color: true,
        verbose: false,
      };
      const result = formatResponse(mockResponse, options);
      expect(result).toBe(JSON.stringify({ result: 'success' }, null, 2));
    });

    it('should format response with status for non-raw formats', () => {
      const options: OutputOptions = {
        format: 'json',
        color: true,
        verbose: false,
        quiet: false,
      };
      const result = formatResponse(mockResponse, options);
      expect(result).toContain('Status:');
      expect(result).toContain('200 OK');
      expect(result).toContain(JSON.stringify({ result: 'success' }, null, 2));
    });

    it('should format response with verbose output', () => {
      const options: OutputOptions = {
        quiet: false,
        format: 'json',
        color: true,
        verbose: true,
        quiet: false,
      };
      const result = formatResponse(mockResponse, options);
      expect(result).toContain('Status:');
      expect(result).toContain('200 OK');
      expect(result).toContain('Headers:');
      expect(result).toContain('content-type');
      expect(result).toContain('application/json');
      expect(result).toContain('Body:');
      expect(result).toContain(JSON.stringify({ result: 'success' }, null, 2));
    });

    it('should format raw output without status', () => {
      const options: OutputOptions = {
        format: 'raw',
        color: true,
        verbose: false,
        quiet: false,
      };
      const result = formatResponse(mockResponse, options);
      expect(result).toBe(JSON.stringify({ result: 'success' }, null, 2));
    });

    it('should format raw output with status when verbose', () => {
      const options: OutputOptions = {
        quiet: false,
        format: 'raw',
        color: true,
        verbose: true,
        quiet: false,
      };
      const result = formatResponse(mockResponse, options);
      expect(result).toContain('Status:');
      expect(result).toContain('200 OK');
      expect(result).toContain('Headers:');
      expect(result).toContain('content-type');
      expect(result).toContain('application/json');
      expect(result).toContain('Body:');
      expect(result).toContain(JSON.stringify({ result: 'success' }, null, 2));
    });
  });

  describe('printResponse', () => {
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { test: 'data' },
    };

    it('should not print when quiet is true', () => {
      const options: OutputOptions = {
        quiet: true,
        format: 'json',
        color: true,
        verbose: false,
      };
      printResponse(mockResponse, options);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should print formatted response', () => {
      const options: OutputOptions = {
        format: 'json',
        color: true,
        verbose: false,
        quiet: false,
      };
      printResponse(mockResponse, options);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should only output raw data with no status when using raw format and quiet mode', () => {
      const options: OutputOptions = {
        quiet: true,
        format: 'raw',
        color: true,
        verbose: false,
      };
      printResponse(mockResponse, options);
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(stdoutWriteSpy).toHaveBeenCalledWith(JSON.stringify({ test: 'data' }, null, 2) + '\n');
    });
  });

  describe('printError', () => {
    it('should not print when quiet is true', () => {
      const options: OutputOptions = {
        quiet: true,
        format: 'json',
        color: true,
        verbose: false,
      };
      printError(new Error('Test error'), options);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(stderrWriteSpy).toHaveBeenCalledWith('{"error":"Test error"}\n');
    });

    it('should print error message', () => {
      const options: OutputOptions = {
        format: 'json',
        color: true,
        verbose: false,
        quiet: false,
      };
      printError(new Error('Test error'), options);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should print error with stack trace when verbose', () => {
      const options: OutputOptions = {
        quiet: false,
        format: 'json',
        color: true,
        verbose: true,
        quiet: false,
      };
      const error = new Error('Test error');
      printError(error, options);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
