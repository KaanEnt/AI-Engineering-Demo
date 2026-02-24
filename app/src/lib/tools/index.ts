import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { executeCommand, validateWritePath, getProjectRoot } from './sandbox';

export const tools = {
  run_command: tool({
    description: `Run a shell command in the project directory. Use this for:
- Running Node.js scripts
- Installing npm packages
- Running build commands
- Checking file existence with dir/ls
Commands are sandboxed - destructive commands (rm -rf, sudo, etc.) are blocked.`,
    inputSchema: z.object({
      command: z.string().describe('The shell command to execute'),
    }),
    execute: async ({ command }) => {
      const effectiveTimeout = 30000;
      const result = await executeCommand(command, effectiveTimeout);

      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout || '(no output)',
        stderr: result.stderr || '',
        error: result.error,
      };
    },
  }),

  read_file: tool({
    description: `Read the contents of a file. Paths are relative to the project root.`,
    inputSchema: z.object({
      path: z.string().describe('Path to the file (relative to project root)'),
    }),
    execute: async ({ path: filePath }) => {
      try {
        const fullPath = path.isAbsolute(filePath)
          ? filePath
          : path.join(getProjectRoot(), filePath);

        const content = await fs.readFile(fullPath, 'utf-8');

        const maxLength = 50000;
        if (content.length > maxLength) {
          return {
            success: true,
            content:
              content.slice(0, maxLength) +
              `\n\n[... truncated, showing first ${maxLength} characters of ${content.length} total]`,
            truncated: true,
            totalLength: content.length,
          };
        }

        return {
          success: true,
          content,
          truncated: false,
        };
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        return {
          success: false,
          error:
            err.code === 'ENOENT'
              ? `File not found: ${filePath}`
              : `Error reading file: ${err.message}`,
        };
      }
    },
  }),

  write_file: tool({
    description: `Write content to a file. RESTRICTED to the output/ directory only for safety.`,
    inputSchema: z.object({
      path: z.string().describe('Path to the file (must be within output/ directory)'),
      content: z.string().describe('Content to write to the file'),
    }),
    execute: async ({ path: filePath, content }) => {
      const validation = validateWritePath(filePath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      try {
        const fullPath = path.isAbsolute(filePath)
          ? filePath
          : path.join(getProjectRoot(), filePath);

        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');

        return {
          success: true,
          message: `File written successfully: ${filePath}`,
          bytesWritten: Buffer.byteLength(content, 'utf-8'),
        };
      } catch (error) {
        const err = error as Error;
        return { success: false, error: `Error writing file: ${err.message}` };
      }
    },
  }),

  list_directory: tool({
    description: `List files and directories in a given path. Paths are relative to the project root.`,
    inputSchema: z.object({
      path: z.string().describe('Path to the directory (relative to project root)'),
    }),
    execute: async ({ path: dirPath }) => {
      try {
        const fullPath = path.isAbsolute(dirPath)
          ? dirPath
          : path.join(getProjectRoot(), dirPath);

        const entries = await fs.readdir(fullPath, { withFileTypes: true });

        const files: string[] = [];
        const directories: string[] = [];

        for (const entry of entries) {
          if (entry.isDirectory()) {
            directories.push(entry.name + '/');
          } else {
            files.push(entry.name);
          }
        }

        return {
          success: true,
          path: dirPath,
          directories: directories.sort(),
          files: files.sort(),
          total: entries.length,
        };
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        return {
          success: false,
          error:
            err.code === 'ENOENT'
              ? `Directory not found: ${dirPath}`
              : `Error listing directory: ${err.message}`,
        };
      }
    },
  }),

  scrape_devpost: tool({
    description: `Scrape a Devpost hackathon gallery for attendee profiles and GitHub links. Use when the user mentions "scrape devpost", "devpost attendees", "hackathon attendees", or provides a devpost.com gallery URL.`,
    inputSchema: z.object({
      gallery_url: z.string().describe('Devpost project gallery URL'),
    }),
    execute: async ({ gallery_url }) => {
      const result = await executeCommand(
        `node scripts/devpost-scraper.js "${gallery_url}"`,
        300000
      );
      return {
        success: result.exitCode === 0,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        skillName: 'scrape_devpost',
      };
    },
  }),

  extract_document: tool({
    description: `Extract text from PDFs and documents (local files or URLs). Use when the user mentions "read pdf", "extract pdf", "parse document", or provides a PDF file path/URL.`,
    inputSchema: z.object({
      file_path: z.string().describe('Path or URL to the document'),
    }),
    execute: async ({ file_path }) => {
      const result = await executeCommand(
        `python3 .claude/skills/doc-reader/scripts/extract-pdf.py "${file_path}"`,
        60000
      );
      return {
        success: result.exitCode === 0,
        content: result.stdout,
        error: result.stderr,
        skillName: 'extract_document',
      };
    },
  }),

  create_diagram: tool({
    description: `Create technical diagrams from DOT language notation. Use when the user asks to "create a diagram", "draw architecture", "make a flowchart", or describes a visual they need.`,
    inputSchema: z.object({
      dot_content: z.string().describe('DOT language content for the diagram'),
      filename: z.string().optional().describe('Output filename without extension (default: diagram)'),
    }),
    execute: async ({ dot_content, filename }) => {
      const outputName = filename ?? 'diagram';
      try {
        const dotPath = `output/${outputName}.dot`;
        const pngPath = `output/${outputName}.png`;
        const fullDotPath = path.join(getProjectRoot(), dotPath);

        await fs.mkdir(path.dirname(fullDotPath), { recursive: true });
        await fs.writeFile(fullDotPath, dot_content, 'utf-8');

        const result = await executeCommand(
          `dot -Tpng -Gdpi=150 ${dotPath} -o ${pngPath}`,
          30000
        );

        return {
          success: result.exitCode === 0,
          outputPath: pngPath,
          dotPath,
          error: result.stderr || result.error,
          skillName: 'create_diagram',
        };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: `Error creating diagram: ${err.message}`,
          skillName: 'create_diagram',
        };
      }
    },
  }),
};

export type Tools = typeof tools;
