import type { Metadata, Viewport } from "next";
import {
  Anton,
  Dela_Gothic_One,
  DM_Mono,
  IBM_Plex_Mono,
  JetBrains_Mono,
  Shippori_Mincho,
  Yuji_Syuku,
  Zen_Kaku_Gothic_New,
  Zen_Old_Mincho,
} from "next/font/google";
import type { ReactNode } from "react";
import Loader from "@/components/Loader";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import "../styles/style.css";
import "../styles/pop.css";
import "../styles/wa.css";
import "../styles/loader.css";

// Google Fonts は、ビルド時に取得してこのサイト自身のドメインから配信する（実行時に Google へは接続しない）。
// 書体は CSS 変数（--font-*）で渡し、styles/ の --display / --font / --mono から参照する。
// 通常・Pop の書体は、そのデザインを選んだときに読み込む
// 日本語の明朝体は、文字の範囲ごとに細かく分かれた数百のファイルでできている。先読み（preload）すると全部を取りに行ってしまう
// （約13MB）ので、先読みはせず、表示に使う文字の分だけをブラウザが取る。先読みするのは、小さい等幅フォントだけ
const shippori = Shippori_Mincho({ weight: ["500", "700", "800"], subsets: ["latin"], variable: "--font-shippori", display: "swap", preload: false });
const zenOld = Zen_Old_Mincho({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-zen-old", display: "swap", preload: false });
const yuji = Yuji_Syuku({ weight: "400", subsets: ["latin"], variable: "--font-yuji", display: "swap", preload: false });
const plexMono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-plex", display: "swap" });

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap", preload: false });
const delaGothic = Dela_Gothic_One({ weight: "400", subsets: ["latin"], variable: "--font-dela", display: "swap", preload: false });
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-dm-mono", display: "swap", preload: false });
const jetbrainsMono = JetBrains_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-jetbrains", display: "swap", preload: false });
const zenKaku = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-zen",
  display: "swap",
  preload: false,
});
const FONT_VARIABLES = [shippori, zenOld, yuji, plexMono, anton, delaGothic, dmMono, jetbrainsMono, zenKaku]
  .map((f) => f.variable)
  .join(" ");

const SITE_URL = "https://python-ai-chat-portfolio.vercel.app";
const TITLE = "Shinpei Ohtani | Portfolio";
const DESCRIPTION = "Portfolio of Shinpei Ohtani. Ask the AI chat about his background, skills, and projects.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Shinpei Ohtani",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    alternateLocale: ["ja_JP"],
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

// 保存済みのデザインを、最初の描画の前に <html> へ反映する（表示のちらつきを避けるため）。
// ファビコンはここでは書き換えない: <head> のリンクをあとから書き換えると、React が元のリンクをもう1つ足してしまうため、
// 読み込み後に lib/theme.tsx が切り替える。保存がなければ、メインの「和」（<html data-theme="wa">）のまま
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="normal"||t==="pop"||t==="wa"){document.documentElement.dataset.theme=t}}catch(e){}`;

// 初回表示のローディングを出すかどうかを、最初の描画の前に決める（Loader.tsx と同じキー）。
// 動きを減らす設定の人と、同じタブで2回目以降は出さない。8秒たっても閉じなかったとき（JS が動かないなど）のために、ここでも外す。
// ローディング本体（Loader.tsx）が動き出したら、この予備のタイマーは止める（あとから切り替えで出す次のローディングを消さないため）
const LOADER_SCRIPT = `try{var r=document.documentElement;if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem("loader-seen")){r.classList.add("is-loading");window.__loaderFallback=setTimeout(function(){r.classList.remove("is-loading")},8000)}}catch(e){}`;

const PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Shinpei Ohtani",
  jobTitle: "Web Engineer / System Engineer",
  url: SITE_URL,
  sameAs: ["https://github.com/shim369"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="wa" className={FONT_VARIABLES} suppressHydrationWarning>
      <head>
        <link rel="icon" id="favicon" href="/favicon-wa.svg" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LOADER_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }} />
      </head>
      <body>
        <Loader />
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
