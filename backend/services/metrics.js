/**
 * Prometheus Metrics Service
 * Phase 3: Application metrics collection and exposition
 */

const client = require('prom-client');
const logger = require('../utils/logger');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'innatural_chatbot_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// ===========================================
// CUSTOM METRICS
// ===========================================

/**
 * HTTP Request Duration Histogram
 * Tracks response time for HTTP requests
 */
const httpRequestDuration = new client.Histogram({
  name: 'innatural_chatbot_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10], // seconds
  registers: [register],
});

/**
 * HTTP Request Counter
 * Total number of HTTP requests
 */
const httpRequestTotal = new client.Counter({
  name: 'innatural_chatbot_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * Active Sessions Gauge
 * Number of currently active chat sessions
 */
const activeSessions = new client.Gauge({
  name: 'innatural_chatbot_active_sessions',
  help: 'Number of active chat sessions',
  registers: [register],
});

/**
 * Chat Messages Counter
 * Total number of chat messages processed
 */
const chatMessagesTotal = new client.Counter({
  name: 'innatural_chatbot_messages_total',
  help: 'Total number of chat messages',
  labelNames: ['role', 'language'],
  registers: [register],
});

/**
 * AI Request Duration Histogram
 * Time taken for AI (OpenAI) requests
 */
const aiRequestDuration = new client.Histogram({
  name: 'innatural_chatbot_ai_request_duration_seconds',
  help: 'Duration of AI API requests in seconds',
  labelNames: ['model', 'success'],
  buckets: [0.5, 1, 2, 5, 10, 30], // seconds
  registers: [register],
});

/**
 * AI Tokens Usage Counter
 * Total tokens consumed by AI requests
 */
const aiTokensTotal = new client.Counter({
  name: 'innatural_chatbot_ai_tokens_total',
  help: 'Total number of AI tokens used',
  labelNames: ['model', 'type'], // type: prompt | completion
  registers: [register],
});

/**
 * Database Query Duration Histogram
 * Time taken for database queries
 */
const dbQueryDuration = new client.Histogram({
  name: 'innatural_chatbot_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2], // seconds
  registers: [register],
});

/**
 * Database Connections Gauge
 * Number of active database connections
 */
const dbConnections = new client.Gauge({
  name: 'innatural_chatbot_db_connections',
  help: 'Number of active database connections',
  registers: [register],
});

/**
 * Redis Operations Counter
 * Total Redis operations
 */
const redisOperationsTotal = new client.Counter({
  name: 'innatural_chatbot_redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'success'],
  registers: [register],
});

/**
 * Error Counter
 * Total number of errors by type
 */
const errorsTotal = new client.Counter({
  name: 'innatural_chatbot_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'],
  registers: [register],
});

/**
 * Product Recommendations Counter
 * Total product recommendations made
 */
const productRecommendationsTotal = new client.Counter({
  name: 'innatural_chatbot_product_recommendations_total',
  help: 'Total number of product recommendations',
  labelNames: ['product_id', 'clicked'],
  registers: [register],
});

/**
 * User Feedback Counter
 * Total user feedback received
 */
const userFeedbackTotal = new client.Counter({
  name: 'innatural_chatbot_user_feedback_total',
  help: 'Total user feedback received',
  labelNames: ['rating'],
  registers: [register],
});

/**
 * Rate Limit Hits Counter
 * Number of requests blocked by rate limiting
 */
const rateLimitHits = new client.Counter({
  name: 'innatural_chatbot_rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint'],
  registers: [register],
});

/**
 * Validation Errors Counter
 * Number of validation errors
 */
const validationErrors = new client.Counter({
  name: 'innatural_chatbot_validation_errors_total',
  help: 'Total number of validation errors',
  labelNames: ['field'],
  registers: [register],
});

// ===========================================
// METRIC COLLECTION FUNCTIONS
// ===========================================

/**
 * Record HTTP request metrics
 */
function recordHttpRequest(method, route, statusCode, durationSeconds) {
  httpRequestDuration.labels(method, route, statusCode).observe(durationSeconds);
  httpRequestTotal.labels(method, route, statusCode).inc();
}

/**
 * Update active sessions count
 */
function setActiveSessions(count) {
  activeSessions.set(count);
}

/**
 * Record chat message
 */
function recordChatMessage(role, language) {
  chatMessagesTotal.labels(role, language).inc();
}

/**
 * Record AI request
 */
function recordAIRequest(model, durationSeconds, success, promptTokens = 0, completionTokens = 0) {
  aiRequestDuration.labels(model, success ? 'true' : 'false').observe(durationSeconds);

  if (promptTokens > 0) {
    aiTokensTotal.labels(model, 'prompt').inc(promptTokens);
  }
  if (completionTokens > 0) {
    aiTokensTotal.labels(model, 'completion').inc(completionTokens);
  }
}

/**
 * Record database query
 */
function recordDbQuery(operation, model, durationSeconds) {
  dbQueryDuration.labels(operation, model).observe(durationSeconds);
}

/**
 * Update database connections
 */
function setDbConnections(count) {
  dbConnections.set(count);
}

/**
 * Record Redis operation
 */
function recordRedisOperation(operation, success) {
  redisOperationsTotal.labels(operation, success ? 'true' : 'false').inc();
}

/**
 * Record error
 */
function recordError(type, severity = 'error') {
  errorsTotal.labels(type, severity).inc();
}

/**
 * Record product recommendation
 */
function recordProductRecommendation(productId, clicked = false) {
  productRecommendationsTotal.labels(productId, clicked ? 'true' : 'false').inc();
}

/**
 * Record user feedback
 */
function recordUserFeedback(rating) {
  userFeedbackTotal.labels(rating.toString()).inc();
}

/**
 * Record rate limit hit
 */
function recordRateLimitHit(endpoint) {
  rateLimitHits.labels(endpoint).inc();
}

/**
 * Record validation error
 */
function recordValidationError(field) {
  validationErrors.labels(field).inc();
}

// ===========================================
// METRICS EXPOSITION
// ===========================================

/**
 * Get metrics in Prometheus format
 */
async function getMetrics() {
  return register.metrics();
}

/**
 * Get metrics as JSON
 */
async function getMetricsJSON() {
  const metrics = await register.getMetricsAsJSON();
  return metrics;
}

/**
 * Get specific metric value
 */
async function getMetricValue(metricName) {
  const metrics = await register.getSingleMetric(metricName);
  return metrics ? metrics.get() : null;
}

/**
 * Reset all metrics (useful for testing)
 */
function resetMetrics() {
  register.resetMetrics();
  logger.warn('All metrics have been reset');
}

/**
 * Get metrics summary for dashboard
 */
async function getMetricsSummary() {
  try {
    const metrics = await getMetricsJSON();

    // Extract key metrics
    const summary = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        avgDuration: 0,
      },
      sessions: {
        active: 0,
      },
      messages: {
        total: 0,
        byRole: {},
        byLanguage: {},
      },
      ai: {
        requests: 0,
        avgDuration: 0,
        tokensUsed: 0,
      },
      database: {
        connections: 0,
        avgQueryDuration: 0,
      },
      errors: {
        total: 0,
        byType: {},
      },
    };

    // Parse metrics (simplified extraction)
    for (const metric of metrics) {
      if (metric.name === 'innatural_chatbot_http_requests_total') {
        summary.requests.total = metric.values.reduce((sum, v) => sum + v.value, 0);
      }
      if (metric.name === 'innatural_chatbot_active_sessions') {
        summary.sessions.active = metric.values[0]?.value || 0;
      }
      if (metric.name === 'innatural_chatbot_messages_total') {
        summary.messages.total = metric.values.reduce((sum, v) => sum + v.value, 0);
      }
      if (metric.name === 'innatural_chatbot_errors_total') {
        summary.errors.total = metric.values.reduce((sum, v) => sum + v.value, 0);
      }
      if (metric.name === 'innatural_chatbot_db_connections') {
        summary.database.connections = metric.values[0]?.value || 0;
      }
    }

    return summary;
  } catch (error) {
    logger.error('Error getting metrics summary', { error: error.message });
    return null;
  }
}

/**
 * Initialize metrics service
 */
function initMetrics() {
  logger.info('✅ Prometheus metrics initialized');
  logger.info('   Metrics endpoint: /metrics');
  logger.info('   Dashboard endpoint: /api/metrics/summary');
}

module.exports = {
  // Initialization
  initMetrics,

  // Recording functions
  recordHttpRequest,
  setActiveSessions,
  recordChatMessage,
  recordAIRequest,
  recordDbQuery,
  setDbConnections,
  recordRedisOperation,
  recordError,
  recordProductRecommendation,
  recordUserFeedback,
  recordRateLimitHit,
  recordValidationError,

  // Exposition
  getMetrics,
  getMetricsJSON,
  getMetricValue,
  getMetricsSummary,
  resetMetrics,

  // Raw register (for advanced usage)
  register,
};
