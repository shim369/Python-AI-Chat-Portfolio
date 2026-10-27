/*
 * ページ表示用の定数。経験年数や制作物はここを書き換えるだけで反映されます。
 * （AIチャットが参照する経歴データは app/data/profile.json です）
 */
window.SITE_CONFIG = {
  SKILLS: [
    { name: "Python", years: "X年", note: "FastAPI / スクリプト / 業務自動化" },
    { name: "JavaScript", years: "X年", note: "バニラJS / フロントエンド実装" },
    { name: "PHP", years: "X年", note: "Webアプリ開発・保守" },
    { name: "Web制作", years: "X年", note: "HTML / CSS / レスポンシブ対応" },
    { name: "システム改修", years: "X年", note: "既存システムの調査・改修・不具合修正" },
    { name: "OAuth2.0", years: "X年", note: "外部サービス連携・認可フロー実装" },
  ],

  PROJECTS: [
    {
      title: "Python-AI-Chat-Portfolio",
      summary: "このサイト。Gemini の function calling を使った手動エージェントループのAIチャットを、Vercel 上の FastAPI で動かしています。",
      tech: ["Python", "FastAPI", "Gemini API", "JavaScript", "Vercel"],
      url: "https://github.com/shim369/Python-AI-Chat-Portfolio",
    },
    {
      title: "制作物タイトル（準備中）",
      summary: "制作物の概要をここに記載します。",
      tech: ["PHP", "MySQL"],
      url: "https://github.com/shim369",
    },
    {
      title: "制作物タイトル（準備中）",
      summary: "制作物の概要をここに記載します。",
      tech: ["JavaScript", "OAuth2.0"],
      url: "https://github.com/shim369",
    },
  ],

  SAMPLE_QUESTIONS: [
    "得意なスキルを教えてください",
    "これまでの制作物を紹介してください",
    "このチャットはどんな仕組みですか？",
  ],

  // サーバー側の上限と揃える
  MAX_INPUT_LENGTH: 500,
  MAX_HISTORY: 10,
};
