/**
 * Monitoring & Observability Middleware
 * Phase 3: Sentry Error Tracking & Performance Monitoring
 */

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('../utils/logger');

// Initialize Sentry (only if DSN is provided)
let sentryEnabled = false;

/**
 * Initialize Sentry error tracking
 */
function initSentry(app) {
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    logger.info('📊 Sentry not configured (SENTRY_DSN not set)');
    logger.info('   Error tracking will use Winston logs only');
    return false;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || '1.0.0',

      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Profiling
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        new ProfilingIntegration(),
      ],

      // Ignore common errors
      ignoreErrors: [
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
        'AbortError',
      ],

      // Before send hook - filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from request
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
        }

        // Remove sensitive data from extra
        if (event.extra) {
          delete event.extra.password;
          delete event.extra.token;
          delete event.extra.apiKey;
        }

        return event;
      },
    });

    // Request handler - must be first middleware
    if (app) {
      app.use(Sentry.Handlers.requestHandler());
      app.use(Sentry.Handlers.tracingHandler());
    }

    sentryEnabled = true;
    logger.info('✅ Sentry error tracking initialized');
    logger.info(`   Environment: ${process.env.NODE_ENV}`);
    logger.info(`   Traces sample rate: ${process.env.NODE_ENV === 'production' ? '10%' : '100%'}`);

    return true;
  } catch (error) {
    logger.error('Failed to initialize Sentry', { error: error.message });
    return false;
  }
}

/**
 * Get Sentry error handler middleware
 * Must be used after all routes
 */
function getSentryErrorHandler() {
  if (!sentryEnabled) {
    return (err, req, res, next) => {
      // Fallback error handler
      logger.logError(err, {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      next(err);
    };
  }

  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors
      return true;
    },
  });
}

/**
 * Manually capture an exception
 */
function captureException(error, context = {}) {
  if (sentryEnabled) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  // Also log with Winston
  logger.logError(error, context);
}

/**
 * Manually capture a message
 */
function captureMessage(message, level = 'info', context = {}) {
  if (sentryEnabled) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }

  // Also log with Winston
  logger[level](message, context);
}

/**
 * Set user context for error tracking
 */
function setUserContext(userId, email = null, username = null) {
  if (sentryEnabled) {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  }
}

/**
 * Add breadcrumb for debugging
 */
function addBreadcrumb(message, category = 'custom', data = {}) {
  if (sentryEnabled) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}

/**
 * Create a transaction for performance monitoring
 */
function startTransaction(name, op = 'http') {
  if (!sentryEnabled) {
    return {
      finish: () => {},
      setStatus: () => {},
      setData: () => {},
      startChild: () => ({ finish: () => {} }),
    };
  }

  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Middleware to track request performance
 */
function performanceMiddleware(req, res, next) {
  if (!sentryEnabled) {
    return next();
  }

  const transaction = Sentry.startTransaction({
    op: 'http.server',
    name: `${req.method} ${req.path}`,
  });

  // Store transaction in request for nested spans
  req.sentryTransaction = transaction;

  res.on('finish', () => {
    transaction.setHttpStatus(res.statusCode);
    transaction.finish();
  });

  next();
}

/**
 * Create a span within a transaction
 */
function createSpan(req, operation, description) {
  if (!sentryEnabled || !req.sentryTransaction) {
    return { finish: () => {} };
  }

  return req.sentryTransaction.startChild({
    op: operation,
    description,
  });
}

/**
 * Track custom event
 */
function trackEvent(eventName, data = {}) {
  if (sentryEnabled) {
    Sentry.captureMessage(`Event: ${eventName}`, {
      level: 'info',
      extra: {
        eventName,
        ...data,
      },
    });
  }

  logger.info(`Event: ${eventName}`, data);
}

/**
 * Flush Sentry events (useful before shutdown)
 */
async function flush(timeout = 2000) {
  if (sentryEnabled) {
    try {
      await Sentry.close(timeout);
      logger.info('Sentry events flushed');
    } catch (error) {
      logger.error('Error flushing Sentry', { error: error.message });
    }
  }
}

/**
 * Get Sentry status
 */
function getStatus() {
  return {
    enabled: sentryEnabled,
    environment: process.env.NODE_ENV || 'development',
    dsn: sentryEnabled ? 'configured' : 'not configured',
  };
}

module.exports = {
  initSentry,
  getSentryErrorHandler,
  captureException,
  captureMessage,
  setUserContext,
  addBreadcrumb,
  startTransaction,
  performanceMiddleware,
  createSpan,
  trackEvent,
  flush,
  getStatus,
  Sentry, // Export raw Sentry for advanced usage
};
