"use client";

import { useCallback, useRef, useState } from "react";
import { MAX_HISTORY, MAX_INPUT_LENGTH } from "./config";
import { useI18n } from "./i18n";

export type ChatMessage =
  | { id: number; kind: "greeting" }
  | { id: number; kind: "user"; text: string }
  | { id: number; kind: "ai"; text: string; tools: string[]; notes: string[]; loading: boolean }
  | { id: number; kind: "error"; message: string; requestId?: string; retryable: boolean };

type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;
type NewMessage = DistributiveOmit<ChatMessage, "id">;

type HistoryItem = { role: "user" | "model"; text: string };

// 再試行しても結果が変わらないエラーには再試行ボタンを出さない
const NO_RETRY_CODES = ["region_unavailable", "input_too_long", "invalid_input"];

// SSE のテキストを {event, data} に分解する（fetch のストリームを読むため EventSource は使わない）
function parseSSE(block: string): { event: string; data: Record<string, any> } {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trim());
  }
  return { event, data: data.length ? JSON.parse(data.join("\n")) : {} };
}

/** AIチャットの会話。履歴はここ（ブラウザ）で保持し、毎回サーバーへ送る（サーバーはステートレス） */
export function useChat() {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 0, kind: "greeting" }]);
  const [busy, setBusy] = useState(false);
  const history = useRef<HistoryItem[]>([]);
  const nextId = useRef(1);
  const busyRef = useRef(false);
  const langRef = useRef(lang);
  langRef.current = lang;

  const add = useCallback((message: NewMessage) => {
    const id = nextId.current++;
    setMessages((prev) => [...prev, { ...message, id } as ChatMessage]);
    return id;
  }, []);

  const patch = useCallback((id: number, fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
  }, []);

  const remove = useCallback((id: number) => setMessages((prev) => prev.filter((m) => m.id !== id)), []);

  const requestReply = useCallback(async () => {
    busyRef.current = true;
    setBusy(true);
    const aiId = add({ kind: "ai", text: "", tools: [], notes: [], loading: true });
    let answer = "";
    let finished = false;

    const fail = (message: string, requestId?: string, code?: string) => {
      remove(aiId);
      add({ kind: "error", message, requestId, retryable: !NO_RETRY_CODES.includes(code ?? "") });
      finished = true;
    };

    const handle = ({ event, data }: { event: string; data: Record<string, any> }) => {
      if (event === "tool") {
        patch(aiId, (m) => (m.kind === "ai" ? { ...m, tools: [...m.tools, data.name] } : m));
      } else if (event === "delta") {
        answer += data.text;
        const text = answer;
        patch(aiId, (m) => (m.kind === "ai" ? { ...m, text, loading: false } : m));
      } else if (event === "notice") {
        patch(aiId, (m) => (m.kind === "ai" ? { ...m, notes: [...m.notes, data.code] } : m));
      } else if (event === "done") {
        history.current.push({ role: "model", text: answer });
        finished = true;
      } else if (event === "error") {
        fail(t(`error.${data.code || "llm_error"}`), data.request_id, data.code);
      }
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.current.slice(-MAX_HISTORY), lang: langRef.current }),
      });
      if (!res.ok || !(res.headers.get("content-type") || "").includes("text/event-stream")) {
        // 入力エラーなどはストリーム開始前に JSON で返る。表示文言は code から現在の言語で選ぶ
        const data = await res.json().catch(() => ({}));
        fail(t(`error.${data.code || "llm_error"}`, { max: MAX_INPUT_LENGTH }), undefined, data.code);
        return;
      }
      const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let index: number;
        while (!finished && (index = buffer.indexOf("\n\n")) !== -1) {
          handle(parseSSE(buffer.slice(0, index)));
          buffer = buffer.slice(index + 2);
        }
      }
      // done / error が届かずに切れた場合（関数のタイムアウトなど）
      if (!finished) fail(t("error.network"));
    } catch {
      if (!finished) fail(t("error.network"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [add, patch, remove, t]);

  const send = useCallback(
    (text: string): boolean => {
      const trimmed = text.trim();
      if (!trimmed || busyRef.current) return false;
      if (trimmed.length > MAX_INPUT_LENGTH) {
        add({ kind: "error", message: t("chat.tooLong", { max: MAX_INPUT_LENGTH }), retryable: false });
        return false;
      }
      history.current.push({ role: "user", text: trimmed });
      add({ kind: "user", text: trimmed });
      void requestReply();
      return true;
    },
    [add, requestReply, t]
  );

  const retry = useCallback(
    (errorId: number) => {
      remove(errorId);
      void requestReply();
    },
    [remove, requestReply]
  );

  return { messages, busy, send, retry, hasHistory: history.current.length > 0 };
}
