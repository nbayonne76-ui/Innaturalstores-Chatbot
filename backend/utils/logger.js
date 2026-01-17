const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  // Add errors stack trace
  winston.format.errors({ stack: true }),
  // Format for production (JSON)
  process.env.NODE_ENV === 'production'
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
        )
      )
);

// Define which logs to write based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : process.env.LOG_LEVEL || 'info';
};

// Create logs directory if it doesn't exist
const logDir = process.env.LOG_DIR || path.join(__dirname, '../logs');
const fs = require('fs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define transports
const transports = [
  // Console transport (always enabled)
  new winston.transports.Console({
    level: level(),
    format: format,
  }),

  // Error log file (daily rotation)
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d', // Keep logs for 30 days
    maxSize: '20m', // Rotate when file reaches 20MB
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),

  // Combined log file (daily rotation)
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    maxSize: '20m',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),

  // HTTP requests log (daily rotation)
  new DailyRotateFile({
    filename: path.join(logDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxFiles: '14d', // Keep HTTP logs for 14 days
    maxSize: '20m',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper methods for structured logging
logger.logRequest = (req, res, duration) => {
  logger.http('HTTP Request', {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
};

logger.logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

logger.logAIRequest = (model, tokensUsed, duration, success) => {
  logger.info('AI API Request', {
    model,
    tokensUsed,
    duration: `${duration}ms`,
    success,
  });
};

logger.logConversation = (sessionId, action, details = {}) => {
  logger.info('Conversation Event', {
    sessionId,
    action, // start, message, end
    ...details,
  });
};

logger.logSecurity = (event, details = {}) => {
  logger.warn('Security Event', {
    event, // rate_limit, invalid_input, auth_failure
    ...details,
  });
};

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason.message || reason,
    stack: reason.stack,
    promise: promise.toString(),
  });
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });
  // Give logger time to write logs before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

module.exports = logger;
