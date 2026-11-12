"use client";

import { SKILLS } from "@/lib/config";
import { useI18n } from "@/lib/i18n";

export default function Skills() {
  const { t, pick } = useI18n();
  return (
    <section id="skills" className="section">
      <div className="container">
        <p className="eyebrow"><b data-kan="壱">01</b><span>{t("nav.skills")}</span></p>
        <h2 className="section-title">{t("skills.heading")}</h2>
        <ul className="skill-grid" id="skill-list">
          {SKILLS.map((skill) => (
            <li key={skill.name} className="skill-item">
              <div className="skill-head">
                <span className="skill-name">{skill.name}</span>
                <span className="skill-years">{pick(skill.years)}</span>
              </div>
              <p className="skill-note">{pick(skill.note)}</p>
            </li>
          ))}
        </ul>
        <p className="skills-extra">{t("skills.extra")}</p>
        <p className="skills-more">
          <a className="btn btn-ghost" href="https://github.com/shim369?tab=repositories" target="_blank" rel="noopener">{t("skills.more")}</a>
        </p>
      </div>
    </section>
  );
}
