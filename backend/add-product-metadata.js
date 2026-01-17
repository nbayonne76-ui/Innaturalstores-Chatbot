/**
 * Add Missing Metadata to Products
 * Systematically adds: humidity-resistant, silicone-free, sulfate-free,
 * color-safe, weight-class, protein-level, heat-protect
 */

const fs = require('fs');
const path = require('path');

// Load products
const productsPath = path.join(__dirname, '../config/products.json');
const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// Product type classifications
const OILS_SERUMS = [
  'mixoil-rosemary-serum',
  'mixoil-rosemary-oil',
  'mixoil-castor-serum',
  'mixoil-castor-oil',
  'cocoshea-serum',
  'africa-serum'
];

const SERUMS_ONLY = [
  'mixoil-rosemary-serum',
  'mixoil-castor-serum',
  'cocoshea-serum',
  'africa-serum'
];

const LEAVE_IN_TYPES = ['leave-in', 'serum', 'oil'];
const RICH_TYPES = ['mask', 'butter'];
const LIGHTWEIGHT_TYPES = ['shampoo', 'leave-in', 'lotion', 'hand-cream'];

/**
 * Determine weight class based on product type and name
 */
function getWeightClass(product) {
  const type = product.type?.toLowerCase() || '';
  const name = (product.name?.en || '').toLowerCase();

  // Rich products
  if (RICH_TYPES.includes(type) || name.includes('butter') || name.includes('mask')) {
    return 'rich';
  }

  // Lightweight products
  if (LIGHTWEIGHT_TYPES.includes(type) || name.includes('light')) {
    return 'lightweight';
  }

  // Medium (conditioners, creams, scrubs)
  return 'medium';
}

/**
 * Determine protein level based on tags and description
 */
function getProteinLevel(product) {
  const tags = product.tags || [];
  const hasStrength = tags.some(t => ['strengthen', 'strength', 'fortification', 'repair'].includes(t));

  if (hasStrength) {
    return 'medium';
  }

  return 'low';
}

/**
 * Determine if product provides heat protection
 */
function hasHeatProtect(product) {
  const type = product.type?.toLowerCase() || '';

  // Leave-in products, oils, and serums provide heat protection
  return LEAVE_IN_TYPES.includes(type);
}

// Process each product
let updatedCount = 0;

productsData.products = productsData.products.map(product => {
  const metadata = {
    // Humidity-resistant: TRUE only for oils/serums
    'humidity-resistant': OILS_SERUMS.includes(product.id),

    // Silicone-free: FALSE for serums (silicone-based), TRUE for others
    'silicone-free': !SERUMS_ONLY.includes(product.id),

    // Sulfate-free: TRUE for all (natural brand)
    'sulfate-free': true,

    // Color-safe: TRUE for all (gentle formulations)
    'color-safe': true,

    // Weight class: lightweight/medium/rich
    'weight-class': getWeightClass(product),

    // Protein level: low/medium (no high-protein products)
    'protein-level': getProteinLevel(product),

    // Heat protection: TRUE for leave-ins, oils, serums
    'heat-protect': hasHeatProtect(product)
  };

  updatedCount++;

  return {
    ...product,
    metadata
  };
});

// Write updated products
fs.writeFileSync(productsPath, JSON.stringify(productsData, null, 2), 'utf8');

console.log('✅ Product metadata added successfully!');
console.log(`📦 Updated ${updatedCount} products`);
console.log('\nMetadata added:');
console.log('  • humidity-resistant (6 oils/serums)');
console.log('  • silicone-free (4 serums = false, rest = true)');
console.log('  • sulfate-free (all = true)');
console.log('  • color-safe (all = true)');
console.log('  • weight-class (lightweight/medium/rich)');
console.log('  • protein-level (low/medium)');
console.log('  • heat-protect (leave-ins, oils, serums)');

// Show sample of oils/serums with humidity-resistant
console.log('\n🌊 Humidity-resistant products:');
productsData.products
  .filter(p => p.metadata['humidity-resistant'])
  .forEach(p => {
    console.log(`  - ${p.name.en} (${p.type})`);
  });

// Show serums with silicone
console.log('\n💧 Silicone-based products (silicone-free = false):');
productsData.products
  .filter(p => !p.metadata['silicone-free'])
  .forEach(p => {
    console.log(`  - ${p.name.en} (${p.type})`);
  });
