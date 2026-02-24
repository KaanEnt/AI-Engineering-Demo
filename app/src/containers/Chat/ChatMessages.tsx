"use client";

import { useRef, useEffect } from "react";
import type { UIMessage } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Wrench, Globe, FileText, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { SKILL_META } from "./skillMeta";

interface ToolInvocationData {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

function getMessageContent(message: UIMessage): string {
  if (!message.parts) return "";
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function getToolInvocations(message: UIMessage): ToolInvocationData[] {
  if (!message.parts) return [];

  const invocations: ToolInvocationData[] = [];

  for (const part of message.parts) {
    if (part.type.startsWith("tool-")) {
      const toolPart = part as unknown as {
        type: string;
        toolCallId: string;
        toolName: string;
        args?: Record<string, unknown>;
        input?: unknown;
        output?: unknown;
        state: string;
      };

      invocations.push({
        toolCallId: toolPart.toolCallId,
        toolName: toolPart.toolName,
        args: toolPart.args || (toolPart.input as Record<string, unknown>) || {},
        state: toolPart.state,
        result: toolPart.output,
      });
    }
  }

  return invocations;
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
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-mono uppercase tracking-wide mb-1",
        colorMap[meta.color]
      )}
    >
      <Icon size={10} />
      <span>{meta.name}</span>
    </div>
  );
}

function ToolInvocationDisplay({ toolInvocation }: { toolInvocation: ToolInvocationData }) {
  const { toolName, args, state, result } = toolInvocation;

  const getStatusColor = () => {
    switch (state) {
      case "partial-call":
      case "call":
        return "text-yellow-500";
      case "result":
        return (result as { success?: boolean })?.success
          ? "text-green-500"
          : "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = () => {
    if (state === "partial-call" || state === "call") {
      return <Loader2 className="w-3 h-3 animate-spin" />;
    }
    return <Wrench className="w-3 h-3" />;
  };

  const typedResult = result as {
    success?: boolean;
    error?: string;
    stdout?: string;
    content?: string;
    files?: string[];
    directories?: string[];
    outputPath?: string;
  } | undefined;

  return (
    <div className="my-1 p-2 rounded bg-muted/20 border border-dashed border-muted-foreground/30">
      <div
        className={cn(
          "flex items-center gap-2 text-[9px] font-mono uppercase",
          getStatusColor()
        )}
      >
        {getStatusIcon()}
        <span>{toolName}</span>
        <span className="text-muted-foreground/60">
          {state === "result" ? "completed" : "executing..."}
        </span>
      </div>

      {toolName === "run_command" && !!args?.command && (
        <div className="mt-1 text-[10px] font-mono text-muted-foreground/80 truncate">
          $ {String(args.command)}
        </div>
      )}

      {(toolName === "read_file" ||
        toolName === "write_file" ||
        toolName === "list_directory") &&
        !!args?.path && (
          <div className="mt-1 text-[10px] font-mono text-muted-foreground/80 truncate">
            {String(args.path)}
          </div>
        )}

      {toolName === "scrape_devpost" && !!args?.gallery_url && (
        <div className="mt-1 text-[10px] font-mono text-muted-foreground/80 truncate">
          {String(args.gallery_url)}
        </div>
      )}

      {toolName === "extract_document" && !!args?.file_path && (
        <div className="mt-1 text-[10px] font-mono text-muted-foreground/80 truncate">
          {String(args.file_path)}
        </div>
      )}

      {toolName === "create_diagram" && !!args?.filename && (
        <div className="mt-1 text-[10px] font-mono text-muted-foreground/80 truncate">
          {String(args.filename)}.dot
        </div>
      )}

      {state === "result" && typedResult && (
        <div className="mt-1 text-[10px] font-mono text-muted-foreground/60 max-h-20 overflow-hidden">
          {typedResult.error && (
            <span className="text-red-400">{String(typedResult.error)}</span>
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
            <span className="text-emerald-400">{typedResult.outputPath}</span>
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
        const content = getMessageContent(msg);
        const toolInvocations = getToolInvocations(msg);

        return (
          <div key={msg.id}>
            {content && (
              <div
                className={cn(
                  "text-xs font-mono p-2 rounded",
                  msg.role === "user"
                    ? "bg-cyan-500/10 text-cyan-300 ml-4"
                    : "bg-muted/30 text-muted-foreground"
                )}
              >
                <span className="text-[9px] text-muted-foreground/60 mr-2">
                  [{msg.role === "user" ? "USER" : "SYS"}]
                </span>
                {msg.role === "assistant" ? (
                  <span className="whitespace-pre-wrap prose prose-invert prose-xs max-w-none [&_pre]:bg-muted/40 [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-[10px] [&_code]:text-cyan-300 [&_code]:text-[10px] [&_a]:text-cyan-400 [&_a]:underline">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  </span>
                ) : (
                  <span className="whitespace-pre-wrap">{content}</span>
                )}
              </div>
            )}

            {toolInvocations.length > 0 && (
              <div className="ml-2 mt-1">
                {toolInvocations.map((toolInvocation) => (
                  <div key={toolInvocation.toolCallId}>
                    <SkillBadge toolName={toolInvocation.toolName} />
                    <ToolInvocationDisplay toolInvocation={toolInvocation} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1]?.role === "user" && (
          <div className="text-xs font-mono p-2 rounded bg-muted/30 text-muted-foreground">
            <span className="text-[9px] text-muted-foreground/60 mr-2">[SYS]</span>
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing...
            </span>
          </div>
        )}

      {error && (
        <div className="text-xs font-mono p-2 rounded bg-red-500/10 text-red-400">
          <span className="text-[9px] mr-2">[ERROR]</span>
          {String(error.message || error)}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
