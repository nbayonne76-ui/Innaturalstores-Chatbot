const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const logger = require('../utils/logger');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with adapter and logging (Prisma 7)
const prisma = new PrismaClient({
  adapter,
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log Prisma queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Prisma Query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

// Log Prisma errors
prisma.$on('error', (e) => {
  logger.error('Prisma Error', {
    message: e.message,
    target: e.target,
  });
});

// Log Prisma warnings
prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning', {
    message: e.message,
  });
});

/**
 * Database Service
 * Handles all database operations for the chatbot
 */
class DatabaseService {
  constructor() {
    this.prisma = prisma;
    this.connected = false;
  }

  /**
   * Connect to database and verify connection
   */
  async connect() {
    try {
      await this.prisma.$connect();
      // Test connection
      await this.prisma.$queryRaw`SELECT 1`;
      this.connected = true;
      logger.info('✅ Database connected successfully');
      return true;
    } catch (error) {
      this.connected = false;
      logger.error('❌ Database connection failed', {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    try {
      await this.prisma.$disconnect();
      this.connected = false;
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error disconnecting from database', {
        error: error.message,
      });
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', connected: true };
    } catch (error) {
      return { status: 'unhealthy', connected: false, error: error.message };
    }
  }

  // ===========================================
  // USER OPERATIONS
  // ===========================================

  /**
   * Find or create a user by session ID
   */
  async findOrCreateUser(sessionId, userData = {}) {
    try {
      let user = await this.prisma.user.findUnique({
        where: { sessionId },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            sessionId,
            language: userData.language || 'ar',
            hairType: userData.hairType,
            concerns: userData.concerns || [],
            email: userData.email,
            phone: userData.phone,
            name: userData.name,
          },
        });
        logger.info('New user created', { userId: user.id, sessionId });
      } else {
        // Update last seen
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        });
      }

      return user;
    } catch (error) {
      logger.error('Error finding/creating user', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId, data) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error updating user', { userId, error: error.message });
      throw error;
    }
  }

  // ===========================================
  // CONVERSATION OPERATIONS
  // ===========================================

  /**
   * Create a new conversation
   */
  async createConversation(userId, sessionId, metadata = {}) {
    try {
      const conversation = await this.prisma.conversation.create({
        data: {
          userId,
          sessionId,
          language: metadata.language || 'ar',
          hairType: metadata.hairType,
          concerns: metadata.concerns || [],
          userAgent: metadata.userAgent,
          ipAddress: metadata.ipAddress,
          source: metadata.source || 'widget',
        },
      });
      logger.logConversation(sessionId, 'start', { conversationId: conversation.id });
      return conversation;
    } catch (error) {
      logger.error('Error creating conversation', { userId, sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Get conversation by session ID
   */
  async getConversationBySessionId(sessionId) {
    try {
      return await this.prisma.conversation.findFirst({
        where: { sessionId },
        orderBy: { startedAt: 'desc' },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching conversation', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Update conversation status
   */
  async updateConversation(conversationId, data) {
    try {
      return await this.prisma.conversation.update({
        where: { id: conversationId },
        data,
      });
    } catch (error) {
      logger.error('Error updating conversation', { conversationId, error: error.message });
      throw error;
    }
  }

  // ===========================================
  // MESSAGE OPERATIONS
  // ===========================================

  /**
   * Save a message to the database
   */
  async saveMessage(conversationId, role, content, metadata = {}) {
    try {
      const message = await this.prisma.message.create({
        data: {
          conversationId,
          role, // 'user' or 'assistant'
          content,
          language: metadata.language,
          model: metadata.model,
          tokensUsed: metadata.tokensUsed,
          responseTime: metadata.responseTime,
          confidence: metadata.confidence,
        },
      });

      // Update conversation message count
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          messageCount: {
            increment: 1,
          },
        },
      });

      logger.debug('Message saved', {
        messageId: message.id,
        conversationId,
        role,
      });

      return message;
    } catch (error) {
      logger.error('Error saving message', { conversationId, role, error: error.message });
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId, limit = 50) {
    try {
      return await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'asc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Error fetching conversation history', { conversationId, error: error.message });
      throw error;
    }
  }

  // ===========================================
  // PRODUCT RECOMMENDATION OPERATIONS
  // ===========================================

  /**
   * Save product recommendation
   */
  async saveProductRecommendation(messageId, productId, productName, reason = null) {
    try {
      return await this.prisma.productRecommendation.create({
        data: {
          messageId,
          productId,
          productName,
          reason,
        },
      });
    } catch (error) {
      logger.error('Error saving product recommendation', {
        messageId,
        productId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Track product click
   */
  async trackProductClick(recommendationId) {
    try {
      return await this.prisma.productRecommendation.update({
        where: { id: recommendationId },
        data: { clicked: true },
      });
    } catch (error) {
      logger.error('Error tracking product click', { recommendationId, error: error.message });
      throw error;
    }
  }

  // ===========================================
  // ANALYTICS OPERATIONS
  // ===========================================

  /**
   * Track an analytics event
   */
  async trackEvent(eventType, data, context = {}) {
    try {
      return await this.prisma.analyticsEvent.create({
        data: {
          userId: context.userId,
          sessionId: context.sessionId,
          eventType,
          eventName: data.eventName,
          data: data,
          language: context.language,
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
        },
      });
    } catch (error) {
      logger.error('Error tracking event', { eventType, error: error.message });
      // Don't throw - analytics shouldn't break the app
      return null;
    }
  }

  /**
   * Save system metric
   */
  async saveMetric(metricType, metricName, value, dimensions = {}) {
    try {
      return await this.prisma.systemMetric.create({
        data: {
          metricType,
          metricName,
          value,
          unit: dimensions.unit,
          endpoint: dimensions.endpoint,
          statusCode: dimensions.statusCode,
          errorType: dimensions.errorType,
        },
      });
    } catch (error) {
      logger.error('Error saving metric', { metricType, metricName, error: error.message });
      return null;
    }
  }

  // ===========================================
  // LEAD OPERATIONS
  // ===========================================

  /**
   * Create a lead
   */
  async createLead(userId, leadData) {
    try {
      return await this.prisma.lead.create({
        data: {
          userId,
          email: leadData.email,
          phone: leadData.phone,
          name: leadData.name,
          source: leadData.source || 'chat',
          interest: leadData.interest || [],
          budget: leadData.budget,
          timeline: leadData.timeline,
          notes: leadData.notes,
        },
      });
    } catch (error) {
      logger.error('Error creating lead', { userId, error: error.message });
      throw error;
    }
  }

  // ===========================================
  // FEEDBACK OPERATIONS
  // ===========================================

  /**
   * Save user feedback
   */
  async saveFeedback(sessionId, rating, comment = null, conversationId = null) {
    try {
      return await this.prisma.feedback.create({
        data: {
          sessionId,
          conversationId,
          rating,
          comment,
        },
      });
    } catch (error) {
      logger.error('Error saving feedback', { sessionId, error: error.message });
      throw error;
    }
  }

  // ===========================================
  // STATISTICS & REPORTING
  // ===========================================

  /**
   * Get conversation statistics
   */
  async getConversationStats(startDate, endDate) {
    try {
      const stats = await this.prisma.conversation.groupBy({
        by: ['language', 'status'],
        where: {
          startedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
        _avg: {
          messageCount: true,
        },
      });
      return stats;
    } catch (error) {
      logger.error('Error fetching conversation stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user growth statistics
   */
  async getUserGrowth(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await this.prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
      });
    } catch (error) {
      logger.error('Error fetching user growth', { error: error.message });
      throw error;
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down database connection...');
  await databaseService.disconnect();
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down database connection...');
  await databaseService.disconnect();
});

module.exports = databaseService;
