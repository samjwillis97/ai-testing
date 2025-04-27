import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CLI Entrypoint', () => {
  it('shows help with no args', () => {
    const cliPath = path.join(__dirname, '../../dist/index.js');
    const output = execSync(`node ${cliPath} --help`).toString();
    expect(output).toContain('SHC Command Line Interface');
  });
});
