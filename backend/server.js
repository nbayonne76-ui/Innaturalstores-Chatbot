const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const ClaudeService = require('./claudeService');
const ProductKnowledge = require('./productKnowledge');
const analytics = require('./analytics');
const monitoring = require('./monitoring');
const SessionCleaner = require('./session-cleaner');
const RedisSessionManager = require('./redis-session-manager');

const GuidedFlowManager = require('./guided-flow-manager');
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize AI service (using OpenAI)
const claudeService = new ClaudeService(process.env.OPENAI_API_KEY);

// Initialize Guided Flow Manager
const flowManager = new GuidedFlowManager();
// Initialize Redis Session Manager (with fallback to in-memory)
const redisManager = new RedisSessionManager();
let useRedis = false;

// Initialize session cleaner
const sessionCleaner = new SessionCleaner(claudeService, new Map());

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../widget')));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Monitoring middleware - tracks all requests
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const success = res.statusCode < 400;
    monitoring.trackRequest(req.path, duration, success, {
      sessionId: req.body?.sessionId,
      language: req.body?.userProfile?.language
    });
  });

  next();
});

// Rate limiting configuration
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: {
      ar: 'عذراً، الكثير من الطلبات. يرجى المحاولة مرة أخرى بعد قليل.',
      en: 'Too many requests, please try again later.'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Store user profiles (in production, use a database)
const userProfiles = new Map();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'INnatural Chatbot API is running' });
});

// Get greeting endpoint
app.get('/api/greeting', (req, res) => {
  const language = req.query.language || 'en';
  const sessionId = req.query.sessionId || generateSessionId();

  const greeting = claudeService.getGreeting(language, sessionId);

  res.json({
    ...greeting,
    sessionId,
  });
});

// Chat endpoint (with stricter rate limiting)
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { message, sessionId, userProfile } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const session = sessionId || generateSessionId();

    // Touch session to update TTL (keep alive)
    sessionCleaner.touch(session);

    // Store/update user profile if provided
    if (userProfile) {
      const existingProfile = userProfiles.get(session) || {};
      userProfiles.set(session, { ...existingProfile, ...userProfile });
    }

    // Get user profile
    const profile = userProfiles.get(session) || {};

    // Track conversation start if new session
    if (!userProfiles.has(session)) {
      analytics.trackConversationStart(session, profile.language || 'en');
    }

    // Track user message
    analytics.trackMessage(session, 'user', message, profile.language || 'en');

    // Get response from Claude
    const startTime = Date.now();
    const response = await claudeService.chat(message, session, profile);
    const responseTime = Date.now() - startTime;

    // Track bot response
    if (response.success) {
      analytics.trackMessage(session, 'assistant', response.message, response.language, responseTime);
    }

    res.json({
      ...response,
      sessionId: session,
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'An error occurred while processing your request',
    });
  }
});

// Streaming chat endpoint (Server-Sent Events) with Guided Flow
app.post('/api/chat/stream', chatLimiter, async (req, res) => {
  try {
    const { message, sessionId, userProfile } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const session = sessionId || generateSessionId();

    // Store/update user profile if provided
    if (userProfile) {
      const existingProfile = userProfiles.get(session) || {};
      userProfiles.set(session, { ...existingProfile, ...userProfile });
    }

    // Get user profile
    const profile = userProfiles.get(session) || {};

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

    // Send initial connected message
    res.write(`data: ${JSON.stringify({ type: 'connected', sessionId: session })}

`);

    // **NEW: Check guided flow first**
    const flowResult = flowManager.processMessage(message, session);
    
    console.log(`[Flow] Session: ${session}, Type: ${flowResult.type}`);

    // If guided flow has a response, send it directly
    if (flowResult.response && !flowResult.useAI) {
      const botMessage = flowResult.response.message;
      const showCategories = flowResult.response.showCategories;
      const categories = flowResult.response.categories;
      const showSubcategories = flowResult.response.showSubcategories;
      const subcategories = flowResult.response.subcategories;

      // Send message in chunks to simulate streaming
      const words = botMessage.split(' ');
      let accumulated = '';

      for (let i = 0; i < words.length; i++) {
        accumulated += (i > 0 ? ' ' : '') + words[i];
        res.write(`data: ${JSON.stringify({
          success: true,
          content: words[i] + (i < words.length - 1 ? ' ' : ''),
          done: false
        })}

`);

        // Small delay to simulate natural typing
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Send final done message with category/subcategory buttons
      res.write(`data: ${JSON.stringify({
        success: true,
        content: '',
        done: true,
        fullMessage: botMessage,
        sessionId: session,
        showCategories: showCategories || false,
        categories: categories || [],
        showSubcategories: showSubcategories || false,
        subcategories: subcategories || [],
        flowType: flowResult.type
      })}

`);

      res.end();
      return;
    }

    // Otherwise, use AI for free conversation
    for await (const chunk of claudeService.chatStream(message, session, profile)) {
      res.write(`data: ${JSON.stringify(chunk)}

`);

      // If done, close connection
      if (chunk.done) {
        res.end();
        return;
      }
    }

  } catch (error) {
    console.error('Error in /api/chat/stream:', error);
    res.write(`data: ${JSON.stringify({
      success: false,
      error: error.message,
      message: 'An error occurred while processing your request',
      done: true
    })}

`);
    res.end();
  }
});

// Product recommendations endpoint (with stricter rate limiting)
app.post('/api/recommendations', chatLimiter, async (req, res) => {
  try {
    const { hairType, concerns, language, sessionId } = req.body;

    const session = sessionId || generateSessionId();

    // Store user profile
    userProfiles.set(session, {
      hairType,
      concerns,
      language,
    });

    const response = await claudeService.getRecommendations(
      hairType,
      concerns || [],
      language || 'en',
      session
    );

    res.json({
      ...response,
      sessionId: session,
    });
  } catch (error) {
    console.error('Error in /api/recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all products endpoint
app.get('/api/products', (req, res) => {
  const language = req.query.language || 'en';
  const products = ProductKnowledge.getAllProducts();

  res.json({
    success: true,
    products: products,
    language: language,
  });
});

// Search product endpoint
app.get('/api/products/search', (req, res) => {
  const query = req.query.q;
  const language = req.query.language || 'en';

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const product = ProductKnowledge.findProduct(query, language);

  if (product) {
    res.json({
      success: true,
      product: product,
      language: language,
    });
  } else {
    res.json({
      success: false,
      message: language === 'ar'
        ? 'لم يتم العثور على المنتج'
        : 'Product not found',
      language: language,
    });
  }
});

// FAQ endpoint
app.get('/api/faq', (req, res) => {
  const question = req.query.q;
  const language = req.query.language || 'en';

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const answer = claudeService.answerFAQ(question, language);
  res.json(answer);
});

// Clear conversation history endpoint
app.post('/api/clear-history', (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  claudeService.clearHistory(sessionId);
  userProfiles.delete(sessionId);

  res.json({
    success: true,
    message: 'Conversation history cleared',
  });
});

// ========================================
// NEW: Monitoring & Session Management Endpoints
// ========================================

// Get monitoring metrics
app.get('/api/monitoring', (req, res) => {
  res.json(monitoring.getMetrics());
});

// Get health check with detailed status
app.get('/api/monitoring/health', (req, res) => {
  res.json(monitoring.getHealthCheck());
});

// Get session cleaner statistics
app.get('/api/sessions/stats', (req, res) => {
  const cleanerStats = sessionCleaner.getStats();
  const activeSessionIds = sessionCleaner.getActiveSessionIds();

  res.json({
    ...cleanerStats,
    activeSessions: activeSessionIds.length,
    sessionIds: activeSessionIds.slice(0, 10), // First 10 for preview
    userProfiles: userProfiles.size,
    conversationHistories: claudeService.conversationHistory.size
  });
});

// Get specific session info
app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const info = sessionCleaner.getSessionInfo(sessionId);

  if (!info) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json(info);
});

// Force cleanup expired sessions (manual trigger)
app.post('/api/sessions/cleanup', (req, res) => {
  const count = sessionCleaner.cleanupExpiredSessions();
  res.json({
    success: true,
    message: `Cleaned ${count} expired sessions`,
    sessionsRemaining: sessionCleaner.getStats().activeSessions
  });
});

// Redis status and stats (if enabled)
app.get('/api/redis/status', async (req, res) => {
  if (!useRedis) {
    return res.json({
      enabled: false,
      message: 'Redis is not enabled. Using in-memory sessions.'
    });
  }

  const stats = redisManager.getStats();
  const serverInfo = await redisManager.getServerInfo();

  res.json({
    enabled: true,
    stats,
    serverInfo: serverInfo ? {
      redis_version: serverInfo.redis_version,
      uptime_in_seconds: serverInfo.uptime_in_seconds,
      connected_clients: serverInfo.connected_clients,
      used_memory_human: serverInfo.used_memory_human
    } : null
  });
});

// ========================================
// Analytics endpoints
// ========================================
app.get('/api/analytics/summary', (req, res) => {
  res.json(analytics.getSummary());
});

app.get('/api/analytics/events/:type', (req, res) => {
  const { type } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  res.json(analytics.getEventsByType(type, limit));
});

app.post('/api/analytics/track', (req, res) => {
  const { eventType, data } = req.body;
  const event = analytics.trackEvent(eventType, data);
  res.json({ success: true, event });
});

app.post('/api/analytics/feedback', (req, res) => {
  const { sessionId, messageId, rating } = req.body;

  if (!sessionId || !rating) {
    return res.status(400).json({ error: 'Session ID and rating are required' });
  }

  analytics.trackSatisfactionRating(sessionId, messageId, rating);

  res.json({
    success: true,
    message: 'Feedback recorded',
  });
});

// Serve the embed script
app.get('/embed.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../widget/embed.js'));
});

// Serve demo page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../widget/index.html'));
});

// Serve analytics dashboard
app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, '../widget/analytics.html'));
});

// Generate unique session ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Start server with initialization
app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🌿 INnatural Chatbot API Server Running! 🌿       ║
║                                                       ║
║   Server:  http://localhost:${PORT}                     ║
║   Demo:    http://localhost:${PORT}                     ║
║   Status:  http://localhost:${PORT}/api/health          ║
║   Monitor: http://localhost:${PORT}/api/monitoring      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  // Verify API key
  if (!process.env.OPENAI_API_KEY) {
    console.warn(`
⚠️  WARNING: OPENAI_API_KEY not found in environment variables!
Please create a .env file with your API key.
Get your key from: https://platform.openai.com/api-keys
See .env.example for reference.
    `);
  }

  // Initialize Redis (with graceful fallback)
  console.log('\n🔌 Initializing session storage...');
  useRedis = await redisManager.connect();

  if (!useRedis) {
    console.log('⚠️  Redis not available - using in-memory sessions (not production-ready)');
    console.log('   Sessions will be lost on server restart');
    console.log('   To enable Redis: Set REDIS_HOST in .env or install Redis locally\n');
  } else {
    console.log('✅ Redis enabled - sessions will persist across restarts\n');
  }

  // Start session cleaner (runs every 5 minutes)
  console.log('🧹 Starting automatic session cleanup...');
  sessionCleaner.start(5); // Cleanup every 5 minutes

  console.log('\n📊 New endpoints available:');
  console.log(`   - GET  /api/monitoring          (Real-time metrics)`);
  console.log(`   - GET  /api/monitoring/health   (Health check)`);
  console.log(`   - GET  /api/sessions/stats      (Session statistics)`);
  console.log(`   - GET  /api/sessions/:id        (Session details)`);
  console.log(`   - POST /api/sessions/cleanup    (Manual cleanup)`);
  console.log(`   - GET  /api/redis/status        (Redis status)\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n👋 SIGTERM received, shutting down gracefully...');

  sessionCleaner.stop();

  if (useRedis) {
    await redisManager.disconnect();
  }

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n👋 SIGINT received, shutting down gracefully...');

  sessionCleaner.stop();

  if (useRedis) {
    await redisManager.disconnect();
  }

  process.exit(0);
});

module.exports = app;
