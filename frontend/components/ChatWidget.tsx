"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { MAX_INPUT_LENGTH, SAMPLE_QUESTIONS } from "@/lib/config";
import { useChatOpener } from "@/lib/chat-ui";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useChat } from "@/lib/useChat";

/** AIチャット。画面右下のボタンで開閉する。Pop ではヒーロー内の枠（#pop-chat-slot）に常時表示する */
export default function ChatWidget() {
  const { t, lang } = useI18n();
  const { theme } = useTheme();
  const { register } = useChatOpener();
  const { messages, busy, send, retry } = useChat();
  const isPop = theme === "pop";

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [widgetEl, setWidgetEl] = useState<HTMLDivElement | null>(null);
  const [slotEl, setSlotEl] = useState<HTMLElement | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setSlotEl(document.getElementById("pop-chat-slot")), []);

  // Pop のときは、パネルを普段ヒーロー内の枠に常時表示する（ヒーローを抜けたら右下のボタンで浮かせて開く）
  const inSlot = isPop && slotEl !== null && !open;
  const portalTarget = inSlot ? slotEl : widgetEl;
  const visible = inSlot || open;

  // 閉じた状態の Pop パネルには、開いた状態を引きずらない
  useEffect(() => {
    if (!isPop) return;
    setOpen(false);
  }, [isPop]);

  useEffect(() => {
    document.body.classList.toggle("chat-open", open);
    return () => document.body.classList.remove("chat-open");
  }, [open]);

  // 右下のボタンが hero 領域に重なっている間は隠し、抜けたらふんわり表示する（CSS は body.in-hero を参照）
  useEffect(() => {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      // ボタンの位置（画面下端から約 90px）より hero の下端が上に来たら hero を抜けたとみなす
      document.body.classList.toggle("in-hero", hero.getBoundingClientRect().bottom > window.innerHeight - 90);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      document.body.classList.remove("in-hero");
    };
  }, []);

  // 会話が増えたら、常に一番下を見せる
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, visible]);

  const focusOnOpen = () => {
    // スマホではキーボードが画面を覆うため、マウス操作の環境でだけ入力欄にフォーカスする
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
    else closeRef.current?.focus();
  };

  const openChat = () => {
    if (isPop && inSlot) {
      slotEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350);
      return;
    }
    setOpen(true);
    requestAnimationFrame(focusOnOpen);
  };

  // ヒーローやフッターの「AIに質問する」ボタンから開けるようにする
  const openRef = useRef(openChat);
  openRef.current = openChat;
  useEffect(() => {
    register(() => openRef.current());
    return () => register(null);
  }, [register]);

  const close = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  const submit = () => {
    if (send(draft)) setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enterで送信、Shift+Enterで改行（IME変換中は送信しない）
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const panel = (
    <section
      className="chat-panel"
      id="chat-panel"
      role="dialog"
      aria-labelledby="chat-title"
      hidden={!visible}
      style={{ order: -1 }}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <header className="chat-header">
        <div>
          <h2 className="chat-title" id="chat-title">{t("chat.title")}</h2>
          <p className="chat-lead">{t("chat.lead")}</p>
        </div>
        <button type="button" className="chat-close" id="chat-close" ref={closeRef} aria-label={t("chat.close")} onClick={close}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      <div className="chat-log" id="chat-log" ref={logRef} aria-live="polite">
        {messages.map((m) => {
          // AI 出力を含め、本文はすべてテキストとして描画する（React が自動でエスケープする）
          if (m.kind === "greeting")
            return (
              <div key={m.id} className="msg msg-ai">
                <div className="bubble">{t("chat.greeting")}</div>
              </div>
            );
          if (m.kind === "user")
            return (
              <div key={m.id} className="msg msg-user">
                <div className="bubble">{m.text}</div>
              </div>
            );
          if (m.kind === "error")
            return (
              <div key={m.id} className="msg msg-ai msg-error">
                <div className="bubble">{m.message}</div>
                {/* サーバーログ (request_id) と突き合わせられるよう、エラーIDを小さく表示する */}
                {m.requestId && <div className="msg-note">{t("error.requestId", { id: m.requestId })}</div>}
                {m.retryable && (
                  <div className="msg-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => retry(m.id)}>
                      {t("chat.retry")}
                    </button>
                  </div>
                )}
              </div>
            );
          return (
            <div key={m.id} className="msg msg-ai">
              <div className="tool-badges">
                {m.tools.map((name, i) => (
                  <span key={i} className="tool-badge">{t("chat.toolRun", { name })}</span>
                ))}
              </div>
              {m.loading ? (
                <div className="loading">
                  <span className="dots"><span /><span /><span /></span>
                  <span>{t("chat.loading")}</span>
                </div>
              ) : (
                <div className="bubble">{m.text}</div>
              )}
              {m.notes.map((code, i) => (
                <div key={i} className="msg-note">{t(`chat.notice.${code}`)}</div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="chat-chips" id="chat-chips">
        {SAMPLE_QUESTIONS[lang].map((q) => (
          <button key={q} type="button" className="chip" disabled={busy} onClick={() => send(q)}>
            {q}
          </button>
        ))}
      </div>
      <form
        className="chat-form"
        id="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="chat-input" className="visually-hidden">{t("chat.inputLabel")}</label>
        <textarea
          id="chat-input"
          ref={inputRef}
          rows={2}
          maxLength={MAX_INPUT_LENGTH}
          placeholder={t("chat.placeholder")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className="btn btn-primary" id="chat-send" disabled={busy}>{t("chat.send")}</button>
      </form>
      <div className="chat-meta">
        <span id="chat-counter">{draft.length} / {MAX_INPUT_LENGTH}</span>
      </div>
      <p className="chat-notice">{t("chat.notice")}</p>
    </section>
  );

  return (
    <div className="chat-widget" ref={setWidgetEl}>
      {portalTarget && createPortal(panel, portalTarget)}
      <button
        type="button"
        className="chat-launcher"
        id="chat-launcher"
        ref={launcherRef}
        aria-controls="chat-panel"
        aria-expanded={open}
        onClick={() => (open ? close() : openChat())}
      >
        <svg className="icon-open" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" fill="currentColor" />
        </svg>
        <svg className="icon-close" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <span className="chat-launcher-label">{t("chat.launcher")}</span>
      </button>
    </div>
  );
}
