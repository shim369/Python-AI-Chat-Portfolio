"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

const NOTES = [1, 2, 3] as const;
const ARROW_PATHS = [
  "M190 150 C245 150 245 62 300 62",
  "M190 182 C245 182 245 220 300 220",
  "M600 190 C645 190 645 152 690 152",
  "M450 216 L450 252",
];

export default function Architecture() {
  const { t } = useI18n();
  const figure = useRef<HTMLElement>(null);
  const moon = useRef<HTMLDivElement>(null);
  const [go, setGo] = useState(false);

  // 和のデザインの月: 仕組みの節が画面に入るにつれて、節の上から右上の定位置まで、ゆっくり降りてくる
  useEffect(() => {
    const el = moon.current;
    const section = el?.parentElement;
    if (!el || !section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let y: number | null = null;
    let raf = 0;
    const target = () => {
      const size = el.offsetWidth;
      const progress = reduce ? 1 : Math.min(1, Math.max(0, (window.innerHeight - section.getBoundingClientRect().top) / (window.innerHeight * 1.25)));
      const eased = (1 - Math.cos(Math.PI * progress)) / 2;
      const from = -size - 40;
      return from + (24 - from) * eased;
    };
    const frame = () => {
      const t = target();
      y = y === null || reduce ? t : y + (t - y) * 0.04;
      el.style.transform = `translate3d(0, ${y}px, 0)`;
      raf = !reduce && Math.abs(t - y) > 0.3 ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    kick();
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      cancelAnimationFrame(raf);
    };
  }, []);

  // アーキテクチャ図: 画面に入ったら線を順に描く
  useEffect(() => {
    const el = figure.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setGo(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="seam seam-in seam-ink" aria-hidden="true" />
      <section id="architecture" className="section section-dark">
        {/* 和のデザインだけ: 夜空の月（ほかのデザインでは非表示） */}
        <div className="moon" ref={moon} aria-hidden="true" />
        <div className="container">
          <p className="eyebrow"><b data-kan="四">04</b><span>{t("nav.architecture")}</span></p>
          <h2 className="section-title">{t("arch.title")}</h2>
          <figure className={`arch${go ? " go" : ""}`} ref={figure}>
            <svg viewBox="0 0 960 330" role="img" aria-labelledby="arch-title arch-desc">
              <title id="arch-title">{t("arch.svgTitle")}</title>
              <desc id="arch-desc">{t("arch.svgDesc")}</desc>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" className="arch-arrowhead" />
                </marker>
              </defs>
              {/* Browser */}
              <rect className="arch-box" x="20" y="120" width="170" height="90" rx="6" />
              <text className="arch-label" x="40" y="158">Browser</text>
              <text className="arch-sub" x="40" y="180">chat UI · SSE</text>
              {/* Next.js（画面） */}
              <rect className="arch-box" x="300" y="20" width="250" height="84" rx="6" />
              <text className="arch-label" x="320" y="58">Next.js (Vercel)</text>
              <text className="arch-sub" x="320" y="80">{t("arch.cdnSub")}</text>
              {/* FastAPI (tools.py runs in the same process) */}
              <rect className="arch-box arch-accent" x="300" y="140" width="300" height="185" rx="6" />
              <text className="arch-label" x="320" y="170">FastAPI Function</text>
              <text className="arch-sub" x="320" y="190">{t("arch.loop")}</text>
              <text className="arch-sub" x="320" y="208">{t("arch.ops")}</text>
              {/* tools.py */}
              <rect className="arch-box" x="320" y="252" width="260" height="62" rx="6" />
              <text className="arch-label" x="336" y="276">tools.py</text>
              <text className="arch-sub" x="336" y="298">{t("arch.toolsSub")}</text>
              {/* Gemini */}
              <rect className="arch-box" x="690" y="110" width="250" height="84" rx="6" />
              <text className="arch-label" x="710" y="148">Gemini API</text>
              <text className="arch-sub" x="710" y="170">function calling</text>
              {/* arrows（線は画面に入ると順に描かれる） */}
              {ARROW_PATHS.map((d) => (
                <path key={d} className="arch-line" pathLength={1} markerStart="url(#arrow)" markerEnd="url(#arrow)" d={d} />
              ))}
            </svg>
          </figure>
          <ul className="design-notes">
            {NOTES.map((n) => (
              <li key={n}>
                <strong>{t(`arch.note${n}.title`)}</strong>
                <span>{t(`arch.note${n}.body`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
