"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { THEMES, useTheme, type Theme } from "@/lib/theme";

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
          <i aria-hidden="true" />
          {/* 和のデザインだけに出る朱の印（ほかのデザインでは非表示） */}
          <svg className="seal" viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
            <defs>
              <filter id="sealRough" x="-8%" y="-8%" width="116%" height="116%">
                <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="11" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d" />
                <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="5" result="s" />
                <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -7 5.7" result="holes" />
                <feComposite in="d" in2="holes" operator="in" />
              </filter>
            </defs>
            <g filter="url(#sealRough)">
              <rect x="3" y="3" width="42" height="42" fill="#B4362A" />
              <rect x="7" y="7" width="34" height="34" fill="none" stroke="#F4EFE3" strokeWidth="1.6" />
              <rect x="9.6" y="9.6" width="28.8" height="28.8" fill="none" stroke="#F4EFE3" strokeWidth=".7" />
              <text x="24" y="32.6" textAnchor="middle" fontFamily="var(--font-shippori), serif" fontWeight="800" fontSize="25" fill="#F4EFE3">
                晋
              </text>
            </g>
          </svg>
          S. Ohtani
        </a>
        <ul className="nav-links">
          <li><a href="#skills">{t("nav.skills")}</a></li>
          <li><a href="#works">{t("nav.works")}</a></li>
          <li><a href="#blog">{t("nav.blog")}</a></li>
          <li><a href="#architecture">{t("nav.architecture")}</a></li>
          <li><a href="#contact">{t("nav.contact")}</a></li>
        </ul>
        <div className="nav-tools">
          {/* デザインの選択（メインは「和」。通常と Pop はここから選ぶ） */}
          <select className="theme-select" aria-label={t("theme.label")} value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
            {THEMES.map((name) => (
              <option key={name} value={name}>
                {t(`theme.${name}`)}
              </option>
            ))}
          </select>
          <div className="lang-switch" role="group" aria-label={t("lang.label")}>
            <button type="button" aria-pressed={lang === "ja"} onClick={() => setLang("ja")}>JA</button>
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
          </div>
        </div>
      </nav>
    </header>
  );
}
