"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChatStore } from "./ChatState";

export function ChatInput() {
  const draft = useChatStore((s) => s.draft);
  const setDraft = useChatStore((s) => s.setDraft);
  const addMessage = useChatStore((s) => s.addMessage);

  const send = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    addMessage("user", trimmed);
    setDraft("");

    // Simulate assistant response
    setTimeout(() => {
      addMessage(
        "assistant",
        "Thanks for your message! This is a demo response."
      );
    }, 800);
  }, [draft, addMessage, setDraft]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex items-center gap-2 border-t border-border p-3">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="h-9 text-sm"
        aria-label="Chat message input"
      />
      <Button
        onClick={send}
        size="sm"
        disabled={!draft.trim()}
        className="h-9 px-3 shrink-0"
      >
        Send
      </Button>
    </div>
  );
}
