import * as fs from 'fs/promises';
import * as path from 'path';
import { getProjectRoot } from '@/lib/tools/sandbox';

interface DiscoveredSkill {
  dirName: string;
  name: string;
  description: string;
  keywords: string[];
}

async function discoverSkills(): Promise<DiscoveredSkill[]> {
  const skillsDir = path.join(getProjectRoot(), '.claude', 'skills');
  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    const skills: DiscoveredSkill[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      let content: string | null = null;
      for (const filename of ['SKILL.md', 'skill.md']) {
        try {
          content = await fs.readFile(
            path.join(skillsDir, entry.name, filename),
            'utf-8',
          );
          break;
        } catch { /* try next */ }
      }
      if (!content) continue;

      const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (!fmMatch) continue;

      const fm = fmMatch[1];
      const nameMatch = fm.match(/^name:\s*(.+)$/m);
      const descMatch = fm.match(/^description:\s*(.+)$/m);

      const keywords: string[] = [];
      const kwSection = fm.match(
        /(?:activationKeywords|trigger_phrases):\s*\n((?:\s+-\s*.+\n?)*)/,
      );
      if (kwSection) {
        for (const kw of kwSection[1].matchAll(
          /^\s+-\s*"?([^"'\n]+)"?\s*$/gm,
        )) {
          keywords.push(kw[1].trim());
        }
      }

      skills.push({
        dirName: entry.name,
        name: nameMatch?.[1]?.trim() || entry.name,
        description: descMatch?.[1]?.trim() || 'No description available',
        keywords,
      });
    }

    return skills;
  } catch {
    return [];
  }
}

export async function getSystemPrompt(): Promise<string> {
  const skills = await discoverSkills();

  let skillSection = '';
  if (skills.length > 0) {
    const lines = skills.map((s) => {
      const kw =
        s.keywords.length > 0
          ? ` Triggers: ${s.keywords.map((k) => `"${k}"`).join(', ')}.`
          : '';
      return `- **${s.name}** (\`${s.dirName}\`): ${s.description}${kw}`;
    });
    skillSection = `
## Available Skills (auto-discovered from .claude/skills/)
Use the **use_skill** tool to load a skill's full methodology before applying it. Pass the folder name as \`skill_name\`.
${lines.join('\n')}
`;
  }

  return `You are Claude, an AI assistant embedded in a development workspace. You have access to tools for file operations, command execution, web fetching, and specialized skills.

IMPORTANT: You MUST use your tools to fulfill requests. When the user asks you to visit a URL, fetch a website, or look something up online — use the web_fetch tool. When asked to run a command, use run_command. When a request matches a skill's triggers or description, use the use_skill tool to load the methodology first, then apply it. Never say you "don't have access" to a capability that is listed below. Always attempt the tool call.

## Base Tools
- **run_command**: Execute shell commands (sandboxed — destructive commands blocked)
- **read_file**: Read file contents from the project
- **write_file**: Write to the output/ directory only
- **edit_file**: Edit or create any project file (blocked: .env, node_modules, .git, lockfiles). Use for code changes, config updates, or creating new files in the project.
- **list_directory**: List files and directories
- **web_fetch**: Fetch and extract readable text from any URL. Use this whenever the user provides a URL, asks to visit/read/check a website, or needs web content.
- **use_skill**: Load a project skill's methodology from .claude/skills/. Always use this when the user's request matches a discovered skill below.
${skillSection}
## Safety
- Destructive commands (rm -rf, sudo, etc.) are blocked
- File writes via write_file are restricted to output/ directory
- edit_file blocks writes to .env files, node_modules/, .git/, and lockfiles
- Commands have a 30-second default timeout (5 minutes max)

## Output Rules
- After using a tool, summarize the key information. Do NOT echo raw tool output verbatim.
- Keep responses concise — aim for short paragraphs, bullet points, or tables.
- For web_fetch results, extract and present the relevant information, not the full page dump.
- For file reads, highlight the relevant lines rather than reprinting the entire file.

## Response Style
- Be concise and helpful
- Use markdown formatting for structured responses
- Show tool invocations transparently
- Suggest next steps when appropriate
`;
}
