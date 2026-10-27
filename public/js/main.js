// スキル・制作物セクションを SITE_CONFIG から描画する
(function () {
  "use strict";

  const { SKILLS, PROJECTS } = window.SITE_CONFIG;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderSkills() {
    const list = document.getElementById("skill-list");
    for (const skill of SKILLS) {
      const item = el("li", "skill-item");
      const head = el("div", "skill-head");
      head.append(el("span", "skill-name", skill.name), el("span", "skill-years", skill.years));
      item.append(head, el("p", "skill-note", skill.note));
      list.append(item);
    }
  }

  function renderProjects() {
    const list = document.getElementById("project-list");
    for (const project of PROJECTS) {
      const card = el("article", "card");
      card.append(el("h3", "card-title", project.title), el("p", "card-summary", project.summary));

      const tags = el("ul", "tag-list");
      for (const t of project.tech) tags.append(el("li", "tag", t));
      card.append(tags);

      const link = el("a", "card-link", "GitHub →");
      link.href = project.url;
      link.target = "_blank";
      link.rel = "noopener";
      card.append(link);

      list.append(card);
    }
  }

  // 最新記事は /api/blog（サーバー側で TECH BLOG から取得）から読み込む
  async function renderBlog() {
    const list = document.getElementById("blog-list");
    const status = document.getElementById("blog-status");
    try {
      const res = await fetch("/api/blog");
      const data = await res.json();
      if (!res.ok || data.posts.length === 0) throw new Error("no posts");
      status.remove();
      for (const post of data.posts) {
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
        const link = el("a", "card-link", "Read more →");
        link.href = post.url;
        link.target = "_blank";
        link.rel = "noopener";
        body.append(date, el("h3", "card-title", post.title), link);
        card.append(body);
        list.append(card);
      }
    } catch {
      status.textContent = "記事を読み込めませんでした。下のリンクからブログをご覧ください。";
    }
  }

  renderSkills();
  renderProjects();
  renderBlog();
})();
