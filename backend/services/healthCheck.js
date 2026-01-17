/**
 * Enhanced Health Check Service
 * Phase 3: Comprehensive system health monitoring
 */

const logger = require('../utils/logger');

// Health check results cache
let lastHealthCheck = null;
let lastHealthCheckTime = null;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Check database health
 */
async function checkDatabase(db) {
  const start = Date.now();
  try {
    const health = await db.getHealthStatus();
    const duration = Date.now() - start;

    return {
      status: health.connected ? 'healthy' : 'unhealthy',
      connected: health.connected,
      responseTime: duration,
      error: health.error || null,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      responseTime: Date.now() - start,
      error: error.message,
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedis(redisManager) {
  const start = Date.now();
  try {
    // isConnected is a property, not a method
    const connected = redisManager.isConnected && redisManager.client;
    const duration = Date.now() - start;

    if (!connected) {
      return {
        status: 'degraded',
        connected: false,
        responseTime: duration,
        message: 'Redis not available (using fallback)',
      };
    }

    // Try a ping
    const pingStart = Date.now();
    await redisManager.client.ping();
    const pingDuration = Date.now() - pingStart;

    return {
      status: 'healthy',
      connected: true,
      responseTime: pingDuration,
      message: 'Redis operational',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      responseTime: Date.now() - start,
      error: error.message,
    };
  }
}

/**
 * Check AI service health (OpenAI)
 */
async function checkAIService() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      status: 'unhealthy',
      configured: false,
      message: 'OpenAI API key not configured',
    };
  }

  // Basic validation - just check if key exists and has correct format
  const isValid = apiKey.startsWith('sk-') && apiKey.length > 20;

  return {
    status: isValid ? 'healthy' : 'unhealthy',
    configured: true,
    message: isValid ? 'API key configured' : 'API key format invalid',
  };
}

/**
 * Check memory usage
 */
function checkMemory() {
  const used = process.memoryUsage();
  const totalMB = Math.round(used.heapTotal / 1024 / 1024);
  const usedMB = Math.round(used.heapUsed / 1024 / 1024);
  const externalMB = Math.round(used.external / 1024 / 1024);
  const usagePercent = ((used.heapUsed / used.heapTotal) * 100).toFixed(2);

  let status = 'healthy';
  if (usagePercent > 90) {
    status = 'critical';
  } else if (usagePercent > 75) {
    status = 'warning';
  }

  return {
    status,
    heap: {
      total: `${totalMB}MB`,
      used: `${usedMB}MB`,
      external: `${externalMB}MB`,
      usage: `${usagePercent}%`,
    },
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
  };
}

/**
 * Check CPU usage (approximate)
 */
function checkCPU() {
  const usage = process.cpuUsage();
  const uptimeMs = process.uptime() * 1000000; // Convert to microseconds

  const userPercent = ((usage.user / uptimeMs) * 100).toFixed(2);
  const systemPercent = ((usage.system / uptimeMs) * 100).toFixed(2);
  const totalPercent = (parseFloat(userPercent) + parseFloat(systemPercent)).toFixed(2);

  let status = 'healthy';
  if (totalPercent > 80) {
    status = 'warning';
  } else if (totalPercent > 95) {
    status = 'critical';
  }

  return {
    status,
    user: `${userPercent}%`,
    system: `${systemPercent}%`,
    total: `${totalPercent}%`,
  };
}

/**
 * Check disk space (if available)
 */
function checkDiskSpace() {
  // This is a simplified check - in production, use a library like 'check-disk-space'
  return {
    status: 'healthy',
    message: 'Disk space check not implemented',
  };
}

/**
 * Get system uptime
 */
function getUptime() {
  const uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  let uptimeString = '';
  if (days > 0) uptimeString += `${days}d `;
  if (hours > 0) uptimeString += `${hours}h `;
  if (minutes > 0) uptimeString += `${minutes}m `;
  uptimeString += `${seconds}s`;

  return {
    seconds: Math.floor(uptimeSeconds),
    formatted: uptimeString.trim(),
    startTime: new Date(Date.now() - uptimeSeconds * 1000).toISOString(),
  };
}

/**
 * Perform comprehensive health check
 */
async function performHealthCheck(services = {}) {
  const { db, redisManager } = services;

  // Check if we have a recent cached result
  if (lastHealthCheck && lastHealthCheckTime && (Date.now() - lastHealthCheckTime < CACHE_TTL)) {
    return lastHealthCheck;
  }

  const startTime = Date.now();

  // Run all checks in parallel
  const [
    databaseHealth,
    redisHealth,
    aiHealth,
    memoryHealth,
    cpuHealth,
    diskHealth,
  ] = await Promise.all([
    db ? checkDatabase(db) : Promise.resolve({ status: 'unknown', message: 'Not configured' }),
    redisManager ? checkRedis(redisManager) : Promise.resolve({ status: 'unknown', message: 'Not configured' }),
    checkAIService(),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkCPU()),
    Promise.resolve(checkDiskSpace()),
  ]);

  const uptime = getUptime();

  // Determine overall status
  const statuses = [
    databaseHealth.status,
    redisHealth.status === 'degraded' ? 'healthy' : redisHealth.status, // Redis is optional
    aiHealth.status,
    memoryHealth.status,
    cpuHealth.status,
  ];

  let overallStatus = 'healthy';
  if (statuses.includes('unhealthy') || statuses.includes('critical')) {
    overallStatus = 'unhealthy';
  } else if (statuses.includes('warning') || statuses.includes('degraded')) {
    overallStatus = 'degraded';
  }

  const healthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    responseTime: Date.now() - startTime,
    services: {
      database: databaseHealth,
      redis: redisHealth,
      ai: aiHealth,
    },
    system: {
      memory: memoryHealth,
      cpu: cpuHealth,
      disk: diskHealth,
      nodejs: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };

  // Cache the result
  lastHealthCheck = healthCheck;
  lastHealthCheckTime = Date.now();

  // Log if unhealthy
  if (overallStatus !== 'healthy') {
    logger.warn('Health check failed', { status: overallStatus, services: healthCheck.services });
  }

  return healthCheck;
}

/**
 * Get simple liveness check (for k8s liveness probe)
 */
function getLivenessCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get simple readiness check (for k8s readiness probe)
 */
async function getReadinessCheck(services = {}) {
  const { db } = services;

  // Check if critical services are ready
  const ready = db ? (await db.getHealthStatus()).connected : true;

  return {
    status: ready ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Clear health check cache
 */
function clearCache() {
  lastHealthCheck = null;
  lastHealthCheckTime = null;
}

module.exports = {
  performHealthCheck,
  getLivenessCheck,
  getReadinessCheck,
  clearCache,
  checkDatabase,
  checkRedis,
  checkAIService,
  checkMemory,
  checkCPU,
  getUptime,
};
