import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { executeCommand, validateWritePath, validateEditPath, getProjectRoot } from './sandbox';

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

        const maxLength = 15000;
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

  edit_file: tool({
    description: `Edit or create a file anywhere in the project. Use for modifying source code, configs, or any project file. Blocked: .env files, node_modules, .git, lockfiles.`,
    inputSchema: z.object({
      file_path: z.string().describe('Path relative to project root'),
      content: z.string().describe('Full new content for the file'),
    }),
    execute: async ({ file_path, content }) => {
      const validation = validateEditPath(file_path);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      try {
        const fullPath = path.join(getProjectRoot(), file_path);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');

        return {
          success: true,
          message: `File written successfully: ${file_path}`,
          bytesWritten: Buffer.byteLength(content, 'utf-8'),
        };
      } catch (error) {
        const err = error as Error;
        return { success: false, error: `Error editing file: ${err.message}` };
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
      const maxOut = 10000;
      const stdout = result.stdout && result.stdout.length > maxOut
        ? result.stdout.slice(0, maxOut) + '\n[truncated]'
        : result.stdout;
      return {
        success: result.exitCode === 0,
        stdout,
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
      const maxOut = 10000;
      const content = result.stdout && result.stdout.length > maxOut
        ? result.stdout.slice(0, maxOut) + '\n[truncated]'
        : result.stdout;
      return {
        success: result.exitCode === 0,
        content,
        error: result.stderr,
        skillName: 'extract_document',
      };
    },
  }),

  web_fetch: tool({
    description: `Fetch and extract readable text content from any URL. Use when the user asks to visit, read, check, or scrape a website, or provides a URL to look at.`,
    inputSchema: z.object({
      url: z.string().url().describe('The URL to fetch'),
    }),
    execute: async ({ url }) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        clearTimeout(timeout);

        if (!response.ok) {
          return { success: false, error: `HTTP ${response.status}: ${response.statusText}`, url };
        }

        const contentType = response.headers.get('content-type') || '';
        const html = await response.text();

        if (contentType.includes('application/json')) {
          const maxLen = 8000;
          return {
            success: true,
            url,
            contentType: 'json',
            content: html.length > maxLen ? html.slice(0, maxLen) + '\n[truncated]' : html,
          };
        }

        const extractions: string[] = [];

        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) extractions.push(`# ${titleMatch[1].trim()}`);

        const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
        if (metaDesc) extractions.push(metaDesc[1].trim());

        const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
        if (ogDesc && ogDesc[1] !== metaDesc?.[1]) extractions.push(ogDesc[1].trim());

        const nextDataMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
        if (nextDataMatch) {
          try {
            const nextData = JSON.parse(nextDataMatch[1]);
            const pageProps = nextData?.props?.pageProps;
            if (pageProps) {
              const extractText = (obj: unknown, depth = 0): string[] => {
                if (depth > 5) return [];
                const texts: string[] = [];
                if (typeof obj === 'string' && obj.length > 20 && obj.length < 5000) {
                  texts.push(obj);
                } else if (Array.isArray(obj)) {
                  for (const item of obj) texts.push(...extractText(item, depth + 1));
                } else if (obj && typeof obj === 'object') {
                  for (const val of Object.values(obj as Record<string, unknown>)) {
                    texts.push(...extractText(val, depth + 1));
                  }
                }
                return texts;
              };
              const nextTexts = extractText(pageProps);
              if (nextTexts.length > 0) {
                extractions.push('\n--- Page Data ---\n' + nextTexts.join('\n\n'));
              }
            }
          } catch { /* ignore parse errors */ }
        }

        let text = html;

        const mainContent = html.match(/<main[\s\S]*?<\/main>/i)
          || html.match(/<article[\s\S]*?<\/article>/i)
          || html.match(/<div[^>]+(?:role=["']main["']|id=["'](?:content|main|app)["']|class=["'][^"']*content[^"']*["'])[\s\S]*?<\/div>/i);

        if (mainContent) {
          text = mainContent[0];
        }

        text = text
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[\s\S]*?<\/footer>/gi, '');

        text = text
          .replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
          .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n\n## $1\n')
          .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '  - $1\n')
          .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\n{3,}/g, '\n\n')
          .replace(/[ \t]+/g, ' ')
          .trim();

        let finalContent = extractions.length > 0
          ? extractions.join('\n\n') + '\n\n--- Page Content ---\n\n' + text
          : text;

        const maxLength = 8000;
        const truncated = finalContent.length > maxLength;
        if (truncated) {
          finalContent = finalContent.slice(0, maxLength) + '\n[truncated]';
        }

        return { success: true, url, contentType: 'html', content: finalContent, truncated };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          url,
          error: err.name === 'AbortError' ? 'Request timed out (15s)' : err.message,
        };
      }
    },
  }),

  use_skill: tool({
    description: `Load a project skill's methodology from .claude/skills/. Use when the user's request matches a discovered skill. The skill's full instructions are returned for you to apply.`,
    inputSchema: z.object({
      skill_name: z.string().describe('Folder name under .claude/skills/ (e.g. "copy-writer", "doc-reader")'),
      input_text: z.string().optional().describe('Optional text input for the skill to process'),
    }),
    execute: async ({ skill_name, input_text }) => {
      const normalized = skill_name.replace(/\\/g, '/');
      if (normalized.includes('..') || normalized.includes('/')) {
        return { success: false, error: 'Invalid skill name' };
      }

      const skillDir = path.join(getProjectRoot(), '.claude', 'skills', skill_name);

      let content: string | null = null;
      for (const filename of ['SKILL.md', 'skill.md']) {
        try {
          content = await fs.readFile(path.join(skillDir, filename), 'utf-8');
          break;
        } catch { /* try next */ }
      }

      if (!content) {
        return {
          success: false,
          error: `Skill "${skill_name}" not found. Check .claude/skills/ for available skills.`,
        };
      }

      const maxLen = 10000;
      const methodology = content.length > maxLen
        ? content.slice(0, maxLen) + '\n[truncated]'
        : content;

      return {
        success: true,
        skillName: skill_name,
        methodology,
        inputText: input_text || null,
        instructions: 'Apply this skill methodology to fulfill the user request. Follow its framework, rules, and output format.',
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
