"""メモリ内の簡易レート制限（スライディングウィンドウ）。

Vercel のサーバーレス環境ではインスタンスごとにメモリが分かれるため、
インスタンスをまたいだ厳密な制限ではない。Gemini 無料枠を使い切らないための安全柵として使う。
"""

import time
from collections import defaultdict, deque


class SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: float):
        self.limit = limit  # 0 以下は無制限
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def has_room(self, key: str, now: float) -> bool:
        if self.limit <= 0:
            return True
        hits = self._hits[key]
        while hits and now - hits[0] >= self.window_seconds:
            hits.popleft()
        return len(hits) < self.limit

    def record(self, key: str, now: float) -> None:
        if self.limit > 0:
            self._hits[key].append(now)


class RateLimiter:
    """IP ごとの分あたり・日あたりの上限と、インスタンス全体の分あたりの上限をまとめて判定する。"""

    GLOBAL_KEY = "*"

    def __init__(self, per_ip_per_minute: int, per_ip_per_day: int, global_per_minute: int):
        self._ip_limits = {
            "ip_minute": SlidingWindowLimiter(per_ip_per_minute, 60),
            "ip_day": SlidingWindowLimiter(per_ip_per_day, 86400),
        }
        self._global = SlidingWindowLimiter(global_per_minute, 60)

    def check(self, ip: str, now: float | None = None) -> str | None:
        """許可なら記録して None、拒否なら記録せずに当たった上限の名前を返す。"""
        now = time.monotonic() if now is None else now
        checks = [(name, limiter, ip) for name, limiter in self._ip_limits.items()]
        checks.append(("global_minute", self._global, self.GLOBAL_KEY))
        for name, limiter, key in checks:
            if not limiter.has_room(key, now):
                return name
        for _, limiter, key in checks:
            limiter.record(key, now)
        return None
