"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { reveal } from "@/lib/scrollfx";

type Post = { title: string; url: string; date: string; image?: string };

/** 最新記事は /api/blog（サーバー側で TECH BLOG から取得）から読み込む */
export default function Blog() {
  const { t } = useI18n();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/blog");
        const data = await res.json();
        if (!res.ok || data.posts.length === 0) throw new Error("no posts");
        if (!cancelled) setPosts(data.posts);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 記事が届いたら、画面に入るタイミングでふわっと表示する
  useEffect(() => {
    if (posts) reveal("#blog-list > .card");
  }, [posts]);

  return (
    <section id="blog" className="section">
      <div className="container">
        <p className="eyebrow"><b>03</b><span>{t("nav.blog")}</span></p>
        <h2 className="section-title">TECH BLOG</h2>
        <p className="section-lead">{t("blog.lead")}</p>
        <div className="card-grid" id="blog-list">
          {posts ? (
            posts.map((post) => (
              <article key={post.url} className="card blog-card">
                {post.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="blog-card-img" src={post.image} alt="" loading="lazy" width={309} height={160} />
                )}
                <div className="blog-card-body">
                  <time className="blog-card-date" dateTime={post.date}>{post.date.replaceAll("-", "/")}</time>
                  <h3 className="card-title">{post.title}</h3>
                  <a className="card-link" href={post.url} target="_blank" rel="noopener">{t("blog.readMore")}</a>
                </div>
              </article>
            ))
          ) : (
            <p className="blog-status" id="blog-status">{failed ? t("blog.error") : t("blog.loading")}</p>
          )}
        </div>
        <p className="blog-more">
          <a className="btn btn-ghost" href="https://sohtani.pythonanywhere.com/" target="_blank" rel="noopener">{t("blog.more")}</a>
        </p>
      </div>
    </section>
  );
}
