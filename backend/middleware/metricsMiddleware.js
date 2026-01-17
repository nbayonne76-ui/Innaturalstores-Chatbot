/**
 * Metrics Collection Middleware
 * Phase 3: Automatic metrics collection for HTTP requests
 */

const metrics = require('../services/metrics');
const logger = require('../utils/logger');
const responseTime = require('response-time');

/**
 * Middleware to collect HTTP request metrics
 */
function collectHttpMetrics(req, res, next) {
  const start = Date.now();

  // Record when response finishes
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Record metrics
    metrics.recordHttpRequest(method, route, statusCode, duration);

    // Log slow requests (> 5 seconds)
    if (duration > 5) {
      logger.warn('Slow request detected', {
        method,
        route,
        duration: `${duration.toFixed(2)}s`,
        statusCode,
      });
    }
  });

  next();
}

/**
 * Response time header middleware
 * Adds X-Response-Time header to responses
 */
const addResponseTimeHeader = responseTime((req, res, time) => {
  // time is in milliseconds
  res.setHeader('X-Response-Time', `${time.toFixed(2)}ms`);
});

/**
 * Middleware to track active sessions
 * Should be called when session count changes
 */
function updateSessionsMetric(sessionManager) {
  return (req, res, next) => {
    if (sessionManager && sessionManager.getSessionCount) {
      const count = sessionManager.getSessionCount();
      metrics.setActiveSessions(count);
    }
    next();
  };
}

/**
 * Error tracking middleware
 * Records errors in metrics
 */
function trackErrors(err, req, res, next) {
  // Determine error type
  let errorType = 'unknown';
  if (err.name) {
    errorType = err.name;
  } else if (err.code) {
    errorType = err.code;
  }

  // Determine severity
  let severity = 'error';
  if (res.statusCode >= 500) {
    severity = 'critical';
  } else if (res.statusCode >= 400) {
    severity = 'warning';
  }

  // Record error metric
  metrics.recordError(errorType, severity);

  // Pass error to next handler
  next(err);
}

/**
 * Validation error tracking middleware
 * Integrates with validation middleware
 */
function trackValidationErrors(errors) {
  if (Array.isArray(errors)) {
    errors.forEach(error => {
      if (error.field) {
        metrics.recordValidationError(error.field);
      }
    });
  }
}

/**
 * Rate limit tracking middleware
 * Records when rate limits are hit
 */
function trackRateLimitHit(req) {
  const route = req.route ? req.route.path : req.path;
  metrics.recordRateLimitHit(route);
}

/**
 * Chat message tracking wrapper
 * Wraps chat endpoints to track messages
 */
function trackChatMessage(role, language) {
  metrics.recordChatMessage(role, language);
}

/**
 * AI request tracking wrapper
 * Tracks AI API calls
 */
function trackAIRequest(model, startTime, success, promptTokens = 0, completionTokens = 0) {
  const duration = (Date.now() - startTime) / 1000; // seconds
  metrics.recordAIRequest(model, duration, success, promptTokens, completionTokens);
}

/**
 * Database query tracking wrapper
 * Tracks database operations
 */
function trackDbQuery(operation, model, startTime) {
  const duration = (Date.now() - startTime) / 1000; // seconds
  metrics.recordDbQuery(operation, model, duration);
}

/**
 * Redis operation tracking wrapper
 */
function trackRedisOperation(operation, success) {
  metrics.recordRedisOperation(operation, success);
}

/**
 * Product recommendation tracking
 */
function trackProductRecommendation(productId, clicked = false) {
  metrics.recordProductRecommendation(productId, clicked);
}

/**
 * User feedback tracking
 */
function trackUserFeedback(rating) {
  metrics.recordUserFeedback(rating);
}

/**
 * Initialize metrics collection
 */
function initMetricsCollection() {
  metrics.initMetrics();
  logger.info('✅ Metrics collection initialized');
}

module.exports = {
  collectHttpMetrics,
  addResponseTimeHeader,
  updateSessionsMetric,
  trackErrors,
  trackValidationErrors,
  trackRateLimitHit,
  trackChatMessage,
  trackAIRequest,
  trackDbQuery,
  trackRedisOperation,
  trackProductRecommendation,
  trackUserFeedback,
  initMetricsCollection,
};
