/**
 * Test Enhanced 3-Phase Qualification with New Metadata
 * Tests the audit scenario: Color-treated + Frizz + Shine
 */

const QualificationSystem = require('./qualification-system');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('ENHANCED 3-PHASE QUALIFICATION TEST');
console.log('Testing: Color-treated Hair + Frizz Problem + Shine Goal');
console.log('='.repeat(80));

const qualSystem = new QualificationSystem();

// Load products to inspect metadata
const productsPath = path.join(__dirname, '../config/products.json');
const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// Test Scenario: Color-treated hair with frizz problem
console.log('\n📋 TEST SCENARIO: Color-treated Hair + Frizz Control + Shine');
console.log('-'.repeat(80));

const sessionId = 'test-color-frizz-session';
const language = 'en';

// Start qualification
console.log('\n▶ Starting qualification for HAIR category...');
const q1 = qualSystem.startQualification(sessionId, language, 'hair');

// Answer Step 1: Hair texture = Wavy
console.log('\n▶ Step 1: Hair texture = Wavy');
qualSystem.processAnswer(sessionId, 1, { selected: 'wavy' }, language);

// Answer Step 2: Hair thickness = Medium
console.log('▶ Step 2: Hair thickness = Medium');
qualSystem.processAnswer(sessionId, 2, { selected: 'medium' }, language);

// Answer Step 3: Scalp type = Normal
console.log('▶ Step 3: Scalp type = Normal');
qualSystem.processAnswer(sessionId, 3, { selected: 'normal' }, language);

// Answer Step 4: Chemical treatment = Color-treated
console.log('▶ Step 4: Chemical treatment = Color-treated');
console.log('   ⚠️  CRITICAL: Product MUST be color-safe!');
qualSystem.processAnswer(sessionId, 4, { selected: 'color-treated' }, language);

// Answer Step 5: Primary problem = Frizz (MUST HAVE)
console.log('\n▶ Step 5 (PHASE 2 - MUST HAVE): Primary problem = Frizz / Humidity Control');
console.log('   ⚠️  CRITICAL: Product MUST have anti-frizz OR humidity-resistant!');
qualSystem.processAnswer(sessionId, 5, { selected: 'frizz' }, language);

// Answer Step 6: Secondary goals = Shine
console.log('\n▶ Step 6 (PHASE 3 - GOALS): Secondary goal = Shine Enhancement');
const final = qualSystem.processAnswer(sessionId, 6, { selected: 'shine' }, language);

console.log(`✓ ${final.completed ? 'Qualification completed!' : 'Not completed'}`);

// Get recommendations
console.log('\n▶ Getting product recommendations...');
const recommendations = qualSystem.getRecommendations(sessionId, language, 5);

if (recommendations.success) {
  console.log(`\n✅ ${recommendations.message}`);
  console.log(`📦 Found ${recommendations.count} products\n`);
  console.log('='.repeat(80));

  recommendations.recommendations.forEach((product, idx) => {
    console.log(`\n${idx + 1}. ${product.name} - LE ${product.price}`);
    console.log(`   Type: ${product.type?.toUpperCase()}`);
    console.log(`   Match: ${product.matchPercentage}% (Score: ${product.scoring.totalScore.toFixed(2)})`);

    // Show metadata
    const fullProduct = productsData.products.find(p => p.id === product.id);
    if (fullProduct?.metadata) {
      console.log(`\n   📊 METADATA CHECK:`);
      console.log(`      • Humidity-resistant: ${fullProduct.metadata['humidity-resistant'] ? '✅ YES' : '❌ NO'}`);
      console.log(`      • Color-safe: ${fullProduct.metadata['color-safe'] ? '✅ YES' : '⚠️  NO (SHOULD BE FILTERED!)'}`);
      console.log(`      • Silicone-free: ${fullProduct.metadata['silicone-free'] ? 'YES' : 'NO (silicone-based)'}`);
      console.log(`      • Sulfate-free: ${fullProduct.metadata['sulfate-free'] ? '✅ YES' : '❌ NO'}`);
      console.log(`      • Weight class: ${fullProduct.metadata['weight-class']}`);
      console.log(`      • Protein level: ${fullProduct.metadata['protein-level']}`);
      console.log(`      • Heat protect: ${fullProduct.metadata['heat-protect'] ? 'YES' : 'NO'}`);
    }

    console.log(`\n   ✓ Phase 2 (Must-have - Frizz Control):`);
    console.log(`      ${product.matchedRequiredTags.join(', ')}`);

    console.log(`   ✓ Phase 3 (Goals - Shine):`);
    console.log(`      ${product.matchedDesiredTags.join(', ')}`);

    console.log(`\n   📈 Scoring Breakdown:`);
    console.log(`      Required tags (3.0×): ${product.scoring.requiredTagScore.toFixed(1)}`);
    console.log(`      Desired tags (1.0×):  ${product.scoring.desiredTagScore.toFixed(1)}`);
    console.log(`      Context bonus:        ${product.scoring.contextBonus.toFixed(1)}`);
    console.log(`      TOTAL:                ${product.scoring.totalScore.toFixed(2)}`);

    if (product.contraindications.length > 0) {
      console.log(`\n   ⚠️  Contraindications: ${product.contraindications.join(', ')}`);
    }

    console.log('\n   ' + '-'.repeat(76));
  });

  // Validation checks
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION CHECKS:');
  console.log('='.repeat(80));

  const allColorSafe = recommendations.recommendations.every(p => {
    const full = productsData.products.find(fp => fp.id === p.id);
    return full?.metadata?.['color-safe'] === true;
  });

  const allHaveFrizzControl = recommendations.recommendations.every(p => {
    return p.matchedRequiredTags.length > 0;
  });

  const humidityResistantCount = recommendations.recommendations.filter(p => {
    const full = productsData.products.find(fp => fp.id === p.id);
    return full?.metadata?.['humidity-resistant'] === true;
  }).length;

  console.log(`\n✓ All products are color-safe: ${allColorSafe ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`✓ All products address frizz: ${allHaveFrizzControl ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`✓ Humidity-resistant products: ${humidityResistantCount}/${recommendations.count} (oils/serums)`);

  // Expected: Serums/oils should rank higher for frizz control
  const topProduct = recommendations.recommendations[0];
  const topProductFull = productsData.products.find(p => p.id === topProduct.id);
  const isTopHumidityResistant = topProductFull?.metadata?.['humidity-resistant'];

  console.log(`\n📌 Top recommendation: ${topProduct.name}`);
  console.log(`   Type: ${topProduct.type}`);
  console.log(`   Humidity-resistant: ${isTopHumidityResistant ? '✅ YES (ideal for frizz!)' : '⚠️  NO (deep treatment)'}`);

} else {
  console.log(`\n❌ ERROR: ${recommendations.error || 'Unknown error'}`);
}

console.log('\n' + '='.repeat(80));
console.log('✅ ENHANCED QUALIFICATION TEST COMPLETE');
console.log('='.repeat(80));
