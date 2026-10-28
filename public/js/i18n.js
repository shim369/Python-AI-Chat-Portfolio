/*
 * 日本語 / 英語の切り替え。
 * - 固定の文言は data-i18n="キー" の要素に textContent で流し込む
 *   （data-i18n-placeholder / data-i18n-aria-label / data-i18n-content は各属性に流し込む）
 * - 選んだ言語は localStorage に保存（初回や保存できない環境では英語で表示する）
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
      "nav.contact": "お問い合わせ",
      "hero.lead": "Python・JavaScript で、Web システムの改修から AI チャットの設計・実装まで手がけるエンジニアです。",
      "hero.cta": "AIに質問する",
      "skills.title": "スキル",
      "skills.extra": "このほか、MySQL・PostgreSQL・SQL Server（SQLの調査・レビュー）、要件定義・基本設計、pytest・Ruff・Mypy・GitHub Actions によるテストと CI、Gemini API・Claude Code を使った開発の経験があります。",
      "skills.more": "その他のスキルは GitHub で見る →",
      "works.title": "制作物",
      "works.more": "その他の制作物は GitHub で見る →",
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
      "chat.launcher": "AIに質問",
      "chat.close": "チャットを閉じる",
      "chat.inputLabel": "質問を入力",
      "chat.placeholder": "質問を入力（Enterで送信 / Shift+Enterで改行）",
      "chat.send": "送信",
      "chat.notice": "入力内容はAIサービス提供元で処理されます。個人情報は入力しないでください。AIの回答は誤りを含む場合があります。",
      "chat.greeting": "こんにちは！Shinpei Ohtani の経歴・スキル・制作物について、何でも質問してください。",
      "chat.loading": "考え中…（初回は少し時間がかかります）",
      "chat.retry": "再試行",
      "chat.toolRun": "🔧 {name} を実行",
      "chat.notice.partial_timeout": "時間切れのため一部のみ表示しています。",
      "chat.tooLong": "質問は{max}文字以内で入力してください。",
      "error.network": "通信エラーが発生しました。ネットワークを確認して再試行してください。",
      "error.llm_error": "AIの応答取得中にエラーが発生しました。少し待ってから再試行してください。",
      "error.rate_limited": "現在アクセスが集中しています。少し待ってから再試行してください。",
      "error.too_many_requests": "短時間に多くの質問が送られました。1分ほど待ってから再試行してください。",
      "error.requestId": "エラーID: {id}",
      "error.region_unavailable": "お住まいの地域では AI チャットを提供していません（利用している AI サービスの規約によるものです）。ページのその他の内容はご覧いただけます。",
      "error.timeout": "AIの応答に時間がかかりすぎたため中断しました。再試行してください。",
      "error.config_error": "AIチャットは現在利用できません（サーバー設定エラー）。",
      "error.input_too_long": "質問は{max}文字以内で入力してください。",
      "error.invalid_input": "入力内容が正しくありません。",
      "contact.title": "お問い合わせ",
      "contact.lead": "お仕事のご相談やご質問は、こちらのフォームからお送りください。",
      "contact.name": "お名前",
      "contact.email": "メールアドレス",
      "contact.message": "お問い合わせ内容",
      "contact.submit": "送信する",
      "contact.sending": "送信中…",
      "contact.success": "送信しました。お問い合わせありがとうございます。内容を確認のうえ、ご連絡します。",
      "contact.recaptcha1": "このサイトは reCAPTCHA で保護されており、Google の",
      "contact.privacy": "プライバシーポリシー",
      "contact.recaptcha2": "と",
      "contact.terms": "利用規約",
      "contact.recaptcha3": "が適用されます。",
      "contact.error.name_required": "お名前を入力してください。",
      "contact.error.name_too_long": "お名前は100文字以内で入力してください。",
      "contact.error.email_required": "メールアドレスを入力してください。",
      "contact.error.invalid_email": "メールアドレスの形式が正しくありません。",
      "contact.error.message_required": "お問い合わせ内容を入力してください。",
      "contact.error.message_too_long": "お問い合わせ内容は2000文字以内で入力してください。",
      "contact.error.recaptcha_failed": "送信を確認できませんでした。時間をおいて再度お試しください。",
      "contact.error.recaptcha_load": "送信の確認（reCAPTCHA）を読み込めませんでした。広告ブロッカーなどを無効にして再度お試しください。",
      "contact.error.too_many_requests": "短時間に何度も送信されました。しばらく待ってから再度お試しください。",
      "contact.error.contact_unavailable": "現在お問い合わせフォームは利用できません。GitHub からご連絡ください。",
      "contact.error.contact_failed": "送信に失敗しました。時間をおいて再度お試しください。",
      "contact.error.network": "通信エラーが発生しました。ネットワークを確認して再度お試しください。",
    },
    en: {
      "meta.title": "Shinpei Ohtani | Portfolio",
      "meta.description": "Portfolio of Shinpei Ohtani. Ask the AI chat about his background, skills, and projects.",
      "lang.label": "Language",
      "nav.skills": "Skills",
      "nav.works": "Works",
      "nav.blog": "Blog",
      "nav.architecture": "Architecture",
      "nav.contact": "Contact",
      "hero.lead": "An engineer working across Python and JavaScript, from maintaining web systems to designing and building AI chat applications.",
      "hero.cta": "Ask the AI",
      "skills.title": "Skills",
      "skills.extra": "Also experienced with MySQL, PostgreSQL and SQL Server (SQL investigation and reviews), requirements definition and basic design, testing and CI with pytest, Ruff, Mypy and GitHub Actions, and development with the Gemini API and Claude Code.",
      "skills.more": "See more skills on GitHub →",
      "works.title": "Works",
      "works.more": "See more projects on GitHub →",
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
      "chat.launcher": "Ask the AI",
      "chat.close": "Close chat",
      "chat.inputLabel": "Your question",
      "chat.placeholder": "Ask a question (Enter to send / Shift+Enter for a new line)",
      "chat.send": "Send",
      "chat.notice": "Your input is processed by the AI service provider. Please do not enter personal information. AI answers may contain mistakes.",
      "chat.greeting": "Hi! Ask me anything about Shinpei Ohtani's background, skills, and projects.",
      "chat.loading": "Thinking… (the first reply may take a moment)",
      "chat.retry": "Retry",
      "chat.toolRun": "🔧 Ran {name}",
      "chat.notice.partial_timeout": "Time ran out, so only part of the answer is shown.",
      "chat.tooLong": "Please keep your question within {max} characters.",
      "error.network": "A network error occurred. Please check your connection and try again.",
      "error.llm_error": "Something went wrong while getting the AI response. Please wait a moment and try again.",
      "error.rate_limited": "The service is busy right now. Please wait a moment and try again.",
      "error.too_many_requests": "Too many questions in a short time. Please wait about a minute and try again.",
      "error.requestId": "Error ID: {id}",
      "error.region_unavailable": "The AI chat is not available in your region due to the terms of the AI service it uses. The rest of this page is still available.",
      "error.timeout": "The AI took too long to respond, so the request was stopped. Please try again.",
      "error.config_error": "The AI chat is currently unavailable (server configuration error).",
      "error.input_too_long": "Please keep your question within {max} characters.",
      "error.invalid_input": "The input is not valid.",
      "contact.title": "Contact",
      "contact.lead": "For work inquiries or questions, please use the form below.",
      "contact.name": "Name",
      "contact.email": "Email",
      "contact.message": "Message",
      "contact.submit": "Send",
      "contact.sending": "Sending…",
      "contact.success": "Your message has been sent. Thank you, I will get back to you soon.",
      "contact.recaptcha1": "This site is protected by reCAPTCHA and the Google ",
      "contact.privacy": "Privacy Policy",
      "contact.recaptcha2": " and ",
      "contact.terms": "Terms of Service",
      "contact.recaptcha3": " apply.",
      "contact.error.name_required": "Please enter your name.",
      "contact.error.name_too_long": "Please keep your name within 100 characters.",
      "contact.error.email_required": "Please enter your email address.",
      "contact.error.invalid_email": "Please enter a valid email address.",
      "contact.error.message_required": "Please enter a message.",
      "contact.error.message_too_long": "Please keep your message within 2,000 characters.",
      "contact.error.recaptcha_failed": "We couldn't verify your submission. Please try again later.",
      "contact.error.recaptcha_load": "Couldn't load reCAPTCHA. Please disable any content blockers and try again.",
      "contact.error.too_many_requests": "Too many submissions in a short time. Please wait a while and try again.",
      "contact.error.contact_unavailable": "The contact form is currently unavailable. Please reach out via GitHub.",
      "contact.error.contact_failed": "Failed to send your message. Please try again later.",
      "contact.error.network": "A network error occurred. Please check your connection and try again.",
    },
  };

  // 前回選んだ言語があればそれを使い、なければ英語で表示する
  function initialLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED.includes(saved)) return saved;
    } catch {
      // localStorage が使えない環境では英語のまま
    }
    return "en";
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
