// デザインの切り替え（通常 / Pop）。選択は localStorage に保存し、<html data-theme="pop"> で CSS を切り替える。
// 初期状態は index.html の <head> 内のインラインスクリプトで反映済み（表示のちらつきを避けるため）
(function () {
  "use strict";

  const STORAGE_KEY = "theme";
  const root = document.documentElement;
  const buttons = document.querySelectorAll("[data-theme-set]");

  const favicon = document.getElementById("favicon");

  function sync() {
    const current = root.dataset.theme === "pop" ? "pop" : "normal";
    favicon.href = current === "pop" ? "/favicon-pop.svg" : "/favicon.svg";
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.themeSet === current));
    }
  }

  function setTheme(next) {
    if ((root.dataset.theme === "pop" ? "pop" : "normal") === next) return;
    if (next === "pop") root.dataset.theme = "pop";
    else delete root.dataset.theme;
    try {
      if (next === "pop") localStorage.setItem(STORAGE_KEY, "pop");
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage が使えない環境では、このページを開いている間だけ切り替わる
    }
    sync();
    window.dispatchEvent(new Event("themechange"));
  }

  for (const button of buttons) {
    button.addEventListener("click", () => setTheme(button.dataset.themeSet));
  }

  // Pop のフッターの大きな文字: フッターが画面に入りきるまでの進み具合（0〜1）を CSS 変数で渡す
  const footer = document.querySelector(".site-footer");
  const big = footer.querySelector(".footer-big");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let ticking = false;

  function updateFooter() {
    ticking = false;
    if (root.dataset.theme !== "pop" || reduceMotion.matches) {
      big.style.removeProperty("--footer-p");
      return;
    }
    const rect = footer.getBoundingClientRect();
    const progress = (window.innerHeight - rect.top) / rect.height;
    big.style.setProperty("--footer-p", String(Math.min(1, Math.max(0, progress))));
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateFooter);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("themechange", updateFooter);

  sync();
  updateFooter();
})();
