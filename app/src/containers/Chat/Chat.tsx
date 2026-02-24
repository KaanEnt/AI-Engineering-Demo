"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, PlusIcon, Minimize2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "./ChatState";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

function CreateCorners({ children }: { children: React.ReactNode }) {
  const positions = [
    "top-0 -left-3",
    "top-0 -right-3",
    "bottom-0 -left-3",
    "bottom-0 -right-3",
  ];

  return (
    <div className="absolute z-10 inset-0 pointer-events-none">
      {positions.map((pos, index) => (
        <section key={index} className={`absolute ${pos}`}>
          {children}
        </section>
      ))}
    </div>
  );
}

const COLLAPSED_HEIGHT = 48;
const EXPANDED_HEIGHT = 400;

export function Chat() {
  const isOpen = useChatStore((s) => s.isOpen);
  const setOpen = useChatStore((s) => s.setOpen);
  const toggleOpen = useChatStore((s) => s.toggleOpen);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    sendMessage,
    status,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue;
    setInputValue("");
    sendMessage({
      role: "user",
      parts: [{ type: "text", text }],
    });
  };

  return (
    <div className="chatbar-root fixed bottom-0 left-0 right-0 z-50">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="expanded"
            className="chat-bar-expanded"
            initial={{ height: COLLAPSED_HEIGHT, opacity: 0.8 }}
            animate={{ height: EXPANDED_HEIGHT, opacity: 1 }}
            exit={{ height: COLLAPSED_HEIGHT, opacity: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="h-full bg-black border-t border-neutral-700 overflow-hidden relative">
              <CreateCorners>
                <PlusIcon className="w-4 h-4 text-neutral-600" />
              </CreateCorners>

              {/* Grid background */}
              <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, white 1px, transparent 1px),
                    linear-gradient(to bottom, white 1px, transparent 1px)
                  `,
                  backgroundSize: "24px 24px",
                }}
              />

              <div className="relative z-10 h-full flex flex-col p-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-700">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span>Agent Terminal</span>
                    {isLoading && (
                      <Loader2 className="w-3 h-3 animate-spin ml-2 text-neutral-400" />
                    )}
                  </h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 hover:bg-neutral-800 rounded transition-colors"
                    aria-label="Minimize chat"
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                </div>

                {/* Messages */}
                <ChatMessages messages={messages} status={status} error={error} />

                {/* Input */}
                <ChatInput
                  input={inputValue}
                  setInput={setInputValue}
                  onSend={handleSend}
                  isLoading={isLoading}
                />

                {/* Status bar */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                    Status:{" "}
                    {isLoading ? (
                      <span className="text-neutral-300">Processing...</span>
                    ) : error ? (
                      <span className="text-neutral-300">Error</span>
                    ) : (
                      <span className="text-white border border-neutral-600 px-1">
                        Ready
                      </span>
                    )}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                    AGENT_MODE
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="h-12 bg-black border-t border-neutral-700 cursor-pointer hover:border-neutral-500 transition-colors relative overflow-hidden"
              onClick={toggleOpen}
              role="button"
              tabIndex={0}
              aria-label="Open agent terminal"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleOpen();
              }}
            >
              <CreateCorners>
                <PlusIcon className="w-3 h-3 text-neutral-700" />
              </CreateCorners>
              <div className="h-full flex items-center justify-center gap-3 p-3 relative z-10">
                <Terminal className="w-4 h-4 text-white" />
                <span className="text-xs font-mono text-neutral-400">
                  Click to open agent terminal...
                </span>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
