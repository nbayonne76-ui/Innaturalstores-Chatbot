/**
 * Guided Flow Manager for INnatural Chatbot
 * Manages conversation state and step-by-step flow
 *
 * Flow:
 * 1. Initial Choice: Browse vs Trouble
 * 2a. Browse → Categories → Subcategories → Products
 * 2b. Trouble → Hair/Body → 3-Phase Qualification
 */

const fs = require('fs');
const path = require('path');
const QualificationSystem = require('./qualification-system');

// Load bot personality configuration
const botPersonality = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/bot-personality.json'), 'utf8')
);

class GuidedFlowManager {
  constructor(qualificationSystem = null) {
    this.conversationStates = new Map(); // Store conversation state by sessionId
    this.guidedFlow = botPersonality.guidedFlow || {};
    this.initialChoice = this.guidedFlow.initialChoice || {};
    this.categories = this.guidedFlow.categories || [];
    this.qualificationSystem = qualificationSystem || new QualificationSystem(); // Use shared instance or create new
  }

  /**
   * Get or initialize conversation state for a session
   */
  getState(sessionId) {
    if (!this.conversationStates.has(sessionId)) {
      this.conversationStates.set(sessionId, {
        currentStep: 'initial_choice', // Start with initial choice
        messageCount: 0,
        selectedMode: null, // 'browse' or 'trouble'
        selectedCategory: null,
        selectedSubcategory: null,
        greetingSent: false,
        language: 'ar', // Default to Arabic
        history: []
      });
    }
    return this.conversationStates.get(sessionId);
  }

  /**
   * Update conversation state
   */
  updateState(sessionId, updates) {
    const state = this.getState(sessionId);
    Object.assign(state, updates);
    this.conversationStates.set(sessionId, state);
  }

  /**
   * Check if this is the first message in the conversation
   */
  isFirstMessage(sessionId) {
    const state = this.getState(sessionId);
    return state.messageCount === 0 && !state.greetingSent;
  }

  /**
   * Get the greeting message with initial choice
   */
  getGreetingMessage(language = 'ar') {
    if (this.guidedFlow.enabled && this.guidedFlow.firstMessage) {
      let message = this.guidedFlow.firstMessage[language] ||
                    this.guidedFlow.firstMessage.ar ||
                    this.guidedFlow.firstMessage.en;

      // Add initial choice options
      if (this.initialChoice.enabled) {
        const question = this.initialChoice.question[language] || this.initialChoice.question.ar;

        return {
          message: message + '\n\n' + question,
          showInitialChoice: true,
          initialOptions: this.initialChoice.options.map(opt => ({
            id: opt.id,
            label: opt.label[language] || opt.label.ar || opt.label.en,
            icon: opt.icon,
            description: opt.description ? (opt.description[language] || opt.description.ar) : null
          })),
          language: language
        };
      }

      return {
        message: message,
        showCategories: true,
        categories: this.categories.map(cat => ({
          id: cat.id,
          label: typeof cat.label === 'object' ? (cat.label[language] || cat.label.ar || cat.label.en) : cat.label,
          icon: cat.icon
        })),
        language: language
      };
    }
    return null;
  }

  /**
   * Detect initial choice selection (Browse vs Trouble)
   */
  detectInitialChoice(message) {
    const messageLower = message.toLowerCase().trim();

    for (const option of this.initialChoice.options || []) {
      // Check ID
      if (messageLower === option.id.toLowerCase()) {
        return option;
      }

      // Check labels
      if (option.label.ar && messageLower.includes(option.label.ar.toLowerCase())) {
        return option;
      }
      if (option.label.en && messageLower.includes(option.label.en.toLowerCase())) {
        return option;
      }

      // Special keywords
      if (option.id === 'browse' && (messageLower.includes('تصفح') || messageLower.includes('browse') || messageLower.includes('products'))) {
        return option;
      }
      if (option.id === 'trouble' && (messageLower.includes('مشكلة') || messageLower.includes('trouble') || messageLower.includes('problem') || messageLower.includes('help'))) {
        return option;
      }
    }
    return null;
  }

  /**
   * Detect if message is selecting a category
   */
  detectCategorySelection(message) {
    const messageLower = message.toLowerCase().trim();

    for (const category of this.categories) {
      if (typeof category.label === 'object') {
        if (category.label.ar && messageLower === category.label.ar.toLowerCase()) {
          return category;
        }
        if (category.label.en && messageLower === category.label.en.toLowerCase()) {
          return category;
        }
        if (category.label.ar && messageLower.includes(category.label.ar.toLowerCase())) {
          return category;
        }
        if (category.label.en && messageLower.includes(category.label.en.toLowerCase())) {
          return category;
        }
      } else {
        const categoryLower = category.label.toLowerCase();
        if (messageLower === categoryLower || messageLower.includes(categoryLower)) {
          return category;
        }
      }

      if (messageLower === category.id.toLowerCase()) {
        return category;
      }
    }
    return null;
  }

  /**
   * Get subcategories for a selected category
   */
  getSubcategories(categoryId, language = 'ar') {
    const category = this.categories.find(cat => cat.id === categoryId);
    if (category && category.subcategories) {
      const catLabel = typeof category.label === 'object' ? (category.label[language] || category.label.ar || category.label.en) : category.label;

      const messages = {
        ar: `تمام! بالنسبة لـ ${catLabel}، قوليلي بالظبط إيه المشكلة:`,
        en: `Perfect! For ${catLabel}, tell me more specifically about your concern:`
      };

      return {
        message: messages[language] || messages.ar,
        showSubcategories: true,
        subcategories: category.subcategories.map(sub => ({
          id: sub.id,
          label: typeof sub.label === 'object' ? (sub.label[language] || sub.label.ar || sub.label.en) : sub.label
        })),
        category: catLabel,
        language: language
      };
    }
    return null;
  }

  /**
   * Detect if message is selecting a subcategory
   */
  detectSubcategorySelection(message, categoryId) {
    const category = this.categories.find(cat => cat.id === categoryId);
    if (!category || !category.subcategories) return null;

    const messageLower = message.toLowerCase().trim();

    for (const subcategory of category.subcategories) {
      if (typeof subcategory.label === 'object') {
        if (subcategory.label.ar && messageLower === subcategory.label.ar.toLowerCase()) {
          return subcategory;
        }
        if (subcategory.label.en && messageLower === subcategory.label.en.toLowerCase()) {
          return subcategory;
        }
        if (subcategory.label.ar && messageLower.includes(subcategory.label.ar.toLowerCase())) {
          return subcategory;
        }
        if (subcategory.label.en && messageLower.includes(subcategory.label.en.toLowerCase())) {
          return subcategory;
        }
      } else {
        const subLower = subcategory.label.toLowerCase();
        if (messageLower === subLower || messageLower.includes(subLower)) {
          return subcategory;
        }
      }

      if (messageLower === subcategory.id.toLowerCase() ||
          this.matchesKeywords(messageLower, subcategory.keywords)) {
        return subcategory;
      }
    }
    return null;
  }

  /**
   * Check if message matches any keywords
   */
  matchesKeywords(message, keywords) {
    return keywords && keywords.some(keyword =>
      message.includes(keyword.toLowerCase())
    );
  }

  /**
   * Process message and determine next step in the flow
   */
  processMessage(message, sessionId) {
    const state = this.getState(sessionId);

    // Prevent duplicate processing
    const normalizedMessage = message.trim().toLowerCase();
    if (state.lastProcessedMessage === normalizedMessage &&
        Date.now() - (state.lastProcessedTime || 0) < 5000) {
      console.log(`[Flow] Duplicate message detected, skipping: ${message}`);
      return {
        type: 'duplicate',
        response: null,
        useAI: false
      };
    }

    // First message - show greeting with initial choice
    if (this.isFirstMessage(sessionId)) {
      this.updateState(sessionId, {
        greetingSent: true,
        messageCount: 1,
        currentStep: 'initial_choice',
        lastProcessedMessage: normalizedMessage,
        lastProcessedTime: Date.now()
      });
      return {
        type: 'greeting',
        response: this.getGreetingMessage(state.language || 'ar')
      };
    }

    // Increment message count
    this.updateState(sessionId, {
      messageCount: state.messageCount + 1
    });

    // Step 1: Handle initial choice (Browse vs Trouble)
    if (state.currentStep === 'initial_choice') {
      const choice = this.detectInitialChoice(message);

      if (choice) {
        if (choice.id === 'browse') {
          // Browse mode - show categories
          this.updateState(sessionId, {
            selectedMode: 'browse',
            currentStep: 'category_selection',
            lastProcessedMessage: normalizedMessage,
            lastProcessedTime: Date.now()
          });

          const messages = {
            ar: 'رائع! اختاري الفئة:',
            en: 'Great! Choose a category:'
          };

          return {
            type: 'browse_mode',
            response: {
              message: messages[state.language] || messages.ar,
              showCategories: true,
              categories: this.categories.map(cat => ({
                id: cat.id,
                label: typeof cat.label === 'object' ? (cat.label[state.language] || cat.label.ar || cat.label.en) : cat.label,
                icon: cat.icon
              }))
            }
          };
        } else if (choice.id === 'trouble') {
          // Trouble mode - ask hair or body, then start qualification
          this.updateState(sessionId, {
            selectedMode: 'trouble',
            currentStep: 'trouble_category_selection',
            lastProcessedMessage: normalizedMessage,
            lastProcessedTime: Date.now()
          });

          const messages = {
            ar: 'حسناً! هل المشكلة في الشعر أم الجسم؟',
            en: 'Okay! Is it a hair or body problem?'
          };

          return {
            type: 'trouble_mode',
            response: {
              message: messages[state.language] || messages.ar,
              showCategories: true,
              categories: this.categories.map(cat => ({
                id: cat.id,
                label: typeof cat.label === 'object' ? (cat.label[state.language] || cat.label.ar || cat.label.en) : cat.label,
                icon: cat.icon
              }))
            }
          };
        }
      }
    }

    // Step 2a (Trouble mode): Category selection for qualification
    if (state.currentStep === 'trouble_category_selection') {
      const category = this.detectCategorySelection(message);
      if (category) {
        // Map category IDs to qualification system categories
        const qualCategory = category.id === 'cheveux' ? 'hair' : category.id === 'corps' ? 'body' : category.id;

        // Start 3-phase qualification
        const firstQuestion = this.qualificationSystem.startQualification(
          sessionId,
          state.language || 'ar',
          qualCategory
        );

        this.updateState(sessionId, {
          selectedCategory: qualCategory,
          currentStep: 'qualification_in_progress',
          qualificationStep: 1,
          lastProcessedMessage: normalizedMessage,
          lastProcessedTime: Date.now()
        });

        return {
          type: 'qualification_start',
          response: {
            message: state.language === 'ar'
              ? 'تمام! دعيني أسألك بعض الأسئلة لأعطيك أفضل توصية ✨'
              : 'Perfect! Let me ask you some questions for the best recommendation ✨',
            currentStep: firstQuestion.currentStep,
            totalSteps: firstQuestion.totalSteps,
            phase: firstQuestion.phase,
            question: firstQuestion.question,
            options: firstQuestion.options,
            questionType: firstQuestion.type
          }
        };
      }
    }

    // Step 2b (Browse mode): Category selection for browsing
    if (state.currentStep === 'category_selection' && state.selectedMode === 'browse') {
      const category = this.detectCategorySelection(message);
      if (category) {
        this.updateState(sessionId, {
          selectedCategory: category.id,
          currentStep: 'subcategory_selection',
          lastProcessedMessage: normalizedMessage,
          lastProcessedTime: Date.now()
        });
        return {
          type: 'category_selected',
          response: this.getSubcategories(category.id, state.language || 'ar'),
          category: category
        };
      }
    }

    // Step 3 (Browse mode): Subcategory selection
    if (state.currentStep === 'subcategory_selection') {
      const subcategory = this.detectSubcategorySelection(message, state.selectedCategory);
      if (subcategory) {
        this.updateState(sessionId, {
          selectedSubcategory: subcategory.id,
          currentStep: 'showing_products',
          lastProcessedMessage: normalizedMessage,
          lastProcessedTime: Date.now()
        });

        const label = typeof subcategory.label === 'object'
          ? (subcategory.label[state.language] || subcategory.label.ar || subcategory.label.en)
          : subcategory.label;

        const messages = {
          ar: `إليكِ منتجات ${label}:`,
          en: `Here are the ${label} products:`
        };

        return {
          type: 'show_products',
          response: {
            message: messages[state.language] || messages.ar,
            category: state.selectedCategory,
            productType: subcategory.id,
            language: state.language || 'ar'
          },
          useAI: true
        };
      }
    }

    // Qualification in progress
    if (state.currentStep === 'qualification_in_progress') {
      // Answer should come from button clicks via API
      // This is handled by the qualification API endpoints
      return {
        type: 'qualification_answer_expected',
        response: null,
        useAI: false
      };
    }

    // Free conversation
    return {
      type: 'free_conversation',
      response: null,
      useAI: true
    };
  }

  /**
   * Clear conversation state
   */
  clearState(sessionId) {
    this.conversationStates.delete(sessionId);
  }

  /**
   * Get current state for debugging
   */
  getStateInfo(sessionId) {
    return this.getState(sessionId);
  }
}

module.exports = GuidedFlowManager;
