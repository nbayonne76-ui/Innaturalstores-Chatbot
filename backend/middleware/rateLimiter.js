/**
 * Advanced Rate Limiting Configuration
 * Phase 2: Per-endpoint rate limiting with Redis support
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const logger = require('../utils/logger');

// Try to use Redis for rate limiting if available
let useRedisStore = false;
let redisClient = null;

/**
 * Initialize Redis store for rate limiting
 */
async function initRedisStore() {
  if (process.env.REDIS_HOST) {
    try {
      const { createClient } = require('redis');
      redisClient = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
        password: process.env.REDIS_PASSWORD || undefined,
      });

      await redisClient.connect();
      useRedisStore = true;
      logger.info('✅ Redis rate limiting enabled');
      return true;
    } catch (error) {
      logger.warn('⚠️  Redis not available for rate limiting, using memory store', {
        error: error.message,
      });
      return false;
    }
  }
  return false;
}

/**
 * Get store configuration for rate limiter
 */
function getStore() {
  if (useRedisStore && redisClient) {
    return new RedisStore({
      client: redisClient,
      prefix: 'rl:', // Rate limit prefix
    });
  }
  return undefined; // Use default memory store
}

/**
 * Custom handler for rate limit exceeded
 */
function rateLimitExceeded(req, res) {
  logger.logSecurity('rate_limit_exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
  });

  res.status(429).json({
    success: false,
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
}

/**
 * Standard key generator using IP address
 */
function standardKeyGenerator(req) {
  return req.ip;
}

/**
 * Session-based key generator
 */
function sessionKeyGenerator(req) {
  const sessionId = req.body?.sessionId || req.query?.sessionId || req.params?.sessionId;
  return sessionId ? `session:${sessionId}` : req.ip;
}

// ===========================================
// RATE LIMITER CONFIGURATIONS
// ===========================================

/**
 * Strict rate limiter - For sensitive operations
 * 5 requests per minute
 */
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  handler: rateLimitExceeded,
  keyGenerator: standardKeyGenerator,
});

/**
 * Standard rate limiter - For normal API endpoints
 * 30 requests per minute
 */
const standardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  handler: rateLimitExceeded,
  keyGenerator: standardKeyGenerator,
});

/**
 * Chat rate limiter - For chat endpoints
 * 20 messages per minute per session
 */
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many messages sent. Please wait before sending more.',
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  handler: rateLimitExceeded,
  keyGenerator: sessionKeyGenerator,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

/**
 * Generous rate limiter - For read-only endpoints
 * 100 requests per minute
 */
const generousLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests.',
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  handler: rateLimitExceeded,
  keyGenerator: standardKeyGenerator,
});

/**
 * Authentication rate limiter - For login/auth endpoints
 * 5 attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  handler: rateLimitExceeded,
  keyGenerator: standardKeyGenerator,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * File upload rate limiter - For file upload endpoints
 * 10 uploads per hour
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many file uploads. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  handler: rateLimitExceeded,
  keyGenerator: standardKeyGenerator,
});

/**
 * API key based rate limiter - For API key authenticated requests
 * 1000 requests per hour
 */
const apiKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: 'API key rate limit exceeded.',
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  handler: rateLimitExceeded,
  keyGenerator: (req) => {
    const apiKey = req.headers['x-api-key'];
    return apiKey ? `apikey:${apiKey}` : req.ip;
  },
});

/**
 * Global rate limiter - Apply to all requests
 * 200 requests per 5 minutes
 */
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200,
  message: 'Too many requests from this IP.',
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  handler: rateLimitExceeded,
  keyGenerator: standardKeyGenerator,
  skip: (req) => {
    // Skip for health check and monitoring endpoints
    return req.path === '/api/health' || req.path === '/api/monitoring/health';
  },
});

/**
 * Create custom rate limiter with specific options
 */
function createLimiter(options) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore(),
    handler: rateLimitExceeded,
    keyGenerator: standardKeyGenerator,
    ...options,
  });
}

module.exports = {
  initRedisStore,
  strictLimiter,
  standardLimiter,
  chatLimiter,
  generousLimiter,
  authLimiter,
  uploadLimiter,
  apiKeyLimiter,
  globalLimiter,
  createLimiter,
};
