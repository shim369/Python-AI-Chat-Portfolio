// GSAP + ScrollTrigger によるスクロールアニメーション（クライアント専用）。
// 要素を隠すのは JS からだけにしているので、GSAP が使えない（動きを減らす設定など）ときも内容はそのまま表示される。
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function motionEnabled(): boolean {
  return typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 画面に入ったら下からふわっと表示する。まとめて入った要素は少しずつずらす */
export function reveal(targets: string): void {
  if (!motionEnabled()) return;
  const nodes = gsap.utils.toArray<HTMLElement>(targets);
  if (nodes.length === 0) return;
  gsap.set(nodes, { autoAlpha: 0, y: 24 });
  ScrollTrigger.batch(nodes, {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.08, overwrite: "auto" }),
  });
  // 後から描画された要素でページの高さが変わるので、発火位置を計算し直す
  ScrollTrigger.refresh();
}

export { gsap, ScrollTrigger };
