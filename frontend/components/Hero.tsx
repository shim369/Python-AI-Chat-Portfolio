"use client";

import { useChatOpener } from "@/lib/chat-ui";
import Emblem from "@/components/Emblem";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const KEYWORDS = ["Python", "JavaScript", "TypeScript", "React", "FastAPI", "Gemini API", "AI Chat", "SQL"];
const TICKER = ["PYTHON", "JAVASCRIPT", "FASTAPI", "AI CHAT", "SQL"];

export default function Hero() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const { open } = useChatOpener();

  return (
    <>
      <section className="hero">
        {/* 和のデザインでは、背景の水の動画も、エンブレムの代わりの円相も使い分ける（動画は和のときは読み込まない） */}
        {theme === "wa" ? (
          <Emblem />
        ) : (
          <video className="hero-video" src="/images/water.mp4" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
        )}
        <div className="container">
          <div className="hero-intro">
            <p className="hero-kicker">Portfolio / 2026</p>
            <h1 className="hero-name" aria-label="Shinpei Ohtani">
              <span><b>Shinpei</b></span>
              <span><b>Ohtani</b></span>
            </h1>
            <p className="hero-eyebrow">Web Engineer / System Engineer</p>
            <p className="hero-lead">{t("hero.lead")}</p>
            <button type="button" className="btn btn-primary" onClick={open}>{t("hero.cta")}</button>
            <div className="pop-badge" aria-hidden="true">
              <svg viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="98" fill="#FF9EC4" stroke="#111" strokeWidth="3" />
                <defs>
                  <path id="pop-circ" d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0" />
                </defs>
                <text><textPath href="#pop-circ">WEB * SYSTEM * AI * PYTHON * JS *</textPath></text>
                <circle cx="100" cy="100" r="22" fill="#111" />
              </svg>
            </div>
          </div>
          {/* Pop デザインのときだけ、AIチャットのパネルがここに入る（ChatWidget） */}
          <div className="pop-chat-slot" id="pop-chat-slot" />
        </div>
      </section>

      {/* 通常デザイン: 罫線で挟んだキーワード帯 */}
      <div className="strip" aria-hidden="true">
        {KEYWORDS.map((k) => <span key={k}>{k}</span>)}
      </div>

      {/* 和のデザイン: 赤い菱形のある仕切り線（ほかのデザインでは非表示） */}
      <div className="rule" aria-hidden="true">
        <i />
      </div>

      {/* Pop デザイン: 流れるティッカー（スクロールに連動して横に動く） */}
      <div className="band" aria-hidden="true">
        <div>
          {[0, 1, 2].flatMap((round) =>
            TICKER.map((k, i) => (
              <span key={`${round}-${k}`}>
                {k}
                {!(round === 2 && i === TICKER.length - 1) && <em>/</em>}
              </span>
            ))
          )}
        </div>
      </div>
    </>
  );
}
