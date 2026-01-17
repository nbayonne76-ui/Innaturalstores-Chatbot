/**
 * Test script for 3-Phase Qualification System
 * Tests the complete flow: Phase 1 → Phase 2 → Phase 3 → Recommendations
 */

const QualificationSystem = require('./qualification-system');

console.log('='.repeat(80));
console.log('3-PHASE QUALIFICATION SYSTEM TEST');
console.log('='.repeat(80));

const qualSystem = new QualificationSystem();

// Test Scenario 1: Fine hair, bleached, with dryness problem, wants shine
console.log('\n📋 TEST SCENARIO 1: Fine, bleached hair with dryness');
console.log('-'.repeat(80));

const sessionId1 = 'test-session-1';
const language = 'en';

// Start qualification
console.log('\n▶ Starting qualification for hair category...');
const q1 = qualSystem.startQualification(sessionId1, language, 'hair');
console.log(`✓ Question 1 (Phase ${q1.currentStep <= 4 ? '1' : q1.currentStep === 5 ? '2' : '3'}): ${q1.question}`);
console.log(`  Options: ${q1.options.map(o => o.label).join(', ')}`);

// Answer Step 1: Hair texture = Straight
console.log('\n▶ Step 1: Hair texture = Straight');
const a1 = qualSystem.processAnswer(sessionId1, 1, { selected: 'straight' }, language);
console.log(`✓ Question 2 (Phase ${a1.currentStep <= 4 ? '1' : a1.currentStep === 5 ? '2' : '3'}): ${a1.question}`);

// Answer Step 2: Hair thickness = Fine
console.log('\n▶ Step 2: Hair thickness = Fine (contraindication: heavy-oils)');
const a2 = qualSystem.processAnswer(sessionId1, 2, { selected: 'fine' }, language);
console.log(`✓ Question 3 (Phase ${a2.currentStep <= 4 ? '1' : a2.currentStep === 5 ? '2' : '3'}): ${a2.question}`);

// Answer Step 3: Scalp type = Dry
console.log('\n▶ Step 3: Scalp type = Dry (contraindication: clarifying)');
const a3 = qualSystem.processAnswer(sessionId1, 3, { selected: 'dry' }, language);
console.log(`✓ Question 4 (Phase ${a3.currentStep <= 4 ? '1' : a3.currentStep === 5 ? '2' : '3'}): ${a3.question}`);

// Answer Step 4: Chemical treatments = Bleached
console.log('\n▶ Step 4: Chemical treatment = Bleached (contraindication: harsh-sulfates)');
const a4 = qualSystem.processAnswer(sessionId1, 4, { selected: 'bleached' }, language);
console.log(`✓ Question 5 (Phase ${a4.currentStep <= 4 ? '1' : a4.currentStep === 5 ? '2' : '3'}): ${a4.question}`);
console.log(`  ${a4.options.map(o => o.label).join(' | ')}`);

// Answer Step 5: Primary problem = Dryness (MUST HAVE)
console.log('\n▶ Step 5 (PHASE 2 - MUST HAVE): Primary problem = Dryness');
const a5 = qualSystem.processAnswer(sessionId1, 5, { selected: 'dryness' }, language);
console.log(`✓ Question 6 (Phase ${a5.currentStep <= 4 ? '1' : a5.currentStep === 5 ? '2' : '3'}): ${a5.question}`);

// Answer Step 6: Secondary goals = [Shine, Natural ingredients]
console.log('\n▶ Step 6 (PHASE 3 - GOALS): Secondary goals = Shine + Natural ingredients');
const a6 = qualSystem.processAnswer(sessionId1, 6, { selected: ['shine', 'natural-clean'] }, language);
console.log(`✓ ${a6.completed ? 'Qualification completed!' : 'Not completed'}`);

// Get recommendations
console.log('\n▶ Getting product recommendations...');
const recommendations1 = qualSystem.getRecommendations(sessionId1, language, 5);

if (recommendations1.success) {
  console.log(`\n✅ ${recommendations1.message}`);
  console.log(`📦 Found ${recommendations1.count} products\n`);

  recommendations1.recommendations.forEach((product, idx) => {
    console.log(`${idx + 1}. ${product.name} - LE ${product.price}`);
    console.log(`   Match: ${product.matchPercentage}% (Score: ${product.scoring.totalScore.toFixed(2)})`);
    console.log(`   ✓ Phase 2 (Must-have): ${product.matchedRequiredTags.join(', ')}`);
    console.log(`   ✓ Phase 3 (Goals): ${product.matchedDesiredTags.join(', ')}`);
    console.log(`   Scoring: Required=${product.scoring.requiredTagScore.toFixed(1)}, Desired=${product.scoring.desiredTagScore.toFixed(1)}, Bonus=${product.scoring.contextBonus.toFixed(1)}`);
    console.log(`   Tags: ${product.tags.slice(0, 8).join(', ')}...`);
    if (product.contraindications.length > 0) {
      console.log(`   ⚠️  Contraindications: ${product.contraindications.join(', ')}`);
    }
    console.log('');
  });
}

// Test Scenario 2: Thick, curly hair with hair loss problem
console.log('\n' + '='.repeat(80));
console.log('📋 TEST SCENARIO 2: Thick, curly hair with hair loss');
console.log('-'.repeat(80));

const sessionId2 = 'test-session-2';

// Start and answer all questions at once for brevity
qualSystem.startQualification(sessionId2, language, 'hair');
qualSystem.processAnswer(sessionId2, 1, { selected: 'curly' }, language);
qualSystem.processAnswer(sessionId2, 2, { selected: 'thick' }, language);
qualSystem.processAnswer(sessionId2, 3, { selected: 'normal' }, language);
qualSystem.processAnswer(sessionId2, 4, { selected: 'none' }, language);
qualSystem.processAnswer(sessionId2, 5, { selected: 'thinning' }, language); // Primary: Hair loss
qualSystem.processAnswer(sessionId2, 6, { selected: ['strengthening', 'volume', 'deep-nourishment'] }, language);

console.log('\n▶ User: Curly, Thick, Normal scalp, No treatments');
console.log('▶ Phase 2 (Must-have): Thinning/Hair loss');
console.log('▶ Phase 3 (Goals): Strengthening + Volume + Deep nourishment');

const recommendations2 = qualSystem.getRecommendations(sessionId2, language, 5);

if (recommendations2.success) {
  console.log(`\n✅ ${recommendations2.message}`);
  console.log(`📦 Found ${recommendations2.count} products\n`);

  recommendations2.recommendations.forEach((product, idx) => {
    console.log(`${idx + 1}. ${product.name} - LE ${product.price}`);
    console.log(`   Match: ${product.matchPercentage}% (Score: ${product.scoring.totalScore.toFixed(2)})`);
    console.log(`   ✓ Phase 2: ${product.matchedRequiredTags.join(', ')}`);
    console.log(`   ✓ Phase 3: ${product.matchedDesiredTags.join(', ')}`);
    console.log('');
  });
}

// Test Scenario 3: Body products - Sensitive skin needing nourishment
console.log('\n' + '='.repeat(80));
console.log('📋 TEST SCENARIO 3: Sensitive skin needing deep nourishment');
console.log('-'.repeat(80));

const sessionId3 = 'test-session-3';

qualSystem.startQualification(sessionId3, language, 'body');
qualSystem.processAnswer(sessionId3, 1, { selected: 'sensitive' }, language); // Contraindication: harsh-exfoliants
qualSystem.processAnswer(sessionId3, 2, { selected: 'nourishment' }, language); // Primary: Nourishment
qualSystem.processAnswer(sessionId3, 3, { selected: ['softness', 'natural-ingredients'] }, language);

console.log('\n▶ User: Sensitive skin');
console.log('▶ Phase 2 (Must-have): Deep nourishment');
console.log('▶ Phase 3 (Goals): Softness + Natural ingredients');

const recommendations3 = qualSystem.getRecommendations(sessionId3, language, 5);

if (recommendations3.success) {
  console.log(`\n✅ ${recommendations3.message}`);
  console.log(`📦 Found ${recommendations3.count} products\n`);

  recommendations3.recommendations.forEach((product, idx) => {
    console.log(`${idx + 1}. ${product.name} - LE ${product.price}`);
    console.log(`   Match: ${product.matchPercentage}% (Score: ${product.scoring.totalScore.toFixed(2)})`);
    console.log(`   ✓ Phase 2: ${product.matchedRequiredTags.join(', ')}`);
    console.log(`   ✓ Phase 3: ${product.matchedDesiredTags.join(', ')}`);
    if (product.contraindications.length > 0) {
      console.log(`   ⚠️  Contraindications: ${product.contraindications.join(', ')} (Should be filtered!)`);
    }
    console.log('');
  });
}

console.log('\n' + '='.repeat(80));
console.log('✅ 3-PHASE QUALIFICATION SYSTEM TEST COMPLETE');
console.log('='.repeat(80));

// Get stats
const stats = qualSystem.getStats();
console.log('\n📊 System Statistics:');
console.log(`   Total sessions: ${stats.totalSessions}`);
console.log(`   Completed: ${stats.completed}`);
console.log(`   In progress: ${stats.inProgress}`);
console.log(`   Hair: ${stats.byCategory.hair}`);
console.log(`   Body: ${stats.byCategory.body}`);
console.log('');
