/**
 * 3-Phase Benefits-Based Product Matching System
 *
 * Phase 1: Hair type & context → Captures contraindications
 * Phase 2: Primary problem (must-have) → Hard filter requirement
 * Phase 3: Desired outcomes (secondary goals) → Scoring/ranking
 *
 * Matching Rules:
 * - Hard Filter: Exclude products with contraindications OR missing Phase 2 required tags
 * - Scoring: Phase 2 weight=3.0, Phase 3 weight=1.0, Phase 1 context=0.7
 */

const fs = require('fs');
const path = require('path');

class BenefitsMatchingSystem {
  constructor() {
    // Load product catalog
    this.productsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../config/products.json'), 'utf8')
    );

    // Load qualification questions
    this.questionsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../config/qualification-questions.json'), 'utf8')
    );
  }

  /**
   * Get question for a specific step
   * @param {string} category - 'hair' or 'body'
   * @param {number} step - Step number (1, 2, 3, etc.)
   * @param {string} language - 'ar' or 'en'
   */
  getQuestion(category, step, language = 'ar') {
    const categoryData = this.questionsData[category];
    if (!categoryData) {
      throw new Error(`Invalid category: ${category}`);
    }

    const stepData = categoryData.steps.find(s => s.id === step);
    if (!stepData) {
      throw new Error(`Invalid step: ${step} for category: ${category}`);
    }

    return {
      currentStep: step,
      totalSteps: categoryData.totalSteps,
      phase: stepData.phase,
      type: stepData.type,
      question: stepData.question[language],
      options: stepData.options.map(opt => ({
        id: opt.id,
        label: opt.label[language],
        icon: opt.icon
      })),
      config: {
        min: stepData.min,
        max: stepData.max
      }
    };
  }

  /**
   * Extract user contraindications from Phase 1 answers
   * @param {Object} userAnswers - All user answers
   * @param {string} category - 'hair' or 'body'
   * @returns {Array} List of contraindications
   */
  extractContraindications(userAnswers, category) {
    const contraindications = new Set();
    const categoryQuestions = this.questionsData[category];

    // Only process Phase 1 steps (context gathering)
    const phase1Steps = categoryQuestions.phases.phase1.steps;

    phase1Steps.forEach(stepId => {
      const stepKey = `step${stepId}`;
      const stepData = categoryQuestions.steps.find(s => s.id === stepId);

      if (!stepData || !userAnswers[stepKey]) return;

      const answer = userAnswers[stepKey];
      const selectedIds = Array.isArray(answer) ? answer : [answer];

      selectedIds.forEach(selectedId => {
        const option = stepData.options.find(opt => opt.id === selectedId);
        if (option && option.contraindications) {
          option.contraindications.forEach(c => contraindications.add(c));
        }
      });
    });

    return Array.from(contraindications);
  }

  /**
   * Extract required tags from Phase 2 answer (primary problem)
   * @param {Object} userAnswers - All user answers
   * @param {string} category - 'hair' or 'body'
   * @returns {Array} List of required tags
   */
  extractRequiredTags(userAnswers, category) {
    const categoryQuestions = this.questionsData[category];
    const phase2Steps = categoryQuestions.phases.phase2.steps;

    const requiredTags = new Set();

    phase2Steps.forEach(stepId => {
      const stepKey = `step${stepId}`;
      const stepData = categoryQuestions.steps.find(s => s.id === stepId);

      if (!stepData || !userAnswers[stepKey]) return;

      const answer = userAnswers[stepKey];
      const option = stepData.options.find(opt => opt.id === answer);

      if (option && option.requiredTags) {
        option.requiredTags.forEach(tag => requiredTags.add(tag));
      }
    });

    return Array.from(requiredTags);
  }

  /**
   * Extract desired benefit tags from Phase 3 answers (secondary goals)
   * @param {Object} userAnswers - All user answers
   * @param {string} category - 'hair' or 'body'
   * @returns {Array} List of desired benefit tags
   */
  extractDesiredBenefitTags(userAnswers, category) {
    const categoryQuestions = this.questionsData[category];
    const phase3Steps = categoryQuestions.phases.phase3.steps;

    const desiredTags = new Set();

    phase3Steps.forEach(stepId => {
      const stepKey = `step${stepId}`;
      const stepData = categoryQuestions.steps.find(s => s.id === stepId);

      if (!stepData || !userAnswers[stepKey]) return;

      const answer = userAnswers[stepKey];
      const selectedIds = Array.isArray(answer) ? answer : [answer];

      selectedIds.forEach(selectedId => {
        const option = stepData.options.find(opt => opt.id === selectedId);
        if (option && option.benefitTags) {
          option.benefitTags.forEach(tag => desiredTags.add(tag));
        }
      });
    });

    return Array.from(desiredTags);
  }

  /**
   * Apply hard filters to products
   * Step A: Filter out products based on:
   * 1. Contraindications from Phase 1
   * 2. Missing required tags from Phase 2
   *
   * @param {Array} products - All products
   * @param {Array} userContraindications - User's contraindications
   * @param {Array} requiredTags - Required tags from Phase 2
   * @returns {Array} Filtered products that pass hard filters
   */
  applyHardFilters(products, userContraindications, requiredTags) {
    return products.filter(product => {
      // Filter 1: Check contraindications
      if (product.contraindications && product.contraindications.length > 0) {
        const hasContraindication = product.contraindications.some(c =>
          userContraindications.includes(c)
        );
        if (hasContraindication) {
          return false; // Exclude this product
        }
      }

      // Filter 2: Check required tags (Phase 2 MUST HAVE)
      if (requiredTags.length > 0) {
        const hasRequiredTag = requiredTags.some(tag =>
          product.tags && product.tags.includes(tag)
        );
        if (!hasRequiredTag) {
          return false; // Exclude - doesn't address primary problem
        }
      }

      return true; // Product passes hard filters
    });
  }

  /**
   * Score a product based on tag matches
   * Step B: Scoring algorithm
   * - Phase 2 (required tags) matches: weight = 3.0
   * - Phase 3 (desired benefit tags) matches: weight = 1.0
   * - Context bonus (Phase 1): weight = 0.7
   *
   * @param {Object} product - Product to score
   * @param {Array} requiredTags - Required tags from Phase 2
   * @param {Array} desiredTags - Desired tags from Phase 3
   * @param {Array} userContraindications - For bonus scoring
   * @returns {Object} Scoring details
   */
  scoreProduct(product, requiredTags, desiredTags, userContraindications) {
    if (!product.tags) {
      return {
        totalScore: 0,
        normalizedScore: 0,
        matchedRequiredTags: [],
        matchedDesiredTags: [],
        scoring: {
          requiredTagScore: 0,
          desiredTagScore: 0,
          contextBonus: 0
        }
      };
    }

    const scoring = {
      requiredTagScore: 0,
      desiredTagScore: 0,
      contextBonus: 0
    };

    const matchedRequiredTags = [];
    const matchedDesiredTags = [];

    // Score Phase 2 required tags (weight = 3.0)
    requiredTags.forEach(tag => {
      if (product.tags.includes(tag)) {
        scoring.requiredTagScore += 3.0;
        matchedRequiredTags.push(tag);
      }
    });

    // Score Phase 3 desired benefit tags (weight = 1.0)
    desiredTags.forEach(tag => {
      if (product.tags.includes(tag)) {
        scoring.desiredTagScore += 1.0;
        matchedDesiredTags.push(tag);
      }
    });

    // Context bonus: Product is safe for user's hair characteristics
    if (product.contraindications && product.contraindications.length > 0) {
      const isSafe = !product.contraindications.some(c =>
        userContraindications.includes(c)
      );
      if (isSafe) {
        scoring.contextBonus += 0.7;
      }
    } else {
      // No contraindications = universally safe
      scoring.contextBonus += 0.7;
    }

    // Bonus for matching multiple criteria
    if (matchedRequiredTags.length >= 2) {
      scoring.contextBonus += 1.0; // Multiple required tag matches
    }
    if (matchedDesiredTags.length >= 2) {
      scoring.contextBonus += 0.5; // Multiple desired tag matches
    }

    // METADATA-BASED BONUSES: Prioritize products with specific characteristics
    if (product.metadata) {
      // FRIZZ CONTROL PRIORITY: Humidity-resistant products (oils/serums) rank higher
      // Humidity-resistant = seals cuticles, blocks moisture (not just moisturizing)
      const hasFrizzRequirement = requiredTags.some(tag =>
        ['anti-frizz', 'frizz-control', 'smooth'].includes(tag)
      );
      if (hasFrizzRequirement && product.metadata['humidity-resistant'] === true) {
        scoring.contextBonus += 3.0; // Strong bonus for humidity-resistant products on frizz control
      }

      // COLOR-TREATED SAFETY: Ensure color-safe products for color-treated users
      // (This is already enforced by hard filters via contraindications, but we can bonus it)
      // Note: All INnatural products are color-safe, so this is informational

      // PROTEIN SENSITIVITY: Bonus for low-protein when user has protein sensitivity
      // (Can be added later when protein sensitivity is in Phase 1)
    }

    const totalScore = scoring.requiredTagScore + scoring.desiredTagScore + scoring.contextBonus;

    // Normalized score (0-1 range)
    const maxPossible = (requiredTags.length * 3.0) + (desiredTags.length * 1.0) + 3.0;
    const normalizedScore = Math.min(totalScore / maxPossible, 1);

    return {
      totalScore: totalScore,
      normalizedScore: normalizedScore,
      matchedRequiredTags: matchedRequiredTags,
      matchedDesiredTags: matchedDesiredTags,
      scoring: scoring
    };
  }

  /**
   * Match products based on user's qualification answers
   * Complete 3-Phase matching algorithm
   *
   * @param {Object} userAnswers - User's answers from qualification
   * @param {string} category - 'hair' or 'body'
   * @param {string} language - 'ar' or 'en'
   * @param {number} limit - Number of top products to return
   */
  matchProducts(userAnswers, category, language = 'ar', limit = 3) {
    // Get products for this category
    const products = this.productsData.products.filter(p => p.category === category);

    // Extract user requirements from answers
    const userContraindications = this.extractContraindications(userAnswers, category);
    const requiredTags = this.extractRequiredTags(userAnswers, category);
    const desiredTags = this.extractDesiredBenefitTags(userAnswers, category);

    console.log('Matching criteria:', {
      contraindications: userContraindications,
      requiredTags: requiredTags,
      desiredTags: desiredTags
    });

    // Step A: Apply hard filters
    const eligibleProducts = this.applyHardFilters(products, userContraindications, requiredTags);

    console.log(`Hard filters: ${products.length} → ${eligibleProducts.length} eligible products`);

    // Step B: Score and rank eligible products
    const scoredProducts = eligibleProducts.map(product => {
      const score = this.scoreProduct(product, requiredTags, desiredTags, userContraindications);

      return {
        ...this.formatProduct(product, language),
        scoring: score,
        matchScore: score.totalScore
      };
    });

    // Step C: Sort by score and return top N
    const topProducts = scoredProducts
      .filter(p => p.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    console.log(`Top ${topProducts.length} products selected (limit: ${limit})`);

    return topProducts;
  }

  /**
   * Format product for response
   */
  formatProduct(product, language) {
    return {
      id: product.id,
      name: product.name[language] || product.name.en,
      description: product.description[language] || product.description.en,
      price: product.price,
      size: product.size,
      image: product.image,
      type: product.type,
      collection: product.collection,
      usage: product.usage ? (product.usage[language] || product.usage.en) : null,
      benefits: product.benefits ? (product.benefits[language] || product.benefits.en) : [],
      concerns: product.concerns || [],
      tags: product.tags || [],
      contraindications: product.contraindications || []
    };
  }

  /**
   * Legacy methods for backward compatibility
   */

  extractDesiredBenefits(userAnswers, category) {
    // For backward compatibility with old code
    return this.extractDesiredBenefitTags(userAnswers, category);
  }

  extractDesiredConcerns(userAnswers, category) {
    // For backward compatibility - extract from old system
    const concerns = new Set();
    const categoryQuestions = this.questionsData[category];

    Object.keys(userAnswers).forEach(stepKey => {
      const stepNum = parseInt(stepKey.replace('step', ''));
      const stepData = categoryQuestions.steps.find(s => s.id === stepNum);

      if (!stepData) return;

      const answer = userAnswers[stepKey];
      const selectedIds = Array.isArray(answer) ? answer : [answer];

      selectedIds.forEach(selectedId => {
        const option = stepData.options.find(opt => opt.id === selectedId);
        if (option && option.concernMatch) {
          option.concernMatch.forEach(concern => concerns.add(concern));
        }
      });
    });

    return Array.from(concerns);
  }

  /**
   * Get first question (category selection or first step)
   */
  getFirstQuestion(language = 'ar') {
    return this.getQuestion('hair', 1, language);
  }
}

module.exports = BenefitsMatchingSystem;
