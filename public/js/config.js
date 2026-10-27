/*
 * ページ表示用の定数。経験年数や制作物はここを書き換えるだけで反映されます。
 * 言語によって変わる値は { ja: "...", en: "..." } の形で書きます。
 * （AIチャットが参照する経歴データは app/data/profile.json です）
 */
window.SITE_CONFIG = {
  SKILLS: [
    { name: "Python", years: { ja: "X年", en: "X yrs" }, note: { ja: "FastAPI / スクリプト / 業務自動化", en: "FastAPI / scripting / task automation" } },
    { name: "JavaScript", years: { ja: "X年", en: "X yrs" }, note: { ja: "バニラJS / フロントエンド実装", en: "Vanilla JS / frontend development" } },
    { name: "PHP", years: { ja: "X年", en: "X yrs" }, note: { ja: "Webアプリ開発・保守", en: "Web application development and maintenance" } },
    { name: { ja: "Web制作", en: "Web Production" }, years: { ja: "X年", en: "X yrs" }, note: { ja: "HTML / CSS / レスポンシブ対応", en: "HTML / CSS / responsive design" } },
    { name: { ja: "システム改修", en: "System Maintenance" }, years: { ja: "X年", en: "X yrs" }, note: { ja: "既存システムの調査・改修・不具合修正", en: "Investigating, improving, and fixing existing systems" } },
    { name: "OAuth2.0", years: { ja: "X年", en: "X yrs" }, note: { ja: "外部サービス連携・認可フロー実装", en: "Third-party integrations and authorization flows" } },
  ],

  PROJECTS: [
    {
      title: "Python-AI-Chat-Portfolio",
      summary: {
        ja: "このサイト。Gemini の function calling を使った手動エージェントループのAIチャットを、Vercel 上の FastAPI で動かしています。",
        en: "This site. An AI chat with a hand-written agent loop using Gemini function calling, running on FastAPI on Vercel.",
      },
      tech: ["Python", "FastAPI", "Gemini API", "JavaScript", "Vercel"],
      url: "https://github.com/shim369/Python-AI-Chat-Portfolio",
    },
    {
      title: { ja: "制作物タイトル（準備中）", en: "Project title (coming soon)" },
      summary: { ja: "制作物の概要をここに記載します。", en: "A short description of the project goes here." },
      tech: ["PHP", "MySQL"],
      url: "https://github.com/shim369",
    },
    {
      title: { ja: "制作物タイトル（準備中）", en: "Project title (coming soon)" },
      summary: { ja: "制作物の概要をここに記載します。", en: "A short description of the project goes here." },
      tech: ["JavaScript", "OAuth2.0"],
      url: "https://github.com/shim369",
    },
  ],

  SAMPLE_QUESTIONS: {
    ja: ["得意なスキルを教えてください", "これまでの制作物を紹介してください", "このチャットはどんな仕組みですか？"],
    en: ["What are his main skills?", "Tell me about his projects.", "How does this chat work?"],
  },

  // サーバー側の上限と揃える
  MAX_INPUT_LENGTH: 500,
  MAX_HISTORY: 10,
};
