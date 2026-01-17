/**
 * Redis Session Manager - Persistent session storage with automatic TTL
 * Provides scalable, production-ready session management
 */

const Redis = require('ioredis');

class RedisSessionManager {
  constructor(config = {}) {
    this.config = {
      host: process.env.REDIS_HOST || config.host || 'localhost',
      port: parseInt(process.env.REDIS_PORT || config.port || 6379),
      password: process.env.REDIS_PASSWORD || config.password,
      db: parseInt(process.env.REDIS_DB || config.db || 0),
      keyPrefix: process.env.REDIS_KEY_PREFIX || config.keyPrefix || 'innatural:',
      ttl: parseInt(process.env.SESSION_TTL || config.ttl || 3600), // 1 hour default
      retryStrategy: (times) => {
        // Give up after 20 attempts
        if (times > 20) {
          console.log('❌ Redis retry limit reached, giving up');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        console.log(`⏳ Redis retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      }
    };

    this.client = null;
    this.isConnected = false;
    this.stats = {
      totalReads: 0,
      totalWrites: 0,
      totalDeletes: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      this.client = new Redis(this.config);

      // Connection event handlers
      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        console.log(`   - Host: ${this.config.host}:${this.config.port}`);
        console.log(`   - DB: ${this.config.db}`);
        console.log(`   - Key prefix: ${this.config.keyPrefix}`);
        console.log(`   - TTL: ${this.config.ttl}s (${this.config.ttl / 60} minutes)`);
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis error:', error.message);
        this.stats.errors++;
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      // Test connection
      await this.client.ping();
      console.log('✅ Redis ping successful');

      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      console.log('⚠️  Falling back to in-memory sessions');
      this.client = null;
      return false;
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable() {
    return this.client !== null && this.isConnected;
  }

  /**
   * Generate Redis key for session
   */
  getSessionKey(sessionId) {
    return `${this.config.keyPrefix}session:${sessionId}`;
  }

  /**
   * Save session data to Redis
   */
  async saveSession(sessionId, data) {
    if (!this.isAvailable()) {
      throw new Error('Redis not available');
    }

    try {
      const key = this.getSessionKey(sessionId);
      const serialized = JSON.stringify(data);

      // Save with TTL
      await this.client.setex(key, this.config.ttl, serialized);

      this.stats.totalWrites++;
      return true;
    } catch (error) {
      console.error(`❌ Error saving session ${sessionId}:`, error.message);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Get session data from Redis
   */
  async getSession(sessionId) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const key = this.getSessionKey(sessionId);
      const data = await this.client.get(key);

      this.stats.totalReads++;

      if (data) {
        this.stats.cacheHits++;
        return JSON.parse(data);
      } else {
        this.stats.cacheMisses++;
        return null;
      }
    } catch (error) {
      console.error(`❌ Error getting session ${sessionId}:`, error.message);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Update session TTL (extend session lifetime)
   */
  async touchSession(sessionId, additionalTtl = null) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const key = this.getSessionKey(sessionId);
      const ttl = additionalTtl || this.config.ttl;

      const result = await this.client.expire(key, ttl);
      return result === 1; // Returns 1 if key exists, 0 if not
    } catch (error) {
      console.error(`❌ Error touching session ${sessionId}:`, error.message);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete session from Redis
   */
  async deleteSession(sessionId) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const key = this.getSessionKey(sessionId);
      const result = await this.client.del(key);

      this.stats.totalDeletes++;
      return result === 1;
    } catch (error) {
      console.error(`❌ Error deleting session ${sessionId}:`, error.message);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get all active session IDs
   */
  async getAllSessionIds() {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const pattern = this.getSessionKey('*');
      const keys = await this.client.keys(pattern);

      // Remove prefix to get session IDs
      const prefixLength = this.getSessionKey('').length;
      return keys.map(key => key.substring(prefixLength));
    } catch (error) {
      console.error('❌ Error getting all sessions:', error.message);
      this.stats.errors++;
      return [];
    }
  }

  /**
   * Get count of active sessions
   */
  async getActiveSessionsCount() {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const pattern = this.getSessionKey('*');
      const keys = await this.client.keys(pattern);
      return keys.length;
    } catch (error) {
      console.error('❌ Error counting sessions:', error.message);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Get session TTL (time to live)
   */
  async getSessionTTL(sessionId) {
    if (!this.isAvailable()) {
      return -1;
    }

    try {
      const key = this.getSessionKey(sessionId);
      const ttl = await this.client.ttl(key);
      return ttl; // Returns -2 if key doesn't exist, -1 if no expiry, seconds otherwise
    } catch (error) {
      console.error(`❌ Error getting TTL for ${sessionId}:`, error.message);
      this.stats.errors++;
      return -1;
    }
  }

  /**
   * Clear all sessions (use with caution!)
   */
  async clearAllSessions() {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const pattern = this.getSessionKey('*');
      const keys = await this.client.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      const result = await this.client.del(...keys);
      console.log(`🗑️  Cleared ${result} sessions from Redis`);
      return result;
    } catch (error) {
      console.error('❌ Error clearing all sessions:', error.message);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Get Redis statistics
   */
  getStats() {
    return {
      ...this.stats,
      isConnected: this.isConnected,
      config: {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        ttl: this.config.ttl
      },
      hitRate: this.stats.totalReads > 0
        ? ((this.stats.cacheHits / this.stats.totalReads) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Get Redis server info
   */
  async getServerInfo() {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const info = await this.client.info();
      const parsed = {};

      info.split('\r\n').forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            parsed[key] = value;
          }
        }
      });

      return parsed;
    } catch (error) {
      console.error('❌ Error getting server info:', error.message);
      return null;
    }
  }

  /**
   * Migrate session from Map to Redis
   */
  async migrateSession(sessionId, sessionData) {
    try {
      await this.saveSession(sessionId, sessionData);
      console.log(`✅ Migrated session ${sessionId} to Redis`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to migrate session ${sessionId}:`, error.message);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      console.log('👋 Redis connection closed gracefully');
    }
  }
}

module.exports = RedisSessionManager;
