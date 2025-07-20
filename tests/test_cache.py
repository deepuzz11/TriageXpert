from cache import InMemoryCache
import time

def test_cache_set_get():
    cache = InMemoryCache()
    cache.set("test", "value", ttl=1)
    assert cache.get("test") == "value"
    time.sleep(1.1)
    assert cache.get("test") is None
