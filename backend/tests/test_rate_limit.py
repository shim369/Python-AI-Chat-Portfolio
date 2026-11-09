from app.rate_limit import RateLimiter, SlidingWindowLimiter


def test_sliding_window_allows_again_after_the_window_passes():
    limiter = SlidingWindowLimiter(limit=2, window_seconds=60)
    for now in (0, 1):
        assert limiter.has_room("a", now)
        limiter.record("a", now)
    assert not limiter.has_room("a", 2)
    assert limiter.has_room("a", 60.5)


def test_zero_limit_means_unlimited():
    limiter = SlidingWindowLimiter(limit=0, window_seconds=60)
    for now in range(100):
        assert limiter.has_room("a", now)
        limiter.record("a", now)


def test_per_ip_limits_are_independent():
    limiter = RateLimiter(per_ip_per_minute=1, per_ip_per_day=0, global_per_minute=0)
    assert limiter.check("1.1.1.1", now=0) is None
    assert limiter.check("2.2.2.2", now=0) is None
    assert limiter.check("1.1.1.1", now=1) == "ip_minute"


def test_daily_limit_applies_after_minute_window_resets():
    limiter = RateLimiter(per_ip_per_minute=5, per_ip_per_day=2, global_per_minute=0)
    assert limiter.check("ip", now=0) is None
    assert limiter.check("ip", now=100) is None
    assert limiter.check("ip", now=200) == "ip_day"


def test_global_limit_covers_all_ips():
    limiter = RateLimiter(per_ip_per_minute=0, per_ip_per_day=0, global_per_minute=2)
    assert limiter.check("a", now=0) is None
    assert limiter.check("b", now=0) is None
    assert limiter.check("c", now=0) == "global_minute"


def test_rejected_requests_do_not_consume_other_windows():
    limiter = RateLimiter(per_ip_per_minute=1, per_ip_per_day=0, global_per_minute=2)
    assert limiter.check("a", now=0) is None
    # "a" は分あたりの上限で拒否される。このとき全体の枠は消費しない
    assert limiter.check("a", now=1) == "ip_minute"
    assert limiter.check("b", now=2) is None
