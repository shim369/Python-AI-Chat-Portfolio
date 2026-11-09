import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import "../styles/style.css";
import "../styles/pop.css";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" id="favicon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Dela+Gothic+One&family=DM+Mono:wght@400;500&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
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
