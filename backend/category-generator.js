/**
 * Category Generator - Generates bot-personality.json categories from products.json
 * This ensures products.json is the SINGLE SOURCE OF TRUTH
 */

const fs = require('fs');
const path = require('path');

// Load catalog (SOURCE OF TRUTH)
const productsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/products.json'), 'utf8')
);

// Load bot personality
const botPersonalityPath = path.join(__dirname, '../config/bot-personality.json');
const botPersonality = JSON.parse(fs.readFileSync(botPersonalityPath, 'utf8'));

class CategoryGenerator {
  constructor() {
    this.products = productsData.products;
  }

  /**
   * Generate category and subcategory structure from products
   * This is the SOURCE OF TRUTH
   */
  generateCategoriesFromProducts() {
    const categories = {
      body: {
        id: 'corps',
        label: {
          ar: 'الجسم',
          fr: 'Corps',
          en: 'Body'
        },
        icon: '💆‍♀️',
        subcategories: {}
      },
      hair: {
        id: 'cheveux',
        label: {
          ar: 'الشعر',
          fr: 'Cheveux',
          en: 'Hair'
        },
        icon: '💇‍♀️',
        subcategories: {}
      }
    };

    // Build subcategories from actual products
    this.products.forEach(product => {
      const category = product.category; // 'hair' or 'body'
      const type = product.type; // 'shampoo', 'body-butter', etc.

      if (!category) {
        console.warn(`⚠️  Product ${product.id} has no category!`);
        return;
      }

      if (!categories[category]) {
        console.warn(`⚠️  Unknown category: ${category} for product ${product.id}`);
        return;
      }

      // Initialize subcategory if it doesn't exist
      if (!categories[category].subcategories[type]) {
        categories[category].subcategories[type] = {
          id: type,
          label: this.generateLabel(type),
          keywords: this.generateKeywords(type),
          productCount: 0,
          products: []
        };
      }

      // Add product to subcategory
      categories[category].subcategories[type].productCount++;
      categories[category].subcategories[type].products.push({
        id: product.id,
        name: product.name,
        price: product.price
      });
    });

    return categories;
  }

  /**
   * Generate label for subcategory based on type
   */
  generateLabel(type) {
    const labels = {
      // Hair products
      'shampoo': {
        ar: 'شامبو',
        fr: 'Shampooing',
        en: 'Shampoo'
      },
      'conditioner': {
        ar: 'بلسم',
        fr: 'Après-shampooing',
        en: 'Conditioner'
      },
      'leave-in': {
        ar: 'ليف إن',
        fr: 'Leave-in',
        en: 'Leave-in'
      },
      'mask': {
        ar: 'ماسك',
        fr: 'Masque',
        en: 'Hair Mask'
      },
      'serum': {
        ar: 'سيروم',
        fr: 'Sérum',
        en: 'Serum'
      },
      'oil': {
        ar: 'زيت',
        fr: 'Huile',
        en: 'Hair Oil'
      },
      'mist': {
        ar: 'بخاخ',
        fr: 'Spray',
        en: 'Hair Mist'
      },
      // Body products
      'body-butter': {
        ar: 'زبدة الجسم',
        fr: 'Beurre corporel',
        en: 'Body Butter'
      },
      'body-cream': {
        ar: 'كريم الجسم',
        fr: 'Crème corporelle',
        en: 'Body Cream'
      },
      'body-scrub': {
        ar: 'مقشر الجسم',
        fr: 'Gommage corporel',
        en: 'Body Scrub'
      },
      'hand-cream': {
        ar: 'كريم اليدين',
        fr: 'Crème pour les mains',
        en: 'Hand Cream'
      }
    };

    return labels[type] || {
      ar: type,
      fr: type,
      en: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    };
  }

  /**
   * Generate keywords for subcategory
   */
  generateKeywords(type) {
    const keywords = {
      'shampoo': ['shampoo', 'shampooing', 'wash', 'شامبو', 'غسول'],
      'conditioner': ['conditioner', 'après-shampooing', 'balsam', 'بلسم', 'كونديشنر'],
      'leave-in': ['leave-in', 'leave in', 'sans rinçage', 'ليف إن', 'بدون شطف'],
      'mask': ['mask', 'masque', 'treatment', 'ماسك', 'قناع'],
      'serum': ['serum', 'sérum', 'سيروم'],
      'oil': ['oil', 'huile', 'زيت', 'أويل'],
      'mist': ['mist', 'spray', 'بخاخ', 'سبراي'],
      'body-butter': ['body butter', 'butter', 'beurre', 'زبدة الجسم', 'زبدة'],
      'body-cream': ['body cream', 'cream', 'crème', 'كريم الجسم', 'كريم'],
      'body-scrub': ['body scrub', 'scrub', 'exfoliant', 'gommage', 'مقشر الجسم', 'مقشر', 'سكراب'],
      'hand-cream': ['hand cream', 'hands', 'mains', 'كريم اليدين', 'كريم اليد']
    };

    return keywords[type] || [type];
  }

  /**
   * Format categories for bot-personality.json
   */
  formatForBotPersonality(categories) {
    return Object.values(categories).map(category => ({
      id: category.id,
      label: category.label,
      icon: category.icon,
      subcategories: Object.values(category.subcategories).map(sub => ({
        id: sub.id,
        label: sub.label,
        keywords: sub.keywords
      }))
    }));
  }

  /**
   * Update bot-personality.json with generated categories
   */
  updateBotPersonality(dryRun = false) {
    console.log('\n' + '='.repeat(80));
    console.log('🔄 CATEGORY GENERATOR - SYNCING BOT WITH CATALOG');
    console.log('='.repeat(80) + '\n');

    // Generate categories from products (SOURCE OF TRUTH)
    const generatedCategories = this.generateCategoriesFromProducts();

    console.log('📊 GENERATED FROM PRODUCTS.JSON (SOURCE OF TRUTH):\n');
    Object.entries(generatedCategories).forEach(([key, category]) => {
      console.log(`   ${category.icon} ${category.label.en} (${key}):`);
      Object.entries(category.subcategories).forEach(([subKey, sub]) => {
        console.log(`      • ${sub.id}: ${sub.productCount} products`);
      });
      console.log('');
    });

    // Format for bot-personality.json
    const formattedCategories = this.formatForBotPersonality(generatedCategories);

    if (dryRun) {
      console.log('📝 DRY RUN - Would update bot-personality.json with:');
      console.log(JSON.stringify(formattedCategories, null, 2));
      console.log('\n⚠️  Run without --dry-run to actually update');
      return;
    }

    // Update bot-personality.json
    botPersonality.guidedFlow.categories = formattedCategories;

    // Save
    fs.writeFileSync(
      botPersonalityPath,
      JSON.stringify(botPersonality, null, 2),
      'utf8'
    );

    console.log('✅ Updated bot-personality.json with categories from products.json');
    console.log(`   File: ${botPersonalityPath}`);
    console.log('');

    // Show summary
    console.log('📈 SUMMARY:');
    console.log(`   Total categories: ${formattedCategories.length}`);
    console.log(`   Total subcategories: ${formattedCategories.reduce((sum, cat) => sum + cat.subcategories.length, 0)}`);
    console.log('');

    console.log('🎯 SOURCE OF TRUTH: products.json');
    console.log('   ↓ SYNCED TO ↓');
    console.log('📝 bot-personality.json');

    console.log('\n' + '='.repeat(80));
    console.log('✅ SYNC COMPLETE');
    console.log('='.repeat(80) + '\n');

    return formattedCategories;
  }

  /**
   * Generate statistics about the mapping
   */
  generateStatistics(categories) {
    const stats = {
      totalProducts: this.products.length,
      categories: {},
      orphanedProducts: []
    };

    Object.entries(categories).forEach(([key, category]) => {
      stats.categories[key] = {
        name: category.label.en,
        totalProducts: 0,
        subcategories: {}
      };

      Object.entries(category.subcategories).forEach(([subKey, sub]) => {
        stats.categories[key].totalProducts += sub.productCount;
        stats.categories[key].subcategories[subKey] = {
          productCount: sub.productCount,
          products: sub.products
        };
      });
    });

    return stats;
  }
}

// Run generator
const generator = new CategoryGenerator();

// Check if --dry-run flag is passed
const dryRun = process.argv.includes('--dry-run');

if (dryRun) {
  console.log('🔍 Running in DRY RUN mode...\n');
}

generator.updateBotPersonality(dryRun);

module.exports = CategoryGenerator;
