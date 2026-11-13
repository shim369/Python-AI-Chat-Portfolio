"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { gsap, motionEnabled, reveal, ScrollTrigger } from "@/lib/scrollfx";

const REVEAL_TARGETS =
  ".eyebrow, .section-title, .section-lead, .skills-extra, .skills-more, .works-more, .blog-more, .arch, .design-notes li, .contact-form";

/**
 * ページ全体のスクロールアニメーション（画面には何も描かない）。
 * 要素を隠すのは JS からだけなので、動きを減らす設定のときは内容がそのまま表示される。
 */
export default function ScrollEffects() {
  const { lang } = useI18n();
  const { theme } = useTheme();

  // 全デザイン共通の動き
  useEffect(() => {
    if (!motionEnabled()) return;

    // CSS の scroll-behavior: smooth があると、ScrollTrigger が位置を計算し直すときの
    // スクロールまでアニメーションになり、固定の開始位置がずれて空白ができる。
    // そのため CSS 側は無効にし、ページ内リンクのなめらかなスクロールは JS で行う
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const target = link && document.getElementById(link.hash.slice(1));
      if (!link || !target) return;
      e.preventDefault();
      // 固定中のセクションは位置が変わるので、ScrollTrigger が挿入する外側の要素を基準にする
      const spacer = target.parentElement?.classList.contains("pin-spacer") ? target.parentElement : target;
      spacer.scrollIntoView({ behavior: "smooth" });
      history.pushState(null, "", link.hash);
    };
    document.addEventListener("click", onClick);

    let heroIntro: gsap.core.Tween | null = null;
    const startHeroIntro = () => heroIntro?.restart();
    // 切り替えでローディングを出し直すときは、ヒーローを隠した状態に戻して待つ
    const resetHeroIntro = () => heroIntro?.pause(0);
    const ctx = gsap.context(() => {
      // hero: 読み込み時に上から順に表示する（名前の見出しは CSS で下からせり上がる）。
      // 初回のローディング中は止めておき、ローディングが消えた合図（loader:done）で始める
      heroIntro = gsap.from(".hero .container > :not(h1)", {
        autoAlpha: 0,
        y: 24,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.12,
        paused: root.classList.contains("is-loading"),
      });
      window.addEventListener("loader:start", resetHeroIntro);
      window.addEventListener("loader:done", startHeroIntro);

      reveal("#skill-list > .skill-item");
      reveal(REVEAL_TARGETS);
    });

    return () => {
      ctx.revert();
      window.removeEventListener("loader:start", resetHeroIntro);
      window.removeEventListener("loader:done", startHeroIntro);
      document.removeEventListener("click", onClick);
      root.style.scrollBehavior = previousBehavior;
    };
  }, []);

  // セクションを画面上端で固定し、縦スクロールの量に合わせて制作物の一覧を横に流す（通常・Pop。和は、襖が開く格子状の一覧）。
  // 横並びのレイアウトは .is-horizontal が付いたときだけ効くので、無効時は通常のグリッドのまま
  const horizontalWorks = theme !== "wa";
  useEffect(() => {
    const track = document.querySelector<HTMLElement>("#project-list");
    if (!motionEnabled() || !horizontalWorks || !track) return;
    track.classList.add("is-horizontal");
    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: "#works",
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          // 小さめにして、スクロールを止めたらカードもすぐ止まるようにする（大きいと止めた後も流れ続ける）
          scrub: 0.2,
          invalidateOnRefresh: true,
          // 固定で増えた高さを後ろのセクションの発火位置に反映させるため、先に計算する
          refreshPriority: 1,
        },
      });
    });
    return () => {
      ctx.revert();
      track.classList.remove("is-horizontal");
    };
  }, [horizontalWorks]);

  // 和のデザインだけの動き。ほかのデザインに切り替えたら gsap.context ごと片付ける（インラインスタイルも元に戻る）
  useEffect(() => {
    if (!motionEnabled() || theme !== "wa") return;
    const doors = gsap.utils.toArray<HTMLElement>("#project-list > .card");
    const big = document.querySelector<HTMLElement>(".footer-big");
    const clearBig = () => {
      for (const prop of ["mask-image", "-webkit-mask-image", "opacity"]) big?.style.removeProperty(prop);
    };

    const ctx = gsap.context(() => {
      // 見出し（縦書き）: 上から下へ、墨が引かれるように現れる
      gsap.utils.toArray<HTMLElement>(".eyebrow span").forEach((heading) => {
        gsap.fromTo(
          heading,
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 1.2,
            ease: "power2.inOut",
            // 現れ終わったら切り抜きを外す（残すと、縦書きの "g" の下のはらいなど、文字の枠からはみ出した部分が切れて見える）
            clearProps: "clipPath",
            scrollTrigger: { trigger: heading, start: "top 90%", once: true },
          }
        );
      });

      // フッターの S.OHTANI: 画面に入ると、左の文字から順に、ふわっと現れる（縁をぼかしたマスクを左から右へ動かす）
      if (big) {
        const state = { p: 0 };
        const paint = () => {
          const edge = state.p * 140;
          const mask = `linear-gradient(90deg, #000 ${edge - 40}%, transparent ${edge}%)`;
          big.style.maskImage = mask;
          big.style.webkitMaskImage = mask;
          big.style.opacity = String(Math.min(1, state.p * 3));
        };
        paint();
        gsap.to(state, {
          p: 1,
          duration: 2.4,
          ease: "power1.inOut",
          onUpdate: paint,
          // 終わったらマスクを外す（文字の枠からはみ出した部分が切れないように）
          onComplete: clearBig,
          scrollTrigger: { trigger: big, start: "top 92%", once: true },
        });
      }

      // 制作物: 閉じた襖が、画面に入ると左右に開く（開く動きは CSS の transition）
      doors.forEach((card) => card.classList.add("is-closed"));
      ScrollTrigger.batch(doors, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => batch.forEach((card, i) => gsap.delayedCall(i * 0.15 + 0.1, () => card.classList.remove("is-closed"))),
      });
    });

    return () => {
      ctx.revert();
      clearBig();
      for (const card of doors) card.classList.remove("is-closed");
    };
  }, [theme]);

  // 通常デザインだけの動き。ほかのデザインに切り替えたら gsap.context ごと片付ける（インラインスタイルも元に戻る）
  useEffect(() => {
    if (!motionEnabled() || theme !== "normal") return;
    const cards = gsap.utils.toArray<HTMLElement>("#skill-list > .skill-item");

    const ctx = gsap.context(() => {
      // スクロールで薄くする演出（ヒーローの文字を上へ流しながら薄くする）
      gsap.to(".hero .container", {
        y: -60,
        autoAlpha: 0.2,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });

      // ストリップ: 罫線が中央から伸び、キーワードが左から順に現れる
      gsap
        .timeline({ scrollTrigger: { trigger: ".strip", start: "top 92%", once: true } })
        .fromTo(".strip", { clipPath: "inset(0 50% 0 50%)" }, { clipPath: "inset(0 0% 0 0%)", duration: 0.7, ease: "power2.out" })
        .from(".strip span", { autoAlpha: 0, x: -24, duration: 0.5, ease: "power2.out", stagger: 0.07 }, "-=0.3");

      // ヒーロー背景: 本文より遅く動かして奥行きを出す（拡大して、動いても端が見えないようにする）
      gsap.fromTo(
        ".hero-video",
        { scale: 1.2, yPercent: 0 },
        { yPercent: 9, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } }
      );

      // 見出し: 上から下へ現れるマスク（フェードとせり上がりは reveal 側）
      gsap.utils.toArray<HTMLElement>(".section-title").forEach((title) => {
        gsap.fromTo(
          title,
          { clipPath: "inset(0 0 100% 0)" },
          // 現れ終わったら切り抜きを外す（文字の枠からはみ出した部分が切れて見えないように）
          { clipPath: "inset(0 0% 0% 0)", duration: 0.8, ease: "power3.out", clearProps: "clipPath", scrollTrigger: { trigger: title, start: "top 88%", once: true } }
        );
      });

      // フッターの S.OHTANI: スクロールがページの一番下（フッター）に届いたら、全文字の輪郭が同時に、ペンでなぞるように一周して描かれる（塗りはしない）
      // strokeDashoffset を GSAP で直接動かすと途中の値にならず、終わりで突然現れてしまうため、数値だけを動かして自分で書き込む
      const strokes = gsap.utils.toArray<SVGPathElement>(".footer-strokes path");
      const draw = { offset: 1 };
      const setOffset = () => strokes.forEach((path) => path.style.setProperty("stroke-dashoffset", String(draw.offset)));
      strokes.forEach((path) => path.style.setProperty("stroke-dasharray", "1"));
      setOffset();
      gsap.to(draw, {
        offset: 0,
        duration: 1,
        ease: "none",
        onUpdate: setOffset,
        scrollTrigger: { trigger: ".site-footer", start: "bottom bottom+=40", once: true },
      });

      // スキル: 番号の円がポンと現れて塗りつぶされる
      cards.forEach((card) => card.classList.add("is-pre"));
      ScrollTrigger.batch(cards, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          batch.forEach((card, i) =>
            gsap.delayedCall(i * 0.08 + 0.2, () => {
              card.classList.remove("is-pre");
              card.classList.add("is-in");
            })
          ),
      });
    });

    return () => {
      ctx.revert();
      for (const card of cards) card.classList.remove("is-pre", "is-in");
      for (const path of document.querySelectorAll<SVGPathElement>(".footer-strokes path")) {
        path.style.removeProperty("stroke-dasharray");
        path.style.removeProperty("stroke-dashoffset");
      }
    };
  }, [theme]);

  // 言語やデザインの切り替えでカードの幅や高さが変わるので、描画後に計算し直す
  // （しないと、固定中の Works が切り替え前の高さのままになり、カードの下が切れる）
  useEffect(() => {
    if (!motionEnabled()) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [lang, theme]);

  return null;
}
