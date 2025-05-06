/**
 * Tests for quiet mode functionality
 */
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { formatOutput, formatResponse, printResponse, printError } from '../../src/utils/output.js';
import { OutputOptions } from '../../src/types.js';

describe('Quiet Mode', () => {
  // Mock process.stdout.write and process.stderr.write
  const stdoutWriteMock = vi.fn();
  const stderrWriteMock = vi.fn();
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;

  // Mock console methods
  const consoleLogMock = vi.fn();
  const consoleErrorMock = vi.fn();
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Setup mocks
    process.stdout.write = stdoutWriteMock;
    process.stderr.write = stderrWriteMock;
    console.log = consoleLogMock;
    console.error = consoleErrorMock;
    
    // Clear mock calls
    stdoutWriteMock.mockClear();
    stderrWriteMock.mockClear();
    consoleLogMock.mockClear();
    consoleErrorMock.mockClear();
  });

  afterEach(() => {
    // Restore original functions
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('formatOutput', () => {
    it('should format data as JSON in quiet mode with JSON format', () => {
      const data = { key: 'value' };
      const options: OutputOptions = {
        format: 'json',
        color: true,
        verbose: false,
        silent: false,
        quiet: true
      };

      const result = formatOutput(data, options);
      expect(result).toBe(JSON.stringify(data, null, 2));
    });

    it('should format data as YAML in quiet mode with YAML format', () => {
      const data = { key: 'value' };
      const options: OutputOptions = {
        format: 'yaml',
        color: true,
        verbose: false,
        silent: false,
        quiet: true
      };

      const result = formatOutput(data, options);
      expect(result).toContain('key: value');
    });

    it('should format data as raw in quiet mode with raw format', () => {
      const data = 'raw data';
      const options: OutputOptions = {
        format: 'raw',
        color: true,
        verbose: false,
        silent: false,
        quiet: true
      };

      const result = formatOutput(data, options);
      expect(result).toBe('raw data');
    });
  });

  describe('formatResponse', () => {
    it('should return only formatted data in quiet mode respecting the output format', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { key: 'value' }
      };
      
      // Test with JSON format
      const jsonOptions: OutputOptions = {
        format: 'json',
        color: true,
        verbose: false,
        silent: false,
        quiet: true
      };

      const jsonResult = formatResponse(response, jsonOptions);
      expect(jsonResult).toBe(JSON.stringify(response.data, null, 2));
      expect(jsonResult).not.toContain('Status:');
      expect(jsonResult).not.toContain('Headers:');
      
      // Test with YAML format
      const yamlOptions: OutputOptions = {
        format: 'yaml',
        color: true,
        verbose: false,
        silent: false,
        quiet: true
      };

      const yamlResult = formatResponse(response, yamlOptions);
      expect(yamlResult).toContain('key: value');
      expect(yamlResult).not.toContain('Status:');
      expect(yamlResult).not.toContain('Headers:');
    });
  });

  describe('printResponse', () => {
    it('should write output directly to stdout in quiet mode respecting the output format', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { key: 'value' }
      };
      
      // Test with JSON format
      const jsonOptions: OutputOptions = {
        format: 'json',
        color: true,
        verbose: false,
        silent: false,
        quiet: true
      };

      printResponse(response, jsonOptions);
      
      // Should write to stdout directly
      expect(stdoutWriteMock).toHaveBeenCalled();
      // Should not use console.log
      expect(consoleLogMock).not.toHaveBeenCalled();
      
      // Should write JSON data
      const expectedJsonOutput = JSON.stringify(response.data, null, 2);
      expect(stdoutWriteMock).toHaveBeenCalledWith(expect.stringContaining(expectedJsonOutput));
      
      // Clear mocks
      stdoutWriteMock.mockClear();
      
      // Test with YAML format
      const yamlOptions: OutputOptions = {
        format: 'yaml',
        color: true,
        verbose: false,
        silent: false,
        quiet: true
      };

      printResponse(response, yamlOptions);
      
      // Should write to stdout directly
      expect(stdoutWriteMock).toHaveBeenCalled();
      // Should not use console.log
      expect(consoleLogMock).not.toHaveBeenCalled();
      
      // Should contain YAML formatted data
      expect(stdoutWriteMock).toHaveBeenCalledWith(expect.stringContaining('key: value'));
    });
  });

  describe('printError', () => {
    it('should write error as JSON to stderr in quiet mode with json format', () => {
      const error = new Error('Test error');
      const options: OutputOptions = {
        format: 'json',
        color: true,
        verbose: false,
        silent: false,
        quiet: true
      };

      printError(error, options);
      
      // Should write to stderr directly
      expect(stderrWriteMock).toHaveBeenCalled();
      // Should not use console.error
      expect(consoleErrorMock).not.toHaveBeenCalled();
      
      // Should write JSON error
      const expectedOutput = JSON.stringify({ error: 'Test error' });
      expect(stderrWriteMock).toHaveBeenCalledWith(expect.stringContaining(expectedOutput));
    });

    it('should write error as YAML to stderr in quiet mode with yaml format', () => {
      const error = new Error('Test error');
      const options: OutputOptions = {
        format: 'yaml',
        color: true,
        verbose: false,
        silent: false,
        quiet: true
      };

      printError(error, options);
      
      // Should write to stderr directly
      expect(stderrWriteMock).toHaveBeenCalled();
      // Should not use console.error
      expect(consoleErrorMock).not.toHaveBeenCalled();
      
      // Should write YAML error
      expect(stderrWriteMock).toHaveBeenCalledWith(expect.stringContaining('error: Test error'));
    });

    it('should write simple error message to stderr in quiet mode with non-json/yaml format', () => {
      const error = new Error('Test error');
      const options: OutputOptions = {
        format: 'raw',
        color: true,
        verbose: false,
        silent: false,
        quiet: true
      };

      printError(error, options);
      
      // Should write to stderr directly
      expect(stderrWriteMock).toHaveBeenCalled();
      // Should not use console.error
      expect(consoleErrorMock).not.toHaveBeenCalled();
      
      // Should write simple error message
      expect(stderrWriteMock).toHaveBeenCalledWith(expect.stringContaining('Error: Test error'));
    });
  });
});
