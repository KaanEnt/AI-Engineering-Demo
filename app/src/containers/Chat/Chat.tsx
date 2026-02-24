"use client";

import { useEffect, useCallback } from "react";
import { useChatStore } from "./ChatState";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

export function Chat() {
  const isOpen = useChatStore((s) => s.isOpen);
  const toggleOpen = useChatStore((s) => s.toggleOpen);
  const setOpen = useChatStore((s) => s.setOpen);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setOpen(false);
      }
    },
    [isOpen, setOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      <div
        className={`flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all duration-200 ease-out ${
          isOpen
            ? "h-[420px] w-[360px] opacity-100 translate-y-0"
            : "h-0 w-[360px] opacity-0 translate-y-2 pointer-events-none"
        }`}
        role="dialog"
        aria-label="Chat window"
        aria-hidden={!isOpen}
      >
        {/* Panel header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold">Chat</span>
          <button
            onClick={() => setOpen(false)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close chat"
          >
            &times;
          </button>
        </div>

        {/* Messages */}
        <ChatMessages />

        {/* Input */}
        <ChatInput />
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
}
