import type { Metadata, Viewport } from "next";
import { Anton, Dela_Gothic_One, DM_Mono, JetBrains_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import "../styles/style.css";
import "../styles/pop.css";

// Google Fonts は、ビルド時に取得してこのサイト自身のドメインから配信する（実行時に Google へは接続しない）。
// 書体は CSS 変数（--font-*）で渡し、styles/ の --display / --font / --mono から参照する
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const delaGothic = Dela_Gothic_One({ weight: "400", subsets: ["latin"], variable: "--font-dela", display: "swap", preload: false });
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-dm-mono", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });
const zenKaku = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-zen",
  display: "swap",
  preload: false,
});
const FONT_VARIABLES = [anton, delaGothic, dmMono, jetbrainsMono, zenKaku].map((f) => f.variable).join(" ");

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

// 保存済みのデザイン（Pop）を、最初の描画の前に <html> へ反映する（表示のちらつきを避けるため）
const THEME_SCRIPT = `try{if(localStorage.getItem("theme")==="pop"){document.documentElement.dataset.theme="pop";document.getElementById("favicon").href="/favicon-pop.svg"}}catch(e){}`;

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
    <html lang="en" className={FONT_VARIABLES} suppressHydrationWarning>
      <head>
        <link rel="icon" id="favicon" href="/favicon.svg" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }} />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
