"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/scrollfx";

/** 同じタブで2回目以降は出さないための印（layout.tsx の LOADER_SCRIPT と同じキー） */
export const LOADER_SEEN_KEY = "loader-seen";

const MIN_MS = 1200; // 読み込みが速くても、これだけは見せる（短すぎるとちらつきに見える）
const MAX_MS = 6000; // 読み込みが長引いても、これを超えたら閉じる
const LEAVE_MS = 500; // 画面全体が薄くなって消えるまでの時間

/**
 * 初回表示のローディング（通常デザインは名前と線、Pop は跳ねる丸のカード。どちらも名前が現れて消える）。
 * 出すかどうかは layout.tsx のインラインスクリプトが <html class="is-loading"> で決める
 * （動きを減らす設定の人と、同じタブでの2回目以降は付かないので、何も表示されない）。
 * 閉じたあとに "loader:done" を送り、ヒーローの入場アニメーションがそれに合わせて始まる。
 */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;
    if (!el || !html.classList.contains("is-loading")) return;

    let cancelled = false;
    let finished = false;
    const timers: number[] = [];

    const finish = () => {
      if (cancelled || finished) return;
      finished = true;
      el.classList.add("is-leaving");
      timers.push(
        window.setTimeout(() => {
          html.classList.remove("is-loading");
          try {
            sessionStorage.setItem(LOADER_SEEN_KEY, "1");
          } catch {
            // sessionStorage が使えない環境では、再読み込みのたびに表示される
          }
          window.dispatchEvent(new Event("loader:done"));
          // スクロール位置の計算は、ローディングを消してレイアウトが確定してからやり直す
          requestAnimationFrame(() => ScrollTrigger.refresh());
        }, LEAVE_MS)
      );
    };

    const loaded = new Promise<void>((resolve) => {
      const done = () => (document.fonts ? document.fonts.ready.then(() => resolve(), () => resolve()) : resolve());
      if (document.readyState === "complete") done();
      else window.addEventListener("load", done, { once: true });
    });
    const minimum = new Promise<void>((resolve) => {
      timers.push(window.setTimeout(resolve, Math.max(0, MIN_MS - performance.now())));
    });
    Promise.all([loaded, minimum]).then(finish);
    timers.push(window.setTimeout(finish, Math.max(0, MAX_MS - performance.now())));

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <div ref={root} className="loader" aria-hidden="true">
      <div className="loader-inner">
        {/* 通常デザインと Pop で出す部品が違う（見た目は styles/loader.css で切り替える） */}
        <i className="loader-mark">SO</i>
        <p className="loader-kicker">Portfolio / 2026</p>
        <p className="loader-name">S. OHTANI</p>
        <span className="loader-line" />
        <span className="loader-dots">
          <b />
          <b />
          <b />
        </span>
      </div>
    </div>
  );
}
