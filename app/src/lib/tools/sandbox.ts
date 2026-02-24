import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const BLOCKED_COMMANDS = [
  'rm -rf',
  'rm -r',
  'rmdir',
  'del /s',
  'rd /s',
  'sudo',
  'format',
  'mkfs',
  '> /dev',
  'dd if=',
  ':(){:|:&};:',
  'chmod -R 777',
  'chown -R',
  '> /etc',
  'shutdown',
  'reboot',
  'halt',
  'poweroff',
  'init 0',
  'init 6',
  'kill -9 -1',
  'pkill -9',
  'killall',
  'mv /* ',
  'mv / ',
  'wget | sh',
  'curl | sh',
  'npm publish',
  'git push --force',
  'git reset --hard',
];

const ALLOWED_WRITE_PATHS = ['output/', 'output\\'];

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

export function validateCommand(command: string): { valid: boolean; error?: string } {
  const lowerCommand = command.toLowerCase();

  for (const blocked of BLOCKED_COMMANDS) {
    if (lowerCommand.includes(blocked.toLowerCase())) {
      return {
        valid: false,
        error: `Command blocked for safety: contains "${blocked}"`,
      };
    }
  }

  return { valid: true };
}

export function validateWritePath(filePath: string): { valid: boolean; error?: string } {
  const normalizedPath = filePath.replace(/\\/g, '/');

  const isAllowed = ALLOWED_WRITE_PATHS.some((allowed) => {
    const normalizedAllowed = allowed.replace(/\\/g, '/');
    return (
      normalizedPath.startsWith(normalizedAllowed) ||
      normalizedPath.startsWith('./' + normalizedAllowed) ||
      normalizedPath.startsWith('/' + normalizedAllowed)
    );
  });

  if (!isAllowed) {
    return {
      valid: false,
      error: `Write operation not allowed outside of output/ directory. Attempted path: ${filePath}`,
    };
  }

  if (normalizedPath.includes('..')) {
    return { valid: false, error: 'Path traversal not allowed' };
  }

  return { valid: true };
}

export async function executeCommand(
  command: string,
  timeout: number = 30000,
  cwd?: string
): Promise<ExecutionResult> {
  const validation = validateCommand(command);
  if (!validation.valid) {
    return {
      stdout: '',
      stderr: validation.error || 'Command blocked',
      exitCode: 1,
      error: validation.error,
    };
  }

  const workingDir = cwd || process.cwd();

  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'cmd.exe' : '/bin/sh';
    const shellArgs = isWindows ? ['/c', command] : ['-c', command];

    const child = spawn(shell, shellArgs, {
      cwd: workingDir,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timeoutId = setTimeout(() => {
      killed = true;
      child.kill('SIGKILL');
    }, timeout);

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
      if (stdout.length > 10000) {
        stdout = stdout.slice(-10000);
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
      if (stderr.length > 3000) {
        stderr = stderr.slice(-3000);
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);

      if (killed) {
        resolve({
          stdout,
          stderr: stderr + '\n[Process killed: timeout exceeded]',
          exitCode: null,
          error: `Command timed out after ${timeout}ms`,
        });
      } else {
        resolve({ stdout, stderr, exitCode: code });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr: err.message,
        exitCode: 1,
        error: err.message,
      });
    });
  });
}

const BLOCKED_EDIT_PATTERNS = [
  /(?:^|\/)\.env(?:\.|$)/i,
  /(?:^|\/)node_modules\//i,
  /(?:^|\/)\.git\//i,
  /(?:^|\/)package-lock\.json$/i,
  /(?:^|\/)yarn\.lock$/i,
  /(?:^|\/)pnpm-lock\.yaml$/i,
];

export function validateEditPath(filePath: string): { valid: boolean; error?: string } {
  const normalized = filePath.replace(/\\/g, '/');

  if (normalized.includes('..')) {
    return { valid: false, error: 'Path traversal (..) not allowed' };
  }

  if (/^[a-zA-Z]:/.test(normalized) || normalized.startsWith('/')) {
    return { valid: false, error: 'Absolute paths not allowed — use a path relative to the project root' };
  }

  for (const pattern of BLOCKED_EDIT_PATTERNS) {
    if (pattern.test(normalized)) {
      return { valid: false, error: `Editing blocked for safety: ${filePath}` };
    }
  }

  return { valid: true };
}

let _cachedRoot: string | null = null;

export function getProjectRoot(): string {
  if (_cachedRoot) return _cachedRoot;

  let dir = process.cwd();
  const { root } = path.parse(dir);

  while (dir !== root) {
    if (
      fs.existsSync(path.join(dir, '.git')) ||
      fs.existsSync(path.join(dir, '.claude'))
    ) {
      _cachedRoot = dir;
      return dir;
    }
    dir = path.dirname(dir);
  }

  _cachedRoot = process.cwd();
  return _cachedRoot;
}
