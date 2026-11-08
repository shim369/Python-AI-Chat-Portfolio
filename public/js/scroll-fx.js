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
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.08, overwrite: "auto" }),
    });
    // 後から描画された要素でページの高さが変わるので、発火位置を計算し直す
    ScrollTrigger.refresh();
  }

  // セクションを画面上端で固定し、縦スクロールの量に合わせて一覧を横に流す（通常・Pop 共通）。
  // 横並びのレイアウトは .is-horizontal が付いたときだけ効くので、無効時は通常のグリッドのまま
  function horizontal(section, track) {
    if (!enabled) return;
    const trackEl = document.querySelector(track);
    trackEl.classList.add("is-horizontal");
    const distance = () => Math.max(0, trackEl.scrollWidth - trackEl.clientWidth);
    gsap.to(trackEl, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + distance(),
        pin: true,
        scrub: 0.5,
        invalidateOnRefresh: true,
        // 固定で増えた高さを後ろのセクションの発火位置に反映させるため、先に計算する
        refreshPriority: 1,
      },
    });
  }

  window.SCROLL_FX = { reveal, horizontal };

  // 言語切り替えでカードが描画し直されると幅や高さが変わるので、描画後に計算し直す
  if (enabled) window.I18N.onChange(() => requestAnimationFrame(() => ScrollTrigger.refresh()));

  if (!enabled) return;
  gsap.registerPlugin(ScrollTrigger);

  // CSS の scroll-behavior: smooth があると、ScrollTrigger が位置を計算し直すときの
  // スクロールまでアニメーションになり、固定の開始位置がずれて空白ができる。
  // そのため CSS 側は無効にし、ページ内リンクのなめらかなスクロールは JS で行う
  document.documentElement.style.scrollBehavior = "auto";
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    const target = link && document.getElementById(link.hash.slice(1));
    if (!target) return;
    e.preventDefault();
    // 固定中のセクションは位置が変わるので、ScrollTrigger が挿入する外側の要素を基準にする
    const spacer = target.parentElement.classList.contains("pin-spacer") ? target.parentElement : target;
    spacer.scrollIntoView({ behavior: "smooth" });
    history.pushState(null, "", link.hash);
  });

  // hero: 読み込み時に上から順に表示し（名前の見出しは CSS で下からせり上がる）、スクロールに合わせて文字を上へ流しながら薄くする
  gsap.from(".hero .container > :not(h1)", { autoAlpha: 0, y: 24, duration: 0.8, ease: "power2.out", stagger: 0.12 });
  // スクロールで薄くする演出は通常デザインだけ（Pop ではヒーローのタイルを薄くしない）
  let heroFade = null;
  const isPop = () => document.documentElement.dataset.theme === "pop";

  function syncHeroFade() {
    if (isPop()) {
      if (!heroFade) return;
      heroFade.scrollTrigger.kill();
      heroFade.kill();
      heroFade = null;
      gsap.set(".hero .container", { clearProps: "opacity,visibility,transform" });
    } else if (!heroFade) {
      heroFade = gsap.to(".hero .container", {
        y: -60,
        autoAlpha: 0.2,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
    }
  }

  syncHeroFade();
  window.addEventListener("themechange", syncHeroFade);

  // 通常デザインだけの追加の動き。Pop に切り替えたら gsap.context ごと片付ける（インラインスタイルも元に戻る）
  let normalFx = null;

  function syncNormalFx() {
    if (isPop()) {
      if (normalFx) normalFx.revert();
      normalFx = null;
      return;
    }
    if (normalFx) return;
    normalFx = gsap.context(() => {
      // ストリップ: 罫線が中央から伸び、キーワードが左から順に現れる
      gsap
        .timeline({ scrollTrigger: { trigger: ".strip", start: "top 92%", once: true } })
        .fromTo(
          ".strip",
          { clipPath: "inset(0 50% 0 50%)" },
          { clipPath: "inset(0 0% 0 0%)", duration: 0.7, ease: "power2.out" }
        )
        .from(".strip span", { autoAlpha: 0, x: -24, duration: 0.5, ease: "power2.out", stagger: 0.07 }, "-=0.3");

      // ヒーロー背景: 本文より遅く動かして奥行きを出す（拡大して、動いても端が見えないようにする）
      gsap.fromTo(
        ".hero-video",
        { scale: 1.2, yPercent: 0 },
        {
          yPercent: 9,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
        }
      );

      // 見出し: 上から下へ現れるマスク（フェードとせり上がりは reveal 側）
      gsap.utils.toArray(".section-title").forEach((title) => {
        gsap.fromTo(
          title,
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: title, start: "top 88%", once: true },
          }
        );
      });

      // フッターの S.OHTANI: 画面に届いたら、線が一文字ずつ引かれていく
      const strokes = gsap.utils.toArray(".footer-strokes path");
      gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.to(strokes, {
        strokeDashoffset: 0,
        duration: 1.1,
        ease: "power1.inOut",
        stagger: 0.28,
        scrollTrigger: { trigger: ".site-footer", start: "top 85%", once: true },
      });

      // スキル: 番号の円がポンと現れて塗りつぶされる。言語切り替えで描画し直した分は最初から塗りつぶし
      const cards = gsap.utils.toArray("#skill-list > .skill-item");
      cards.forEach((card) => card.classList.add("is-pre"));
      ScrollTrigger.batch(cards, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          batch.forEach((card, i) =>
            gsap.delayedCall(i * 0.08 + 0.2, () => card.classList.replace("is-pre", "is-in"))
          ),
      });
    });
  }

  syncNormalFx();
  window.addEventListener("themechange", syncNormalFx);

  reveal(
    ".eyebrow, .section-title, .section-lead, .skills-extra, .skills-more, .works-more, .blog-more, .arch, .design-notes li, .contact-form"
  );
})();
