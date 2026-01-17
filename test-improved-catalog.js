#!/usr/bin/env node
/**
 * Script de test pour valider le catalogue produit amélioré
 * Teste les descriptions et bénéfices des produits body et capillaires
 */

const fs = require('fs');
const path = require('path');

// Charger le catalogue amélioré
const catalogPath = path.join(__dirname, 'config', 'products.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log('\n🎯 TEST DU CATALOGUE PRODUIT AMÉLIORÉ\n');
console.log('='.repeat(60));
console.log(`📦 Catalogue version: ${catalog.metadata.version}`);
console.log(`📅 Dernière mise à jour: ${catalog.metadata.lastUpdated}`);
console.log(`✨ Amélioré: ${catalog.metadata.improved ? 'OUI' : 'NON'}`);
console.log(`📊 Total produits: ${catalog.metadata.totalProducts}`);
console.log('='.repeat(60));

// Fonction pour afficher un produit
function displayProduct(product, language = 'en') {
  console.log(`\n📦 ${product.name[language]} (${product.id})`);
  console.log(`   Type: ${product.type}`);
  console.log(`   Prix: LE ${product.price}`);

  // Afficher les bénéfices
  if (product.benefits && product.benefits[language]) {
    console.log(`\n   ✨ Bénéfices (${language}):`);
    product.benefits[language].forEach((benefit, i) => {
      console.log(`      ${i + 1}. ${benefit}`);
    });
  }

  // Afficher un extrait de la description
  if (product.description && product.description[language]) {
    const desc = product.description[language];
    const preview = desc.substring(0, 150) + (desc.length > 150 ? '...' : '');
    console.log(`\n   📝 Description (${language}):`);
    console.log(`      ${preview}`);
  }
}

// TEST 1: Vérifier les produits body
console.log('\n\n🧴 TEST 1: PRODUITS BODY (Vérification des bénéfices corrigés)\n');
console.log('-'.repeat(60));

const bodyProducts = catalog.products.filter(p =>
  ['body-butter', 'body-cream', 'body-scrub', 'hand-cream'].includes(p.type)
);

console.log(`\nNombre de produits body trouvés: ${bodyProducts.length}`);

// Vérifier qu'aucun produit body ne parle de cheveux
let bodyProductsWithHairBenefits = 0;
let bodyProductsWithSkinBenefits = 0;

bodyProducts.forEach((product) => {
  const benefitsText = JSON.stringify(product.benefits?.en || []).toLowerCase();

  if (benefitsText.includes('hair')) {
    bodyProductsWithHairBenefits++;
    console.log(`\n❌ ERREUR: ${product.id} a des bénéfices pour cheveux!`);
    displayProduct(product, 'en');
  } else if (benefitsText.includes('skin') || benefitsText.includes('hand')) {
    bodyProductsWithSkinBenefits++;
  }
});

console.log(`\n📊 Résultats:`);
console.log(`   ✅ Produits avec bénéfices pour peau: ${bodyProductsWithSkinBenefits}/${bodyProducts.length}`);
console.log(`   ❌ Produits avec bénéfices pour cheveux: ${bodyProductsWithHairBenefits}/${bodyProducts.length}`);

if (bodyProductsWithHairBenefits === 0) {
  console.log(`\n   🎉 SUCCÈS: Tous les produits body ont des bénéfices corrects!`);
}

// Afficher un exemple de produit body amélioré
console.log(`\n📋 Exemple de produit body amélioré:`);
const exampleBody = bodyProducts.find(p => p.type === 'body-butter');
if (exampleBody) {
  displayProduct(exampleBody, 'en');
}

// TEST 2: Vérifier les produits capillaires
console.log('\n\n💇 TEST 2: PRODUITS CAPILLAIRES\n');
console.log('-'.repeat(60));

const hairProducts = catalog.products.filter(p =>
  ['shampoo', 'conditioner', 'leave-in', 'mask', 'serum', 'oil', 'mist', 'treatment'].includes(p.type)
);

console.log(`\nNombre de produits capillaires trouvés: ${hairProducts.length}`);

// Afficher un exemple de produit capillaire
console.log(`\n📋 Exemple de produit capillaire:`);
const exampleHair = hairProducts.find(p => p.type === 'shampoo');
if (exampleHair) {
  displayProduct(exampleHair, 'en');
}

// TEST 3: Vérifier que tous les produits ont descriptions et bénéfices
console.log('\n\n✅ TEST 3: COMPLÉTUDE DU CATALOGUE\n');
console.log('-'.repeat(60));

let missingDescriptions = 0;
let missingBenefits = 0;

catalog.products.forEach((product) => {
  if (!product.description || !product.description.en || product.description.en.length < 50) {
    missingDescriptions++;
  }
  if (!product.benefits || !product.benefits.en || product.benefits.en.length === 0) {
    missingBenefits++;
  }
});

console.log(`\n📊 Résultats:`);
console.log(`   Total produits: ${catalog.products.length}`);
console.log(`   Produits avec descriptions: ${catalog.products.length - missingDescriptions}/${catalog.products.length}`);
console.log(`   Produits avec bénéfices: ${catalog.products.length - missingBenefits}/${catalog.products.length}`);

if (missingDescriptions === 0 && missingBenefits === 0) {
  console.log(`\n   🎉 SUCCÈS: Tous les produits ont des descriptions et bénéfices complets!`);
}

// TEST 4: Vérifier la qualité des descriptions (longueur, détails)
console.log('\n\n📝 TEST 4: QUALITÉ DES DESCRIPTIONS\n');
console.log('-'.repeat(60));

let shortDescriptions = 0;
let richDescriptions = 0;
let descWithEmojis = 0;
let descWithContact = 0;

catalog.products.forEach((product) => {
  const desc = product.description?.en || '';

  if (desc.length < 200) {
    shortDescriptions++;
  } else if (desc.length > 300) {
    richDescriptions++;
  }

  if (/[\u{1F300}-\u{1F9FF}]/u.test(desc) || /[\u{2600}-\u{26FF}]/u.test(desc)) {
    descWithEmojis++;
  }

  if (desc.includes('WhatsApp') || desc.includes('+20155 5590333')) {
    descWithContact++;
  }
});

console.log(`\n📊 Résultats:`);
console.log(`   Descriptions riches (>300 chars): ${richDescriptions}/${catalog.products.length}`);
console.log(`   Descriptions courtes (<200 chars): ${shortDescriptions}/${catalog.products.length}`);
console.log(`   Descriptions avec emojis: ${descWithEmojis}/${catalog.products.length}`);
console.log(`   Descriptions avec contact WhatsApp: ${descWithContact}/${catalog.products.length}`);

// RÉSUMÉ FINAL
console.log('\n\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ FINAL\n');

const allTests = [
  {
    name: 'Bénéfices produits body corrects',
    passed: bodyProductsWithHairBenefits === 0,
    details: `${bodyProductsWithSkinBenefits}/${bodyProducts.length} produits corrects`
  },
  {
    name: 'Tous les produits ont des descriptions',
    passed: missingDescriptions === 0,
    details: `${catalog.products.length - missingDescriptions}/${catalog.products.length} produits`
  },
  {
    name: 'Tous les produits ont des bénéfices',
    passed: missingBenefits === 0,
    details: `${catalog.products.length - missingBenefits}/${catalog.products.length} produits`
  },
  {
    name: 'Qualité des descriptions',
    passed: richDescriptions > shortDescriptions,
    details: `${richDescriptions} riches vs ${shortDescriptions} courtes`
  }
];

allTests.forEach((test, i) => {
  const icon = test.passed ? '✅' : '❌';
  console.log(`   ${icon} ${test.name}`);
  console.log(`      ${test.details}`);
});

const allPassed = allTests.every(t => t.passed);

if (allPassed) {
  console.log(`\n🎉 TOUS LES TESTS RÉUSSIS ! Le catalogue est prêt pour production.`);
} else {
  console.log(`\n⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus.`);
}

console.log('='.repeat(60) + '\n');
