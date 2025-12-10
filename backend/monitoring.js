/**
 * Monitoring Service - Real-time metrics and performance tracking
 * Provides insights into chatbot usage, performance, and health
 */

class MonitoringService {
  constructor() {
    this.metrics = {
      // Request metrics
      totalRequests: 0,
      totalErrors: 0,
      requestsByEndpoint: new Map(),

      // Performance metrics
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      responseTimeSamples: [],

      // User metrics
      peakConcurrentUsers: 0,
      currentActiveUsers: 0,
      totalUniqueUsers: new Set(),

      // Time-series data
      requestsPerMinute: [],
      requestsPerHour: [],
      errorsPerMinute: [],

      // Language metrics
      languageDistribution: new Map(),

      // Conversation metrics
      avgConversationLength: 0,
      totalConversations: 0,
      activeConversations: 0,

      // Error tracking
      recentErrors: [],
      errorsByType: new Map()
    };

    this.startTime = Date.now();
    this.lastMinuteTimestamp = Date.now();
    this.lastHourTimestamp = Date.now();

    // Start automatic metrics collection
    this.startMetricsCollection();

    console.log('✅ Monitoring service initialized');
  }

  /**
   * Track a request
   */
  trackRequest(endpoint, duration, success = true, metadata = {}) {
    this.metrics.totalRequests++;

    // Track by endpoint
    const endpointStats = this.metrics.requestsByEndpoint.get(endpoint) || {
      count: 0,
      errors: 0,
      avgDuration: 0
    };
    endpointStats.count++;
    if (!success) {
      endpointStats.errors++;
      this.metrics.totalErrors++;
    }
    endpointStats.avgDuration =
      (endpointStats.avgDuration * (endpointStats.count - 1) + duration) / endpointStats.count;
    this.metrics.requestsByEndpoint.set(endpoint, endpointStats);

    // Update response time metrics
    this.updateResponseTimeMetrics(duration);

    // Track language
    if (metadata.language) {
      const langCount = this.metrics.languageDistribution.get(metadata.language) || 0;
      this.metrics.languageDistribution.set(metadata.language, langCount + 1);
    }

    // Track unique users
    if (metadata.sessionId) {
      this.metrics.totalUniqueUsers.add(metadata.sessionId);
    }
  }

  /**
   * Update response time metrics
   */
  updateResponseTimeMetrics(duration) {
    // Update avg
    this.metrics.avgResponseTime =
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + duration) /
      this.metrics.totalRequests;

    // Update min/max
    this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, duration);
    this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, duration);

    // Store sample for percentile calculations (keep last 1000)
    this.metrics.responseTimeSamples.push(duration);
    if (this.metrics.responseTimeSamples.length > 1000) {
      this.metrics.responseTimeSamples.shift();
    }
  }

  /**
   * Track an error
   */
  trackError(error, context = {}) {
    this.metrics.totalErrors++;

    // Store recent errors (keep last 50)
    this.metrics.recentErrors.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date()
    });
    if (this.metrics.recentErrors.length > 50) {
      this.metrics.recentErrors.shift();
    }

    // Count by error type
    const errorType = error.name || 'Unknown';
    const count = this.metrics.errorsByType.get(errorType) || 0;
    this.metrics.errorsByType.set(errorType, count + 1);
  }

  /**
   * Update active users count
   */
  updateActiveUsers(count) {
    this.metrics.currentActiveUsers = count;
    if (count > this.metrics.peakConcurrentUsers) {
      this.metrics.peakConcurrentUsers = count;
    }
  }

  /**
   * Track conversation metrics
   */
  trackConversation(sessionId, messageCount, isActive = true) {
    if (isActive) {
      this.metrics.activeConversations++;
    } else {
      this.metrics.totalConversations++;

      // Update avg conversation length
      this.metrics.avgConversationLength =
        (this.metrics.avgConversationLength * (this.metrics.totalConversations - 1) + messageCount) /
        this.metrics.totalConversations;
    }
  }

  /**
   * Start automatic metrics collection
   */
  startMetricsCollection() {
    // Collect per-minute metrics
    setInterval(() => {
      const now = Date.now();
      const requestsSinceLastMinute = this.metrics.totalRequests;

      this.metrics.requestsPerMinute.push({
        timestamp: new Date(),
        count: requestsSinceLastMinute - (this.lastMinuteCount || 0),
        errors: this.metrics.totalErrors - (this.lastMinuteErrors || 0)
      });

      this.lastMinuteCount = requestsSinceLastMinute;
      this.lastMinuteErrors = this.metrics.totalErrors;

      // Keep only last 60 minutes
      if (this.metrics.requestsPerMinute.length > 60) {
        this.metrics.requestsPerMinute.shift();
      }
    }, 60000); // Every minute

    // Collect per-hour metrics
    setInterval(() => {
      const requestsSinceLastHour = this.metrics.totalRequests;

      this.metrics.requestsPerHour.push({
        timestamp: new Date(),
        count: requestsSinceLastHour - (this.lastHourCount || 0),
        errors: this.metrics.totalErrors - (this.lastHourErrors || 0)
      });

      this.lastHourCount = requestsSinceLastHour;
      this.lastHourErrors = this.metrics.totalErrors;

      // Keep only last 24 hours
      if (this.metrics.requestsPerHour.length > 24) {
        this.metrics.requestsPerHour.shift();
      }
    }, 3600000); // Every hour
  }

  /**
   * Calculate response time percentiles
   */
  calculatePercentiles() {
    const samples = [...this.metrics.responseTimeSamples].sort((a, b) => a - b);
    if (samples.length === 0) return null;

    const percentile = (p) => {
      const index = Math.ceil((p / 100) * samples.length) - 1;
      return samples[Math.max(0, index)];
    };

    return {
      p50: percentile(50),
      p75: percentile(75),
      p90: percentile(90),
      p95: percentile(95),
      p99: percentile(99)
    };
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const memUsage = process.memoryUsage();

    return {
      // Summary
      summary: {
        totalRequests: this.metrics.totalRequests,
        totalErrors: this.metrics.totalErrors,
        errorRate: this.metrics.totalRequests > 0
          ? ((this.metrics.totalErrors / this.metrics.totalRequests) * 100).toFixed(2) + '%'
          : '0%',
        successRate: this.metrics.totalRequests > 0
          ? (((this.metrics.totalRequests - this.metrics.totalErrors) / this.metrics.totalRequests) * 100).toFixed(2) + '%'
          : '100%',
        totalUniqueUsers: this.metrics.totalUniqueUsers.size,
        currentActiveUsers: this.metrics.currentActiveUsers,
        peakConcurrentUsers: this.metrics.peakConcurrentUsers
      },

      // Performance
      performance: {
        avgResponseTime: Math.round(this.metrics.avgResponseTime),
        minResponseTime: this.metrics.minResponseTime === Infinity ? 0 : Math.round(this.metrics.minResponseTime),
        maxResponseTime: Math.round(this.metrics.maxResponseTime),
        percentiles: this.calculatePercentiles(),
        requestsPerSecond: this.metrics.totalRequests / (uptime / 1000)
      },

      // Conversations
      conversations: {
        total: this.metrics.totalConversations,
        active: this.metrics.activeConversations,
        avgLength: Math.round(this.metrics.avgConversationLength)
      },

      // Endpoints
      endpoints: Array.from(this.metrics.requestsByEndpoint.entries()).map(([endpoint, stats]) => ({
        endpoint,
        ...stats,
        errorRate: ((stats.errors / stats.count) * 100).toFixed(2) + '%'
      })).sort((a, b) => b.count - a.count),

      // Languages
      languages: Array.from(this.metrics.languageDistribution.entries()).map(([lang, count]) => ({
        language: lang,
        count,
        percentage: ((count / this.metrics.totalRequests) * 100).toFixed(2) + '%'
      })).sort((a, b) => b.count - a.count),

      // Time series
      timeSeries: {
        requestsPerMinute: this.metrics.requestsPerMinute,
        requestsPerHour: this.metrics.requestsPerHour
      },

      // Errors
      errors: {
        total: this.metrics.totalErrors,
        recent: this.metrics.recentErrors.slice(-10),
        byType: Array.from(this.metrics.errorsByType.entries()).map(([type, count]) => ({
          type,
          count
        }))
      },

      // System
      system: {
        uptime: uptime,
        uptimeFormatted: this.formatUptime(uptime),
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        },
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
  }

  /**
   * Get simplified health check
   */
  getHealthCheck() {
    const errorRate = this.metrics.totalRequests > 0
      ? (this.metrics.totalErrors / this.metrics.totalRequests)
      : 0;

    const avgResponseTime = this.metrics.avgResponseTime;

    return {
      status: errorRate < 0.05 && avgResponseTime < 3000 ? 'healthy' : 'degraded',
      checks: {
        errorRate: {
          status: errorRate < 0.05 ? 'pass' : 'fail',
          value: (errorRate * 100).toFixed(2) + '%',
          threshold: '< 5%'
        },
        responseTime: {
          status: avgResponseTime < 3000 ? 'pass' : 'fail',
          value: Math.round(avgResponseTime) + 'ms',
          threshold: '< 3000ms'
        },
        memory: {
          status: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'pass' : 'warn',
          value: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
          threshold: '< 500MB'
        }
      },
      timestamp: new Date()
    };
  }

  /**
   * Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Reset metrics (use with caution!)
   */
  reset() {
    this.metrics = {
      totalRequests: 0,
      totalErrors: 0,
      requestsByEndpoint: new Map(),
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      responseTimeSamples: [],
      peakConcurrentUsers: 0,
      currentActiveUsers: 0,
      totalUniqueUsers: new Set(),
      requestsPerMinute: [],
      requestsPerHour: [],
      errorsPerMinute: [],
      languageDistribution: new Map(),
      avgConversationLength: 0,
      totalConversations: 0,
      activeConversations: 0,
      recentErrors: [],
      errorsByType: new Map()
    };
    this.startTime = Date.now();
    console.log('🔄 Monitoring metrics reset');
  }
}

module.exports = new MonitoringService();
