/**
 * Guided Flow Manager for INnatural Chatbot
 * Manages conversation state and step-by-step flow
 */

const fs = require('fs');
const path = require('path');

// Load bot personality configuration
const botPersonality = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/bot-personality.json'), 'utf8')
);

class GuidedFlowManager {
  constructor() {
    this.conversationStates = new Map(); // Store conversation state by sessionId
    this.guidedFlow = botPersonality.guidedFlow || {};
    this.categories = this.guidedFlow.categories || [];
  }

  /**
   * Get or initialize conversation state for a session
   */
  getState(sessionId) {
    if (!this.conversationStates.has(sessionId)) {
      this.conversationStates.set(sessionId, {
        currentStep: 'greeting',
        messageCount: 0,
        selectedCategory: null,
        selectedSubcategory: null,
        greetingSent: false,
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
   * Get the greeting message (exact message from config)
   */
  getGreetingMessage() {
    if (this.guidedFlow.enabled && this.guidedFlow.firstMessage) {
      return {
        message: this.guidedFlow.firstMessage.text,
        showCategories: true,
        categories: this.categories.map(cat => ({
          id: cat.id,
          label: cat.label,
          icon: cat.icon
        }))
      };
    }
    return null;
  }

  /**
   * Detect if message is selecting a category
   */
  detectCategorySelection(message) {
    const messageLower = message.toLowerCase().trim();
    
    for (const category of this.categories) {
      const categoryLower = category.label.toLowerCase();
      if (messageLower === categoryLower || 
          messageLower.includes(categoryLower) ||
          messageLower === category.id) {
        return category;
      }
    }
    return null;
  }

  /**
   * Get subcategories for a selected category
   */
  getSubcategories(categoryId) {
    const category = this.categories.find(cat => cat.id === categoryId);
    if (category && category.subcategories) {
      return {
        message: `Parfait! Pour ${category.label}, dites-moi plus précisément votre problème :`,
        showSubcategories: true,
        subcategories: category.subcategories.map(sub => ({
          id: sub.id,
          label: sub.label
        })),
        category: category.label
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
      const subLower = subcategory.label.toLowerCase();
      if (messageLower === subLower || 
          messageLower.includes(subLower) ||
          messageLower === subcategory.id ||
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
    return keywords.some(keyword => 
      message.includes(keyword.toLowerCase())
    );
  }

  /**
   * Process message and determine next step in the flow
   */
  processMessage(message, sessionId) {
    const state = this.getState(sessionId);
    
    // First message - always return greeting
    if (this.isFirstMessage(sessionId)) {
      this.updateState(sessionId, {
        greetingSent: true,
        messageCount: 1,
        currentStep: 'category_selection'
      });
      return {
        type: 'greeting',
        response: this.getGreetingMessage()
      };
    }

    // Increment message count
    this.updateState(sessionId, {
      messageCount: state.messageCount + 1
    });

    // Step 2: Waiting for category selection
    if (state.currentStep === 'category_selection') {
      const category = this.detectCategorySelection(message);
      if (category) {
        this.updateState(sessionId, {
          selectedCategory: category.id,
          currentStep: 'subcategory_selection'
        });
        return {
          type: 'category_selected',
          response: this.getSubcategories(category.id),
          category: category
        };
      } else {
        // User didn't select a category - prompt again
        return {
          type: 'category_prompt',
          response: {
            message: "Merci! Dites-moi si c'est pour le Corps ou les Cheveux s'il vous plaît 😊",
            showCategories: true,
            categories: this.categories.map(cat => ({
              id: cat.id,
              label: cat.label,
              icon: cat.icon
            }))
          }
        };
      }
    }

    // Step 3: Waiting for subcategory selection
    if (state.currentStep === 'subcategory_selection') {
      const subcategory = this.detectSubcategorySelection(message, state.selectedCategory);
      if (subcategory) {
        this.updateState(sessionId, {
          selectedSubcategory: subcategory.id,
          currentStep: 'recommendation'
        });
        return {
          type: 'subcategory_selected',
          response: {
            message: `Très bien! Je comprends que vous avez un problème de ${subcategory.label.toLowerCase()}. Laissez-moi vous recommander les meilleurs produits pour cela...`,
            proceed: true,
            concern: subcategory.label
          },
          subcategory: subcategory
        };
      } else {
        // User didn't select a subcategory - keep context and proceed with AI
        return {
          type: 'free_conversation',
          response: null, // Let AI handle it
          useAI: true
        };
      }
    }

    // Step 4+: Free conversation with AI
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
