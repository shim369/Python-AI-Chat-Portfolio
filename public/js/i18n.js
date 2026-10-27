/*
 * 日本語 / 英語の切り替え。
 * - 固定の文言は data-i18n="キー" の要素に textContent で流し込む
 *   （data-i18n-placeholder / data-i18n-aria-label / data-i18n-content は各属性に流し込む）
 * - 選んだ言語は localStorage に保存（使えない環境ではブラウザの言語設定から決める）
 */
(function () {
  "use strict";

  const STORAGE_KEY = "lang";
  const SUPPORTED = ["ja", "en"];

  const MESSAGES = {
    ja: {
      "meta.title": "Shinpei Ohtani | ポートフォリオ",
      "meta.description": "Shinpei Ohtani の自己紹介ページ。経歴・スキル・制作物について AI チャットで質問できます。",
      "lang.label": "表示言語",
      "nav.skills": "スキル",
      "nav.works": "制作物",
      "nav.blog": "ブログ",
      "nav.architecture": "仕組み",
      "nav.chat": "AIチャット",
      "hero.lead": "Python・JavaScript で、Web システムの改修から AI チャットの設計・実装まで手がけるエンジニアです。",
      "hero.cta": "AIに質問する",
      "skills.title": "スキル",
      "works.title": "制作物",
      "blog.title": "ブログ",
      "blog.lead": "技術ブログ「TECH BLOG」の最新記事です（記事は英語です）。",
      "blog.loading": "記事を読み込み中…",
      "blog.error": "記事を読み込めませんでした。下のリンクからブログをご覧ください。",
      "blog.readMore": "続きを読む →",
      "blog.more": "ブログをもっと見る →",
      "arch.title": "このサイトの仕組み",
      "arch.svgTitle": "アーキテクチャ図",
      "arch.svgDesc": "ブラウザから Vercel 上の FastAPI にリクエストし、エージェントループが Gemini API とツール関数を往復して回答を返す構成",
      "arch.cdn": "CDN: public/ 静的配信",
      "arch.loop": "/api/chat ・ エージェントループ",
      "arch.ops": "構造化ログ ・ レート制限",
      "arch.note1.title": "フロントはビルド不要",
      "arch.note1.body": "：HTML/CSS/バニラJSをCDNから配信し、構成をシンプルに保っています。",
      "arch.note2.title": "サーバーはステートレス",
      "arch.note2.body": "：会話履歴はブラウザ側で保持して毎回送信するので、サーバーレス環境でもスケールします。",
      "arch.note3.title": "エージェントループを手書き",
      "arch.note3.body": "：Gemini の function calling の自動実行は使わず、ツール呼び出しと結果の返却を明示的に繰り返しています。",
      "arch.note4.title": "LLM呼び出しを1モジュールに分離",
      "arch.note4.body": "：プロバイダを差し替えやすく、テストではモックに置き換えられます。",
      "chat.title": "AIチャット",
      "chat.lead": "私の経歴・スキル・制作物について、AI に気軽に質問してください。",
      "chat.inputLabel": "質問を入力",
      "chat.placeholder": "質問を入力（Enterで送信 / Shift+Enterで改行）",
      "chat.send": "送信",
      "chat.notice": "入力内容はAIサービス提供元で処理されます。個人情報は入力しないでください。AIの回答は誤りを含む場合があります。",
      "chat.greeting": "こんにちは！Shinpei Ohtani の経歴・スキル・制作物について、何でも質問してください。",
      "chat.loading": "考え中…（初回は少し時間がかかります）",
      "chat.retry": "再試行",
      "chat.tooLong": "質問は{max}文字以内で入力してください。",
      "error.network": "通信エラーが発生しました。ネットワークを確認して再試行してください。",
      "error.llm_error": "AIの応答取得中にエラーが発生しました。少し待ってから再試行してください。",
      "error.rate_limited": "現在アクセスが集中しています。少し待ってから再試行してください。",
      "error.timeout": "AIの応答に時間がかかりすぎたため中断しました。再試行してください。",
      "error.config_error": "AIチャットは現在利用できません（サーバー設定エラー）。",
      "error.input_too_long": "質問は{max}文字以内で入力してください。",
      "error.invalid_input": "入力内容が正しくありません。",
      "footer.contact": "連絡先：",
      "footer.contactPlaceholder": "（連絡先は準備中です）",
      "footer.source": "このサイトのソースコード (GitHub)",
    },
    en: {
      "meta.title": "Shinpei Ohtani | Portfolio",
      "meta.description": "Portfolio of Shinpei Ohtani. Ask the AI chat about his background, skills, and projects.",
      "lang.label": "Language",
      "nav.skills": "Skills",
      "nav.works": "Works",
      "nav.blog": "Blog",
      "nav.architecture": "Architecture",
      "nav.chat": "AI Chat",
      "hero.lead": "An engineer working across Python and JavaScript, from maintaining web systems to designing and building AI chat applications.",
      "hero.cta": "Ask the AI",
      "skills.title": "Skills",
      "works.title": "Works",
      "blog.title": "Blog",
      "blog.lead": "Latest posts from my tech blog, TECH BLOG.",
      "blog.loading": "Loading posts…",
      "blog.error": "Could not load posts. Please visit the blog using the link below.",
      "blog.readMore": "Read more →",
      "blog.more": "See more on the blog →",
      "arch.title": "How This Site Works",
      "arch.svgTitle": "Architecture diagram",
      "arch.svgDesc": "The browser calls FastAPI on Vercel, where an agent loop goes back and forth between the Gemini API and tool functions to build an answer.",
      "arch.cdn": "CDN: static files in public/",
      "arch.loop": "/api/chat · agent loop",
      "arch.ops": "structured logs · rate limiting",
      "arch.note1.title": "No build step for the frontend",
      "arch.note1.body": ": plain HTML/CSS/JavaScript served from the CDN keeps the stack simple.",
      "arch.note2.title": "Stateless server",
      "arch.note2.body": ": the browser keeps the conversation and sends it with each request, so it scales in a serverless environment.",
      "arch.note3.title": "Hand-written agent loop",
      "arch.note3.body": ": instead of Gemini's automatic function calling, tool calls and their results are handled explicitly in a loop.",
      "arch.note4.title": "LLM calls isolated in one module",
      "arch.note4.body": ": the provider is easy to swap, and tests replace it with a mock.",
      "chat.title": "AI Chat",
      "chat.lead": "Feel free to ask the AI about my background, skills, and projects.",
      "chat.inputLabel": "Your question",
      "chat.placeholder": "Ask a question (Enter to send / Shift+Enter for a new line)",
      "chat.send": "Send",
      "chat.notice": "Your input is processed by the AI service provider. Please do not enter personal information. AI answers may contain mistakes.",
      "chat.greeting": "Hi! Ask me anything about Shinpei Ohtani's background, skills, and projects.",
      "chat.loading": "Thinking… (the first reply may take a moment)",
      "chat.retry": "Retry",
      "chat.tooLong": "Please keep your question within {max} characters.",
      "error.network": "A network error occurred. Please check your connection and try again.",
      "error.llm_error": "Something went wrong while getting the AI response. Please wait a moment and try again.",
      "error.rate_limited": "The service is busy right now. Please wait a moment and try again.",
      "error.timeout": "The AI took too long to respond, so the request was stopped. Please try again.",
      "error.config_error": "The AI chat is currently unavailable (server configuration error).",
      "error.input_too_long": "Please keep your question within {max} characters.",
      "error.invalid_input": "The input is not valid.",
      "footer.contact": "Contact: ",
      "footer.contactPlaceholder": "(coming soon)",
      "footer.source": "Source code of this site (GitHub)",
    },
  };

  function initialLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED.includes(saved)) return saved;
    } catch {
      // localStorage が使えない環境ではブラウザの設定にフォールバック
    }
    return (navigator.language || "").toLowerCase().startsWith("ja") ? "ja" : "en";
  }

  let lang = initialLang();
  const listeners = [];

  function t(key, vars) {
    let text = MESSAGES[lang][key] ?? MESSAGES.ja[key] ?? key;
    for (const [name, value] of Object.entries(vars || {})) text = text.replaceAll(`{${name}}`, value);
    return text;
  }

  // config.js の { ja: "...", en: "..." } 形式の値から現在の言語を選ぶ
  function pick(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value[lang] ?? value.ja : value;
  }

  function apply() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    for (const node of document.querySelectorAll("[data-i18n]")) node.textContent = t(node.dataset.i18n);
    for (const [attr, prop] of [["placeholder", "i18nPlaceholder"], ["aria-label", "i18nAriaLabel"], ["content", "i18nContent"]]) {
      for (const node of document.querySelectorAll(`[data-i18n-${attr}]`)) node.setAttribute(attr, t(node.dataset[prop]));
    }
    for (const button of document.querySelectorAll("[data-lang]")) {
      button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
    }
  }

  function setLang(next) {
    if (!SUPPORTED.includes(next) || next === lang) return;
    lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // 保存できなくても切り替え自体は行う
    }
    apply();
    for (const fn of listeners) fn(lang);
  }

  window.I18N = {
    get lang() {
      return lang;
    },
    t,
    pick,
    setLang,
    onChange(fn) {
      listeners.push(fn);
    },
  };

  for (const button of document.querySelectorAll("[data-lang]")) {
    button.addEventListener("click", () => setLang(button.dataset.lang));
  }
  apply();
})();
