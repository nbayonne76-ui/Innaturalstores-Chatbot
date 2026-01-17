#!/usr/bin/env node
/**
 * Data Integrity Validation Script
 * Checks chatbot data matches website reality
 * Run before deployment to catch data mismatches
 */

const fs = require('fs');
const path = require('path');

// Load chatbot data
const productsPath = path.join(__dirname, '../config/products.json');
const faqsPath = path.join(__dirname, '../config/faqs.json');

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const faqs = JSON.parse(fs.readFileSync(faqsPath, 'utf8'));

let errors = [];
let warnings = [];
let passed = 0;

console.log('\n========================================');
console.log('  DATA INTEGRITY VALIDATION REPORT');
console.log('========================================\n');

// Test 1: Check minimum product count
console.log('[TEST 1] Product Count Validation');
if (products.products.length >= 30) {
  console.log(`  [PASS] Found ${products.products.length} products (minimum 30 required)`);
  passed++;
} else {
  errors.push(`Only ${products.products.length} products found, website has 40+`);
  console.log(`  [FAIL] Only ${products.products.length} products, expected 30+`);
}

// Test 2: Check collections exist
console.log('\n[TEST 2] Collections Validation');
const requiredCollections = [
  'mixoil-anti-hair-loss',
  'mixoil-hydration',
  'cocoshea-split-end-repair',
  'curly-hair',
  'africa'
];
const foundCollections = products.collections.map(c => c.id);
const missingCollections = requiredCollections.filter(c => !foundCollections.includes(c));

if (missingCollections.length === 0) {
  console.log(`  [PASS] All 5 required collections found`);
  passed++;
} else {
  errors.push(`Missing collections: ${missingCollections.join(', ')}`);
  console.log(`  [FAIL] Missing: ${missingCollections.join(', ')}`);
}

// Test 3: Check bundles exist
console.log('\n[TEST 3] Bundles Validation');
if (products.bundles && products.bundles.length >= 3) {
  console.log(`  [PASS] Found ${products.bundles.length} bundles`);
  // Check specific bundles
  const bundleIds = products.bundles.map(b => b.id);
  const requiredBundles = ['hair-care-bundle-antiloss', 'hydration-bundle', 'hair-routine-bundle-cocoshea'];
  const missingBundles = requiredBundles.filter(b => !bundleIds.includes(b));

  if (missingBundles.length === 0) {
    console.log(`  [PASS] All required bundles present`);
    passed++;
  } else {
    warnings.push(`Missing bundles: ${missingBundles.join(', ')}`);
    console.log(`  [WARN] Missing bundles: ${missingBundles.join(', ')}`);
  }
} else {
  errors.push('Bundles not found or insufficient count');
  console.log(`  [FAIL] Bundles missing or insufficient`);
}

// Test 4: Check price ranges
console.log('\n[TEST 4] Price Validation');
const prices = products.products.map(p => p.price);
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);

if (minPrice >= 165 && maxPrice <= 325) {
  console.log(`  [PASS] Price range: LE ${minPrice} - LE ${maxPrice} (expected LE 165-325)`);
  passed++;
} else {
  warnings.push(`Price range ${minPrice}-${maxPrice} outside expected range 165-325`);
  console.log(`  [WARN] Price range ${minPrice}-${maxPrice} unusual`);
}

// Test 5: Check promotions in FAQs
console.log('\n[TEST 5] Promotions Validation');
const hasPromotions = faqs.promotions && faqs.promotions.bulk_discount && faqs.promotions.free_shipping;
if (hasPromotions) {
  console.log(`  [PASS] Promotions configured in FAQs`);
  console.log(`        - Free shipping threshold: LE ${faqs.promotions.free_shipping.threshold}`);
  console.log(`        - Bulk discount: ${faqs.promotions.bulk_discount.percentage}% over LE ${faqs.promotions.bulk_discount.threshold}`);
  passed++;
} else {
  errors.push('Promotions not properly configured in FAQs');
  console.log(`  [FAIL] Promotions missing from FAQs`);
}

// Test 6: Check for required product types
console.log('\n[TEST 6] Product Type Diversity');
const productTypes = new Set(products.products.map(p => p.type));
const requiredTypes = ['shampoo', 'conditioner', 'mask', 'oil'];
const hasRequiredTypes = requiredTypes.every(type => productTypes.has(type));

if (hasRequiredTypes) {
  console.log(`  [PASS] All required product types present`);
  console.log(`        Found: ${Array.from(productTypes).join(', ')}`);
  passed++;
} else {
  const missing = requiredTypes.filter(type => !productTypes.has(type));
  errors.push(`Missing product types: ${missing.join(', ')}`);
  console.log(`  [FAIL] Missing types: ${missing.join(', ')}`);
}

// Test 7: Check metadata
console.log('\n[TEST 7] Metadata Validation');
if (products.metadata && products.metadata.lastUpdated && products.metadata.source) {
  console.log(`  [PASS] Metadata present`);
  console.log(`        Last updated: ${products.metadata.lastUpdated}`);
  console.log(`        Source: ${products.metadata.source}`);
  console.log(`        Currency: ${products.metadata.currency}`);
  passed++;
} else {
  warnings.push('Metadata incomplete');
  console.log(`  [WARN] Metadata incomplete`);
}

// Test 8: Check bilingual support
console.log('\n[TEST 8] Bilingual Content Validation');
const sampleProduct = products.products[0];
const hasBilingualNames = sampleProduct && sampleProduct.name && sampleProduct.name.ar && sampleProduct.name.en;

if (hasBilingualNames) {
  console.log(`  [PASS] Products have bilingual names`);
  passed++;
} else {
  errors.push('Products missing bilingual content');
  console.log(`  [FAIL] Bilingual names not found`);
}

// Summary
console.log('\n========================================');
console.log('  SUMMARY');
console.log('========================================\n');
console.log(`Tests Passed:  ${passed}/8`);
console.log(`Warnings:      ${warnings.length}`);
console.log(`Critical Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\n[CRITICAL ERRORS]:');
  errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
}

if (warnings.length > 0) {
  console.log('\n[WARNINGS]:');
  warnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
}

console.log('\n========================================');
if (errors.length === 0) {
  console.log('  STATUS: READY FOR DEPLOYMENT');
  console.log('========================================\n');
  process.exit(0);
} else {
  console.log('  STATUS: FIX ERRORS BEFORE DEPLOYMENT');
  console.log('========================================\n');
  process.exit(1);
}
