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

  renderSkills();
  renderProjects();
})();
