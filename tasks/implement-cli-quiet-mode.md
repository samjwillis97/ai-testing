# Implement Quiet Mode for CLI Package

## Overview

The CLI package needs a new "quiet mode" to facilitate piping JSON responses directly to other command-line tools like `jq`. This mode will output only the raw response data without any formatting, colors, or status information, making it ideal for command chaining and automation.

## Requirements

1. Add a new `--quiet` flag to CLI commands that produce output
2. In quiet mode:
   - Output only the raw response data (JSON, YAML, etc.) without any decorations
   - No spinners, status messages, or other UI elements
   - No colors or formatting
   - Write directly to stdout using `process.stdout.write`
   - Errors should be minimal and written to stderr
3. Differentiate from existing "silent" mode:
   - Silent mode: Minimal output but still includes some formatting
   - Quiet mode: Raw data only, suitable for piping to other tools

## Implementation Plan

### 1. Update Types

- Modify `OutputOptions` interface in `types.ts` to include a `quiet` boolean property

### 2. Update Output Utilities

- Enhance `formatOutput`, `formatResponse`, and `printResponse` functions in `utils/output.ts` to handle quiet mode
- In quiet mode, bypass all formatting and output only the raw data
- Ensure error handling is appropriate for quiet mode (minimal, machine-readable errors to stderr)

### 3. Update Commands

- Add `--quiet` flag to all commands that produce output (collection, request, etc.)
- Pass the quiet flag to output options
- Ensure spinners and other UI elements are disabled in quiet mode

### 4. Testing

- Create tests that verify quiet mode works correctly
- Specifically test piping output to tools like `jq`
- Ensure error handling works correctly in quiet mode

## Test Case Example

```typescript
// Test quiet mode with JSON output piped to jq
test('quiet mode outputs raw JSON suitable for piping to jq', async () => {
  // Setup a mock response
  const mockResponse = {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    data: { key: 'value', nested: { property: 'test' } }
  };
  
  // Create a writable stream to capture stdout
  const stdoutMock = new MockWritableStream();
  const originalStdout = process.stdout.write;
  process.stdout.write = stdoutMock.write.bind(stdoutMock);
  
  try {
    // Call printResponse with quiet mode enabled
    const options: OutputOptions = {
      format: 'json',
      color: false,
      verbose: false,
      silent: false,
      quiet: true
    };
    
    printResponse(mockResponse, options);
    
    // Verify the output is valid JSON and can be parsed
    const output = stdoutMock.getContents();
    const parsed = JSON.parse(output);
    
    // Verify the output contains only the data (no status or headers)
    expect(parsed).toEqual(mockResponse.data);
    
    // Simulate piping to jq by parsing with a jq-like selector
    const jqResult = jqLike(output, '.nested.property');
    expect(jqResult).toBe('test');
  } finally {
    // Restore stdout
    process.stdout.write = originalStdout;
  }
});
```

## Implementation Status

- [ ] Update `OutputOptions` interface in `types.ts`
- [ ] Modify output utilities in `utils/output.ts`
- [ ] Add `--quiet` flag to commands
- [ ] Create tests for quiet mode
- [ ] Document quiet mode in README and help text

## Benefits

1. Enables seamless integration with other command-line tools
2. Facilitates automation and scripting
3. Improves machine-readability of output
4. Provides a cleaner alternative to silent mode for programmatic usage
