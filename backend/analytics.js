/**
 * Analytics Service for INnatural Chatbot
 * Tracks user interactions, messages, and performance metrics
 */

class AnalyticsService {
  constructor() {
    // In-memory storage (in production, use MongoDB/PostgreSQL)
    this.events = [];
    this.conversations = new Map();
    this.metrics = {
      totalConversations: 0,
      totalMessages: 0,
      totalUsers: 0,
      languageBreakdown: { ar: 0, en: 0 },
      quickReplyClicks: 0,
      productRecommendations: 0,
      averageMessagesPerConversation: 0,
      averageResponseTime: 0,
      satisfactionRatings: [],
    };
  }

  /**
   * Track a chat event
   */
  trackEvent(eventType, data) {
    const event = {
      id: this.generateId(),
      type: eventType,
      timestamp: new Date().toISOString(),
      ...data,
    };

    this.events.push(event);

    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events.shift();
    }

    // Update metrics based on event type
    this.updateMetrics(event);

    return event;
  }

  /**
   * Update metrics based on event
   */
  updateMetrics(event) {
    switch (event.type) {
      case 'conversation_started':
        this.metrics.totalConversations++;
        break;

      case 'message_sent':
        this.metrics.totalMessages++;
        if (event.language) {
          this.metrics.languageBreakdown[event.language] =
            (this.metrics.languageBreakdown[event.language] || 0) + 1;
        }
        break;

      case 'quick_reply_clicked':
        this.metrics.quickReplyClicks++;
        break;

      case 'product_recommended':
        this.metrics.productRecommendations++;
        break;

      case 'satisfaction_rating':
        this.metrics.satisfactionRatings.push(event.rating);
        break;
    }
  }

  /**
   * Track conversation start
   */
  trackConversationStart(sessionId, language) {
    this.conversations.set(sessionId, {
      sessionId,
      startTime: Date.now(),
      language,
      messageCount: 0,
      quickReplyCount: 0,
      topics: [],
    });

    return this.trackEvent('conversation_started', { sessionId, language });
  }

  /**
   * Track message sent
   */
  trackMessage(sessionId, role, message, language, responseTime = null) {
    const conversation = this.conversations.get(sessionId);
    if (conversation) {
      conversation.messageCount++;
    }

    return this.trackEvent('message_sent', {
      sessionId,
      role,
      messageLength: message.length,
      language,
      responseTime,
    });
  }

  /**
   * Track quick reply click
   */
  trackQuickReply(sessionId, action, text) {
    const conversation = this.conversations.get(sessionId);
    if (conversation) {
      conversation.quickReplyCount++;
    }

    return this.trackEvent('quick_reply_clicked', {
      sessionId,
      action,
      text,
    });
  }

  /**
   * Track product recommendation
   */
  trackProductRecommendation(sessionId, products) {
    return this.trackEvent('product_recommended', {
      sessionId,
      productCount: products.length,
      products: products.map(p => p.id || p.name),
    });
  }

  /**
   * Track satisfaction rating
   */
  trackSatisfactionRating(sessionId, messageId, rating) {
    return this.trackEvent('satisfaction_rating', {
      sessionId,
      messageId,
      rating, // 'positive' or 'negative'
    });
  }

  /**
   * Get analytics summary
   */
  getSummary() {
    const totalPositive = this.metrics.satisfactionRatings.filter(r => r === 'positive').length;
    const totalRatings = this.metrics.satisfactionRatings.length;
    const satisfactionRate = totalRatings > 0 ? (totalPositive / totalRatings) * 100 : 0;

    return {
      overview: {
        totalConversations: this.metrics.totalConversations,
        totalMessages: this.metrics.totalMessages,
        averageMessagesPerConversation:
          this.metrics.totalConversations > 0
            ? (this.metrics.totalMessages / this.metrics.totalConversations).toFixed(2)
            : 0,
        quickReplyClicks: this.metrics.quickReplyClicks,
        productRecommendations: this.metrics.productRecommendations,
      },
      language: {
        arabic: this.metrics.languageBreakdown.ar || 0,
        english: this.metrics.languageBreakdown.en || 0,
        arabicPercentage:
          this.metrics.totalMessages > 0
            ? ((this.metrics.languageBreakdown.ar / this.metrics.totalMessages) * 100).toFixed(1)
            : 0,
        englishPercentage:
          this.metrics.totalMessages > 0
            ? ((this.metrics.languageBreakdown.en / this.metrics.totalMessages) * 100).toFixed(1)
            : 0,
      },
      satisfaction: {
        totalRatings: totalRatings,
        positiveRatings: totalPositive,
        negativeRatings: totalRatings - totalPositive,
        satisfactionRate: satisfactionRate.toFixed(1) + '%',
      },
      recentEvents: this.events.slice(-20).reverse(), // Last 20 events
    };
  }

  /**
   * Get events by type
   */
  getEventsByType(type, limit = 50) {
    return this.events.filter(e => e.type === type).slice(-limit).reverse();
  }

  /**
   * Get conversation details
   */
  getConversationDetails(sessionId) {
    const conversation = this.conversations.get(sessionId);
    const events = this.events.filter(e => e.sessionId === sessionId);

    return {
      conversation,
      events,
    };
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all data (for testing/reset)
   */
  clear() {
    this.events = [];
    this.conversations.clear();
    this.metrics = {
      totalConversations: 0,
      totalMessages: 0,
      totalUsers: 0,
      languageBreakdown: { ar: 0, en: 0 },
      quickReplyClicks: 0,
      productRecommendations: 0,
      averageMessagesPerConversation: 0,
      averageResponseTime: 0,
      satisfactionRatings: [],
    };
  }
}

module.exports = new AnalyticsService();
