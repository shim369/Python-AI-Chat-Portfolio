// スキル・制作物・ブログのセクションを描画する（言語切り替え時は描画し直す）
(function () {
  "use strict";

  const { SKILLS, PROJECTS } = window.SITE_CONFIG;
  const { t, pick } = window.I18N;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderSkills() {
    const list = document.getElementById("skill-list");
    list.replaceChildren();
    for (const skill of SKILLS) {
      const item = el("li", "skill-item");
      const head = el("div", "skill-head");
      head.append(el("span", "skill-name", pick(skill.name)), el("span", "skill-years", pick(skill.years)));
      item.append(head, el("p", "skill-note", pick(skill.note)));
      list.append(item);
    }
  }

  function renderProjects() {
    const list = document.getElementById("project-list");
    list.replaceChildren();
    for (const project of PROJECTS) {
      const card = el("article", "card");
      card.append(el("h3", "card-title", pick(project.title)), el("p", "card-summary", pick(project.summary)));

      const tags = el("ul", "tag-list");
      for (const tech of project.tech) tags.append(el("li", "tag", tech));
      card.append(tags);

      const link = el("a", "card-link", "GitHub →");
      link.href = project.url;
      link.target = "_blank";
      link.rel = "noopener";
      card.append(link);

      list.append(card);
    }
  }

  // 最新記事は /api/blog（サーバー側で TECH BLOG から取得）から読み込む。
  // 取得結果を保持しておき、言語切り替え時はリンク文言だけ描画し直す
  let blogPosts = null;

  function renderBlogPosts() {
    const list = document.getElementById("blog-list");
    list.replaceChildren();
    for (const post of blogPosts) {
      const card = el("article", "card blog-card");
      if (post.image) {
        const img = el("img", "blog-card-img");
        img.src = post.image;
        img.alt = "";
        img.loading = "lazy";
        img.width = 309;
        img.height = 160;
        card.append(img);
      }
      const body = el("div", "blog-card-body");
      const date = el("time", "blog-card-date", post.date.replaceAll("-", "/"));
      date.dateTime = post.date;
      const link = el("a", "card-link", t("blog.readMore"));
      link.href = post.url;
      link.target = "_blank";
      link.rel = "noopener";
      body.append(date, el("h3", "card-title", post.title), link);
      card.append(body);
      list.append(card);
    }
  }

  async function loadBlog() {
    const status = document.getElementById("blog-status");
    try {
      const res = await fetch("/api/blog");
      const data = await res.json();
      if (!res.ok || data.posts.length === 0) throw new Error("no posts");
      blogPosts = data.posts;
      renderBlogPosts();
      window.SCROLL_FX.reveal("#blog-list > .card");
    } catch {
      status.dataset.i18n = "blog.error";
      status.textContent = t("blog.error");
    }
  }

  const header = document.querySelector(".site-header");

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 0);
  }

  renderSkills();
  renderProjects();
  // 言語切り替えで描画し直したときはアニメーションさせず、そのまま表示する
  window.SCROLL_FX.reveal("#skill-list > .skill-item, #project-list > .card");
  loadBlog();
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  window.I18N.onChange(() => {
    renderSkills();
    renderProjects();
    if (blogPosts) renderBlogPosts();
  });
})();
