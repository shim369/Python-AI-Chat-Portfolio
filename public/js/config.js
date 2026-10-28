/*
 * ページ表示用の定数。経験年数や制作物はここを書き換えるだけで反映されます。
 * 言語によって変わる値は { ja: "...", en: "..." } の形で書きます。
 * （AIチャットが参照する経歴データは app/data/profile.json です）
 */
window.SITE_CONFIG = {
  // 市場価値の高そうなスキルのベスト9（全27件は app/data/profile.json にあり、AIチャットはそちらを参照する）
  SKILLS: [
    { name: "Python", years: { ja: "5ヶ月", en: "5 mos" }, note: { ja: "実務では業務効率化ツール2件（PHPバージョンアップ支援、Webサイト調査）をスクラッチで設計・開発・運用。個人開発では2023年からFastAPI・Streamlit・Djangoなどで継続的に開発", en: "At work: designed, built and operate two automation tools from scratch (PHP upgrade support, website survey). Personal projects with FastAPI, Streamlit, Django and more since 2023" } },
    { name: "Gemini API / Claude Code", years: { ja: "5ヶ月", en: "5 mos" }, note: { ja: "Gemini APIを組み込んでWebサイトの構成・用途の判定を補完、Claude Codeを活用した開発。個人開発ではfunction callingを用いたエージェントループを実装（このサイト）", en: "Using the Gemini API to classify website structure and purpose; development with Claude Code. Built an agent loop with function calling in personal projects (this site)" } },
    { name: "TypeScript / React", years: { ja: "5ヶ月", en: "5 mos" }, note: { ja: "生産管理システムのWebアプリ機能追加（端末設定・表示設定）、結合テスト", en: "New features (device and display settings) for a production management web app, integration testing" } },
    { name: "C# / .NET (ASP.NET)", years: { ja: "11ヶ月", en: "11 mos" }, note: { ja: ".NETバージョンアップ、社内業務ツール（採用管理・給与計算・従業員情報）の解析・改修、ECサイト改修", en: ".NET upgrades, analysis and improvement of internal tools (recruiting, payroll, employee data), e-commerce site changes" } },
    { name: "JavaScript / jQuery", years: { ja: "8年6ヶ月", en: "8 yrs 6 mos" }, note: { ja: "Webサイト制作・改修全般、Electron / Node.jsのデスクトップアプリ開発、ASP.NET ECサイトのフロントエンド対応", en: "Website development and maintenance, Electron / Node.js desktop apps, frontend work on an ASP.NET e-commerce site" } },
    { name: "PHP", years: { ja: "6年8ヶ月", en: "6 yrs 8 mos" }, note: { ja: "WordPressテーマ制作・改修、CakePHP 2系 / Smartyの改修、PHP 5〜7系サイトのPHP 8.4移行対応", en: "WordPress themes, CakePHP 2 / Smarty maintenance, migrating PHP 5–7 sites to PHP 8.4" } },
    { name: "MySQL / MariaDB", years: { ja: "7年6ヶ月", en: "7 yrs 6 mos" }, note: { ja: "Webサイト・CMSのデータベース", en: "Databases for websites and CMSs" } },
    { name: "pytest / Ruff / Mypy / GitHub Actions", years: { ja: "5ヶ月", en: "5 mos" }, note: { ja: "pytestでのテスト作成、GitHub Actionsでの静的解析・テストの自動実行", en: "Writing tests with pytest; automated linting, type checking and tests on GitHub Actions" } },
    { name: { ja: "要件定義・基本設計", en: "Requirements & Basic Design" }, years: { ja: "2年9ヶ月", en: "2 yrs 9 mos" }, note: { ja: "UI / UX設計、共通機能の設計、社内ツールの要件定義", en: "UI / UX design, shared feature design, requirements for internal tools" } },
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
        ja: "PHPエンジニア向けのPython学習Webアプリ。コードの自動採点と、Gemini API によるヒント・コードレビューに対応。",
        en: "A Python learning web app for PHP developers with auto-grading and hints and code reviews from the Gemini API.",
      },
      tech: ["Python", "Streamlit", "SQLite", "Gemini API"],
      url: "https://github.com/shim369/Python-Study-App",
    },
    {
      title: "Python-AWSSAA-Quiz",
      summary: {
        ja: "AWS SAA-C03対策の4択クイズアプリ。Excelのキーワード集から問題を自動生成し、弱点を優先して出題します。",
        en: "A multiple-choice quiz app for AWS SAA-C03 that generates questions from an Excel keyword list and prioritizes weak areas.",
      },
      tech: ["Python", "Streamlit", "pandas", "openpyxl", "SQLite"],
      url: "https://github.com/shim369/Python-AWSSAA-Quiz",
    },
    {
      title: "Python-Spotify-Insights",
      summary: {
        ja: "Spotifyのライブラリに最近追加した曲と週間トップ10を閲覧し、プレイリストを生成できるWebアプリ。",
        en: "A web app to browse recently added Spotify tracks and your weekly top 10, and generate playlists.",
      },
      tech: ["Python", "FastHTML", "HTMX", "Spotify API"],
      url: "https://github.com/shim369/Python-Spotify-Insights",
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
      title: "Java-RecipeRev-App",
      summary: {
        ja: "レシピのバージョン管理Webアプリ。改訂履歴、2バージョン間の差分表示、Python による材料と評価の傾向分析に対応。",
        en: "A recipe version-control web app: revision history, diffs between versions, and ingredient-vs-rating analysis with Python.",
      },
      tech: ["Java", "Spring Boot", "MySQL", "Docker", "Python"],
      url: "https://github.com/shim369/Java-RecipeRev-App",
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
