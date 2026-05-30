import os
import logging
import json
import threading
from datetime import datetime, timedelta
from typing import Optional, Any

logger = logging.getLogger(__name__)

# Environment Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
CACHE_ENABLED = os.getenv("CACHE_ENABLED", "true").lower() == "true"


class CacheService:
    """
    Manages caching of heavy computation results (like ranking lists and text embeddings).
    Connects to Redis but transparently falls back to a thread-safe, in-memory TTL cache if Redis is offline.
    """
    
    def __init__(self):
        self._redis_client = None
        self._redis_available = False
        self._local_cache: dict[str, tuple[str, datetime]] = {}  # Maps key -> (value_json, expire_at)
        self._local_lock = threading.Lock()
        
        if CACHE_ENABLED:
            self._connect_redis()

    def _connect_redis(self):
        """Attempt to establish a connection with the Redis server."""
        try:
            import redis
            logger.info(f"Connecting to Redis at {REDIS_HOST}:{REDIS_PORT}...")
            self._redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                password=REDIS_PASSWORD,
                socket_timeout=2.0,
                decode_responses=True
            )
            # Test connection
            self._redis_client.ping()
            self._redis_available = True
            logger.info("Successfully connected to Redis. Caching is active via Redis.")
        except ImportError:
            logger.warning("Python 'redis' package is not installed. Caching will use in-memory fallback.")
            self._redis_available = False
        except Exception as e:
            logger.warning(f"Failed to connect to Redis server: {str(e)}. Caching will use in-memory fallback.")
            self._redis_available = False

    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve a value from the cache. Returns parsed object (dict/list) or None if cache miss.
        """
        if not CACHE_ENABLED:
            return None

        # 1. Try Redis
        if self._redis_available and self._redis_client:
            try:
                cached_val = self._redis_client.get(key)
                if cached_val:
                    logger.info(f"Cache HIT (Redis) for key: {key}")
                    return json.loads(cached_val)
            except Exception as e:
                logger.error(f"Redis get error: {str(e)}. Falling back to local cache.")
                self._redis_available = False  # Mark unavailable temporarily
                
        # 2. Try In-memory fallback
        with self._local_lock:
            if key in self._local_cache:
                val_json, expire_at = self._local_cache[key]
                if datetime.utcnow() < expire_at:
                    logger.info(f"Cache HIT (In-Memory) for key: {key}")
                    return json.loads(val_json)
                else:
                    # Clean up expired item
                    del self._local_cache[key]
                    logger.info(f"Cache EXPIRED (In-Memory) for key: {key}")
            
        logger.info(f"Cache MISS for key: {key}")
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        """
        Store an object in the cache (serialized as JSON) with an expiration TTL.
        """
        if not CACHE_ENABLED:
            return False

        serialized_value = json.dumps(value)

        # 1. Try Redis
        if self._redis_available and self._redis_client:
            try:
                self._redis_client.setex(key, ttl_seconds, serialized_value)
                return True
            except Exception as e:
                logger.error(f"Redis set error: {str(e)}. Falling back to local cache.")
                self._redis_available = False

        # 2. Try In-memory fallback
        with self._local_lock:
            expire_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
            self._local_cache[key] = (serialized_value, expire_at)
            
            # Prune local cache if it grows too large (keep under 500 items to conserve memory)
            if len(self._local_cache) > 500:
                self._prune_local_cache()
                
            return True

    def _prune_local_cache(self):
        """Cleans up expired items or oldest items to prevent memory bloat."""
        now = datetime.utcnow()
        # Remove all expired first
        expired_keys = [k for k, (_, exp) in self._local_cache.items() if now >= exp]
        for k in expired_keys:
            del self._local_cache[k]
        
        # If still too large, delete oldest 100 items
        if len(self._local_cache) > 400:
            keys_to_remove = list(self._local_cache.keys())[:100]
            for k in keys_to_remove:
                if k in self._local_cache:
                    del self._local_cache[k]

    def delete(self, key: str) -> bool:
        """Invalidate a specific key in both Redis and Local cache."""
        success = False
        
        if self._redis_available and self._redis_client:
            try:
                self._redis_client.delete(key)
                success = True
            except Exception as e:
                logger.error(f"Redis delete error: {str(e)}")
                self._redis_available = False

        with self._local_lock:
            if key in self._local_cache:
                del self._local_cache[key]
                success = True
                
        return success

    def clear(self) -> bool:
        """Clear all cached contents."""
        success = False
        
        if self._redis_available and self._redis_client:
            try:
                self._redis_client.flushdb()
                success = True
            except Exception as e:
                logger.error(f"Redis flush error: {str(e)}")
                self._redis_available = False

        with self._local_lock:
            self._local_cache.clear()
            success = True
            
        logger.info("Cache successfully cleared.")
        return success


# Global Cache Service Instance
cache_service = CacheService()
