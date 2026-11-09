"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MESSAGES, type Lang, type MessageKey } from "./messages";
import type { Localized } from "./config";

const STORAGE_KEY = "lang";
const SUPPORTED: Lang[] = ["ja", "en"];

type Vars = Record<string, string | number>;

type I18n = {
  lang: Lang;
  setLang: (next: Lang) => void;
  /** 固定の文言（{name} の形のプレースホルダーを vars で置き換える） */
  t: (key: MessageKey | (string & {}), vars?: Vars) => string;
  /** { ja, en } 形式の値から現在の言語を選ぶ */
  pick: (value: Localized) => string;
};

const Context = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // 初回の描画は英語。保存済みの言語があればマウント後に切り替える（静的書き出しでも表示がずれないように）
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && SUPPORTED.includes(saved)) setLangState(saved);
    } catch {
      // localStorage が使えない環境では英語のまま
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = MESSAGES[lang]["meta.title"];
    document.querySelector('meta[name="description"]')?.setAttribute("content", MESSAGES[lang]["meta.description"]);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 保存できなくても切り替え自体は行う
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const t: I18n["t"] = (key, vars) => {
      const table = MESSAGES[lang] as Record<string, string>;
      let text = table[key] ?? (MESSAGES.ja as Record<string, string>)[key] ?? key;
      for (const [name, v] of Object.entries(vars ?? {})) text = text.replaceAll(`{${name}}`, String(v));
      return text;
    };
    const pick: I18n["pick"] = (v) => v[lang] ?? v.ja;
    return { lang, setLang, t, pick };
  }, [lang, setLang]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
