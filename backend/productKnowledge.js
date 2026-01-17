const fs = require('fs');
const path = require('path');

// Load product data and FAQs
const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/products.json'), 'utf8'));
const faqsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/faqs.json'), 'utf8'));
const botPersonality = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/bot-personality.json'), 'utf8'));

class ProductKnowledge {
  /**
   * Get product recommendations based on hair type and concerns
   */
  static getRecommendations(hairType, concerns = [], language = 'en') {
    const recommendations = new Set();

    // Get recommendations based on hair type
    if (hairType && productsData.hairTypeMapping[hairType.toLowerCase()]) {
      const hairTypeRecs = productsData.hairTypeMapping[hairType.toLowerCase()].recommendations;
      hairTypeRecs.forEach(rec => recommendations.add(rec));
    }

    // Get recommendations based on concerns
    concerns.forEach(concern => {
      const concernKey = concern.toLowerCase().replace(/\s+/g, '-');
      if (productsData.concernMapping[concernKey]) {
        productsData.concernMapping[concernKey].recommendations.forEach(rec => recommendations.add(rec));
      }
    });

    // If no specific recommendations, return popular products
    if (recommendations.size === 0) {
      return productsData.products.slice(0, 3);
    }

    // Get full product details
    return Array.from(recommendations).map(productId => {
      return productsData.products.find(p => p.id === productId);
    }).filter(Boolean);
  }

  /**
   * Get product recommendations based on qualification system scoring
   * Uses intelligent scoring algorithm that matches user's concerns and objectives
   * @param {Object} qualification - Qualification data from QualificationSystem
   * @param {number} topN - Number of top products to return (default 3)
   * @returns {Array} Scored and sorted products
   */
  static getQualifiedRecommendations(qualification, topN = 3) {
    const QualificationSystem = require('./qualification-system');
    const qualSys = new QualificationSystem();

    const products = this.getAllProducts();
    const scoredProducts = products
      .map(p => ({
        ...p,
        scoring: qualSys.scoreProduct(p, qualification)
      }))
      .filter(p => p.scoring.score > 0)
      .sort((a, b) => b.scoring.score - a.scoring.score);

    return scoredProducts.slice(0, topN);
  }

  /**
   * Get all products
   */
  static getAllProducts() {
    return productsData.products;
  }

  /**
   * Get products by type (e.g., "body-cream", "shampoo", "body-butter")
   */
  static getProductsByType(productType) {
    if (!productType) return [];

    return productsData.products.filter(product =>
      product.type === productType.toLowerCase()
    );
  }

  /**
   * Search for a product by name or ID
   */
  static findProduct(query, language = 'en') {
    query = query.toLowerCase();
    return productsData.products.find(p =>
      p.id.includes(query) ||
      p.name[language].toLowerCase().includes(query) ||
      p.name.en.toLowerCase().includes(query) ||
      p.name.ar.includes(query)
    );
  }

  /**
   * Get FAQ answer based on question
   */
  static findFAQ(question, language = 'en') {
    question = question.toLowerCase();

    // Search by keywords
    const faq = faqsData.faqs.find(f => {
      const keywordMatch = f.keywords.some(keyword =>
        question.includes(keyword.toLowerCase())
      );
      const questionMatch =
        question.includes(f.question[language].toLowerCase()) ||
        question.includes(f.question.en.toLowerCase()) ||
        question.includes(f.question.ar);

      return keywordMatch || questionMatch;
    });

    return faq;
  }

  /**
   * Get business information
   */
  static getBusinessInfo(language = 'en') {
    return faqsData.businessInfo;
  }

  /**
   * Get shipping information
   */
  static getShippingInfo(language = 'en') {
    return faqsData.shippingInfo;
  }

  /**
   * Format product for display
   */
  static formatProduct(product, language = 'en') {
    if (!product) return '';

    // Safely access product fields
    const name = (typeof product.name === 'object') ? (product.name[language] || product.name.ar || product.name.en) : product.name;
    const description = product.description ? ((typeof product.description === 'object') ? (product.description[language] || product.description.ar || product.description.en) : product.description) : '';
    const benefits = product.benefits ? ((typeof product.benefits === 'object') ? (product.benefits[language] || []).join(', ') : product.benefits) : '';

    let result = `**${name}** - LE ${product.price}`;
    if (product.size) result += ` (${product.size})`;
    if (description) result += `\n${description}`;
    if (benefits) result += `\n**Benefits:** ${benefits}`;

    return result;
  }

  /**
   * Format multiple products for display
   */
  static formatProducts(products, language = 'en') {
    return products.map(p => this.formatProduct(p, language)).join('\n\n---\n\n');
  }

  /**
   * Get bot personality greeting
   */
  static getGreeting(language = 'en') {
    // Use guided flow's first message if available
    if (botPersonality.guidedFlow && botPersonality.guidedFlow.firstMessage) {
      return botPersonality.guidedFlow.firstMessage[language] || botPersonality.guidedFlow.firstMessage.en;
    }
    // Fallback to random greetings
    const greetings = botPersonality.greetings[language];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Get bot capabilities
   */
  static getCapabilities(language = 'en') {
    return botPersonality.capabilities[language];
  }

  /**
   * Build system prompt for Claude AI
   */
  static buildSystemPrompt(language = 'en') {
    const businessInfo = this.getBusinessInfo();
    const botName = botPersonality.botName[language];
    const role = botPersonality.role[language];
    const tone = botPersonality.personality.tone[language];
    const guidelines = botPersonality.responseGuidelines[language].join('\n- ');

    const systemPrompt = `You are ${botName}, the ${role} for INnatural, an Egyptian natural hair and body care brand.

**About INnatural:**
- Established: ${businessInfo.established}
- Location: ${businessInfo.location[language]}
- Phone: ${businessInfo.phone}
- Website: ${businessInfo.website}
- Specialization: ${businessInfo.specialization[language]}

**Your Personality:**
${tone}

**Your Capabilities:**
${this.getCapabilities(language).map((c, i) => `${i + 1}. ${c}`).join('\n')}

**Response Guidelines:**
- ${guidelines}

**Important:**
- Always respond in ${language === 'ar' ? 'Arabic' : 'English'} unless the user switches languages
- Use the product knowledge and FAQs provided in the context
- Be helpful and guide customers toward finding the right products
- If you don't know something, be honest and offer to connect them with customer service
- Keep responses conversational and friendly
- When recommending products, explain WHY they're suitable based on the customer's needs

**Contact Information:**
- Phone/WhatsApp: ${businessInfo.phone}
- For urgent matters, always provide the phone number

Remember: You're here to help customers find natural solutions for their hair and body care needs!`;

    return systemPrompt;
  }

  /**
   * Build context for Claude AI with product and FAQ information
   */
  static buildContext(userMessage, userProfile = {}, language = 'en') {
    let context = '';

    // Add relevant product information if discussing products or recommendations
    if (userMessage.match(/product|recommend|hair|oil|شعر|منتج|زيت/i)) {
      const hairType = userProfile.hairType;
      const concerns = userProfile.concerns || [];

      if (hairType || concerns.length > 0) {
        const recommendations = this.getRecommendations(hairType, concerns, language);
        if (recommendations.length > 0) {
          context += `\n\n**Recommended Products for this customer:**\n${this.formatProducts(recommendations, language)}`;
        }
      } else {
        // Show popular products
        const popularProducts = productsData.products.slice(0, 3);
        context += `\n\n**Popular Products:**\n${this.formatProducts(popularProducts, language)}`;
      }
    }

    // Add FAQ information if asking questions
    const faq = this.findFAQ(userMessage, language);
    if (faq) {
      context += `\n\n**Relevant FAQ:**\nQ: ${faq.question[language]}\nA: ${faq.answer[language]}`;
    }

    // Add shipping info if asking about delivery
    if (userMessage.match(/ship|deliver|توصيل|شحن/i)) {
      const shippingInfo = this.getShippingInfo(language);
      context += `\n\n**Shipping Information:**\n- Delivery time: ${shippingInfo.deliveryTime[language]}\n- Providers: ${shippingInfo.serviceProviders.join(', ')}\n- Contact: ${shippingInfo.contact}`;
    }

    return context;
  }
}

module.exports = ProductKnowledge;
module.exports.botPersonality = botPersonality;
