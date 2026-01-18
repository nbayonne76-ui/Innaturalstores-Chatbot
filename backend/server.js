const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ClaudeService = require('./claudeService');
const ProductKnowledge = require('./productKnowledge');
const analytics = require('./analytics');
const monitoring = require('./monitoring');
const SessionCleaner = require('./session-cleaner');
const RedisSessionManager = require('./redis-session-manager');

// Phase 1: Import new services
const logger = require('./utils/logger');
const db = require('./services/database');

// Phase 2: Import security and validation middleware
const { getSecurityMiddleware } = require('./middleware/security');
const {
  validateBody,
  validateQuery,
  chatMessageSchema,
  productQuerySchema,
  faqQuerySchema,
  feedbackSchema,
  leadSchema,
  analyticsEventSchema,
} = require('./middleware/validation');
const {
  initRedisStore,
  chatLimiter,
  standardLimiter,
  generousLimiter,
  authLimiter,
  uploadLimiter,
  globalLimiter,
} = require('./middleware/rateLimiter');

// Phase 3: Import monitoring and observability services
const {
  initSentry,
  getSentryErrorHandler,
  captureException,
  performanceMiddleware,
} = require('./middleware/monitoring');
const metrics = require('./services/metrics');
const healthCheck = require('./services/healthCheck');
const {
  collectHttpMetrics,
  addResponseTimeHeader,
  initMetricsCollection,
} = require('./middleware/metricsMiddleware');

// Phase 5: Import performance and caching services
const cache = require('./services/cache');
const {
  compressionMiddleware,
  optimizeResponse,
  monitorPerformance,
  requestTimeout,
  shortCache,
  mediumCache,
  noCache,
} = require('./middleware/performance');

const GuidedFlowManager = require('./guided-flow-manager');
const QualificationSystem = require('./qualification-system');
const app = express();
const PORT = process.env.PORT || 8080;

// Phase 3: Initialize Sentry (must be first)
initSentry(app);

// Initialize AI service (using OpenAI)
const claudeService = new ClaudeService(process.env.OPENAI_API_KEY);

// Initialize Qualification System (shared instance)
const qualificationSystem = new QualificationSystem();

// Initialize Guided Flow Manager (with shared qualification system)
const flowManager = new GuidedFlowManager(qualificationSystem);
// Initialize Redis Session Manager (with fallback to in-memory)
const redisManager = new RedisSessionManager();
let useRedis = false;

// Initialize session cleaner
const sessionCleaner = new SessionCleaner(claudeService, new Map());

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Phase 3: Sentry request tracking (must be early)
app.use(performanceMiddleware);

// Phase 3: Response time header
app.use(addResponseTimeHeader);

// Phase 3: Metrics collection
app.use(collectHttpMetrics);

// Phase 2: Apply security headers (Helmet)
app.use(getSecurityMiddleware());

// Phase 5: Response compression (should be early, before body parser)
app.use(compressionMiddleware);

// Phase 5: Response optimization
app.use(optimizeResponse);

// Phase 5: Performance monitoring (track slow endpoints)
app.use(monitorPerformance(1000)); // Log requests slower than 1s

// Phase 5: Request timeout (prevent hanging requests)
app.use(requestTimeout(30000)); // 30s timeout

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Body parser with size limits (prevent payload attacks)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../widget')));

// Request logging with Winston
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });

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

// Phase 2: Apply global rate limiting (200 req/5min)
app.use(globalLimiter);

// Store user profiles (in production, use a database)
const userProfiles = new Map();

// ============================================
// MONITORING & HEALTH CHECK ENDPOINTS
// ============================================

// Comprehensive health check (cached for 10s to reduce load)
app.get('/api/health', shortCache, async (req, res) => {
  try {
    const cacheKey = 'health:comprehensive';
    const cached = await cache.get(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      const statusCode = cached.status === 'healthy' ? 200 : cached.status === 'degraded' ? 200 : 503;
      return res.status(statusCode).json(cached);
    }

    const health = await healthCheck.performHealthCheck({ db, redisManager });

    // Cache for 10 seconds (frequent health checks shouldn't hammer the system)
    await cache.set(cacheKey, health, 10);

    res.setHeader('X-Cache', 'MISS');
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// Liveness probe (for Kubernetes)
app.get('/api/health/live', (req, res) => {
  const liveness = healthCheck.getLivenessCheck();
  res.json(liveness);
});

// Readiness probe (for Kubernetes)
app.get('/api/health/ready', async (req, res) => {
  try {
    const readiness = await healthCheck.getReadinessCheck({ db });
    const statusCode = readiness.status === 'ready' ? 200 : 503;
    res.status(statusCode).json(readiness);
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
    });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metrics.register.contentType);
    const metricsData = await metrics.getMetrics();
    res.end(metricsData);
  } catch (error) {
    logger.error('Error fetching metrics', { error: error.message });
    res.status(500).end();
  }
});

// Metrics dashboard (JSON format, cached for 30s)
app.get('/api/metrics/summary', shortCache, async (req, res) => {
  try {
    const cacheKey = 'metrics:summary';
    const cached = await cache.get(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const summary = await metrics.getMetricsSummary();
    const response = {
      success: true,
      metrics: summary,
      timestamp: new Date().toISOString(),
    };

    // Cache for 30 seconds
    await cache.set(cacheKey, response, 30);

    res.setHeader('X-Cache', 'MISS');
    res.json(response);
  } catch (error) {
    logger.error('Error fetching metrics summary', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Cache statistics endpoint (Phase 5)
app.get('/api/cache/stats', (req, res) => {
  try {
    const stats = cache.getStats();
    res.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching cache stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Cache flush endpoint (Phase 5) - clear all cache
app.post('/api/cache/flush', standardLimiter, async (req, res) => {
  try {
    const success = await cache.flush();
    if (success) {
      logger.info('Cache flushed manually via API');
      res.json({
        success: true,
        message: 'Cache flushed successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to flush cache',
      });
    }
  } catch (error) {
    logger.error('Error flushing cache', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get greeting endpoint
app.get('/api/greeting', (req, res) => {
  const language = req.query.language || 'en';
  const sessionId = req.query.sessionId || generateSessionId();

  // Use flow manager to get greeting with initial choice
  const greetingData = flowManager.getGreetingMessage(language);

  // Initialize flow manager state for this session
  const state = flowManager.getState(sessionId);
  state.language = language;
  state.greetingSent = true;
  state.currentStep = 'initial_choice'; // Start with initial choice
  state.messageCount = 1;
  flowManager.updateState(sessionId, state);

  res.json({
    success: true,
    message: greetingData.message,
    sessionId,
    showInitialChoice: greetingData.showInitialChoice || false,
    initialOptions: greetingData.initialOptions || [],
    showCategories: greetingData.showCategories || false,
    categories: greetingData.categories || []
  });
});

// Chat endpoint (with validation and rate limiting)
app.post('/api/chat', chatLimiter, validateBody(chatMessageSchema), async (req, res) => {
  try {
    const { message, sessionId, userProfile } = req.body;

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

    // Ensure language is set and persists for the session
    if (!profile.language && message) {
      // Detect language from first message if not set
      const arabicPattern = /[\u0600-\u06FF]/;
      profile.language = arabicPattern.test(message) ? 'ar' : 'en';
      userProfiles.set(session, profile);
    }

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
app.post('/api/chat/stream', chatLimiter, validateBody(chatMessageSchema), async (req, res) => {
  try {
    const { message, sessionId, userProfile } = req.body;

    const session = sessionId || generateSessionId();

    // Store/update user profile if provided
    if (userProfile) {
      const existingProfile = userProfiles.get(session) || {};
      userProfiles.set(session, { ...existingProfile, ...userProfile });
    }

    // Get user profile
    const profile = userProfiles.get(session) || {};

    // Ensure language is set and persists for the session
    if (!profile.language && message) {
      // Detect language from first message if not set
      const arabicPattern = /[\u0600-\u06FF]/;
      profile.language = arabicPattern.test(message) ? 'ar' : 'en';
      userProfiles.set(session, profile);
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

    // Send initial connected message
    res.write(`data: ${JSON.stringify({ type: 'connected', sessionId: session })}

`);

    // **NEW: Check guided flow first**
    // Pass user language to flow manager
    if (profile.language) {
      const state = flowManager.getState(session);
      state.language = profile.language;
      flowManager.updateState(session, state);
    }
    
    const flowResult = flowManager.processMessage(message, session);

    console.log(`[Flow] Session: ${session}, Type: ${flowResult.type}, Language: ${profile.language || 'ar'}, UseAI: ${flowResult.useAI}`);

    // DEBUG: Log flowResult.response when qualification_start
    if (flowResult.type === 'qualification_start') {
      console.log('🔍 FlowResult for qualification_start:', JSON.stringify({
        type: flowResult.type,
        hasResponse: !!flowResult.response,
        responseKeys: flowResult.response ? Object.keys(flowResult.response) : [],
        currentStep: flowResult.response?.currentStep,
        totalSteps: flowResult.response?.totalSteps,
        hasQuestion: !!flowResult.response?.question,
        hasOptions: !!flowResult.response?.options,
        useAI: flowResult.useAI
      }, null, 2));
    }

    // If duplicate message detected, ignore it silently
    if (flowResult.type === 'duplicate') {
      console.log(`[Flow] Ignoring duplicate message from session ${session}`);
      res.write(`data: ${JSON.stringify({
        success: true,
        content: '',
        done: true,
        duplicate: true
      })}

`);
      res.end();
      return;
    }

    // If guided flow has a response AND should not use AI, send it and stop
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

      // Send final done message with category/subcategory buttons OR qualification questions
      const finalData = {
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
      };

      // Include qualification data if present
      if (flowResult.response.currentStep) finalData.currentStep = flowResult.response.currentStep;
      if (flowResult.response.totalSteps) finalData.totalSteps = flowResult.response.totalSteps;
      if (flowResult.response.phase) finalData.phase = flowResult.response.phase;
      if (flowResult.response.question) finalData.question = flowResult.response.question;
      if (flowResult.response.options) finalData.options = flowResult.response.options;
      if (flowResult.response.questionType) finalData.questionType = flowResult.response.questionType;

      // Debug: Log what we're sending
      if (flowResult.type === 'qualification_start') {
        console.log('🎯 Sending qualification data:', {
          flowType: finalData.flowType,
          hasQuestion: !!finalData.question,
          hasOptions: !!finalData.options,
          currentStep: finalData.currentStep,
          totalSteps: finalData.totalSteps,
          optionsCount: finalData.options?.length
        });
      }

      res.write(`data: ${JSON.stringify(finalData)}

`);

      res.end();
      return;
    }

    // If guided flow has a response AND should use AI, send flow message first, then continue with AI
    if (flowResult.response && flowResult.useAI) {
      const botMessage = flowResult.response.message;

      // Send confirmation message in chunks
      const words = botMessage.split(' ');
      for (let i = 0; i < words.length; i++) {
        res.write(`data: ${JSON.stringify({
          success: true,
          content: words[i] + (i < words.length - 1 ? ' ' : ''),
          done: false
        })}

`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Add a small pause before AI response
      res.write(`data: ${JSON.stringify({
        success: true,
        content: '\n\n',
        done: false
      })}

`);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Now continue with AI recommendations
      // Enhance the message with context from guided flow
      let enhancedMessage = message;

      // Check if user selected a product type (e.g., "Body Butter", "Shampoo")
      if (flowResult.response.productType) {
        const productType = flowResult.response.productType; // e.g., "body-butter", "shampoo"
        const label = flowResult.response.concern; // e.g., "Body Butter", "Shampoo"
        const language = flowResult.response.language || userProfile.language || 'en';

        // Get actual products of this type from the catalog
        const products = ProductKnowledge.getProductsByType(productType);

        console.log('\n🔍 Product Type Selected:', productType, '(' + label + ')');
        console.log('   Found', products.length, 'products');

        if (products.length > 0) {
          // Send products as structured data directly to frontend
          // This is better than having AI reformat them - keeps data pure

          // Send welcome message
          const welcomeMessages = {
            ar: `رائع! إليكِ منتجات ${label} المتوفرة لدينا:`,
            en: `Perfect! Here are our ${label} products:`
          };

          res.write(`data: ${JSON.stringify({
            success: true,
            content: welcomeMessages[language] || welcomeMessages.en,
            done: false
          })}

`);

          // Send products as structured data
          res.write(`data: ${JSON.stringify({
            success: true,
            showProducts: true,
            products: products.map(p => ({
              id: p.id,
              name: p.name[language] || p.name.en,
              price: p.price,
              size: p.size,
              description: p.description[language] || p.description.en,
              benefits: p.benefits?.[language] || p.benefits?.en || [],
              image: p.image || null,
              category: p.category,
              type: p.type
            })),
            language: language,
            done: false
          })}\n\n`);

          // Send completion with shipping info
          const shippingMessages = {
            ar: `\n\n🎁 شحن مجاني للطلبات فوق 1000 جنيه\n📱 للطلب عبر WhatsApp: +20 15 55590333`,
            en: `\n\n🎁 Free shipping on orders over LE 1,000\n📱 Order via WhatsApp: +20 15 55590333`
          };

          res.write(`data: ${JSON.stringify({
            success: true,
            content: shippingMessages[language] || shippingMessages.en,
            done: true,
            fullMessage: welcomeMessages[language] + shippingMessages[language]
          })}

`);

          console.log('✅ Sent', products.length, 'products as structured data');
          res.end();
          return;
        } else {
          enhancedMessage = `User selected: ${label}\n\n[User wants ${label} products, but none were found in the catalog. Apologize and offer to help with other products or categories.]`;
        }
      }
      else if (flowResult.response.category && flowResult.response.concern) {
        // Include both category (body/hair) and concern for accurate recommendations
        const categoryMap = {
          'corps': 'body',
          'body': 'body',
          'cheveux': 'hair',
          'hair': 'hair'
        };
        const categoryEn = categoryMap[flowResult.response.category.toLowerCase()] || 'body';
        const otherCategory = categoryEn === 'body' ? 'hair' : 'body';
        const categoryUpper = categoryEn.toUpperCase();

        // Store productType in user profile for Knowledge Base filtering
        profile.productType = categoryEn;
        userProfiles.set(session, profile);

        enhancedMessage = `${message}\n[IMPORTANT Context: User is looking for ${categoryUpper} products for ${flowResult.response.concern} concern. ONLY recommend ${categoryUpper} products. Do NOT recommend ${otherCategory} products or ${otherCategory} routines.]`;

        console.log('\n🔍 Category + Concern:', categoryEn, flowResult.response.concern);
        console.log('   ProductType set in profile:', profile.productType);
      }
      else if (flowResult.response.concern) {
        enhancedMessage = `${message}\n[Context: User selected ${flowResult.response.concern} concern]`;
      }

      console.log('\n📤 SENDING TO AI:');
      console.log('   Message length:', enhancedMessage.length, 'characters');
      console.log('   First 200 chars:', enhancedMessage.substring(0, 200));

      let responseLength = 0;
      for await (const chunk of claudeService.chatStream(enhancedMessage, session, profile)) {
        if (chunk.content) {
          responseLength += chunk.content.length;
        }

        res.write(`data: ${JSON.stringify(chunk)}

`);
        if (chunk.done) {
          console.log('✅ AI Response complete:', responseLength, 'characters');
          res.end();
          return;
        }
      }
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

// Get all products endpoint (cached for 1 hour - products rarely change)
app.get('/api/products', mediumCache, async (req, res) => {
  try {
    const language = req.query.language || 'en';
    const cacheKey = `products:all:${language}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const products = ProductKnowledge.getAllProducts();
    const response = {
      success: true,
      products: products,
      language: language,
    };

    // Cache for 1 hour (products don't change often)
    await cache.set(cacheKey, response, 3600);

    res.setHeader('X-Cache', 'MISS');
    res.json(response);
  } catch (error) {
    logger.error('Error fetching products', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Search product endpoint
app.get('/api/products/search', generousLimiter, (req, res) => {
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
app.get('/api/faq', generousLimiter, (req, res) => {
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
// Test Page for Qualification Flow
// ========================================

/**
 * Serve test page for qualification flow
 * GET /test-qualification
 */
app.get('/test-qualification', (req, res) => {
  res.sendFile(path.join(__dirname, '../test-qualification-widget.html'));
});

// ========================================
// Qualification System Endpoints
// ========================================

/**
 * Start qualification flow
 * POST /api/qualification/start
 */
app.post('/api/qualification/start', chatLimiter, (req, res) => {
  try {
    const { sessionId, language } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }

    const question = qualificationSystem.startQualification(
      sessionId,
      language || 'ar'
    );

    res.json({
      success: true,
      question
    });
  } catch (error) {
    logger.error('Error starting qualification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start qualification'
    });
  }
});

/**
 * Process qualification answer
 * POST /api/qualification/answer
 */
app.post('/api/qualification/answer', chatLimiter, (req, res) => {
  try {
    const { sessionId, step, answer, language } = req.body;

    console.log('📝 Received qualification answer:', {
      sessionId,
      step,
      answer,
      language
    });

    if (!sessionId || !step || !answer) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, step, and answer are required'
      });
    }

    const nextQuestion = qualificationSystem.processAnswer(
      sessionId,
      step,
      answer,
      language || 'ar'
    );

    console.log('✅ Next question response:', {
      success: nextQuestion.success,
      completed: nextQuestion.completed,
      hasQuestion: !!nextQuestion.question,
      currentStep: nextQuestion.currentStep
    });

    res.json({
      success: true,
      ...nextQuestion
    });
  } catch (error) {
    logger.error('Error processing qualification answer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process answer'
    });
  }
});

/**
 * Get qualified product recommendations
 * GET /api/qualification/recommendations/:sessionId
 */
app.get('/api/qualification/recommendations/:sessionId', chatLimiter, (req, res) => {
  try {
    const { sessionId } = req.params;
    const language = req.query.language || 'ar';
    const topN = parseInt(req.query.limit) || 3;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }

    const recommendations = qualificationSystem.getRecommendations(sessionId, language, topN);

    res.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

/**
 * Get qualification stats (for analytics)
 * GET /api/qualification/stats
 */
app.get('/api/qualification/stats', (req, res) => {
  try {
    const stats = qualificationSystem.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting qualification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
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

app.post('/api/analytics/track', standardLimiter, validateBody(analyticsEventSchema), (req, res) => {
  const { eventType, data } = req.body;
  const event = analytics.trackEvent(eventType, data);
  res.json({ success: true, event });
});

app.post('/api/analytics/feedback', standardLimiter, validateBody(feedbackSchema), (req, res) => {
  const { sessionId, rating, comment } = req.body;

  analytics.trackSatisfactionRating(sessionId, null, rating);

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
const HOST = process.env.HOST || '0.0.0.0';

(async () => {
  try {
    // Verify API key
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables!');
      logger.warn('Please create a .env file with your API key.');
      logger.warn('Get your key from: https://platform.openai.com/api-keys');
      logger.warn('See .env.example for reference.');
    }

    // Initialize Database (Phase 1)
    logger.info('\n💾 Initializing database connection...');
    const dbConnected = await db.connect();
    if (dbConnected) {
      logger.info('✅ Database ready - conversations will be persisted');
    } else {
      logger.warn('⚠️  Database not available - running without persistence');
      logger.warn('   Set DATABASE_URL in .env to enable database');
    }

    // MAINTENANT on démarre le serveur
    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🌿 INnatural Chatbot API Server Running! 🌿       ║
║                                                       ║
║   Server:  http://${HOST}:${PORT}                     ║
║   Demo:    http://${HOST}:${PORT}                     ║
║   Status:  http://${HOST}:${PORT}/api/health          ║
║   Monitor: http://${HOST}:${PORT}/api/monitoring    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();

  // Initialize Redis (with graceful fallback)
  logger.info('\n🔌 Initializing session storage...');
  useRedis = await redisManager.connect();

  if (!useRedis) {
    logger.warn('⚠️  Redis not available - using in-memory sessions (not production-ready)');
    logger.warn('   Sessions will be lost on server restart');
    logger.warn('   To enable Redis: Set REDIS_HOST in .env or install Redis locally');
  } else {
    logger.info('✅ Redis enabled - sessions will persist across restarts');
  }

  // Phase 2: Initialize Redis rate limiting store
  logger.info('\n🛡️  Initializing rate limiting...');
  const rateLimitRedis = await initRedisStore();
  if (rateLimitRedis) {
    logger.info('✅ Redis-backed rate limiting enabled');
  } else {
    logger.info('📝 Using memory-based rate limiting (suitable for single server)');
  }

  // Phase 3: Initialize monitoring and metrics
  logger.info('\n📊 Initializing monitoring & metrics...');
  initMetricsCollection();
  logger.info('   Endpoints:');
  logger.info('   - GET  /metrics                  (Prometheus metrics)');
  logger.info('   - GET  /api/metrics/summary      (Metrics dashboard JSON)');
  logger.info('   - GET  /api/health               (Comprehensive health check)');
  logger.info('   - GET  /api/health/live          (Liveness probe)');
  logger.info('   - GET  /api/health/ready         (Readiness probe)');

  // Phase 5: Initialize caching service
  logger.info('\n⚡ Initializing caching layer...');
  cache.initCache(useRedis ? redisManager : null);
  logger.info('   Cache endpoints:');
  logger.info('   - GET  /api/cache/stats          (Cache statistics)');
  if (useRedis) {
    logger.info('✅ Multi-layer cache active (Redis + Memory)');
  } else {
    logger.info('📝 Memory-only cache active (Redis not available)');
  }

  // Start session cleaner (runs every 5 minutes)
  logger.info('\n🧹 Starting automatic session cleanup...');
  sessionCleaner.start(5); // Cleanup every 5 minutes

  logger.info('\n📊 API Endpoints available:');
  logger.info('   - GET  /api/monitoring          (Real-time metrics)');
  logger.info('   - GET  /api/monitoring/health   (Health check)');
  logger.info('   - GET  /api/sessions/stats      (Session statistics)');
  logger.info('   - GET  /api/sessions/:id        (Session details)');
  logger.info('   - POST /api/sessions/cleanup    (Manual cleanup)');
  logger.info('   - GET  /api/redis/status        (Redis status)\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('\n👋 SIGTERM received, shutting down gracefully...');

  sessionCleaner.stop();

  if (useRedis) {
    await redisManager.disconnect();
  }

  if (db.connected) {
    await db.disconnect();
  }

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('\n👋 SIGINT received, shutting down gracefully...');

  sessionCleaner.stop();

  if (useRedis) {
    await redisManager.disconnect();
  }

  if (db.connected) {
    await db.disconnect();
  }

  process.exit(0);
});

// ============================================
// ERROR HANDLERS
// ============================================

// Phase 3: Sentry error handler (must be after all routes)
app.use(getSentryErrorHandler());

// General error handler
app.use((err, req, res, next) => {
  logger.logError(err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

module.exports = app;
