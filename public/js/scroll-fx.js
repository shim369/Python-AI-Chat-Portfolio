// GSAP + ScrollTrigger によるスクロールアニメーション。
// 要素を隠すのは JS からだけにしているので、GSAP の読み込みに失敗しても内容はそのまま表示される。
// main.js が描画する一覧（スキル・制作物・ブログ）は、描画後に main.js から reveal() を呼ぶ
(function () {
  "use strict";

  const enabled =
    typeof window.gsap !== "undefined" &&
    typeof window.ScrollTrigger !== "undefined" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 画面に入ったら下からふわっと表示する。まとめて入った要素は少しずつずらす
  function reveal(targets) {
    if (!enabled) return;
    const nodes = gsap.utils.toArray(targets);
    if (nodes.length === 0) return;
    gsap.set(nodes, { autoAlpha: 0, y: 24 });
    ScrollTrigger.batch(nodes, {
      start: "top 88%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.08, overwrite: true }),
    });
    // 後から描画された要素でページの高さが変わるので、発火位置を計算し直す
    ScrollTrigger.refresh();
  }

  window.SCROLL_FX = { reveal };

  if (!enabled) return;
  gsap.registerPlugin(ScrollTrigger);

  // hero: 読み込み時に上から順に表示し、スクロールに合わせて文字を上へ流しながら薄くする
  gsap.from(".hero .container > *", { autoAlpha: 0, y: 24, duration: 0.8, ease: "power2.out", stagger: 0.12 });
  gsap.to(".hero .container", {
    y: -60,
    autoAlpha: 0.2,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  reveal(
    ".section-title, .section-lead, .skills-extra, .skills-more, .works-more, .blog-more, .arch, .design-notes li, .contact-form"
  );
})();
