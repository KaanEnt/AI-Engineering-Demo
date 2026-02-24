"use client";

import { useRef, useEffect } from "react";
import { Send, Terminal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export function ChatInput({ input, setInput, onSend, isLoading }: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSend();
      }
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1 group">
        <div className="absolute left-3 top-2.5 text-neutral-600 group-focus-within:text-white transition-colors">
          <Terminal size={12} />
        </div>
        <textarea
          ref={inputRef}
          rows={1}
          autoComplete="off"
          placeholder="ENTER QUERY >>"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className={cn(
            "w-full bg-neutral-900 border border-neutral-700 border-dashed rounded-none min-h-[32px] max-h-[120px] resize-none",
            "font-mono text-[10px] p-2 pl-8 outline-none transition-all text-white",
            "placeholder:text-neutral-600",
            "focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>
      <button
        type="button"
        onClick={onSend}
        disabled={isLoading || !input.trim()}
        className={cn(
          "px-4 h-8 border border-neutral-700 bg-black text-neutral-400 font-bold uppercase text-[9px] tracking-[0.15em] border-dashed transition-all flex items-center justify-center gap-1.5 rounded-none self-end",
          !isLoading &&
            input.trim() &&
            "hover:border-white hover:text-white hover:bg-neutral-900 active:scale-95",
          (isLoading || !input.trim()) && "opacity-40 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <Loader2 size={10} className="animate-spin" />
        ) : (
          <Send size={10} />
        )}
        <span>{isLoading ? "..." : "SEND"}</span>
      </button>
    </div>
  );
}
