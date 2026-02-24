import { create } from "zustand";

interface ChatState {
  isOpen: boolean;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
}));
