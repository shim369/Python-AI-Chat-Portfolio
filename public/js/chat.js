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

  function createLoading() {
    const loading = el("div", "loading");
    const dots = el("span", "dots");
    dots.append(el("span"), el("span"), el("span"));
    loading.append(dots, el("span", "", t("chat.loading")));
    return loading;
  }

  function addError(message, onRetry, requestId) {
    const msg = el("div", "msg msg-ai msg-error");
    msg.append(el("div", "bubble", message));
    // サーバーログ (request_id) と突き合わせられるよう、エラーIDを小さく表示する
    if (requestId) msg.append(el("div", "msg-note", t("error.requestId", { id: requestId })));
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

  // SSE のテキストを {event, data} に分解する（fetch のストリームを読むため EventSource は使わない）
  function parseSSE(block) {
    let event = "message";
    const data = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trim());
    }
    return { event, data: data.length ? JSON.parse(data.join("\n")) : {} };
  }

  async function requestReply() {
    setBusy(true);
    // AI の吹き出し: ツールバッジ → 回答（届くまではローディング表示）
    const msg = el("div", "msg msg-ai");
    const badges = el("div", "tool-badges");
    const loading = createLoading();
    msg.append(badges, loading);
    log.append(msg);
    scrollToBottom();

    let bubble = null;
    let answer = "";
    let finished = false;

    const fail = (message, requestId) => {
      msg.remove();
      addError(message, requestReply, requestId);
      finished = true;
    };

    const handle = ({ event, data }) => {
      if (event === "tool") {
        badges.append(el("span", "tool-badge", t("chat.toolRun", { name: data.name })));
      } else if (event === "delta") {
        if (!bubble) {
          loading.remove();
          bubble = el("div", "bubble");
          msg.append(bubble);
        }
        answer += data.text;
        bubble.textContent = answer;
      } else if (event === "notice") {
        msg.append(el("div", "msg-note", t(`chat.notice.${data.code}`)));
      } else if (event === "done") {
        history.push({ role: "model", text: answer });
        finished = true;
      } else if (event === "error") {
        fail(t(`error.${data.code || "llm_error"}`), data.request_id);
      }
      scrollToBottom();
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-MAX_HISTORY), lang: window.I18N.lang }),
      });
      if (!res.ok || !(res.headers.get("content-type") || "").includes("text/event-stream")) {
        // 入力エラーなどはストリーム開始前に JSON で返る。表示文言は code から現在の言語で選ぶ
        const data = await res.json().catch(() => ({}));
        fail(t(`error.${data.code || "llm_error"}`, { max: MAX_INPUT_LENGTH }));
        return;
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let index;
        while (!finished && (index = buffer.indexOf("\n\n")) !== -1) {
          handle(parseSSE(buffer.slice(0, index)));
          buffer = buffer.slice(index + 2);
        }
      }
      // done / error が届かずに切れた場合（関数のタイムアウトなど）
      if (!finished) fail(t("error.network"));
    } catch (err) {
      if (!finished) fail(t("error.network"));
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
