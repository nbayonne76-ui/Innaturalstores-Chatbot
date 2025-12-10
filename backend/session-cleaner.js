/**
 * Session Cleaner - Automatic cleanup of expired sessions
 * Prevents memory leaks by removing inactive sessions after TTL expires
 */

class SessionCleaner {
  constructor(claudeService, userProfilesMap) {
    this.claudeService = claudeService;
    this.userProfiles = userProfilesMap;
    this.sessionTimestamps = new Map();
    this.TTL = parseInt(process.env.SESSION_TTL) || (60 * 60 * 1000); // Default: 1 hour
    this.cleanupInterval = null;
    this.stats = {
      totalCleaned: 0,
      lastCleanupAt: null,
      lastCleanupCount: 0
    };
  }

  /**
   * Start automatic cleanup job
   * Runs every 5 minutes by default
   */
  start(intervalMinutes = 5) {
    if (this.cleanupInterval) {
      console.log('⚠️  Session cleaner already running');
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, intervalMs);

    console.log('✅ Session cleanup job started');
    console.log(`   - Runs every ${intervalMinutes} minutes`);
    console.log(`   - Session TTL: ${this.TTL / 1000 / 60} minutes`);

    // Run initial cleanup after 1 minute
    setTimeout(() => this.cleanupExpiredSessions(), 60000);
  }

  /**
   * Stop cleanup job
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 Session cleanup job stopped');
    }
  }

  /**
   * Update session timestamp (touch)
   * Call this on every user interaction to keep session alive
   */
  touch(sessionId) {
    this.sessionTimestamps.set(sessionId, Date.now());
  }

  /**
   * Manually mark session for deletion
   */
  markForDeletion(sessionId) {
    this.sessionTimestamps.set(sessionId, 0); // Set to epoch = immediate cleanup
  }

  /**
   * Clean up all expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;
    const expiredSessions = [];

    // Find expired sessions
    for (const [sessionId, timestamp] of this.sessionTimestamps.entries()) {
      const age = now - timestamp;

      if (age > this.TTL) {
        expiredSessions.push({ sessionId, age });
      }
    }

    // Delete expired sessions
    for (const { sessionId, age } of expiredSessions) {
      try {
        // Clear conversation history
        if (this.claudeService && this.claudeService.conversationHistory) {
          this.claudeService.conversationHistory.delete(sessionId);
        }

        // Clear user profile
        if (this.userProfiles) {
          this.userProfiles.delete(sessionId);
        }

        // Remove timestamp
        this.sessionTimestamps.delete(sessionId);

        cleaned++;
      } catch (error) {
        console.error(`❌ Error cleaning session ${sessionId}:`, error.message);
      }
    }

    // Update stats
    this.stats.totalCleaned += cleaned;
    this.stats.lastCleanupAt = new Date();
    this.stats.lastCleanupCount = cleaned;

    if (cleaned > 0) {
      console.log(`🗑️  Cleaned ${cleaned} expired sessions`);
      console.log(`   - Total cleaned since start: ${this.stats.totalCleaned}`);
      console.log(`   - Active sessions remaining: ${this.sessionTimestamps.size}`);
    }

    return cleaned;
  }

  /**
   * Force cleanup of all sessions (use with caution!)
   */
  cleanupAll() {
    const count = this.sessionTimestamps.size;

    // Clear all
    if (this.claudeService && this.claudeService.conversationHistory) {
      this.claudeService.conversationHistory.clear();
    }

    if (this.userProfiles) {
      this.userProfiles.clear();
    }

    this.sessionTimestamps.clear();

    console.log(`🗑️  Force cleaned ALL ${count} sessions`);
    return count;
  }

  /**
   * Get session statistics
   */
  getStats() {
    const timestamps = Array.from(this.sessionTimestamps.values());
    const now = Date.now();

    const sessionAges = timestamps.map(ts => now - ts);
    const activeCount = sessionAges.filter(age => age <= this.TTL).length;
    const expiredCount = sessionAges.filter(age => age > this.TTL).length;

    return {
      activeSessions: this.sessionTimestamps.size,
      activeWithinTTL: activeCount,
      expiredAwaitingCleanup: expiredCount,
      oldestSessionAge: timestamps.length > 0 ? Math.max(...sessionAges) : 0,
      newestSessionAge: timestamps.length > 0 ? Math.min(...sessionAges) : 0,
      averageSessionAge: timestamps.length > 0
        ? sessionAges.reduce((a, b) => a + b, 0) / timestamps.length
        : 0,
      ttlMinutes: this.TTL / 1000 / 60,
      totalCleaned: this.stats.totalCleaned,
      lastCleanupAt: this.stats.lastCleanupAt,
      lastCleanupCount: this.stats.lastCleanupCount,
      memoryUsage: {
        conversationHistories: this.claudeService?.conversationHistory?.size || 0,
        userProfiles: this.userProfiles?.size || 0,
        timestamps: this.sessionTimestamps.size
      }
    };
  }

  /**
   * Get detailed session info
   */
  getSessionInfo(sessionId) {
    const timestamp = this.sessionTimestamps.get(sessionId);
    if (!timestamp) return null;

    const now = Date.now();
    const age = now - timestamp;
    const timeUntilExpiry = Math.max(0, this.TTL - age);

    return {
      sessionId,
      lastActivity: new Date(timestamp),
      age: age,
      ageMinutes: (age / 1000 / 60).toFixed(2),
      expiresIn: timeUntilExpiry,
      expiresInMinutes: (timeUntilExpiry / 1000 / 60).toFixed(2),
      isExpired: age > this.TTL,
      hasConversationHistory: this.claudeService?.conversationHistory?.has(sessionId) || false,
      hasUserProfile: this.userProfiles?.has(sessionId) || false
    };
  }

  /**
   * Get all active session IDs
   */
  getActiveSessionIds() {
    const now = Date.now();
    const activeSessions = [];

    for (const [sessionId, timestamp] of this.sessionTimestamps.entries()) {
      if (now - timestamp <= this.TTL) {
        activeSessions.push(sessionId);
      }
    }

    return activeSessions;
  }
}

module.exports = SessionCleaner;
