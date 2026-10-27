from app.blog import parse_posts

BASE = "https://blog.example.com/"


def card(href: str, title: str, date: str, img: str = "/media/a.jpg") -> str:
    return f"""
<div class="c-card">
  <a class="c-card__link" href="{href}" title="{title}">
    <div class="c-card__img"><picture>
      <source srcset="/media/a.webp" type="image/webp">
      <img src="{img}" width="309" height="160" alt="a">
    </picture></div>
    <div class="c-card__text">
      <div class="c-card__category">read</div>
      <h2 class="c-card__title">{title[:10]}…</h2>
      <time class="c-card__time" datetime="{date}">{date}</time>
    </div>
  </a>
</div>"""


def test_parse_posts_returns_latest_three_with_full_title():
    html = "".join(card(f"/post-{i}/", f"Post number {i} full title", f"2026-10-0{i}") for i in range(1, 5))
    posts = parse_posts(html, base_url=BASE)
    assert [p.url for p in posts] == [f"{BASE}post-{i}/" for i in range(1, 4)]
    assert posts[0].title == "Post number 1 full title"
    assert posts[0].date == "2026-10-01"
    assert posts[0].image == f"{BASE}media/a.jpg"
    assert posts[0].category == "read"


def test_parse_posts_drops_external_links_and_non_https_images():
    html = card("https://evil.example.com/x/", "External", "2026-01-01") + card(
        "/ok/", "Internal", "2026-01-02", img="http://insecure.example.com/a.jpg"
    )
    posts = parse_posts(html, base_url=BASE)
    assert [p.title for p in posts] == ["Internal"]
    assert posts[0].image == ""


def test_parse_posts_returns_empty_list_when_markup_changes():
    assert parse_posts("<html><body><p>no cards</p></body></html>", base_url=BASE) == []
