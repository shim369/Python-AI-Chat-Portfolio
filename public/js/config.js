/*
 * ページ表示用の定数。経験年数や制作物はここを書き換えるだけで反映されます。
 * 言語によって変わる値は { ja: "...", en: "..." } の形で書きます。
 * （AIチャットが参照する経歴データは app/data/profile.json です）
 */
window.SITE_CONFIG = {
  // 言語系スキル（全件は app/data/profile.json にあり、AIチャットはそちらを参照する。DB・テスト・AIなどは i18n.js の skills.extra に記載）
  SKILLS: [
    { name: "Python", years: { ja: "5ヶ月", en: "5 mos" }, note: { ja: "実務では業務効率化ツール2件（PHPバージョンアップ支援、Webサイト調査）をスクラッチで設計・開発・運用。個人開発では2023年からFastAPI・Streamlit・Djangoなどで継続的に開発", en: "At work: designed, built and operate two automation tools from scratch (PHP upgrade support, website survey). Personal projects with FastAPI, Streamlit, Django and more since 2023" } },
    { name: "TypeScript / React", years: { ja: "5ヶ月", en: "5 mos" }, note: { ja: "生産管理システムのWebアプリ機能追加（端末設定・表示設定）、結合テスト", en: "New features (device and display settings) for a production management web app, integration testing" } },
    { name: "C# / .NET (ASP.NET)", years: { ja: "11ヶ月", en: "11 mos" }, note: { ja: ".NETバージョンアップ、社内業務ツール（採用管理・給与計算・従業員情報）の解析・改修、ECサイト改修", en: ".NET upgrades, analysis and improvement of internal tools (recruiting, payroll, employee data), e-commerce site changes" } },
    { name: "JavaScript / jQuery", years: { ja: "8年6ヶ月", en: "8 yrs 6 mos" }, note: { ja: "Webサイト制作・改修全般、Electron / Node.jsのデスクトップアプリ開発、ASP.NET ECサイトのフロントエンド対応", en: "Website development and maintenance, Electron / Node.js desktop apps, frontend work on an ASP.NET e-commerce site" } },
    { name: "PHP", years: { ja: "6年8ヶ月", en: "6 yrs 8 mos" }, note: { ja: "WordPressテーマ制作・改修、CakePHP 2系 / Smartyの改修、PHP 5〜7系サイトのPHP 8.4移行対応", en: "WordPress themes, CakePHP 2 / Smarty maintenance, migrating PHP 5–7 sites to PHP 8.4" } },
    { name: "HTML / CSS (Sass)", years: { ja: "8年3ヶ月", en: "8 yrs 3 mos" }, note: { ja: "コーポレート・EC・LP・イントラサイトのデザイン / コーディング、cshtml / aspxへの組み込み", en: "Design and coding of corporate, e-commerce, landing and intranet sites; integration into cshtml / aspx" } },
    { name: "WordPress", years: { ja: "5年7ヶ月", en: "5 yrs 7 mos" }, note: { ja: "テーマ制作・サイト構築、本体・プラグインの改修（開発停止プラグインを含む）", en: "Theme development and site builds, core and plugin maintenance (including discontinued plugins)" } },
    { name: "MySQL / MariaDB", years: { ja: "7年6ヶ月", en: "7 yrs 6 mos" }, note: { ja: "Webサイト・CMSのデータベース", en: "Databases behind websites and CMSs" } },
    { name: "Git (GitHub / GitLab)", years: { ja: "3年9ヶ月", en: "3 yrs 9 mos" }, note: { ja: "ブランチ戦略に基づくマージ・リリース調整、フルリモートでのチーム開発", en: "Merges and release coordination under a branching strategy, fully remote team development" } },
  ],

  // スキル欄の言語を裏付ける制作物（AIチャットは app/data/profile.json を参照する）
  PROJECTS: [
    {
      title: "Python-Web-Analyzer",
      summary: {
        ja: "Excelのドメイン一覧から、SSL対応・CMS・総ページ数などを並列クロールで自動解析し、ビジネス評価を付けるStreamlit製アプリ。SQLiteで状態を永続化し、強制終了後も復旧します。",
        en: "A Streamlit app that crawls a list of domains in parallel to detect SSL setup, CMS and page count, then rates each site. State is persisted in SQLite and recovered after a crash.",
      },
      tech: ["Python", "Streamlit", "SQLite", "Playwright"],
      url: "https://github.com/shim369/Python-Web-Analyzer",
    },
    {
      title: "Python-Health-Insight-Agent",
      summary: {
        ja: "食事・運動・睡眠ログを分析するAIエージェント。Gemini が解釈と説明を担当し、統計は型付きツールで計算して、根拠つきで回答します。RAG、読み取り専用SQL、LightGBM、MCPサーバーも備えます（合成データのデモ）。",
        en: "A data-analysis AI agent over meal, workout and sleep logs. Gemini interprets and explains while typed tools compute the statistics, so answers come with evidence. Also has RAG, guarded read-only SQL, LightGBM and an MCP server (synthetic demo data).",
      },
      tech: ["Python", "FastAPI", "Gemini API", "PostgreSQL", "LightGBM", "React", "Docker"],
      url: "https://github.com/shim369/Python-Health-Insight-Agent",
    },
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
      title: "Python-Defect-Hunter-Game",
      summary: {
        ja: "表面欠陥データセット KolektorSDD2 を使った「人間 vs AI」のブラウザゲーム。CPUで学習した小さな U-Net と人間が同じ画像の欠陥をなぞり、IoU で比較します。",
        en: "A Human vs AI browser game on the KolektorSDD2 surface-defect dataset. You and a small CPU-trained U-Net trace the same defect, and both are scored by IoU.",
      },
      tech: ["Python", "PyTorch", "FastAPI", "OpenCV", "Docker"],
      url: "https://github.com/shim369/Python-Defect-Hunter-Game",
    },
    {
      title: "Python-Smart-Health-Intelligence-Platform",
      summary: {
        ja: "開発中のマルチユーザー向け健康管理Webアプリ。ルールベースの提案、Gemini によるレシピ生成、LightGBM による体重予測を備えます。",
        en: "A multi-user health tracking web app (in progress) with rule-based recommendations, AI recipe generation with Gemini, and weight prediction with LightGBM.",
      },
      tech: ["Python", "Streamlit", "PostgreSQL", "SQLAlchemy", "LightGBM", "Gemini API"],
      url: "https://github.com/shim369/Python-Smart-Health-Intelligence-Platform",
    },
    {
      title: "Python-Budget-Tracker-App",
      summary: {
        ja: "オフラインで動く家計簿・サブスク管理アプリ。設計書とトレーサビリティを整備し、336件のテストでカバレッジ99.9%。",
        en: "An offline budget and subscription tracker with design docs, traceability, and 336 tests at 99.9% coverage.",
      },
      tech: ["Python", "FastAPI", "Pydantic", "Alpine.js", "pytest"],
      url: "https://github.com/shim369/Python-Budget-Tracker-App",
    },
    {
      title: "Python-Study-App",
      summary: {
        ja: "PHPエンジニア向けのPython学習Webアプリ。コードを実行・自動採点し、Gemini API によるヒントとコードレビュー、間隔反復での復習に対応。",
        en: "A Python learning web app for PHP developers: run and auto-grade your code, get hints and code reviews from the Gemini API, and review with spaced repetition.",
      },
      tech: ["Python", "Streamlit", "SQLite", "Gemini API", "pytest"],
      url: "https://github.com/shim369/Python-Study-App",
    },
    {
      title: "Python-Encryption-Tool",
      summary: {
        ja: "ファイル・フォルダを一括で暗号化 / 復号するデスクトップツール。ソルトとストレッチングによる鍵の強化、Mypy Strict 準拠の型付け、GitHub Actions での CI。",
        en: "A desktop tool that encrypts and decrypts files and whole folders, with salted, stretched keys, Mypy-strict typing and CI on GitHub Actions.",
      },
      tech: ["Python", "cryptography", "CustomTkinter", "Mypy", "GitHub Actions"],
      url: "https://github.com/shim369/Python-Encryption-Tool",
    },
    {
      title: "Nuxtjs-TypeScript-Gsap-MicroCMS-Site",
      summary: {
        ja: "Nuxt 3 とヘッドレスCMS（microCMS）で構築した Jamstack サイト。GSAP によるスクロールアニメーションと reCAPTCHA v3 付きフォーム。",
        en: "A Jamstack site built with Nuxt 3 and the microCMS headless CMS, with GSAP scroll animations and a reCAPTCHA v3 form.",
      },
      tech: ["Nuxt", "TypeScript", "microCMS", "GSAP", "Vercel"],
      url: "https://github.com/shim369/Nuxtjs-TypeScript-Gsap-MicroCMS-Site",
    },
  ],

  SAMPLE_QUESTIONS: {
    ja: ["得意なスキルを教えてください", "これまでの制作物を紹介してください", "このチャットはどんな仕組みですか？"],
    en: ["What are his main skills?", "Tell me about his projects.", "How does this chat work?"],
  },

  // reCAPTCHA v3 のサイトキー（公開して問題ない値）。空のときは reCAPTCHA を読み込まない。
  // サーバー側には対になるシークレットキーを環境変数 RECAPTCHA_SECRET_KEY で設定する
  RECAPTCHA_SITE_KEY: "6LeoiwUuAAAAABGP5A1GwYA98CffONhuEQZbAI7J",

  // サーバー側の上限と揃える
  MAX_INPUT_LENGTH: 500,
  MAX_HISTORY: 10,
};
