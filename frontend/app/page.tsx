import Architecture from "@/components/Architecture";
import Blog from "@/components/Blog";
import ChatWidget from "@/components/ChatWidget";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ScrollEffects from "@/components/ScrollEffects";
import ScrollProgress from "@/components/ScrollProgress";
import Skills from "@/components/Skills";
import Works from "@/components/Works";
import { ChatUIProvider } from "@/lib/chat-ui";

export default function Page() {
  return (
    <ChatUIProvider>
      <ScrollProgress />
      <Header />
      <main id="top">
        <Hero />
        <Skills />
        <Works />
        <Blog />
        <Architecture />
        <Contact />
      </main>
      <Footer />
      <ChatWidget />
      {/* 最後に置く: 他のコンポーネントの描画が終わってから、スクロールの動きを設定する */}
      <ScrollEffects />
    </ChatUIProvider>
  );
}
