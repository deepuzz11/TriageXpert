import threading
import time

class InMemoryCache:
    def __init__(self):
        self.store = {}
        self.lock = threading.Lock()

    def set(self, key, value, ttl):
        with self.lock:
            self.store[key] = (value, time.time() + ttl)

    def get(self, key):
        with self.lock:
            if key in self.store:
                value, expiry = self.store[key]
                if time.time() < expiry:
                    return value
                else:
                    del self.store[key]
            return None

    def stats(self):
        with self.lock:
            return {"keys": len(self.store)}
