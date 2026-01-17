const OpenAI = require('openai');
const ProductKnowledge = require('./productKnowledge');
const synonymsHelper = require('./synonyms');
const fs = require('fs');
const path = require('path');

// Load comprehensive knowledge base v2.0
const comprehensiveKB = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/INnatural_Chatbot_Knowledge_Base_v2.json'), 'utf8')
);

class ClaudeService {
  constructor(apiKey) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
    this.conversationHistory = new Map(); // Store conversation history by session ID
    this.knowledgeBase = comprehensiveKB; // Store comprehensive knowledge base v2.0
    this.config = comprehensiveKB.config || {}; // Configuration settings
    console.log(`✅ Knowledge Base v${comprehensiveKB.metadata.version} loaded`);
    console.log(`   Primary language: ${comprehensiveKB.metadata.primary_language}`);
    console.log(`   Total scenarios: ${comprehensiveKB.metadata.total_scenarios}`);
  }

  /**
   * Detect language from user message
   */
  detectLanguage(message) {
    // Simple Arabic detection - if message contains Arabic characters
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(message) ? 'ar' : 'en';
  }

  /**
   * Search comprehensive knowledge base v2.0 for relevant scenarios
   * Uses synonyms, tags, and keywords for improved matching
   * @param {string} userMessage - The user's message
   * @param {string} language - Language code ('ar' or 'en')
   * @param {string} productType - Optional product type filter ('hair' or 'body')
   */
  searchKnowledgeBase(userMessage, language = 'ar', productType = null) {
    if (!userMessage) return [];

    const messageLower = userMessage.toLowerCase();

    // Normalize query using synonyms
    const normalizedQuery = synonymsHelper.normalizeQuery(userMessage, language);
    const normalizedLower = normalizedQuery.toLowerCase();

    // Find main terms in the query
    const termsFound = synonymsHelper.findTermsInQuery(userMessage, language);

    const relevantScenarios = [];

    // Search through all categories and scenarios
    // Filter categories by product_type if specified
    const categoriesToSearch = productType
      ? this.knowledgeBase.categories.filter(cat => !cat.product_type || cat.product_type === productType)
      : this.knowledgeBase.categories;

    for (const category of categoriesToSearch) {
      for (const scenario of category.scenarios) {
        let score = 0;
        let matchReasons = [];

        // 1. Check user_queries (both languages)
        const userQueries = [
          ...(scenario.user_queries.ar || []),
          ...(scenario.user_queries.en || [])
        ];

        for (const query of userQueries) {
          const queryLower = query.toLowerCase();
          if (messageLower.includes(queryLower) || queryLower.includes(messageLower)) {
            score += 50; // High score for direct query match
            matchReasons.push('direct_query');
            break;
          }
        }

        // 2. Check keywords with synonym normalization
        const keywords = scenario.keywords[language] || [];
        for (const keyword of keywords) {
          const keywordLower = keyword.toLowerCase();
          if (normalizedLower.includes(keywordLower) ||
              messageLower.includes(keywordLower) ||
              synonymsHelper.queryContainsTerm(userMessage, keyword, language)) {
            score += 30; // Medium score for keyword match
            matchReasons.push('keyword_match');
          }
        }

        // 3. Check tags
        const tags = scenario.tags[language] || [];
        for (const tag of tags) {
          const tagLower = tag.toLowerCase();
          if (normalizedLower.includes(tagLower) ||
              messageLower.includes(tagLower) ||
              synonymsHelper.queryContainsTerm(userMessage, tag, language)) {
            score += 20; // Lower score for tag match
            matchReasons.push('tag_match');
          }
        }

        // 4. Check for main terms found by synonym system
        for (const term of termsFound) {
          const termLower = term.toLowerCase();
          const scenarioText = JSON.stringify(scenario).toLowerCase();
          if (scenarioText.includes(termLower)) {
            score += 15;
            matchReasons.push('synonym_match');
          }
        }

        // If we have any matches, add to results
        if (score > 0) {
          // Get appropriate response for the language
          const response = scenario.responses.find(r =>
            r.language === language && r.response_type === 'detailed'
          ) || scenario.responses.find(r => r.language === language) ||
             scenario.responses[0];

          relevantScenarios.push({
            category: category.category_name[language] || category.category_name,
            scenario: scenario.scenario_id,
            response: response ? response.text : '',
            follow_ups: scenario.follow_up_questions ?
              (scenario.follow_up_questions[language] || []) : [],
            score: score,
            priority: scenario.priority || 5,
            matchReasons: [...new Set(matchReasons)], // Remove duplicates
            confidence: Math.min(score / 100, 1.0) // Normalize to 0-1
          });
        }
      }
    }

    // Sort by score (descending), then by priority (descending)
    relevantScenarios.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.priority || 0) - (a.priority || 0);
    });

    // Apply max_results limit from config
    const maxResults = this.config.max_results || 3;
    const topScenarios = relevantScenarios.slice(0, maxResults);

    // Filter by minimum confidence threshold
    const minConfidence = this.config.min_confidence_score || 0.3;
    return topScenarios.filter(s => s.confidence >= minConfidence);
  }

  /**
   * Get or create conversation history for a session
   */
  getConversationHistory(sessionId) {
    if (!this.conversationHistory.has(sessionId)) {
      this.conversationHistory.set(sessionId, []);
    }
    return this.conversationHistory.get(sessionId);
  }

  /**
   * Add message to conversation history
   */
  addToHistory(sessionId, role, content) {
    const history = this.getConversationHistory(sessionId);
    history.push({ role, content });

    // Keep only last 10 messages to avoid token limits
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
  }

  /**
   * Clear conversation history for a session
   */
  clearHistory(sessionId) {
    this.conversationHistory.delete(sessionId);
  }

  /**
   * Send message to Claude and get response
   */
  async chat(userMessage, sessionId = 'default', userProfile = {}) {
    // Detect language (declare outside try-catch so it's available in error handler)
    const language = userProfile.language || this.detectLanguage(userMessage);

    try {

      // Build system prompt with comprehensive knowledge base
      let systemPrompt = ProductKnowledge.buildSystemPrompt(language);

      // Enhance with comprehensive knowledge base tone guidelines
      const toneGuidelines = this.knowledgeBase.tone_guidelines;
      systemPrompt += `\n\n**TONE & STYLE (Very Important!)**:\n`;
      systemPrompt += `- ${toneGuidelines.general}\n`;
      systemPrompt += `- Emojis: ${toneGuidelines.emojis}\n`;
      systemPrompt += `- CRITICAL: Respond ONLY in ${language === 'ar' ? 'Arabic' : 'English'}. NEVER mix languages in your responses!\n`;
      systemPrompt += `- When speaking Arabic, use "حبيبتي" "يا قمر" "يا جميل" naturally\n`;
      systemPrompt += `- Be ${toneGuidelines.formality}\n`;
      systemPrompt += `- Adapt length: ${toneGuidelines.length}\n\n`;

      // Add greeting templates
      if (userMessage.match(/مرحب|hello|hi|أهلا|سلام/i)) {
        const greetings = this.knowledgeBase.response_templates.greeting[language] || [];
        systemPrompt += `\n**Use one of these friendly greetings**: ${greetings.join(' / ')}\n`;
      }

      // Build context with relevant product and FAQ information
      let context = ProductKnowledge.buildContext(userMessage, userProfile, language);

      // Get product type from user profile (can be 'hair', 'body', or null for all)
      const productType = userProfile.productType || userProfile.category || null;

      // Search comprehensive knowledge base v3.0 for relevant scenarios
      const kbScenarios = this.searchKnowledgeBase(userMessage, language, productType);
      if (kbScenarios.length > 0) {
        context += `\n\n**Relevant scenarios from Knowledge Base v3.0:**\n`;
        kbScenarios.slice(0, 2).forEach((scenario, idx) => {
          context += `\n${idx + 1}. ${scenario.category} - ${scenario.scenario}:\n`;
          context += `   Confidence: ${(scenario.confidence * 100).toFixed(0)}% | Score: ${scenario.score}\n`;
          context += `   Match reasons: ${scenario.matchReasons.join(', ')}\n`;
          context += `   Example response: ${scenario.response.substring(0, 200)}...\n`;
        });
        context += `\n✨ Use similar tone and style from the highest confidence match, personalize for the customer.\n`;
      } else {
        // No matches found - use fallback
        const fallback = this.knowledgeBase.fallback_messages?.no_match?.[language] || '';
        if (fallback) {
          context += `\n\n**No direct match found. Use this fallback guidance:**\n${fallback}\n`;
        }
      }

      // Add user message to history
      this.addToHistory(sessionId, 'user', userMessage);

      // Prepare messages for Claude
      const conversationHistory = this.getConversationHistory(sessionId);

      // Create the full user message with context
      const fullUserMessage = context
        ? `${userMessage}\n\n---\n**Context for your response:**${context}`
        : userMessage;

      // Prepare messages array with system message first (OpenAI format)
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(0, -1),
        { role: 'user', content: fullUserMessage }
      ];

      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        messages: messages,
      });

      const assistantMessage = response.choices[0].message.content;

      // Add assistant response to history (with original message, not context-enhanced)
      this.addToHistory(sessionId, 'assistant', assistantMessage);

      return {
        success: true,
        message: assistantMessage,
        language: language,
        sessionId: sessionId,
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);

      return {
        success: false,
        error: error.message,
        message: language === 'ar'
          ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى أو الاتصال بنا على +20 15 55590333'
          : 'Sorry, an error occurred. Please try again or contact us at +20 15 55590333',
        language: language || 'en',
      };
    }
  }

  /**
   * Send message to OpenAI with streaming response
   */
  async *chatStream(userMessage, sessionId = 'default', userProfile = {}) {
    const language = userProfile.language || this.detectLanguage(userMessage);

    try {
      // Build system prompt with comprehensive knowledge base
      let systemPrompt = ProductKnowledge.buildSystemPrompt(language);

      // Enhance with comprehensive knowledge base tone guidelines
      const toneGuidelines = this.knowledgeBase.tone_guidelines;
      systemPrompt += `\n\n**TONE & STYLE (Very Important!)**:\n`;
      systemPrompt += `- ${toneGuidelines.general}\n`;
      systemPrompt += `- Emojis: ${toneGuidelines.emojis}\n`;
      systemPrompt += `- CRITICAL: Respond ONLY in ${language === 'ar' ? 'Arabic' : 'English'}. NEVER mix languages in your responses!\n`;
      systemPrompt += `- When speaking Arabic, use "حبيبتي" "يا قمر" "يا جميل" naturally\n`;
      systemPrompt += `- Be ${toneGuidelines.formality}\n`;
      systemPrompt += `- Adapt length: ${toneGuidelines.length}\n\n`;

      // Add greeting templates
      if (userMessage.match(/مرحب|hello|hi|أهلا|سلام/i)) {
        const greetings = this.knowledgeBase.response_templates.greeting[language] || [];
        systemPrompt += `\n**Use one of these friendly greetings**: ${greetings.join(' / ')}\n`;
      }

      // Build context with relevant product and FAQ information
      let context = ProductKnowledge.buildContext(userMessage, userProfile, language);

      // Get product type from user profile (can be 'hair', 'body', or null for all)
      const productType = userProfile.productType || userProfile.category || null;

      // Search comprehensive knowledge base v3.0 for relevant scenarios
      const kbScenarios = this.searchKnowledgeBase(userMessage, language, productType);
      if (kbScenarios.length > 0) {
        context += `\n\n**Relevant scenarios from Knowledge Base v3.0:**\n`;
        kbScenarios.slice(0, 2).forEach((scenario, idx) => {
          context += `\n${idx + 1}. ${scenario.category} - ${scenario.scenario}:\n`;
          context += `   Confidence: ${(scenario.confidence * 100).toFixed(0)}% | Score: ${scenario.score}\n`;
          context += `   Match reasons: ${scenario.matchReasons.join(', ')}\n`;
          context += `   Example response: ${scenario.response.substring(0, 200)}...\n`;
        });
        context += `\n✨ Use similar tone and style from the highest confidence match, personalize for the customer.\n`;
      } else {
        // No matches found - use fallback
        const fallback = this.knowledgeBase.fallback_messages?.no_match?.[language] || '';
        if (fallback) {
          context += `\n\n**No direct match found. Use this fallback guidance:**\n${fallback}\n`;
        }
      }

      // Add user message to history
      this.addToHistory(sessionId, 'user', userMessage);

      // Prepare messages
      const conversationHistory = this.getConversationHistory(sessionId);
      const fullUserMessage = context
        ? `${userMessage}\n\n---\n**Context for your response:**${context}`
        : userMessage;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(0, -1),
        { role: 'user', content: fullUserMessage }
      ];

      // Call OpenAI API with streaming
      const stream = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        messages: messages,
        stream: true,
      });

      let fullResponse = '';

      // Stream the response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          yield {
            success: true,
            content: content,
            done: false,
            language: language,
          };
        }
      }

      // Add complete response to history
      this.addToHistory(sessionId, 'assistant', fullResponse);

      // Send final message indicating completion
      yield {
        success: true,
        content: '',
        done: true,
        fullMessage: fullResponse,
        language: language,
        sessionId: sessionId,
      };

    } catch (error) {
      console.error('Error calling OpenAI API (streaming):', error);
      yield {
        success: false,
        error: error.message,
        message: language === 'ar'
          ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى أو الاتصال بنا على +20 15 55590333'
          : 'Sorry, an error occurred. Please try again or contact us at +20 15 55590333',
        language: language || 'en',
        done: true,
      };
    }
  }

  /**
   * Get product recommendations
   */
  async getRecommendations(hairType, concerns, language = 'en', sessionId = 'default') {
    const products = ProductKnowledge.getRecommendations(hairType, concerns, language);

    const message = language === 'ar'
      ? `بناءً على نوع شعرك (${hairType}) ومخاوفك، إليك توصياتي:`
      : `Based on your hair type (${hairType}) and concerns, here are my recommendations:`;

    const productList = ProductKnowledge.formatProducts(products, language);

    const fullMessage = `${message}\n\n${productList}`;

    // Add to conversation history
    this.addToHistory(sessionId, 'assistant', fullMessage);

    return {
      success: true,
      message: fullMessage,
      products: products,
      language: language,
    };
  }

  /**
   * Handle greeting
   */
  getGreeting(language = 'en', sessionId = 'default') {
    const greeting = ProductKnowledge.getGreeting(language);
    this.addToHistory(sessionId, 'assistant', greeting);

    return {
      success: true,
      message: greeting,
      language: language,
    };
  }

  /**
   * Answer FAQ
   */
  answerFAQ(question, language = 'en') {
    const faq = ProductKnowledge.findFAQ(question, language);

    if (faq) {
      return {
        success: true,
        message: faq.answer[language],
        question: faq.question[language],
        language: language,
      };
    }

    return {
      success: false,
      message: language === 'ar'
        ? 'عذراً، لم أجد إجابة على هذا السؤال. هل يمكنني مساعدتك بشيء آخر؟'
        : "Sorry, I couldn't find an answer to that question. Can I help you with something else?",
      language: language,
    };
  }
}

module.exports = ClaudeService;
