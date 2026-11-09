"use client";

import { PROJECTS } from "@/lib/config";
import { useI18n } from "@/lib/i18n";

export default function Works() {
  const { t, pick } = useI18n();
  return (
    <>
      <div className="seam seam-in" aria-hidden="true" />
      <section id="works" className="section section-alt">
        <div className="container">
          <p className="eyebrow"><b>02</b><span>{t("nav.works")}</span></p>
          <h2 className="section-title">{t("works.heading")}</h2>
          <div className="card-grid" id="project-list">
            {PROJECTS.map((project) => (
              <article key={project.url} className="card">
                <h3 className="card-title">{project.title}</h3>
                <p className="card-summary">{pick(project.summary)}</p>
                <ul className="tag-list">
                  {project.tech.map((tech) => <li key={tech} className="tag">{tech}</li>)}
                </ul>
                <a className="card-link" href={project.url} target="_blank" rel="noopener">GitHub →</a>
              </article>
            ))}
          </div>
          <p className="works-more">
            <a className="btn btn-ghost" href="https://github.com/shim369?tab=repositories" target="_blank" rel="noopener">{t("works.more")}</a>
          </p>
        </div>
      </section>
      <div className="seam seam-out" aria-hidden="true" />
    </>
  );
}
