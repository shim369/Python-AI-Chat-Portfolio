"use client";

import { createContext, useContext, useRef, type MutableRefObject, type ReactNode } from "react";

// ヒーローやフッターの「AIに質問する」ボタンから、チャットパネルを開くための橋渡し
const Context = createContext<MutableRefObject<(() => void) | null> | null>(null);

export function ChatUIProvider({ children }: { children: ReactNode }) {
  const opener = useRef<(() => void) | null>(null);
  return <Context.Provider value={opener}>{children}</Context.Provider>;
}

export function useChatOpener() {
  const ref = useContext(Context);
  if (!ref) throw new Error("useChatOpener must be used inside ChatUIProvider");
  return { open: () => ref.current?.(), register: (fn: (() => void) | null) => void (ref.current = fn) };
}
