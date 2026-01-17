/**
 * Catalog Fixer - Adds missing fields and ensures data integrity
 * This script transforms products.json to be the single source of truth
 */

const fs = require('fs');
const path = require('path');

// Load catalog
const productsFilePath = path.join(__dirname, '../config/products.json');
const productsData = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));

class CatalogFixer {
  constructor() {
    this.products = productsData.products;
    this.changes = [];
  }

  /**
   * Infer category from product type
   */
  inferCategory(type) {
    const hairTypes = ['shampoo', 'conditioner', 'leave-in', 'mask', 'serum', 'oil', 'mist', 'treatment'];
    const bodyTypes = ['body-butter', 'body-cream', 'body-scrub', 'hand-cream'];

    if (hairTypes.includes(type)) return 'hair';
    if (bodyTypes.includes(type)) return 'body';
    return null;
  }

  /**
   * Add category field to all products
   */
  addCategoryField() {
    let addedCount = 0;

    this.products.forEach(product => {
      if (!product.category) {
        const inferredCategory = this.inferCategory(product.type);

        if (inferredCategory) {
          product.category = inferredCategory;
          addedCount++;
          this.changes.push({
            product: product.id,
            change: 'ADD_CATEGORY',
            value: inferredCategory
          });
        } else {
          console.warn(`⚠️  Could not infer category for product: ${product.id} (type: ${product.type})`);
        }
      }
    });

    console.log(`✅ Added 'category' field to ${addedCount} products`);
    return addedCount;
  }

  /**
   * Fix the 'treatment' product type
   * Change it to 'mask' since it's a hair treatment
   */
  fixTreatmentProduct() {
    let fixedCount = 0;

    this.products.forEach(product => {
      if (product.type === 'treatment') {
        const oldType = product.type;
        product.type = 'mask';
        fixedCount++;
        this.changes.push({
          product: product.id,
          change: 'FIX_TYPE',
          from: oldType,
          to: 'mask'
        });
        console.log(`   Fixed: ${product.id} (${product.name.en})`);
        console.log(`      ${oldType} → mask`);
      }
    });

    if (fixedCount > 0) {
      console.log(`✅ Fixed ${fixedCount} 'treatment' product(s) → changed to 'mask'`);
    }

    return fixedCount;
  }

  /**
   * Ensure all products have required fields
   */
  validateRequiredFields() {
    const requiredFields = ['id', 'type', 'category', 'name', 'price', 'description'];
    const issues = [];

    this.products.forEach(product => {
      requiredFields.forEach(field => {
        if (!product[field]) {
          issues.push({
            product: product.id || 'unknown',
            field: field,
            message: `Missing required field: ${field}`
          });
        }
      });

      // Check nested fields
      if (!product.name?.en || !product.name?.ar) {
        issues.push({
          product: product.id,
          field: 'name',
          message: 'Missing language variants (en/ar)'
        });
      }

      if (!product.description?.en || !product.description?.ar) {
        issues.push({
          product: product.id,
          field: 'description',
          message: 'Missing language variants (en/ar)'
        });
      }
    });

    return issues;
  }

  /**
   * Save fixed catalog
   */
  save(dryRun = false) {
    if (dryRun) {
      console.log('\n📝 DRY RUN - Changes that would be made:');
      this.changes.forEach((change, i) => {
        console.log(`   ${i + 1}. ${change.product}: ${change.change}`, change.value || `${change.from} → ${change.to}`);
      });
      console.log('\n⚠️  Run with dryRun=false to actually save changes');
      return;
    }

    // Update the productsData object
    productsData.products = this.products;

    // Update metadata
    productsData.metadata.lastUpdated = new Date().toISOString().split('T')[0];
    productsData.metadata.version = this.incrementVersion(productsData.metadata.version);

    // Write back to file with pretty formatting
    fs.writeFileSync(
      productsFilePath,
      JSON.stringify(productsData, null, 2),
      'utf8'
    );

    console.log(`\n✅ Saved ${this.changes.length} changes to ${productsFilePath}`);
    console.log(`   New version: ${productsData.metadata.version}`);
  }

  /**
   * Increment version (e.g., 4.1.0 → 4.2.0)
   */
  incrementVersion(version) {
    const parts = version.split('.');
    parts[1] = parseInt(parts[1]) + 1;
    return parts.join('.');
  }

  /**
   * Run all fixes
   */
  fixAll(dryRun = false) {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 CATALOG FIXER - RUNNING FIXES');
    console.log('='.repeat(80) + '\n');

    console.log('1️⃣  Adding category field to products...\n');
    const categoriesAdded = this.addCategoryField();

    console.log('\n2️⃣  Fixing "treatment" product type...\n');
    const treatmentsFixed = this.fixTreatmentProduct();

    console.log('\n3️⃣  Validating required fields...\n');
    const validationIssues = this.validateRequiredFields();

    if (validationIssues.length === 0) {
      console.log('   ✅ All products have required fields');
    } else {
      console.log(`   ⚠️  ${validationIssues.length} validation issue(s):`);
      validationIssues.slice(0, 5).forEach(issue => {
        console.log(`      • ${issue.product}: ${issue.message}`);
      });
      if (validationIssues.length > 5) {
        console.log(`      ... and ${validationIssues.length - 5} more`);
      }
    }

    console.log('\n' + '-'.repeat(80));
    console.log('📊 SUMMARY:\n');
    console.log(`   Categories added: ${categoriesAdded}`);
    console.log(`   Treatment products fixed: ${treatmentsFixed}`);
    console.log(`   Total changes: ${this.changes.length}`);
    console.log(`   Validation issues: ${validationIssues.length}`);

    // Save changes
    this.save(dryRun);

    console.log('\n' + '='.repeat(80));
    console.log('END OF FIXES');
    console.log('='.repeat(80) + '\n');

    return {
      categoriesAdded,
      treatmentsFixed,
      validationIssues,
      changes: this.changes
    };
  }
}

// Run fixer
const fixer = new CatalogFixer();

// Check if --dry-run flag is passed
const dryRun = process.argv.includes('--dry-run');

if (dryRun) {
  console.log('🔍 Running in DRY RUN mode...\n');
}

fixer.fixAll(dryRun);

module.exports = CatalogFixer;
