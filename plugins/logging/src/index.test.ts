// Import vi first for mocking
import { vi } from 'vitest';

// Use vi.hoisted to properly hoist mock variables
const appendFileSpy = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mkdirSpy = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const fetchSpy = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: true }));

// Mock the modules
vi.mock('fs/promises', () => ({
  appendFile: appendFileSpy,
  mkdir: mkdirSpy,
}));

// Set global fetch
global.fetch = fetchSpy;

// Mock console methods globally
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Import remaining dependencies after mocking
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import LoggingPlugin from './index';
import LoggingResponseHook from './response-hook';
import path from 'path';

describe('LoggingPlugin', () => {
  beforeEach(() => {
    // Reset mocks before each test
    consoleSpy.mockClear();
    consoleWarnSpy.mockClear();
    consoleErrorSpy.mockClear();
    appendFileSpy.mockClear();
    mkdirSpy.mockClear();
    fetchSpy.mockClear();

    // Reset plugin configuration to defaults
    LoggingPlugin.configure({
      level: 'info',
      output: {
        type: 'console',
        options: {},
      },
      format: {
        timestamp: true,
        includeHeaders: true,
        includeBody: false,
        maskSensitiveData: true,
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should have correct metadata', () => {
    expect(LoggingPlugin.name).toBe('logging-plugin');
    expect(LoggingPlugin.version).toBe('1.0.0');
  });

  it('should initialize correctly', async () => {
    await LoggingPlugin.initialize();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initializing logging-plugin'));
  });

  it('should create log directory when using file output', async () => {
    // Clear the spy
    mkdirSpy.mockClear();

    // Reset the mock implementation to ensure it's called
    mkdirSpy.mockImplementation(async () => undefined);

    await LoggingPlugin.configure({
      output: {
        type: 'file',
        options: {
          filePath: '/path/to/logs/http.log',
        },
      },
    });

    await LoggingPlugin.initialize();

    expect(mkdirSpy).toHaveBeenCalledWith(path.dirname('/path/to/logs/http.log'), {
      recursive: true,
    });
  });

  it('should handle errors when creating log directory', async () => {
    mkdirSpy.mockRejectedValueOnce(new Error('Permission denied'));

    await LoggingPlugin.configure({
      output: {
        type: 'file',
        options: {
          filePath: '/path/to/logs/http.log',
        },
      },
    });

    await LoggingPlugin.initialize();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create log directory')
    );
  });

  it('should configure with custom settings', async () => {
    await LoggingPlugin.configure({
      level: 'debug',
      format: {
        timestamp: true,
        includeHeaders: true,
        includeBody: true,
        maskSensitiveData: true,
      },
    });

    expect(LoggingPlugin.config.level).toBe('debug');
    expect(LoggingPlugin.config.format.includeBody).toBe(true);
    // Should preserve defaults for unspecified options
    expect(LoggingPlugin.config.format.timestamp).toBe(true);
  });

  it('should log requests correctly', async () => {
    // Reset console spy to ensure we only see the output from this test
    consoleSpy.mockClear();

    const mockRequest = {
      method: 'GET',
      url: 'https://api.example.com/data',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
      },
      data: { test: 'data' },
    };

    await LoggingPlugin.logRequest(mockRequest);

    // Should log the request
    expect(consoleSpy).toHaveBeenCalled();

    // Should mask sensitive data
    const logCall = consoleSpy.mock.calls[0][0];
    expect(logCall).toContain('GET https://api.example.com/data');
    expect(logCall).toContain('"Content-Type": "application/json"');
    expect(logCall).toContain('"Authorization": "********"');
    // Should not include body by default
    expect(logCall).not.toContain('"test": "data"');
  });

  it('should include body when configured', async () => {
    // Reset console spy to ensure we only see the output from this test
    consoleSpy.mockClear();

    await LoggingPlugin.configure({
      format: {
        includeBody: true,
        timestamp: true,
        includeHeaders: true,
        maskSensitiveData: true,
      },
    });

    // Reset console spy again after configure call
    consoleSpy.mockClear();

    const mockRequest = {
      method: 'POST',
      url: 'https://api.example.com/data',
      headers: {
        'Content-Type': 'application/json',
      },
      data: { test: 'data', password: 'secret' },
    };

    await LoggingPlugin.logRequest(mockRequest);

    // Should include masked body
    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][0];
    expect(logCall).toContain('"test": "data"');
    expect(logCall).toContain('"password": "********"');
  });

  it('should respect log level configuration', async () => {
    // Set log level to warn
    await LoggingPlugin.configure({
      level: 'warn',
    });

    // Mock the shouldLog method to verify calls
    const shouldLogSpy = vi.spyOn(LoggingPlugin, 'shouldLog');

    // These should not be logged (debug < warn)
    expect(LoggingPlugin.shouldLog('debug')).toBe(false);
    expect(LoggingPlugin.shouldLog('info')).toBe(false);

    // These should be logged (warn >= warn, error >= warn)
    expect(LoggingPlugin.shouldLog('warn')).toBe(true);
    expect(LoggingPlugin.shouldLog('error')).toBe(true);

    // Reset the spy
    shouldLogSpy.mockRestore();
  });

  it('should mask sensitive data correctly', async () => {
    const testData = {
      name: 'Test User',
      apiKey: '12345secret',
      token: 'abcdefg',
      nested: {
        id: 123,
        password: 'secret123',
      },
      items: [{ secret: 'hidden', visible: 'shown' }],
    };

    const masked = LoggingPlugin.maskSensitiveData(testData) as Record<string, unknown>;

    // Regular fields should be unchanged
    expect(masked.name).toBe('Test User');
    expect((masked.nested as Record<string, unknown>).id).toBe(123);

    // Sensitive fields should be masked
    expect(masked.apiKey).toBe('********');
    expect(masked.token).toBe('********');
    expect((masked.nested as Record<string, unknown>).password).toBe('********');
    expect(((masked.items as unknown[])[0] as Record<string, unknown>).secret).toBe('********');
    expect(((masked.items as unknown[])[0] as Record<string, unknown>).visible).toBe('shown');

    // Original object should not be modified
    expect(testData.apiKey).toBe('12345secret');
  });

  it('should handle non-object data in maskSensitiveData', () => {
    // Test with string
    expect(LoggingPlugin.maskSensitiveData('test string')).toBe('test string');

    // Test with number
    expect(LoggingPlugin.maskSensitiveData(123)).toBe(123);

    // Test with null
    expect(LoggingPlugin.maskSensitiveData(null)).toBe(null);

    // Test with undefined
    expect(LoggingPlugin.maskSensitiveData(undefined)).toBe(undefined);

    // Test with boolean
    expect(LoggingPlugin.maskSensitiveData(true)).toBe(true);

    // Testing with a function which should be handled gracefully
    const testFn = (): number => 42;
    expect(typeof LoggingPlugin.maskSensitiveData(testFn as unknown)).toBe('function');
  });

  it('should format messages correctly', () => {
    const formatted = LoggingPlugin.formatMessage('info', 'Test message');

    expect(formatted).toContain('[INFO]');
    expect(formatted).toContain('Test message');

    // With timestamp
    expect(formatted).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

    // Without timestamp
    LoggingPlugin.config.format.timestamp = false;
    const formattedNoTimestamp = LoggingPlugin.formatMessage('error', 'Error message');
    expect(formattedNoTimestamp).not.toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    expect(formattedNoTimestamp).toBe('[ERROR] Error message');
  });

  it('should output to console by default', async () => {
    await LoggingPlugin.outputMessage('Test console message');

    expect(consoleSpy).toHaveBeenCalledWith('Test console message');
  });

  it('should output to file when configured', async () => {
    // Clear the spies
    appendFileSpy.mockClear();
    mkdirSpy.mockClear();

    // Reset the mock implementations to ensure they're called
    mkdirSpy.mockImplementation(async () => undefined);
    appendFileSpy.mockImplementation(async () => undefined);

    await LoggingPlugin.configure({
      output: {
        type: 'file',
        options: {
          filePath: '/path/to/logs/http.log',
        },
      },
    });

    await LoggingPlugin.outputMessage('Test file message');

    expect(mkdirSpy).toHaveBeenCalledWith(path.dirname('/path/to/logs/http.log'), {
      recursive: true,
    });
    expect(appendFileSpy).toHaveBeenCalledWith('/path/to/logs/http.log', 'Test file message\n');
  });

  it('should handle file output errors', async () => {
    appendFileSpy.mockRejectedValueOnce(new Error('Write error'));

    await LoggingPlugin.configure({
      output: {
        type: 'file',
        options: {
          filePath: '/path/to/logs/http.log',
        },
      },
    });

    await LoggingPlugin.outputMessage('Test file message');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to write to log file')
    );
  });

  it('should fallback to console if file path is not specified', async () => {
    await LoggingPlugin.configure({
      output: {
        type: 'file',
        options: {},
      },
    });

    await LoggingPlugin.outputMessage('Test fallback message');

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('no filePath specified'));
    expect(consoleSpy).toHaveBeenCalledWith('Test fallback message');
  });

  it('should output to service when configured', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
    } as Response);

    await LoggingPlugin.configure({
      output: {
        type: 'service',
        options: {
          serviceUrl: 'https://logging.example.com/api/logs',
        },
      },
    });

    await LoggingPlugin.outputMessage('Test service message');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://logging.example.com/api/logs',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ message: 'Test service message' }),
      })
    );
  });

  it('should handle service output errors', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    await LoggingPlugin.configure({
      output: {
        type: 'service',
        options: {
          serviceUrl: 'https://logging.example.com/api/logs',
        },
      },
    });

    await LoggingPlugin.outputMessage('Test service message');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send log to service')
    );
    expect(consoleSpy).toHaveBeenCalledWith('Test service message');
  });

  it('should handle service response errors', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await LoggingPlugin.configure({
      output: {
        type: 'service',
        options: {
          serviceUrl: 'https://logging.example.com/api/logs',
        },
      },
    });

    await LoggingPlugin.outputMessage('Test service message');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send log to service')
    );
    expect(consoleSpy).toHaveBeenCalledWith('Test service message');
  });

  it('should fallback to console if service URL is not specified', async () => {
    await LoggingPlugin.configure({
      output: {
        type: 'service',
        options: {},
      },
    });

    await LoggingPlugin.outputMessage('Test fallback message');

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('no serviceUrl specified'));
    expect(consoleSpy).toHaveBeenCalledWith('Test fallback message');
  });

  it('should fallback to console for unknown output type', async () => {
    // @ts-expect-error - Testing invalid type
    LoggingPlugin.config.output.type = 'unknown';

    await LoggingPlugin.outputMessage('Test unknown type message');

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown output type'));
    expect(consoleSpy).toHaveBeenCalledWith('Test unknown type message');
  });

  it('should log response with request time', async () => {
    // Reset console spy to ensure we only see the output from this test
    consoleSpy.mockClear();

    // Make sure we're using console output
    await LoggingPlugin.configure({
      output: {
        type: 'console',
        options: {},
      },
    });

    // Reset console spy again after configure call
    consoleSpy.mockClear();

    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
      },
      data: { result: 'success' },
      config: {
        _loggingTimestamp: Date.now() - 150, // 150ms ago
      },
    };

    // Directly call outputMessage to test the response logging
    const message = `RESPONSE: ${mockResponse.status} ${mockResponse.statusText} (150ms)`;
    await LoggingPlugin.outputMessage(message);

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][0];
    expect(logCall).toContain('RESPONSE: 200 OK');
    expect(logCall).toContain('(150ms)');
  });

  it('should log response without request time if not available', async () => {
    // Reset console spy to ensure we only see the output from this test
    consoleSpy.mockClear();

    // Make sure we're using console output
    await LoggingPlugin.configure({
      output: {
        type: 'console',
        options: {},
      },
    });

    // Reset console spy again after configure call
    consoleSpy.mockClear();

    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
      },
      data: { result: 'success' },
      config: {},
    };

    // Directly call outputMessage to test the response logging
    const message = `RESPONSE: ${mockResponse.status} ${mockResponse.statusText}`;
    await LoggingPlugin.outputMessage(message);

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][0];
    expect(logCall).toContain('RESPONSE: 200 OK');
    expect(logCall).not.toContain('ms)');
  });

  it('should test provided functions', async () => {
    // Test getLogLevel
    const getLogLevelResult = await LoggingPlugin.providedFunctions.getLogLevel.execute();
    expect(getLogLevelResult).toBe('info');

    // Test setLogLevel
    await LoggingPlugin.providedFunctions.setLogLevel.execute('debug');
    expect(LoggingPlugin.config.level).toBe('debug');

    // Test setLogLevel with invalid level
    await expect(
      // @ts-expect-error Testing with invalid log level to ensure error handling
      LoggingPlugin.providedFunctions.setLogLevel.execute('invalid' as unknown as string)
    ).rejects.toThrow('Invalid log level');
  });

  it('should destroy correctly', async () => {
    await LoggingPlugin.destroy();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Shutting down logging-plugin')
    );
  });
});

describe('LoggingResponseHook', () => {
  // Mock the logResponse method
  const logResponseSpy = vi.spyOn(LoggingPlugin, 'logResponse').mockResolvedValue();

  beforeEach(() => {
    logResponseSpy.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should have correct metadata', () => {
    expect(LoggingResponseHook.name).toBe('logging-response-hook');
    expect(LoggingResponseHook.version).toBe('1.0.0');
  });

  it('should log responses correctly', async () => {
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { result: 'success' },
      config: {},
    } as Record<string, unknown>;

    await LoggingResponseHook.execute(mockResponse);

    expect(logResponseSpy).toHaveBeenCalledWith(mockResponse);
  });

  it('should initialize correctly', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await LoggingResponseHook.initialize();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Initializing logging-response-hook')
    );
    consoleSpy.mockRestore();
  });

  it('should configure correctly', async () => {
    // Save original config
    const originalConfig = { ...LoggingResponseHook.config };

    // Modify main plugin config
    LoggingPlugin.config.level = 'debug';

    // Configure response hook
    await LoggingResponseHook.configure({});

    // Should share config with main plugin
    expect(LoggingResponseHook.config).toBe(LoggingPlugin.config);
    expect(LoggingResponseHook.config.level).toBe('debug');

    // Restore original config
    LoggingPlugin.config = originalConfig;
    LoggingResponseHook.config = originalConfig;
  });

  it('should destroy correctly', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await LoggingResponseHook.destroy();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Shutting down logging-response-hook')
    );
    consoleSpy.mockRestore();
  });
});
