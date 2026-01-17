/**
 * Benefits-Based Qualification System v2.0
 *
 * Dynamic qualification system that uses actual product benefits to match
 * users with the most suitable products.
 *
 * Features:
 * - Questions generated from real product benefits
 * - Intelligent scoring based on benefit and concern matching
 * - Returns matched benefits + usage instructions for each recommendation
 */

const BenefitsMatchingSystem = require('./benefitsMatchingSystem');

class QualificationSystem {
  constructor() {
    this.matchingSystem = new BenefitsMatchingSystem();
    this.userQualifications = new Map(); // sessionId -> qualification data
  }

  /**
   * Start qualification flow for a session
   * @param {string} sessionId - Unique session identifier
   * @param {string} language - 'ar' or 'en'
   * @param {string} category - 'hair' or 'body' (default: 'hair')
   * @returns {Object} First question with options
   */
  startQualification(sessionId, language = 'ar', category = 'hair') {
    // Initialize qualification data
    const qualification = {
      sessionId: sessionId,
      category: category,
      startedAt: new Date().toISOString(),
      answers: {},
      currentStep: 1
    };

    this.userQualifications.set(sessionId, qualification);

    // Get first question for this category
    const question = this.matchingSystem.getQuestion(category, 1, language);

    return {
      success: true,
      currentStep: question.currentStep,
      totalSteps: question.totalSteps,
      question: question.question,
      options: question.options,
      type: question.type,
      config: question.config
    };
  }

  /**
   * Process user answer and return next question or completion
   * @param {string} sessionId - Session identifier
   * @param {number} step - Current step number
   * @param {Object} answer - User's answer { selected: ... }
   * @param {string} language - 'ar' or 'en'
   * @returns {Object} Next question or completion status
   */
  processAnswer(sessionId, step, answer, language = 'ar') {
    const qualification = this.userQualifications.get(sessionId);

    if (!qualification) {
      return {
        success: false,
        error: 'Qualification session not found. Please start again.'
      };
    }

    // Save the answer
    qualification.answers[`step${step}`] = answer.selected;
    qualification.currentStep = step + 1;
    this.userQualifications.set(sessionId, qualification);

    // Get category data to check total steps
    const categoryData = this.matchingSystem.questionsData[qualification.category];
    const totalSteps = categoryData.totalSteps;

    // Check if this was the last step
    if (step >= totalSteps) {
      qualification.completedAt = new Date().toISOString();
      this.userQualifications.set(sessionId, qualification);

      return {
        success: true,
        completed: true,
        message: language === 'ar'
          ? 'شكراً! جاري تحليل إجاباتك...'
          : 'Thank you! Analyzing your answers...'
      };
    }

    // Get next question
    const nextStep = step + 1;
    const nextQuestion = this.matchingSystem.getQuestion(
      qualification.category,
      nextStep,
      language
    );

    return {
      success: true,
      completed: false,
      currentStep: nextQuestion.currentStep,
      totalSteps: nextQuestion.totalSteps,
      question: nextQuestion.question,
      options: nextQuestion.options,
      type: nextQuestion.type,
      config: nextQuestion.config
    };
  }

  /**
   * Get product recommendations based on qualification answers
   * @param {string} sessionId - Session identifier
   * @param {string} language - 'ar' or 'en'
   * @param {number} limit - Number of products to return
   * @returns {Object} Recommended products with match scores
   */
  getRecommendations(sessionId, language = 'ar', limit = 3) {
    const qualification = this.userQualifications.get(sessionId);

    if (!qualification) {
      return {
        success: false,
        error: 'Qualification session not found'
      };
    }

    if (!qualification.completedAt) {
      return {
        success: false,
        error: 'Qualification not completed yet'
      };
    }

    // Use BenefitsMatchingSystem to get matched products
    const recommendations = this.matchingSystem.matchProducts(
      qualification.answers,
      qualification.category,
      language,
      limit
    );

    // Format recommendations with matched tags and usage instructions
    const formattedRecommendations = recommendations.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      size: product.size,
      image: product.image,
      type: product.type,
      collection: product.collection,
      matchScore: product.scoring.normalizedScore, // 0-1 scale
      matchPercentage: Math.round(product.scoring.normalizedScore * 100), // Percentage for display
      matchedRequiredTags: product.scoring.matchedRequiredTags, // Phase 2 tags (must-have)
      matchedDesiredTags: product.scoring.matchedDesiredTags, // Phase 3 tags (goals)
      usage: product.usage, // How to use it instructions
      benefits: product.benefits, // All product benefits
      tags: product.tags, // All product tags
      contraindications: product.contraindications, // Product contraindications
      scoring: {
        requiredTagScore: product.scoring.scoring.requiredTagScore, // Phase 2 score
        desiredTagScore: product.scoring.scoring.desiredTagScore, // Phase 3 score
        contextBonus: product.scoring.scoring.contextBonus, // Phase 1 bonus
        totalScore: product.scoring.totalScore
      }
    }));

    return {
      success: true,
      count: formattedRecommendations.length,
      recommendations: formattedRecommendations,
      qualification: {
        category: qualification.category,
        answers: qualification.answers,
        completedAt: qualification.completedAt
      },
      message: language === 'ar'
        ? `وجدنا ${formattedRecommendations.length} منتجات مثالية لك! ✨`
        : `We found ${formattedRecommendations.length} perfect products for you! ✨`
    };
  }

  /**
   * Get qualification data for a session
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} Qualification data or null
   */
  getQualification(sessionId) {
    return this.userQualifications.get(sessionId) || null;
  }

  /**
   * Clear qualification data for a session
   * @param {string} sessionId - Session identifier
   */
  clearQualification(sessionId) {
    this.userQualifications.delete(sessionId);
  }

  /**
   * Get statistics about qualification system usage
   * @returns {Object} Statistics
   */
  getStats() {
    const qualifications = Array.from(this.userQualifications.values());

    return {
      totalSessions: qualifications.length,
      completed: qualifications.filter(q => q.completedAt).length,
      inProgress: qualifications.filter(q => !q.completedAt).length,
      byCategory: {
        hair: qualifications.filter(q => q.category === 'hair').length,
        body: qualifications.filter(q => q.category === 'body').length
      }
    };
  }

  /**
   * Legacy method for backward compatibility with old ProductKnowledge system
   * Scores a product based on qualification data
   * @param {Object} product - Product object
   * @param {Object} qualification - Qualification data
   * @returns {Object} Scoring object
   */
  scoreProduct(product, qualification) {
    // Extract benefits and concerns from qualification answers
    const desiredBenefits = this.matchingSystem.extractDesiredBenefits(
      qualification.answers,
      qualification.category
    );
    const desiredConcerns = this.matchingSystem.extractDesiredConcerns(
      qualification.answers,
      qualification.category
    );

    // Use the matching system to score
    return this.matchingSystem.scoreProduct(
      product,
      desiredBenefits,
      desiredConcerns,
      qualification.answers,
      qualification.category
    );
  }
}

module.exports = QualificationSystem;
