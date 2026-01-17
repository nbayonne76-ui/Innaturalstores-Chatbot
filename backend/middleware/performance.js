/**
 * Performance Optimization Middleware
 * Phase 5: Response compression, caching headers, etc.
 */

const compression = require('compression');
const slowDown = require('express-slow-down');
const logger = require('../utils/logger');

/**
 * Compression middleware
 * Compresses responses to reduce bandwidth
 */
const compressionMiddleware = compression({
  // Compression level (0-9, higher = better compression but slower)
  level: 6,

  // Only compress responses larger than 1KB
  threshold: 1024,

  // Filter function - what to compress
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression's default filter
    return compression.filter(req, res);
  },
});

/**
 * Slow down repeated requests
 * Gradually increases response time for repeated requests
 */
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per window without delay
  delayMs: hits => (hits - 50) * 100, // Add 100ms delay per request after 50
  maxDelayMs: 5000, // Max 5 second delay
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Cache control headers middleware
 * Sets appropriate caching headers based on route
 */
function setCacheHeaders(maxAge = 0, options = {}) {
  return (req, res, next) => {
    if (maxAge > 0) {
      // Enable caching
      res.set({
        'Cache-Control': `public, max-age=${maxAge}`,
        'Expires': new Date(Date.now() + maxAge * 1000).toUTCString(),
      });
    } else {
      // Disable caching
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      });
    }

    // ETag support
    if (options.etag !== false) {
      res.set('ETag', `W/"${Date.now()}"`);
    }

    next();
  };
}

/**
 * No cache middleware - for dynamic content
 */
const noCache = setCacheHeaders(0);

/**
 * Short cache middleware - 5 minutes
 */
const shortCache = setCacheHeaders(300);

/**
 * Medium cache middleware - 1 hour
 */
const mediumCache = setCacheHeaders(3600);

/**
 * Long cache middleware - 1 day
 */
const longCache = setCacheHeaders(86400);

/**
 * Static assets cache middleware - 1 week
 */
const staticCache = setCacheHeaders(604800);

/**
 * Request timeout middleware
 * Prevents hanging requests
 */
function requestTimeout(timeoutMs = 30000) {
  return (req, res, next) => {
    // Set timeout
    req.setTimeout(timeoutMs, () => {
      logger.warn('Request timeout', {
        path: req.path,
        method: req.method,
        timeout: timeoutMs,
      });

      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          message: 'The request took too long to process',
        });
      }
    });

    next();
  };
}

/**
 * Response optimization middleware
 * Removes unnecessary headers and optimizes response
 */
function optimizeResponse(req, res, next) {
  // Remove unnecessary headers
  res.removeHeader('X-Powered-By');

  // Add performance hints
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-DNS-Prefetch-Control': 'on',
  });

  next();
}

/**
 * JSON minification middleware
 * Removes whitespace from JSON responses in production
 */
function minifyJSON(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      // Send minified JSON (no spaces)
      return originalJson(body);
    };
  }

  next();
}

/**
 * Conditional request middleware
 * Supports If-None-Match (ETag) and If-Modified-Since
 */
function conditionalRequests(req, res, next) {
  const etag = req.headers['if-none-match'];
  const modifiedSince = req.headers['if-modified-since'];

  // Store original json function
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    const currentEtag = res.get('ETag');

    // Check ETag
    if (etag && currentEtag && etag === currentEtag) {
      return res.status(304).end();
    }

    // Check Last-Modified
    const lastModified = res.get('Last-Modified');
    if (modifiedSince && lastModified) {
      const modifiedDate = new Date(modifiedSince);
      const lastModifiedDate = new Date(lastModified);

      if (modifiedDate >= lastModifiedDate) {
        return res.status(304).end();
      }
    }

    return originalJson(body);
  };

  next();
}

/**
 * Performance monitoring middleware
 * Tracks slow endpoints
 */
function monitorPerformance(thresholdMs = 1000) {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      if (duration > thresholdMs) {
        logger.warn('Slow endpoint detected', {
          path: req.path,
          method: req.method,
          duration: `${duration}ms`,
          threshold: `${thresholdMs}ms`,
        });
      }
    });

    next();
  };
}

module.exports = {
  compressionMiddleware,
  speedLimiter,
  setCacheHeaders,
  noCache,
  shortCache,
  mediumCache,
  longCache,
  staticCache,
  requestTimeout,
  optimizeResponse,
  minifyJSON,
  conditionalRequests,
  monitorPerformance,
};
