// AIチャットUI。会話履歴はこのファイル内で保持し、毎回サーバーへ送る（サーバーはステートレス）
(function () {
  "use strict";

  const { SAMPLE_QUESTIONS, MAX_INPUT_LENGTH, MAX_HISTORY } = window.SITE_CONFIG;
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
    loading.append(dots, el("span", "", "考え中…（初回は少し時間がかかります）"));
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
      const retry = el("button", "btn btn-ghost", "再試行");
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
        body: JSON.stringify({ messages: history.slice(-MAX_HISTORY) }),
      });
      const data = await res.json().catch(() => ({}));
      loading.remove();
      if (!res.ok) {
        addError(data.detail || "エラーが発生しました。少し待ってから再試行してください。", requestReply);
        return;
      }
      history.push({ role: "model", text: data.reply });
      addMessage("model", data.reply);
    } catch (err) {
      loading.remove();
      addError("通信エラーが発生しました。ネットワークを確認して再試行してください。", requestReply);
    } finally {
      setBusy(false);
    }
  }

  function send(text) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (trimmed.length > MAX_INPUT_LENGTH) {
      addError(`質問は${MAX_INPUT_LENGTH}文字以内で入力してください。`);
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

  for (const q of SAMPLE_QUESTIONS) {
    const chip = el("button", "chip", q);
    chip.type = "button";
    chip.addEventListener("click", () => send(q));
    chips.append(chip);
  }

  addMessage("model", "こんにちは！Shinpei Ohtani の経歴・スキル・制作物について、何でも質問してください。");
})();
