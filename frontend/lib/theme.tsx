"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "normal" | "pop";
const STORAGE_KEY = "theme";

type ThemeValue = { theme: Theme; setTheme: (next: Theme) => void };
const Context = createContext<ThemeValue | null>(null);

// 初期状態は layout.tsx の <head> 内のインラインスクリプトで <html data-theme> に反映済み（表示のちらつきを避けるため）
function readTheme(): Theme {
  return document.documentElement.dataset.theme === "pop" ? "pop" : "normal";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("normal");

  useEffect(() => {
    setThemeState(readTheme());
  }, []);

  useEffect(() => {
    const favicon = document.getElementById("favicon") as HTMLLinkElement | null;
    if (favicon) favicon.href = theme === "pop" ? "/favicon-pop.svg" : "/favicon.svg";
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    if (next === "pop") document.documentElement.dataset.theme = "pop";
    else delete document.documentElement.dataset.theme;
    try {
      if (next === "pop") localStorage.setItem(STORAGE_KEY, "pop");
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage が使えない環境では、このページを開いている間だけ切り替わる
    }
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
