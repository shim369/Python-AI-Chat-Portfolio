"""外部ブログ (TECH BLOG) のトップページから最新記事を取得する。

ブログには RSS / API がないため、トップページの記事カード (div.c-card) を
標準ライブラリの HTMLParser で読み取る。マークアップが変わった場合は
空のリストを返し、フロントはブログへのリンクだけを表示する。
"""

from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from urllib.parse import urljoin

import httpx

BLOG_URL = "https://sohtani.pythonanywhere.com/"
FETCH_TIMEOUT_SECONDS = 5


@dataclass
class BlogPost:
    title: str
    url: str
    date: str
    category: str
    image: str

    def to_dict(self) -> dict[str, str]:
        return asdict(self)


class _CardParser(HTMLParser):
    def __init__(self, base_url: str):
        super().__init__()
        self.base_url = base_url
        self.posts: list[BlogPost] = []
        self._current: dict[str, str] | None = None
        self._capture: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k: v or "" for k, v in attrs}
        classes = a.get("class", "").split()
        if tag == "a" and "c-card__link" in classes:
            self._current = {
                "title": a.get("title", ""),
                "url": urljoin(self.base_url, a.get("href", "")),
                "date": "",
                "category": "",
                "image": "",
            }
        elif self._current is None:
            return
        elif tag == "img" and not self._current["image"]:
            self._current["image"] = urljoin(self.base_url, a.get("src", ""))
        elif tag == "time":
            self._current["date"] = a.get("datetime", "")
        elif tag == "div" and "c-card__category" in classes:
            self._capture = "category"
        elif tag == "h2" and "c-card__title" in classes and not self._current["title"]:
            self._capture = "title"

    def handle_data(self, data: str) -> None:
        if self._current is not None and self._capture:
            self._current[self._capture] += data.strip()

    def handle_endtag(self, tag: str) -> None:
        if tag in ("div", "h2"):
            self._capture = None
        elif tag == "a" and self._current is not None:
            if self._current["title"] and self._current["url"]:
                self.posts.append(BlogPost(**self._current))
            self._current = None


def parse_posts(html: str, base_url: str = BLOG_URL, limit: int = 3) -> list[BlogPost]:
    parser = _CardParser(base_url)
    parser.feed(html)
    # 外部 HTML 由来の値なので、リンクはブログ配下、画像は https のみに限定する
    posts = [p for p in parser.posts if p.url.startswith(base_url)]
    for p in posts:
        if not p.image.startswith("https://"):
            p.image = ""
    return posts[:limit]


async def fetch_latest_posts(limit: int = 3) -> list[BlogPost]:
    async with httpx.AsyncClient(timeout=FETCH_TIMEOUT_SECONDS, follow_redirects=True) as client:
        response = await client.get(BLOG_URL)
        response.raise_for_status()
    return parse_posts(response.text, limit=limit)
