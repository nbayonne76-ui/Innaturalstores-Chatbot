/**
 * Script to add benefit tags and contraindications to products
 * Based on 3-Phase Qualification System requirements
 */

const fs = require('fs');
const path = require('path');

// Mapping from old concerns to new benefit tags
const concernToTagsMap = {
  'hair-loss': ['anti-hair-loss', 'growth-stimulation', 'density'],
  'weak-hair': ['strength', 'fortification'],
  'thinning': ['anti-hair-loss', 'growth-stimulation', 'density'],
  'dryness': ['hydration', 'deep-moisture', 'moisturize'],
  'dehydration': ['hydration', 'deep-moisture'],
  'frizz': ['anti-frizz', 'frizz-control', 'smooth'],
  'split-ends': ['split-end-repair', 'breakage-repair', 'repair'],
  'damaged-hair': ['damage-repair', 'repair', 'restore'],
  'breakage': ['breakage-repair', 'repair', 'strength'],
  'dandruff': ['anti-dandruff', 'scalp-health', 'scalp-soothing'],
  'scalp-issues': ['scalp-health', 'scalp-soothing'],
  'dull-hair': ['shine', 'luster', 'glossy']
};

// Additional tags based on product type and description
const productTypeToTags = {
  'shampoo': ['cleansing'],
  'conditioner': ['conditioning', 'detangle'],
  'hair-mask': ['deep-nourish', 'intensive-treatment'],
  'hair-oil': ['nourish', 'shine'],
  'leave-in': ['manageable', 'heat-protect'],
  'body-cream': ['moisturize', 'nourish'],
  'body-butter': ['deep-nourish', 'intense-hydration'],
  'body-scrub': ['exfoliation', 'dead-skin-removal']
};

// Contraindications based on product characteristics
const addContraindications = (product) => {
  const contraindications = [];

  // Heavy oils/butters - not for fine hair
  if (product.type === 'body-butter' || product.type === 'hair-oil') {
    if (product.collection && (
      product.collection.includes('castor') ||
      product.collection.includes('africa')
    )) {
      contraindications.push('heavy-oils');
    }
  }

  // Shampoos with sulfates - not for color-treated/bleached
  if (product.type === 'shampoo') {
    // Most shampoos are gentle, but we can flag specific ones if needed
    // For now, we'll assume INnatural shampoos are sulfate-free (natural brand)
  }

  // Clarifying products - not for dry scalp
  if (product.description?.en?.toLowerCase().includes('clarifying') ||
      product.description?.en?.toLowerCase().includes('deep clean')) {
    contraindications.push('clarifying');
  }

  // Protein treatments - not for over-processed hair
  if (product.description?.en?.toLowerCase().includes('protein') ||
      product.description?.en?.toLowerCase().includes('keratin')) {
    contraindications.push('strong-protein');
  }

  // Exfoliating products - not for sensitive skin
  if (product.type === 'body-scrub') {
    // Already natural/gentle, but still not ideal for very sensitive skin
    contraindications.push('harsh-exfoliants');
  }

  return contraindications;
};

// Extract additional tags from description
const extractTagsFromDescription = (description, benefits) => {
  const tags = new Set();

  const text = (description?.en || '').toLowerCase();
  const benefitsText = (benefits?.en || []).join(' ').toLowerCase();
  const combinedText = text + ' ' + benefitsText;

  // Hydration/Moisture
  if (combinedText.match(/hydrat|moisture|moisturiz/i)) {
    tags.add('hydration');
    if (combinedText.match(/deep|intense|rich/i)) {
      tags.add('deep-moisture');
    }
  }

  // Shine/Luster
  if (combinedText.match(/shine|luster|glossy|shiny/i)) {
    tags.add('shine');
    tags.add('luster');
  }

  // Repair/Restore
  if (combinedText.match(/repair|restor|fix/i)) {
    tags.add('repair');
    tags.add('restore');
  }

  // Strength/Fortify
  if (combinedText.match(/strength|fortif|strong/i)) {
    tags.add('strength');
    tags.add('fortification');
  }

  // Growth/Density
  if (combinedText.match(/growth|grow|density|thick|volume/i)) {
    tags.add('growth-stimulation');
    tags.add('density');
  }

  // Nourish/Nutrient
  if (combinedText.match(/nourish|nutrient|vitamin|feed/i)) {
    tags.add('nourish');
    tags.add('deep-nourish');
  }

  // Smooth/Soft
  if (combinedText.match(/smooth|soft|silky/i)) {
    tags.add('smooth');
  }

  // Natural/Organic
  if (combinedText.match(/natural|organic|pure|clean/i)) {
    tags.add('natural');
    tags.add('clean');
  }

  // Volume/Body
  if (combinedText.match(/volume|body|fuller/i)) {
    tags.add('volume');
    tags.add('volumizing');
  }

  // Scalp health
  if (combinedText.match(/scalp|follicle/i)) {
    tags.add('scalp-health');
  }

  // Detangle/Manageable
  if (combinedText.match(/detangle|manageable|easy/i)) {
    tags.add('detangle');
    tags.add('manageable');
  }

  // Color protection
  if (combinedText.match(/color.*protect|protect.*color|color.*safe/i)) {
    tags.add('color-protect');
    tags.add('color-safe');
  }

  // Lightweight
  if (combinedText.match(/light|weightless/i)) {
    tags.add('lightweight');
  }

  return Array.from(tags);
};

// Main function
const addTagsAndContraindications = () => {
  const productsPath = path.join(__dirname, '../config/products.json');
  const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

  console.log(`Processing ${productsData.products.length} products...`);

  let updated = 0;

  productsData.products.forEach(product => {
    const tags = new Set();

    // 1. Add tags from concerns
    if (product.concerns) {
      product.concerns.forEach(concern => {
        const mappedTags = concernToTagsMap[concern] || [];
        mappedTags.forEach(tag => tags.add(tag));
      });
    }

    // 2. Add tags from product type
    if (product.type && productTypeToTags[product.type]) {
      productTypeToTags[product.type].forEach(tag => tags.add(tag));
    }

    // 3. Extract tags from description and benefits
    const extractedTags = extractTagsFromDescription(product.description, product.benefits);
    extractedTags.forEach(tag => tags.add(tag));

    // 4. Add contraindications
    const contraindications = addContraindications(product);

    // Update product
    product.tags = Array.from(tags);
    product.contraindications = contraindications;

    console.log(`✓ ${product.id}: ${product.tags.length} tags, ${contraindications.length} contraindications`);
    updated++;
  });

  // Update metadata
  productsData.metadata.version = "5.0.0";
  productsData.metadata.taggingSystem = "3-Phase Qualification v3.0";
  productsData.metadata.lastUpdated = new Date().toISOString().split('T')[0];

  // Save updated data
  fs.writeFileSync(productsPath, JSON.stringify(productsData, null, 2), 'utf8');

  console.log(`\n✅ Successfully updated ${updated} products with tags and contraindications!`);
  console.log(`📝 Saved to: ${productsPath}`);
};

// Run the script
try {
  addTagsAndContraindications();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
