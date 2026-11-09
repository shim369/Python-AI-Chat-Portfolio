import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const config: NextConfig = {
  reactStrictMode: true,
  // 開発サーバーに 127.0.0.1 でアクセスしたときも、ブラウザ側の JS（HMR・hydration）を許可する
  allowedDevOrigins: ["127.0.0.1"],
  // 本番は Vercel が /api/* を backend（FastAPI）へ振り分ける（ルートの vercel.json）。
  // 開発中だけ、/api/* をローカルの FastAPI（backend/ で uvicorn app.main:app --port 8000）へ転送する
  ...(isDev && {
    async rewrites() {
      const api = process.env.API_ORIGIN ?? "http://127.0.0.1:8000";
      return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
    },
  }),
};

export default config;
