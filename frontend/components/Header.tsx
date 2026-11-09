"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function Header() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      setScrolled((window.scrollY || 0) > 60);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <nav className="container nav">
        <a className="nav-brand" href="#top" aria-label="S. Ohtani">
          <i aria-hidden="true" />S. Ohtani
        </a>
        <ul className="nav-links">
          <li><a href="#skills">{t("nav.skills")}</a></li>
          <li><a href="#works">{t("nav.works")}</a></li>
          <li><a href="#blog">{t("nav.blog")}</a></li>
          <li><a href="#architecture">{t("nav.architecture")}</a></li>
          <li><a href="#contact">{t("nav.contact")}</a></li>
        </ul>
        <div className="nav-tools">
          <div className="theme-switch" role="group" aria-label={t("theme.label")}>
            <button type="button" aria-pressed={theme === "normal"} onClick={() => setTheme("normal")}>{t("theme.normal")}</button>
            <button type="button" aria-pressed={theme === "pop"} onClick={() => setTheme("pop")}>{t("theme.pop")}</button>
          </div>
          <div className="lang-switch" role="group" aria-label={t("lang.label")}>
            <button type="button" aria-pressed={lang === "ja"} onClick={() => setLang("ja")}>JA</button>
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
          </div>
        </div>
      </nav>
    </header>
  );
}
