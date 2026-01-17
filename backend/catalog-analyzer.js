/**
 * Catalog Analyzer - Source of Truth System
 * Analyzes products.json and ensures it's the single source of truth
 */

const fs = require('fs');
const path = require('path');

// Load catalog
const productsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/products.json'), 'utf8')
);

const botPersonality = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/bot-personality.json'), 'utf8')
);

class CatalogAnalyzer {
  constructor() {
    this.products = productsData.products;
    this.botCategories = botPersonality.guidedFlow?.categories || [];
  }

  /**
   * Analyze product types and infer categories
   */
  analyzeProductTypes() {
    const typeStats = {};
    const typeExamples = {};

    this.products.forEach(product => {
      const type = product.type;

      if (!typeStats[type]) {
        typeStats[type] = 0;
        typeExamples[type] = [];
      }

      typeStats[type]++;
      if (typeExamples[type].length < 2) {
        typeExamples[type].push(product.name.en);
      }
    });

    return { typeStats, typeExamples };
  }

  /**
   * Infer category (body/hair) from product type
   */
  inferCategory(type) {
    const hairTypes = ['shampoo', 'conditioner', 'leave-in', 'mask', 'serum', 'oil', 'mist', 'treatment'];
    const bodyTypes = ['body-butter', 'body-cream', 'body-scrub', 'hand-cream'];

    if (hairTypes.includes(type)) return 'hair';
    if (bodyTypes.includes(type)) return 'body';
    return 'unknown';
  }

  /**
   * Build category mapping from products
   * This is the SOURCE OF TRUTH
   */
  buildCategoryMapping() {
    const mapping = {
      hair: {
        id: 'cheveux',
        label: { ar: 'الشعر', en: 'Hair', fr: 'Cheveux' },
        icon: '💇‍♀️',
        subcategories: {}
      },
      body: {
        id: 'corps',
        label: { ar: 'الجسم', en: 'Body', fr: 'Corps' },
        icon: '💆‍♀️',
        subcategories: {}
      }
    };

    // Build subcategories from actual products
    this.products.forEach(product => {
      const category = this.inferCategory(product.type);
      const type = product.type;

      if (category === 'unknown') {
        console.warn(`⚠️  Unknown category for product type: ${type} (${product.name.en})`);
        return;
      }

      if (!mapping[category].subcategories[type]) {
        mapping[category].subcategories[type] = {
          id: type,
          products: [],
          count: 0
        };
      }

      mapping[category].subcategories[type].products.push({
        id: product.id,
        name: product.name,
        price: product.price
      });
      mapping[category].subcategories[type].count++;
    });

    return mapping;
  }

  /**
   * Compare bot-personality.json with actual products
   */
  validateBotCategories() {
    const issues = [];
    const warnings = [];

    // Get all product types
    const productTypes = new Set();
    this.products.forEach(p => productTypes.add(p.type));

    // Get all bot subcategory IDs
    const botSubcategories = new Set();
    this.botCategories.forEach(cat => {
      cat.subcategories?.forEach(sub => {
        botSubcategories.add(sub.id);
      });
    });

    // Find products without bot mapping
    productTypes.forEach(type => {
      if (!botSubcategories.has(type)) {
        const count = this.products.filter(p => p.type === type).length;
        issues.push({
          type: 'UNMAPPED_PRODUCT_TYPE',
          productType: type,
          count: count,
          severity: 'HIGH',
          message: `Product type "${type}" (${count} products) not found in bot-personality.json`
        });
      }
    });

    // Find bot subcategories without products
    botSubcategories.forEach(subId => {
      if (!productTypes.has(subId)) {
        warnings.push({
          type: 'EMPTY_SUBCATEGORY',
          subcategoryId: subId,
          severity: 'MEDIUM',
          message: `Bot subcategory "${subId}" has no products in catalog`
        });
      }
    });

    return { issues, warnings };
  }

  /**
   * Check if products have required fields
   */
  validateProductStructure() {
    const issues = [];

    this.products.forEach((product, index) => {
      // Check required fields
      if (!product.id) {
        issues.push(`Product #${index}: Missing 'id' field`);
      }
      if (!product.type) {
        issues.push(`Product ${product.id || '#' + index}: Missing 'type' field`);
      }
      if (!product.name || !product.name.en || !product.name.ar) {
        issues.push(`Product ${product.id}: Missing or incomplete 'name' field`);
      }
      if (!product.price) {
        issues.push(`Product ${product.id}: Missing 'price' field`);
      }
      if (!product.description || !product.description.en || !product.description.ar) {
        issues.push(`Product ${product.id}: Missing or incomplete 'description' field`);
      }

      // Check if category field exists (should be added)
      if (!product.category) {
        issues.push(`Product ${product.id}: Missing 'category' field (should be 'hair' or 'body')`);
      }
    });

    return issues;
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 CATALOG ANALYSIS REPORT - SOURCE OF TRUTH VALIDATION');
    console.log('='.repeat(80) + '\n');

    // 1. Product Type Analysis
    console.log('📦 PRODUCT TYPE DISTRIBUTION:\n');
    const { typeStats, typeExamples } = this.analyzeProductTypes();

    const hairTypes = [];
    const bodyTypes = [];

    Object.entries(typeStats).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      const category = this.inferCategory(type);
      const line = `   ${type.padEnd(15)} ${count.toString().padStart(2)} products   [${category.toUpperCase()}]   Ex: ${typeExamples[type].join(', ')}`;

      if (category === 'hair') {
        hairTypes.push(line);
      } else if (category === 'body') {
        bodyTypes.push(line);
      } else {
        console.log(`   ⚠️  ${line}`);
      }
    });

    console.log('   HAIR PRODUCTS:');
    hairTypes.forEach(line => console.log(line));
    console.log('\n   BODY PRODUCTS:');
    bodyTypes.forEach(line => console.log(line));

    // 2. Category Mapping
    console.log('\n' + '-'.repeat(80));
    console.log('🗂️  CATEGORY MAPPING (SOURCE OF TRUTH):\n');
    const mapping = this.buildCategoryMapping();

    Object.entries(mapping).forEach(([catKey, category]) => {
      console.log(`   ${category.icon} ${category.label.en} (${catKey}):`);
      Object.entries(category.subcategories).forEach(([subKey, sub]) => {
        console.log(`      • ${subKey}: ${sub.count} products`);
      });
      console.log('');
    });

    // 3. Validation Issues
    console.log('-'.repeat(80));
    console.log('🔍 VALIDATION RESULTS:\n');

    const { issues, warnings } = this.validateBotCategories();

    if (issues.length === 0) {
      console.log('   ✅ No critical issues found');
    } else {
      console.log(`   ❌ ${issues.length} CRITICAL ISSUE(S):\n`);
      issues.forEach((issue, i) => {
        console.log(`      ${i + 1}. [${issue.severity}] ${issue.message}`);
      });
    }

    if (warnings.length > 0) {
      console.log(`\n   ⚠️  ${warnings.length} WARNING(S):\n`);
      warnings.forEach((warning, i) => {
        console.log(`      ${i + 1}. [${warning.severity}] ${warning.message}`);
      });
    }

    // 4. Product Structure Validation
    console.log('\n' + '-'.repeat(80));
    console.log('🏗️  PRODUCT STRUCTURE VALIDATION:\n');

    const structureIssues = this.validateProductStructure();

    if (structureIssues.length === 0) {
      console.log('   ✅ All products have required fields');
    } else {
      console.log(`   ❌ ${structureIssues.length} ISSUE(S) FOUND:\n`);
      structureIssues.slice(0, 10).forEach((issue, i) => {
        console.log(`      ${i + 1}. ${issue}`);
      });
      if (structureIssues.length > 10) {
        console.log(`      ... and ${structureIssues.length - 10} more`);
      }
    }

    // 5. Statistics
    console.log('\n' + '-'.repeat(80));
    console.log('📈 STATISTICS:\n');
    console.log(`   Total Products: ${this.products.length}`);
    console.log(`   Hair Products: ${this.products.filter(p => this.inferCategory(p.type) === 'hair').length}`);
    console.log(`   Body Products: ${this.products.filter(p => this.inferCategory(p.type) === 'body').length}`);
    console.log(`   Unknown Category: ${this.products.filter(p => this.inferCategory(p.type) === 'unknown').length}`);

    console.log('\n' + '='.repeat(80));
    console.log('END OF REPORT');
    console.log('='.repeat(80) + '\n');

    return {
      typeStats,
      mapping,
      issues,
      warnings,
      structureIssues
    };
  }
}

// Run analysis
const analyzer = new CatalogAnalyzer();
const report = analyzer.generateReport();

// Export for use in other modules
module.exports = CatalogAnalyzer;
