// AIチャットUI。会話履歴はこのファイル内で保持し、毎回サーバーへ送る（サーバーはステートレス）
(function () {
  "use strict";

  const { SAMPLE_QUESTIONS, MAX_INPUT_LENGTH, MAX_HISTORY } = window.SITE_CONFIG;
  const { t, pick } = window.I18N;
  const API_URL = "/api/chat";

  const log = document.getElementById("chat-log");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const counter = document.getElementById("chat-counter");
  const chips = document.getElementById("chat-chips");

  /** @type {{role: "user" | "model", text: string}[]} */
  const history = [];
  let busy = false;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function scrollToBottom() {
    log.scrollTop = log.scrollHeight;
  }

  // AI出力を含め、本文はすべて textContent で描画する（XSS対策）
  function addMessage(role, text) {
    const msg = el("div", `msg msg-${role === "user" ? "user" : "ai"}`);
    msg.append(el("div", "bubble", text));
    log.append(msg);
    scrollToBottom();
    return msg;
  }

  function addLoading() {
    const msg = el("div", "msg msg-ai");
    const loading = el("div", "loading");
    const dots = el("span", "dots");
    dots.append(el("span"), el("span"), el("span"));
    loading.append(dots, el("span", "", t("chat.loading")));
    msg.append(loading);
    log.append(msg);
    scrollToBottom();
    return msg;
  }

  function addError(message, onRetry) {
    const msg = el("div", "msg msg-ai msg-error");
    msg.append(el("div", "bubble", message));
    if (onRetry) {
      const actions = el("div", "msg-actions");
      const retry = el("button", "btn btn-ghost", t("chat.retry"));
      retry.type = "button";
      retry.addEventListener("click", () => {
        msg.remove();
        onRetry();
      });
      actions.append(retry);
      msg.append(actions);
    }
    log.append(msg);
    scrollToBottom();
  }

  function setBusy(value) {
    busy = value;
    sendBtn.disabled = value;
    for (const chip of chips.querySelectorAll("button")) chip.disabled = value;
  }

  function updateCounter() {
    counter.textContent = `${input.value.length} / ${MAX_INPUT_LENGTH}`;
  }

  async function requestReply() {
    setBusy(true);
    const loading = addLoading();
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-MAX_HISTORY), lang: window.I18N.lang }),
      });
      const data = await res.json().catch(() => ({}));
      loading.remove();
      if (!res.ok) {
        // サーバーはエラーの code を返すので、表示文言は現在の言語で選ぶ
        addError(t(`error.${data.code || "llm_error"}`, { max: MAX_INPUT_LENGTH }), requestReply);
        return;
      }
      history.push({ role: "model", text: data.reply });
      addMessage("model", data.reply);
    } catch (err) {
      loading.remove();
      addError(t("error.network"), requestReply);
    } finally {
      setBusy(false);
    }
  }

  function send(text) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (trimmed.length > MAX_INPUT_LENGTH) {
      addError(t("chat.tooLong", { max: MAX_INPUT_LENGTH }));
      return;
    }
    history.push({ role: "user", text: trimmed });
    addMessage("user", trimmed);
    input.value = "";
    updateCounter();
    requestReply();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    send(input.value);
  });

  // Enterで送信、Shift+Enterで改行（IME変換中は送信しない）
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send(input.value);
    }
  });

  input.addEventListener("input", updateCounter);

  function renderChips() {
    chips.replaceChildren();
    for (const q of pick(SAMPLE_QUESTIONS)) {
      const chip = el("button", "chip", q);
      chip.type = "button";
      chip.disabled = busy;
      chip.addEventListener("click", () => send(q));
      chips.append(chip);
    }
  }

  renderChips();
  const greeting = addMessage("model", t("chat.greeting"));

  // 言語切り替え時: チップを差し替え、会話が始まる前なら挨拶も切り替える
  // （以降の回答はリクエストの lang に従って AI がその言語で答える）
  window.I18N.onChange(() => {
    renderChips();
    if (history.length === 0) greeting.querySelector(".bubble").textContent = t("chat.greeting");
  });
})();
