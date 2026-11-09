"use client";

import { useEffect, useRef } from "react";

/** 上部の進捗バーと、視差用の CSS 変数 --sy（スクロール量）を更新する */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY || 0;
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      root.style.setProperty("--sy", String(reduceMotion ? 0 : y));
      if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, y / max)})`;
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

  return <div className="progress" id="progress" ref={bar} aria-hidden="true" />;
}
