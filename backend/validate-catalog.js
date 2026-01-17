/**
 * Catalog Validator - Ensures data integrity between products.json and bot-personality.json
 * This script should be run in CI/CD to prevent drift
 */

const fs = require('fs');
const path = require('path');

// Load data
const productsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/products.json'), 'utf8')
);

const botPersonality = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/bot-personality.json'), 'utf8')
);

class CatalogValidator {
  constructor() {
    this.products = productsData.products;
    this.botCategories = botPersonality.guidedFlow?.categories || [];
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  /**
   * Validate that all products have required fields
   */
  validateProductStructure() {
    console.log('1️⃣  Validating product structure...');

    const requiredFields = ['id', 'type', 'category', 'name', 'price', 'description'];

    this.products.forEach(product => {
      // Check required fields
      requiredFields.forEach(field => {
        if (!product[field]) {
          this.errors.push({
            test: 'REQUIRED_FIELDS',
            product: product.id || 'unknown',
            message: `Missing required field: ${field}`
          });
        }
      });

      // Validate category value
      if (product.category && !['hair', 'body'].includes(product.category)) {
        this.errors.push({
          test: 'VALID_CATEGORY',
          product: product.id,
          message: `Invalid category: "${product.category}". Must be "hair" or "body"`
        });
      }

      // Validate nested fields
      if (!product.name?.en || !product.name?.ar) {
        this.errors.push({
          test: 'MULTILINGUAL_NAME',
          product: product.id,
          message: 'Missing language variants in name (en/ar required)'
        });
      }

      if (!product.description?.en || !product.description?.ar) {
        this.errors.push({
          test: 'MULTILINGUAL_DESC',
          product: product.id,
          message: 'Missing language variants in description (en/ar required)'
        });
      }
    });

    if (this.errors.filter(e => e.test.includes('REQUIRED') || e.test.includes('VALID')).length === 0) {
      this.passed.push('✅ All products have required fields with valid values');
    }
  }

  /**
   * Validate bot-personality.json matches products.json
   */
  validateBotCategorySync() {
    console.log('2️⃣  Validating bot-personality.json sync with products.json...');

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
        this.errors.push({
          test: 'BOT_SYNC',
          type: 'UNMAPPED_PRODUCT_TYPE',
          message: `Product type "${type}" (${count} products) not found in bot-personality.json subcategories`
        });
      }
    });

    // Find bot subcategories without products
    botSubcategories.forEach(subId => {
      if (!productTypes.has(subId)) {
        this.warnings.push({
          test: 'BOT_SYNC',
          type: 'EMPTY_SUBCATEGORY',
          message: `Bot subcategory "${subId}" has no products in catalog`
        });
      }
    });

    if (this.errors.filter(e => e.test === 'BOT_SYNC').length === 0) {
      this.passed.push('✅ Bot-personality.json categories are in sync with products.json');
    }
  }

  /**
   * Validate that ProductKnowledge can find products by type
   */
  validateProductKnowledgeIntegration() {
    console.log('3️⃣  Validating ProductKnowledge integration...');

    try {
      const ProductKnowledge = require('./productKnowledge');

      // Test getting products by type for each subcategory
      this.botCategories.forEach(category => {
        category.subcategories?.forEach(sub => {
          const products = ProductKnowledge.getProductsByType(sub.id);

          if (products.length === 0) {
            this.warnings.push({
              test: 'PRODUCT_KNOWLEDGE',
              subcategory: sub.id,
              message: `ProductKnowledge.getProductsByType("${sub.id}") returned 0 products`
            });
          } else {
            // Success - products found
            console.log(`   ✓ ${sub.id}: ${products.length} products found`);
          }
        });
      });

      this.passed.push('✅ ProductKnowledge can retrieve products by type');

    } catch (error) {
      this.errors.push({
        test: 'PRODUCT_KNOWLEDGE',
        message: `ProductKnowledge integration failed: ${error.message}`
      });
    }
  }

  /**
   * Validate metadata and versioning
   */
  validateMetadata() {
    console.log('4️⃣  Validating metadata...');

    if (!productsData.metadata) {
      this.errors.push({
        test: 'METADATA',
        message: 'products.json is missing metadata section'
      });
    } else {
      if (!productsData.metadata.version) {
        this.warnings.push({
          test: 'METADATA',
          message: 'Missing version in products.json metadata'
        });
      }

      if (!productsData.metadata.totalProducts) {
        this.warnings.push({
          test: 'METADATA',
          message: 'Missing totalProducts in metadata'
        });
      } else if (productsData.metadata.totalProducts !== this.products.length) {
        this.warnings.push({
          test: 'METADATA',
          message: `metadata.totalProducts (${productsData.metadata.totalProducts}) doesn't match actual count (${this.products.length})`
        });
      }
    }

    if (this.errors.filter(e => e.test === 'METADATA').length === 0) {
      this.passed.push('✅ Metadata is present and valid');
    }
  }

  /**
   * Run all validations
   */
  validate() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 CATALOG VALIDATION - DATA INTEGRITY CHECK');
    console.log('='.repeat(80) + '\n');

    this.validateProductStructure();
    this.validateBotCategorySync();
    this.validateProductKnowledgeIntegration();
    this.validateMetadata();

    // Print results
    console.log('\n' + '-'.repeat(80));
    console.log('📊 VALIDATION RESULTS:\n');

    if (this.passed.length > 0) {
      console.log('✅ PASSED CHECKS:\n');
      this.passed.forEach(check => {
        console.log(`   ${check}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log(`⚠️  ${this.warnings.length} WARNING(S):\n`);
      this.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. [${warning.test}] ${warning.message}`);
      });
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log(`❌ ${this.errors.length} ERROR(S):\n`);
      this.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. [${error.test}] ${error.message}`);
      });
      console.log('');
    }

    // Summary
    console.log('-'.repeat(80));
    console.log('📈 SUMMARY:\n');
    console.log(`   Total Products: ${this.products.length}`);
    console.log(`   Passed Checks: ${this.passed.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);
    console.log(`   Errors: ${this.errors.length}`);
    console.log('');

    const status = this.errors.length === 0 ? 'PASSED ✅' : 'FAILED ❌';
    console.log(`   Status: ${status}`);

    console.log('\n' + '='.repeat(80));
    console.log(this.errors.length === 0 ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED');
    console.log('='.repeat(80) + '\n');

    // Exit with appropriate code for CI/CD
    if (this.errors.length > 0) {
      process.exit(1);
    }

    return {
      passed: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      passedChecks: this.passed
    };
  }
}

// Run validation
const validator = new CatalogValidator();
validator.validate();

module.exports = CatalogValidator;
