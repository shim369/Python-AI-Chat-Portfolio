"use client";

import { useEffect } from "react";

/** 進捗バーと、視差用の CSS 変数 --sy（スクロール量）を更新する */
export default function ScrollProgress() {
  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY || 0;
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      root.style.setProperty("--sy", String(reduceMotion ? 0 : y));
      // 進み具合（0〜1）を <html> の CSS 変数で渡す。横の細い線（通常・Pop）か、右端の縦線（和）か、
      // フッターの文字の動きかは、各デザインの CSS が決める
      root.style.setProperty("--progress", String(Math.min(1, y / max)));
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

  return <div className="progress" id="progress" aria-hidden="true" />;
}
