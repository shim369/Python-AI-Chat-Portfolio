"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/scrollfx";

/** 同じタブで2回目以降は出さないための印（layout.tsx の LOADER_SCRIPT と同じキー） */
export const LOADER_SEEN_KEY = "loader-seen";

/** デザインを切り替えるときに lib/theme.tsx が送る合図。ローディングをもう一度出して、ページを先頭から見せ直す */
export const LOADER_START_EVENT = "loader:start";

const MIN_MS = 1200; // 読み込みが速くても、これだけは見せる（短すぎるとちらつきに見える）
const MAX_MS = 6000; // 読み込みが長引いても、これを超えたら閉じる
const LEAVE_MS = 500; // 画面全体が薄くなって消えるまでの時間

/**
 * ローディング（和は朱の印と名前、通常は名前と線、Pop は跳ねる丸のカード。どれも名前が現れて消える）。
 * 出る場面は2つ:
 *  1. 初回表示: layout.tsx のインラインスクリプトが <html class="is-loading"> を付けたとき
 *     （動きを減らす設定の人と、同じタブでの2回目以降は付かないので、何も表示されない）
 *  2. デザインの切り替え（和 / 通常 / Pop）: "loader:start" を受けたとき（切り替えのたびに、先頭から見せ直す）
 * 閉じたあとに "loader:done" を送り、ヒーローの入場アニメーションがそれに合わせて始まる。
 */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;
    if (!el) return;
    // layout.tsx の予備のタイマー（8秒で強制的に閉じる）は、ここから先を Loader 自身に任せるので止める
    window.clearTimeout((window as unknown as { __loaderFallback?: number }).__loaderFallback);

    let cancelled = false;
    let finished = true;
    let timers: number[] = [];

    const clearTimers = () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers = [];
    };

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

    /** ローディングを始める（initial: 初回表示のとき。<html> の印はスクリプトが付け済み） */
    const run = (initial: boolean) => {
      clearTimers();
      finished = false;
      el.classList.remove("is-leaving");
      if (!initial) html.classList.add("is-loading");

      const loaded = new Promise<void>((resolve) => {
        const done = () => (document.fonts ? document.fonts.ready.then(() => resolve(), () => resolve()) : resolve());
        if (document.readyState === "complete") done();
        else window.addEventListener("load", done, { once: true });
      });
      const elapsed = initial ? performance.now() : 0;
      const minimum = new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, Math.max(0, MIN_MS - elapsed)));
      });
      Promise.all([loaded, minimum]).then(finish);
      timers.push(window.setTimeout(finish, Math.max(0, MAX_MS - elapsed)));
    };

    // 切り替えのとき: ページを先頭に戻し、ヒーローの名前のせり上がり（CSS）も最初からやり直す
    const onStart = () => {
      if (html.classList.contains("is-loading")) return;
      window.scrollTo(0, 0);
      for (const b of document.querySelectorAll<HTMLElement>(".hero-name b")) {
        b.style.animation = "none";
        void b.offsetWidth; // 強制的に再計算して、アニメーションを最初から始める
        b.style.animation = "";
      }
      run(false);
    };

    window.addEventListener(LOADER_START_EVENT, onStart);
    if (html.classList.contains("is-loading")) run(true);

    return () => {
      cancelled = true;
      clearTimers();
      window.removeEventListener(LOADER_START_EVENT, onStart);
    };
  }, []);

  return (
    <div ref={root} className="loader" aria-hidden="true">
      <div className="loader-inner">
        {/* デザインごとに出す部品が違う（見た目は styles/loader.css で切り替える） */}
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
