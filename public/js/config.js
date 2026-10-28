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
    { name: "Java / JavaFX", years: { ja: "5ヶ月", en: "5 mos" }, note: { ja: "生産管理システムのWindowsアプリ機能追加（端末設定・表示設定）、結合テスト", en: "New features (device and display settings) for a production management Windows app, integration testing" } },
    { name: "C# / .NET (ASP.NET)", years: { ja: "11ヶ月", en: "11 mos" }, note: { ja: ".NETバージョンアップ、社内業務ツール（採用管理・給与計算・従業員情報）の解析・改修、ECサイト改修", en: ".NET upgrades, analysis and improvement of internal tools (recruiting, payroll, employee data), e-commerce site changes" } },
    { name: "JavaScript / jQuery", years: { ja: "8年6ヶ月", en: "8 yrs 6 mos" }, note: { ja: "Webサイト制作・改修全般、Electron / Node.jsのデスクトップアプリ開発、ASP.NET ECサイトのフロントエンド対応", en: "Website development and maintenance, Electron / Node.js desktop apps, frontend work on an ASP.NET e-commerce site" } },
    { name: "PHP", years: { ja: "6年8ヶ月", en: "6 yrs 8 mos" }, note: { ja: "WordPressテーマ制作・改修、CakePHP 2系 / Smartyの改修、PHP 5〜7系サイトのPHP 8.4移行対応", en: "WordPress themes, CakePHP 2 / Smarty maintenance, migrating PHP 5–7 sites to PHP 8.4" } },
    { name: "HTML / CSS (Sass)", years: { ja: "8年3ヶ月", en: "8 yrs 3 mos" }, note: { ja: "コーポレート・EC・LP・イントラサイトのデザイン / コーディング、cshtml / aspxへの組み込み", en: "Design and coding of corporate, e-commerce, landing and intranet sites; integration into cshtml / aspx" } },
    { name: "Perl / CGI", years: { ja: "5ヶ月", en: "5 mos" }, note: { ja: "既存システム・問い合わせフォームの改修", en: "Maintenance of existing systems and contact forms" } },
    { name: "Google Apps Script", years: { ja: "4ヶ月", en: "4 mos" }, note: { ja: "特定メールの内容をGoogleスプレッドシートへ自動記録する機能を開発", en: "Automatically logging specific emails to Google Sheets" } },
  ],

  // スキル欄の言語を裏付ける制作物（AIチャット用には app/data/profile.json にさらに3件ある）
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
      title: "Python-Quotes-Scraper",
      summary: {
        ja: "型安全な名言スクレイパー。CustomTkinter のGUIと SQLite への保存。pytest と GitHub Actions でテストを自動実行。",
        en: "A type-safe quotes scraper with a CustomTkinter GUI and SQLite storage, tested with pytest on GitHub Actions.",
      },
      tech: ["Python", "CustomTkinter", "BeautifulSoup4", "SQLite", "GitHub Actions"],
      url: "https://github.com/shim369/Python-Quotes-Scraper",
    },
    {
      title: "Electron-Investment-App",
      summary: {
        ja: "Electron・React・TypeScript の投資管理デスクトップアプリ。株価APIからの取得、グラフ表示、目標価格のアラート、PDF出力に対応。",
        en: "An investment tracker desktop app built with Electron, React and TypeScript: live stock prices from an API, charts, target-price alerts and PDF export.",
      },
      tech: ["TypeScript", "React", "Electron", "Chart.js"],
      url: "https://github.com/shim369/Electron-Investment-App",
    },
    {
      title: "Java-RecipeRev-App",
      summary: {
        ja: "レシピのバージョン管理Webアプリ。改訂履歴、2バージョン間の差分表示、Python による材料と評価の傾向分析に対応。",
        en: "A recipe version-control web app: revision history, diffs between versions, and ingredient-vs-rating analysis with Python.",
      },
      tech: ["Java", "Spring Boot", "MySQL", "Docker", "Python"],
      url: "https://github.com/shim369/Java-RecipeRev-App",
    },
    {
      title: "Electron-React-TypeScript-AspNetCore-Todo-App",
      summary: {
        ja: "C#（ASP.NET Core Web API）と PostgreSQL のバックエンドに、Electron・React・TypeScript のデスクトップアプリを組み合わせたタスク管理アプリ。",
        en: "A task manager pairing a C# ASP.NET Core Web API and PostgreSQL backend with an Electron, React and TypeScript desktop app.",
      },
      tech: ["C#", "ASP.NET Core", "PostgreSQL", "TypeScript", "React", "Electron"],
      url: "https://github.com/shim369/Electron-React-TypeScript-AspNetCore-Todo-App",
    },
    {
      title: "Nextjs-TypeScript-Laravel-Todo-App-Backend",
      summary: {
        ja: "PHP（Laravel）で作ったタスク管理の REST API。MySQL とトークン認証を備え、Next.js のフロントエンドから利用。",
        en: "A task management REST API built with PHP (Laravel), with MySQL and token authentication, used by a Next.js frontend.",
      },
      tech: ["PHP", "Laravel", "MySQL"],
      url: "https://github.com/shim369/Nextjs-TypeScript-Laravel-Todo-App-Backend",
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
