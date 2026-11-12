"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function Footer() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const footer = useRef<HTMLElement>(null);
  const big = useRef<HTMLDivElement>(null);

  // Pop のフッターの大きな文字: フッターが画面に入りきるまでの進み具合（0〜1）を CSS 変数で渡す
  useEffect(() => {
    const el = footer.current;
    const text = big.current;
    if (!el || !text) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ticking = false;
    const update = () => {
      ticking = false;
      if (theme !== "pop" || reduceMotion.matches) {
        text.style.removeProperty("--footer-p");
        return;
      }
      const rect = el.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / rect.height;
      text.style.setProperty("--footer-p", String(Math.min(1, Math.max(0, progress))));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [theme]);

  return (
    <footer className="site-footer" ref={footer}>
      <div className="container footer-inner">
        {/* 通常デザイン: 元の太い書体（Anton）の輪郭を SVG にしたもの。ページの一番下に届くと輪郭線が引かれる（ScrollEffects） */}
        <svg className="footer-svg" viewBox="0 0 378.9 104.0" aria-hidden="true" focusable="false">
          <g className="footer-strokes">
          <path pathLength={1} d="M29.7 102Q16.2 102 10.3 95.3Q4.3 88.6 4.3 74V64.4H23.8V76.7Q23.8 80.1 24.8 82Q25.8 83.9 28.4 83.9Q31.1 83.9 32.1 82.4Q33.1 80.8 33.1 77.2Q33.1 72.7 32.2 69.7Q31.4 66.6 29.1 63.9Q26.9 61.1 23 57.4L14.2 49Q4.3 39.7 4.3 27.7Q4.3 15.2 10.2 8.6Q16 2 27.1 2Q40.6 2 46.2 9.2Q51.9 16.4 51.9 31.1H31.9V24.3Q31.9 22.3 30.8 21.2Q29.6 20.1 27.7 20.1Q25.3 20.1 24.2 21.4Q23.1 22.7 23.1 24.8Q23.1 26.8 24.3 29.2Q25.4 31.6 28.7 34.8L40 45.6Q43.4 48.9 46.3 52.5Q49.1 56.1 50.8 60.8Q52.6 65.6 52.6 72.5Q52.6 86.3 47.5 94.2Q42.3 102 29.7 102Z" />
          <path pathLength={1} d="M57.8 101.1V84.4H77.8V101.1Z" />
          <path pathLength={1} d="M108.6 102Q96.9 102 90.6 94.9Q84.4 87.8 84.4 74.3V27.7Q84.4 15.1 90.6 8.5Q96.8 2 108.6 2Q120.5 2 126.7 8.5Q132.9 15.1 132.9 27.7V74.3Q132.9 87.8 126.6 94.9Q120.4 102 108.6 102Z" />
          <path pathLength={1} d="M108.8 83.9Q113.3 83.9 113.3 75.3V27.3Q113.3 20.1 108.9 20.1Q104 20.1 104 27.5V75.4Q104 80 105.1 81.9Q106.2 83.9 108.8 83.9Z" />
          <path pathLength={1} d="M140.8 101.1V2.9H160.3V38H169.6V2.9H189.1V101.1H169.6V56.6H160.3V101.1Z" />
          <path pathLength={1} d="M206.2 101.1V21.8H194.6V2.9H237.5V21.8H225.9V101.1Z" />
          <path pathLength={1} d="M240.3 101.1 249.8 2.9H283.1L292.5 101.1H273.9L272.5 85.3H260.6L259.4 101.1Z" />
          <path pathLength={1} d="M262 69.6H271L266.7 19.6H265.8Z" />
          <path pathLength={1} d="M298.5 101.1V2.9H318.7L327.7 49.9V2.9H346.7V101.1H327.5L317.7 52V101.1Z" />
          <path pathLength={1} d="M354.5 101.1V2.9H373.5V101.1Z" />
          </g>
        </svg>
        {/* Pop デザイン: 黄色い文字 */}
        <div className="footer-big" ref={big} aria-hidden="true">S.OHTANI</div>
        <div className="footer-row">
          <p className="footer-thanks">{t("footer.thanks")}</p>
          <p className="footer-copy">&copy; Shinpei Ohtani</p>
        </div>
      </div>
    </footer>
  );
}
