"use client";

import { PROJECTS } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

// 和のデザインのカードの番号（壱・弐・参…）
const KAN_NUMBERS = ["壱", "弐", "参", "四", "五", "六", "七", "八", "九", "十"];

export default function Works() {
  const { t, pick } = useI18n();
  const { theme } = useTheme();
  return (
    <>
      <div className="seam seam-in" aria-hidden="true" />
      <section id="works" className="section section-alt">
        <div className="container">
          <p className="eyebrow"><b data-kan="弐">02</b><span>{t("nav.works")}</span></p>
          <h2 className="section-title">{t("works.heading")}</h2>
          <div className="card-grid" id="project-list">
            {PROJECTS.map((project, index) => (
              <article key={project.url} className="card">
                {/* 和のデザインだけ: 画面に入ると左右に開く襖（styles/wa.css） */}
                {theme === "wa" && (
                  <>
                    <i className="fusuma fusuma-l" aria-hidden="true" />
                    <i className="fusuma fusuma-r" aria-hidden="true" />
                  </>
                )}
                {/* 和のデザインだけ: 大きな漢数字の番号と、種類の札。その下に赤い菱形の線 */}
                {theme === "wa" && (
                  <>
                    <div className="wk-head">
                      <span className="wk-num" aria-hidden="true">{KAN_NUMBERS[index] ?? index + 1}</span>
                      <span className="wk-cat">{pick(project.category)}</span>
                    </div>
                    <div className="wk-rule" aria-hidden="true" />
                  </>
                )}
                <h3 className="card-title">{project.title}</h3>
                <p className="card-summary">{pick(project.summary)}</p>
                <ul className="tag-list">
                  {project.tech.map((tech) => <li key={tech} className="tag">{tech}</li>)}
                </ul>
                {theme === "wa" ? (
                  // 和のデザイン: 下に、GitHub とデモ（あるときだけ）を並べた帯
                  <div className="wk-links">
                    <a href={project.url} target="_blank" rel="noopener">GitHub →</a>
                    {project.demo && (
                      <a href={project.demo} target="_blank" rel="noopener">Demo →</a>
                    )}
                  </div>
                ) : (
                  <a className="card-link" href={project.url} target="_blank" rel="noopener">GitHub →</a>
                )}
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
