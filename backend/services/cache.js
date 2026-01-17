/**
 * Caching Service
 * Phase 5: Performance & Optimization
 *
 * Multi-layer caching with Redis (persistent) and Memory (fast fallback)
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// In-memory cache (fast, fallback)
const memoryCache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every 60s
  useClones: false, // Better performance
});

// Redis client reference (will be injected)
let redisClient = null;
let redisAvailable = false;

/**
 * Initialize cache with Redis client
 */
function initCache(redis) {
  if (redis && redis.isConnected && redis.client) {
    redisClient = redis.client;
    redisAvailable = true;
    logger.info('✅ Cache service initialized with Redis');
  } else {
    logger.info('📝 Cache service initialized with memory-only (Redis not available)');
  }

  // Log cache stats periodically
  setInterval(() => {
    const stats = memoryCache.getStats();
    if (stats.keys > 0) {
      logger.debug('Cache stats', {
        keys: stats.keys,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%',
      });
    }
  }, 300000); // Every 5 minutes
}

/**
 * Get value from cache (tries Redis first, then memory)
 */
async function get(key) {
  try {
    // Try Redis first (if available)
    if (redisAvailable && redisClient) {
      const redisValue = await redisClient.get(`cache:${key}`);
      if (redisValue !== null) {
        logger.debug('Cache HIT (Redis)', { key });
        return JSON.parse(redisValue);
      }
    }

    // Fallback to memory cache
    const memValue = memoryCache.get(key);
    if (memValue !== undefined) {
      logger.debug('Cache HIT (Memory)', { key });
      return memValue;
    }

    logger.debug('Cache MISS', { key });
    return null;
  } catch (error) {
    logger.error('Cache get error', { key, error: error.message });
    return null;
  }
}

/**
 * Set value in cache (both Redis and memory)
 */
async function set(key, value, ttl = 300) {
  try {
    // Set in memory cache
    memoryCache.set(key, value, ttl);

    // Set in Redis (if available)
    if (redisAvailable && redisClient) {
      await redisClient.setex(`cache:${key}`, ttl, JSON.stringify(value));
      logger.debug('Cache SET (Redis + Memory)', { key, ttl });
    } else {
      logger.debug('Cache SET (Memory only)', { key, ttl });
    }

    return true;
  } catch (error) {
    logger.error('Cache set error', { key, error: error.message });
    return false;
  }
}

/**
 * Delete value from cache
 */
async function del(key) {
  try {
    // Delete from memory
    memoryCache.del(key);

    // Delete from Redis
    if (redisAvailable && redisClient) {
      await redisClient.del(`cache:${key}`);
    }

    logger.debug('Cache DELETE', { key });
    return true;
  } catch (error) {
    logger.error('Cache delete error', { key, error: error.message });
    return false;
  }
}

/**
 * Clear all cache
 */
async function flush() {
  try {
    // Clear memory cache
    memoryCache.flushAll();

    // Clear Redis cache
    if (redisAvailable && redisClient) {
      const keys = await redisClient.keys('cache:*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }

    logger.info('Cache flushed');
    return true;
  } catch (error) {
    logger.error('Cache flush error', { error: error.message });
    return false;
  }
}

/**
 * Get cache statistics
 */
function getStats() {
  const memStats = memoryCache.getStats();

  return {
    memory: {
      keys: memStats.keys,
      hits: memStats.hits,
      misses: memStats.misses,
      hitRate: memStats.hits + memStats.misses > 0
        ? ((memStats.hits / (memStats.hits + memStats.misses)) * 100).toFixed(2) + '%'
        : '0%',
    },
    redis: {
      available: redisAvailable,
    },
  };
}

/**
 * Cache middleware for Express routes
 */
function cacheMiddleware(ttl = 300, keyGenerator = null) {
  return async (req, res, next) => {
    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `${req.method}:${req.path}:${JSON.stringify(req.query)}`;

    // Try to get from cache
    const cachedResponse = await get(cacheKey);

    if (cachedResponse) {
      // Add cache header
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    // Cache miss - intercept response
    res.setHeader('X-Cache', 'MISS');

    // Store original json function
    const originalJson = res.json.bind(res);

    // Override json function to cache response
    res.json = function (body) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        set(cacheKey, body, ttl).catch(err =>
          logger.error('Cache middleware error', { error: err.message })
        );
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Cache wrapper for functions
 */
async function cached(key, ttl, fn) {
  // Try cache first
  const cachedValue = await get(key);
  if (cachedValue !== null) {
    return cachedValue;
  }

  // Execute function
  const result = await fn();

  // Cache result
  await set(key, result, ttl);

  return result;
}

/**
 * Invalidate cache by pattern
 */
async function invalidatePattern(pattern) {
  try {
    // Clear matching keys from memory
    const memKeys = memoryCache.keys();
    memKeys.forEach(key => {
      if (key.includes(pattern)) {
        memoryCache.del(key);
      }
    });

    // Clear matching keys from Redis
    if (redisAvailable && redisClient) {
      const keys = await redisClient.keys(`cache:*${pattern}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }

    logger.info('Cache invalidated by pattern', { pattern });
    return true;
  } catch (error) {
    logger.error('Cache invalidate pattern error', { pattern, error: error.message });
    return false;
  }
}

module.exports = {
  initCache,
  get,
  set,
  del,
  flush,
  getStats,
  cacheMiddleware,
  cached,
  invalidatePattern,
};
