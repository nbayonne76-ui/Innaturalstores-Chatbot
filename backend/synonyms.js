/**
 * Synonyms Helper Module
 * Manages bilingual synonym mappings for improved query matching
 * Loads synonyms from Knowledge Base v2.0 and provides normalization functions
 */

const fs = require('fs');
const path = require('path');

class SynonymsHelper {
  constructor() {
    this.synonyms = { ar: {}, en: {} };
    this.reverseMap = { ar: {}, en: {} }; // For quick synonym → main term lookup
    this.loadSynonyms();
  }

  /**
   * Load synonyms from Knowledge Base v2.0
   */
  loadSynonyms() {
    try {
      const kbPath = path.join(__dirname, '../config/INnatural_Chatbot_Knowledge_Base_v2.json');
      const kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));

      if (kb.synonyms) {
        this.synonyms = kb.synonyms;
        this.buildReverseMap();
        console.log('✅ Synonyms loaded successfully');
        console.log(`   - AR synonyms: ${Object.keys(this.synonyms.ar).length} main terms`);
        console.log(`   - EN synonyms: ${Object.keys(this.synonyms.en).length} main terms`);
      }
    } catch (error) {
      console.error('❌ Error loading synonyms:', error.message);
      console.warn('⚠️  Using empty synonym maps');
    }
  }

  /**
   * Build reverse mapping: synonym → main term
   * This allows quick lookup from any synonym variation to its canonical form
   */
  buildReverseMap() {
    // Arabic reverse map
    for (const [mainTerm, synonymList] of Object.entries(this.synonyms.ar)) {
      // The main term maps to itself
      this.reverseMap.ar[mainTerm.toLowerCase()] = mainTerm;

      // Each synonym maps to the main term
      synonymList.forEach(synonym => {
        this.reverseMap.ar[synonym.toLowerCase()] = mainTerm;
      });
    }

    // English reverse map
    for (const [mainTerm, synonymList] of Object.entries(this.synonyms.en)) {
      this.reverseMap.en[mainTerm.toLowerCase()] = mainTerm;

      synonymList.forEach(synonym => {
        this.reverseMap.en[synonym.toLowerCase()] = mainTerm;
      });
    }
  }

  /**
   * Normalize a query by replacing synonyms with main terms
   * @param {string} query - User query
   * @param {string} language - Language code ('ar' or 'en')
   * @returns {string} - Normalized query with main terms
   */
  normalizeQuery(query, language = 'ar') {
    if (!query || typeof query !== 'string') return '';

    const lowerQuery = query.toLowerCase();
    const reverseMap = this.reverseMap[language] || {};

    let normalizedQuery = query;

    // Sort by length (longest first) to match longer phrases first
    const sortedTerms = Object.keys(reverseMap).sort((a, b) => b.length - a.length);

    for (const term of sortedTerms) {
      const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
      if (regex.test(lowerQuery)) {
        const mainTerm = reverseMap[term];
        normalizedQuery = normalizedQuery.replace(regex, mainTerm);
      }
    }

    return normalizedQuery;
  }

  /**
   * Get all variations (main term + synonyms) for a given term
   * @param {string} term - The term to find variations for
   * @param {string} language - Language code ('ar' or 'en')
   * @returns {string[]} - Array of all variations
   */
  getVariations(term, language = 'ar') {
    const lowerTerm = term.toLowerCase();
    const reverseMap = this.reverseMap[language] || {};

    // Find the main term
    const mainTerm = reverseMap[lowerTerm] || term;

    // Get synonyms for the main term
    const synonyms = this.synonyms[language][mainTerm] || [];

    // Return main term + all synonyms
    return [mainTerm, ...synonyms];
  }

  /**
   * Check if a query contains any variation of a term
   * @param {string} query - User query
   * @param {string} term - Term to search for
   * @param {string} language - Language code ('ar' or 'en')
   * @returns {boolean} - True if query contains the term or any synonym
   */
  queryContainsTerm(query, term, language = 'ar') {
    if (!query || !term) return false;

    const lowerQuery = query.toLowerCase();
    const variations = this.getVariations(term, language);

    return variations.some(variation => {
      const regex = new RegExp(`\\b${this.escapeRegex(variation)}\\b`, 'i');
      return regex.test(lowerQuery);
    });
  }

  /**
   * Find all main terms that appear in the query
   * @param {string} query - User query
   * @param {string} language - Language code ('ar' or 'en')
   * @returns {string[]} - Array of main terms found
   */
  findTermsInQuery(query, language = 'ar') {
    if (!query) return [];

    const lowerQuery = query.toLowerCase();
    const reverseMap = this.reverseMap[language] || {};
    const foundTerms = new Set();

    // Check each synonym/term
    for (const [synonym, mainTerm] of Object.entries(reverseMap)) {
      const regex = new RegExp(`\\b${this.escapeRegex(synonym)}\\b`, 'i');
      if (regex.test(lowerQuery)) {
        foundTerms.add(mainTerm);
      }
    }

    return Array.from(foundTerms);
  }

  /**
   * Get synonym statistics
   * @returns {object} - Statistics about loaded synonyms
   */
  getStats() {
    const arMainTerms = Object.keys(this.synonyms.ar).length;
    const enMainTerms = Object.keys(this.synonyms.en).length;

    const arTotalVariations = Object.values(this.synonyms.ar)
      .reduce((sum, arr) => sum + arr.length, 0);
    const enTotalVariations = Object.values(this.synonyms.en)
      .reduce((sum, arr) => sum + arr.length, 0);

    return {
      arabic: {
        mainTerms: arMainTerms,
        totalVariations: arTotalVariations,
        avgVariationsPerTerm: (arTotalVariations / arMainTerms).toFixed(1)
      },
      english: {
        mainTerms: enMainTerms,
        totalVariations: enTotalVariations,
        avgVariationsPerTerm: (enTotalVariations / enMainTerms).toFixed(1)
      },
      total: {
        mainTerms: arMainTerms + enMainTerms,
        totalVariations: arTotalVariations + enTotalVariations
      }
    };
  }

  /**
   * Escape special regex characters
   * @param {string} str - String to escape
   * @returns {string} - Escaped string
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Reload synonyms from file (useful after KB updates)
   */
  reload() {
    this.synonyms = { ar: {}, en: {} };
    this.reverseMap = { ar: {}, en: {} };
    this.loadSynonyms();
  }
}

// Export singleton instance
module.exports = new SynonymsHelper();
