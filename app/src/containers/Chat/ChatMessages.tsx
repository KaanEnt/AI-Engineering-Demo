"use client";

import { useRef, useEffect } from "react";
import type { UIMessage } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Wrench, Globe, FileText, GitBranch, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SKILL_META } from "./skillMeta";

interface ToolInvocationData {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

type OrderedPart =
  | { kind: "text"; content: string }
  | { kind: "tool"; invocation: ToolInvocationData };

function getOrderedParts(message: UIMessage): OrderedPart[] {
  if (!message.parts) return [];

  const groups: OrderedPart[] = [];

  for (const part of message.parts) {
    if (part.type === "text") {
      const textPart = part as { type: "text"; text: string };
      const last = groups[groups.length - 1];
      if (last && last.kind === "text") {
        last.content += textPart.text;
      } else {
        groups.push({ kind: "text", content: textPart.text });
      }
      continue;
    }

    const partType = part.type as string;

    if (partType === "dynamic-tool") {
      const dynPart = part as unknown as {
        type: string;
        toolCallId: string;
        toolName: string;
        state: string;
        input?: unknown;
        output?: unknown;
      };
      groups.push({
        kind: "tool",
        invocation: {
          toolCallId: dynPart.toolCallId,
          toolName: dynPart.toolName,
          args: (dynPart.input as Record<string, unknown>) || {},
          state: dynPart.state,
          result: dynPart.output,
        },
      });
    } else if (partType.startsWith("tool-")) {
      const toolPart = part as unknown as {
        type: string;
        toolCallId: string;
        state: string;
        input?: unknown;
        output?: unknown;
      };
      groups.push({
        kind: "tool",
        invocation: {
          toolCallId: toolPart.toolCallId,
          toolName: partType.slice(5),
          args: (toolPart.input as Record<string, unknown>) || {},
          state: toolPart.state,
          result: toolPart.output,
        },
      });
    }
  }

  return groups;
}

const SKILL_ICONS = {
  Globe,
  FileText,
  GitBranch,
} as const;

function SkillBadge({ toolName }: { toolName: string }) {
  const meta = SKILL_META[toolName];
  if (!meta) return null;

  const Icon = SKILL_ICONS[meta.icon];

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-neutral-700 bg-neutral-900 text-[9px] font-mono uppercase tracking-wide mb-1 text-neutral-300">
      <Icon size={10} />
      <span>{meta.name}</span>
    </div>
  );
}

function ToolInvocationDisplay({ toolInvocation }: { toolInvocation: ToolInvocationData }) {
  const { toolName, args, state, result } = toolInvocation;

  const isRunning = state === "input-streaming" || state === "input-available";
  const isDone = state === "output-available";
  const isError = state === "output-error";

  const getStatusColor = () => {
    if (isRunning) return "text-neutral-400";
    if (isError) return "text-red-400";
    if (isDone) {
      return (result as { success?: boolean })?.success
        ? "text-white"
        : "text-neutral-400";
    }
    return "text-neutral-500";
  };

  const getStatusIcon = () => {
    if (isRunning) return <Loader2 className="w-3 h-3 animate-spin" />;
    if (isError) return <XCircle className="w-3 h-3" />;
    if (isDone && (result as { success?: boolean })?.success) return <CheckCircle2 className="w-3 h-3" />;
    return <Wrench className="w-3 h-3" />;
  };

  const typedResult = result as {
    success?: boolean;
    error?: string;
    stdout?: string;
    content?: string;
    message?: string;
    bytesWritten?: number;
    files?: string[];
    directories?: string[];
    outputPath?: string;
  } | undefined;

  return (
    <div className="my-1 p-2 rounded bg-neutral-900 border border-dashed border-neutral-700">
      <div
        className={cn(
          "flex items-center gap-2 text-[9px] font-mono uppercase",
          getStatusColor()
        )}
      >
        {getStatusIcon()}
        <span>{toolName}</span>
        <span className="text-neutral-600">
          {isDone ? "completed" : isError ? "error" : "executing..."}
        </span>
      </div>

      {toolName === "run_command" && !!args?.command && (
        <div className="mt-1 text-[10px] font-mono text-neutral-500 truncate">
          $ {String(args.command)}
        </div>
      )}

      {(toolName === "read_file" ||
        toolName === "write_file" ||
        toolName === "list_directory") &&
        !!args?.path && (
          <div className="mt-1 text-[10px] font-mono text-neutral-500 truncate">
            {String(args.path)}
          </div>
        )}

      {toolName === "scrape_devpost" && !!args?.gallery_url && (
        <div className="mt-1 text-[10px] font-mono text-neutral-500 truncate">
          {String(args.gallery_url)}
        </div>
      )}

      {toolName === "extract_document" && !!args?.file_path && (
        <div className="mt-1 text-[10px] font-mono text-neutral-500 truncate">
          {String(args.file_path)}
        </div>
      )}

      {toolName === "edit_file" && !!args?.file_path && (
        <div className="mt-1 text-[10px] font-mono text-neutral-500 truncate">
          {String(args.file_path)}
        </div>
      )}

      {toolName === "web_fetch" && !!args?.url && (
        <div className="mt-1 text-[10px] font-mono text-neutral-500 truncate">
          {String(args.url)}
        </div>
      )}

      {toolName === "use_skill" && !!args?.skill_name && (
        <div className="mt-1 text-[10px] font-mono text-neutral-500 truncate">
          {String(args.skill_name)}
        </div>
      )}

      {toolName === "create_diagram" && !!args?.filename && (
        <div className="mt-1 text-[10px] font-mono text-neutral-500 truncate">
          {String(args.filename)}.dot
        </div>
      )}

      {(isDone || isError) && typedResult && (
        <div className="mt-1 text-[10px] font-mono text-neutral-500 max-h-20 overflow-hidden">
          {typedResult.error && (
            <span className="text-neutral-400">{String(typedResult.error)}</span>
          )}
          {typedResult.stdout && typedResult.stdout.length > 0 && (
            <pre className="whitespace-pre-wrap truncate">
              {String(typedResult.stdout).slice(0, 200)}
              {typedResult.stdout.length > 200 ? "..." : ""}
            </pre>
          )}
          {typedResult.content && typedResult.content.length > 0 && (
            <pre className="whitespace-pre-wrap truncate">
              {String(typedResult.content).slice(0, 200)}
              {typedResult.content.length > 200 ? "..." : ""}
            </pre>
          )}
          {typedResult.outputPath && (
            <span className="text-white">{typedResult.outputPath}</span>
          )}
          {typedResult.files && (
            <span>
              {typedResult.files.length} files, {typedResult.directories?.length || 0} dirs
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface ChatMessagesProps {
  messages: UIMessage[];
  status: string;
  error?: Error;
}

export function ChatMessages({ messages, status, error }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const welcomeMessage =
    "SYSTEM INITIALIZED. Ready to assist with file operations, command execution, and data analysis.";

  const displayMessages =
    messages.length === 0
      ? [
          {
            id: "welcome",
            role: "assistant" as const,
            parts: [{ type: "text" as const, text: welcomeMessage }],
          } as UIMessage,
        ]
      : messages;

  return (
    <div className="flex-1 overflow-auto space-y-2 mb-2">
      {displayMessages.map((msg) => {
        const orderedParts = getOrderedParts(msg);

        return (
          <div key={msg.id}>
            {orderedParts.map((group, idx) => {
              if (group.kind === "text" && group.content) {
                return (
                  <div
                    key={`${msg.id}-text-${idx}`}
                    className={cn(
                      "text-xs font-mono p-2 rounded",
                      msg.role === "user"
                        ? "bg-white/5 text-white ml-4"
                        : "bg-neutral-900 text-neutral-300"
                    )}
                  >
                    <span className="text-[9px] text-neutral-600 mr-2">
                      [{msg.role === "user" ? "USER" : "SYS"}]
                    </span>
                    {msg.role === "assistant" ? (
                      <span className="whitespace-pre-wrap prose prose-invert prose-xs max-w-none [&_pre]:bg-neutral-800 [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-[10px] [&_code]:text-white [&_code]:text-[10px] [&_a]:text-neutral-300 [&_a]:underline">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{group.content}</ReactMarkdown>
                      </span>
                    ) : (
                      <span className="whitespace-pre-wrap">{group.content}</span>
                    )}
                  </div>
                );
              }
              if (group.kind === "tool") {
                return (
                  <div key={group.invocation.toolCallId} className="ml-2 my-1">
                    <SkillBadge toolName={group.invocation.toolName} />
                    <ToolInvocationDisplay toolInvocation={group.invocation} />
                  </div>
                );
              }
              return null;
            })}
          </div>
        );
      })}

      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1]?.role === "user" && (
          <div className="text-xs font-mono p-2 rounded bg-neutral-900 text-neutral-400">
            <span className="text-[9px] text-neutral-600 mr-2">[SYS]</span>
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing...
            </span>
          </div>
        )}

      {error && (
        <div className="text-xs font-mono p-2 rounded bg-neutral-900 border border-neutral-700 text-neutral-300">
          <span className="text-[9px] mr-2">[ERROR]</span>
          {String(error.message || error)}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
