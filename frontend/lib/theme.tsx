"use client";

import { LOADER_START_EVENT } from "@/components/Loader";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "wa" | "normal" | "pop";
export const THEMES: Theme[] = ["wa", "normal", "pop"];
const STORAGE_KEY = "theme";

type ThemeValue = { theme: Theme; setTheme: (next: Theme) => void };
const Context = createContext<ThemeValue | null>(null);

// 初期状態は layout.tsx の <head> 内のインラインスクリプトで <html data-theme> に反映済み（表示のちらつきを避けるため）。
// 保存されていないときは、メインの「和」デザイン
function readTheme(): Theme {
  const current = document.documentElement.dataset.theme as Theme | undefined;
  return current && THEMES.includes(current) ? current : "wa";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("wa");

  useEffect(() => {
    setThemeState(readTheme());
  }, []);

  useEffect(() => {
    const favicon = document.getElementById("favicon") as HTMLLinkElement | null;
    if (favicon) favicon.href = theme === "pop" ? "/favicon-pop.svg" : theme === "normal" ? "/favicon.svg" : "/favicon-wa.svg";
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    if (readTheme() === next) return;
    // 切り替えのたびに、ローディングを出してページを先頭から見せ直す（動きを減らす設定の人は、先頭に戻すだけ）。
    // 合図を先に送り、同じ処理の中でデザインも切り替えるので、ローディングは切り替え後のデザインで出る
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, 0);
    } else {
      window.dispatchEvent(new Event(LOADER_START_EVENT));
    }
    // URL に #architecture などが付いていると先頭に戻らないので、外す
    history.replaceState(null, "", window.location.pathname + window.location.search);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
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
