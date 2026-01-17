/**
 * Script de test complet du chatbot INnatural
 * Teste différents scénarios clients avec le catalogue mis à jour
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/chat';
const TEST_SESSION_ID = `test-${Date.now()}`;

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * Fonction pour envoyer un message au chatbot
 */
async function sendMessage(message, language = 'ar', sessionId = TEST_SESSION_ID) {
  try {
    const response = await axios.post(API_URL, {
      message,
      sessionId,
      userProfile: { language }
    });
    return response.data;
  } catch (error) {
    console.error(`${colors.red}❌ Erreur:${colors.reset}`, error.message);
    return null;
  }
}

/**
 * Fonction pour afficher les résultats de test
 */
function displayResult(scenarioName, userMessage, botResponse, expectedKeywords = []) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${colors.cyan}📋 SCENARIO: ${scenarioName}${colors.reset}`);
  console.log(`${colors.blue}👤 Client:${colors.reset} ${userMessage}`);
  console.log(`${colors.magenta}🤖 Bot:${colors.reset} ${botResponse || 'No response'}`);

  // Vérifier les mots-clés attendus
  if (expectedKeywords.length > 0) {
    const foundKeywords = expectedKeywords.filter(keyword =>
      botResponse.toLowerCase().includes(keyword.toLowerCase())
    );

    if (foundKeywords.length === expectedKeywords.length) {
      console.log(`${colors.green}✅ PASS - Tous les mots-clés trouvés: ${foundKeywords.join(', ')}${colors.reset}`);
    } else {
      const missingKeywords = expectedKeywords.filter(keyword =>
        !botResponse.toLowerCase().includes(keyword.toLowerCase())
      );
      console.log(`${colors.yellow}⚠️  PARTIAL - Mots-clés manquants: ${missingKeywords.join(', ')}${colors.reset}`);
    }
  }
}

/**
 * Attendre un délai
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * SCENARIOS DE TEST
 */
async function runTests() {
  console.log(`${colors.green}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.green}🚀 DÉMARRAGE DES TESTS DU CHATBOT INNATURAL${colors.reset}`);
  console.log(`${colors.green}${'='.repeat(80)}${colors.reset}\n`);

  await sleep(3000); // Attendre que le serveur démarre

  // ============================================================================
  // SECTION 1: CHEVEUX SECS
  // ============================================================================
  console.log(`\n${colors.yellow}📌 SECTION 1: Problèmes de cheveux secs${colors.reset}`);

  let response = await sendMessage(
    'شعري جاف جدا ومحتاجة منتج يرطبه',
    'ar'
  );
  displayResult(
    'Cheveux très secs',
    'شعري جاف جدا ومحتاجة منتج يرطبه',
    response?.message,
    ['Mix Oil', 'ترطيب', 'Africa Shea Butter', 'CocoShea']
  );

  await sleep(2000);

  // ============================================================================
  // SECTION 2: CHEVEUX GRAS ET PELLICULES
  // ============================================================================
  console.log(`\n${colors.yellow}📌 SECTION 2: Cheveux gras et pellicules${colors.reset}`);

  response = await sendMessage(
    'عندي شعر دهني وقشرة',
    'ar',
    `test-oily-${Date.now()}`
  );
  displayResult(
    'Cheveux gras avec pellicules',
    'عندي شعر دهني وقشرة',
    response?.message,
    ['Rosemary', 'Almond', 'قشرة', 'دهني']
  );

  await sleep(2000);

  // ============================================================================
  // SECTION 3: CHUTE DE CHEVEUX
  // ============================================================================
  console.log(`\n${colors.yellow}📌 SECTION 3: Chute de cheveux${colors.reset}`);

  response = await sendMessage(
    'شعري بيقع كتير ومحتاجة حل',
    'ar',
    `test-hairloss-${Date.now()}`
  );
  displayResult(
    'Chute de cheveux',
    'شعري بيقع كتير ومحتاجة حل',
    response?.message,
    ['Rosemary', 'تساقط', 'بصيلات']
  );

  await sleep(2000);

  // ============================================================================
  // SECTION 4: CHEVEUX BOUCLÉS/AFRICAINS
  // ============================================================================
  console.log(`\n${colors.yellow}📌 SECTION 4: Cheveux bouclés/africains${colors.reset}`);

  response = await sendMessage(
    'شعري مجعد ومتشابك وخشن، عايزة منتج يفك التشابك',
    'ar',
    `test-curly-${Date.now()}`
  );
  displayResult(
    'Cheveux bouclés et enchevêtrés',
    'شعري مجعد ومتشابك وخشن، عايزة منتج يفك التشابك',
    response?.message,
    ['Africa Shea Butter', 'مجعد', 'تشابك']
  );

  await sleep(2000);

  // ============================================================================
  // SECTION 5: CHEVEUX COLORÉS/TRAITÉS
  // ============================================================================
  console.log(`\n${colors.yellow}📌 SECTION 5: Cheveux colorés/traités chimiquement${colors.reset}`);

  response = await sendMessage(
    'شعري مصبوغ ومعمول له كيراتين وبيتقصف',
    'ar',
    `test-colored-${Date.now()}`
  );
  displayResult(
    'Cheveux colorés et traités',
    'شعري مصبوغ ومعمول له كيراتين وبيتقصف',
    response?.message,
    ['CocoShea', 'Africa', 'كيراتين', 'مصبوغ']
  );

  await sleep(2000);

  // ============================================================================
  // SECTION 6: TESTS EN ANGLAIS
  // ============================================================================
  console.log(`\n${colors.yellow}📌 SECTION 6: Tests en anglais${colors.reset}`);

  response = await sendMessage(
    'I have dry and frizzy hair, what do you recommend?',
    'en',
    `test-english-${Date.now()}`
  );
  displayResult(
    'Dry and frizzy hair (English)',
    'I have dry and frizzy hair, what do you recommend?',
    response?.message,
    ['MixOil', 'Coconut', 'frizz', 'moisture']
  );

  await sleep(2000);

  // ============================================================================
  // SECTION 7: QUESTIONS SUR LES PRIX
  // ============================================================================
  console.log(`\n${colors.yellow}📌 SECTION 7: Questions sur les prix${colors.reset}`);

  response = await sendMessage(
    'كام سعر Africa Shea Butter؟',
    'ar',
    `test-price-${Date.now()}`
  );
  displayResult(
    'Question sur le prix',
    'كام سعر Africa Shea Butter؟',
    response?.message,
    ['300', 'EGP', 'Africa Shea']
  );

  await sleep(2000);

  // ============================================================================
  // SECTION 8: COMPARAISON DE PRODUITS
  // ============================================================================
  console.log(`\n${colors.yellow}📌 SECTION 8: Comparaison de produits${colors.reset}`);

  response = await sendMessage(
    'ايه الفرق بين MixOil Triple Blend و Africa Shea Butter؟',
    'ar',
    `test-comparison-${Date.now()}`
  );
  displayResult(
    'Comparaison de produits',
    'ايه الفرق بين MixOil Triple Blend و Africa Shea Butter؟',
    response?.message,
    ['Mix Oil', 'Africa', 'الفرق']
  );

  await sleep(2000);

  // ============================================================================
  // SECTION 9: ROUTINE CAPILLAIRE
  // ============================================================================
  console.log(`\n${colors.yellow}📌 SECTION 9: Demande de routine${colors.reset}`);

  response = await sendMessage(
    'عايزة روتين كامل لشعري الجاف والمتقصف',
    'ar',
    `test-routine-${Date.now()}`
  );
  displayResult(
    'Routine complète',
    'عايزة روتين كامل لشعري الجاف والمتقصف',
    response?.message,
    ['روتين', 'Complete Hair Care Set', 'شامبو', 'بلسم']
  );

  await sleep(2000);

  // ============================================================================
  // SECTION 10: MULTI-PROBLÈMES
  // ============================================================================
  console.log(`\n${colors.yellow}📌 SECTION 10: Plusieurs problèmes combinés${colors.reset}`);

  response = await sendMessage(
    'شعري دهني من فوق وجاف من تحت وعندي تساقط وقشرة، ايه الحل؟',
    'ar',
    `test-multi-${Date.now()}`
  );
  displayResult(
    'Plusieurs problèmes combinés',
    'شعري دهني من فوق وجاف من تحت وعندي تساقط وقشرة، ايه الحل؟',
    response?.message,
    ['Rosemary', 'Almond', 'دهني', 'قشرة', 'تساقط']
  );

  // ============================================================================
  // RÉSUMÉ FINAL
  // ============================================================================
  console.log(`\n${colors.green}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.green}✅ TESTS TERMINÉS${colors.reset}`);
  console.log(`${colors.green}${'='.repeat(80)}${colors.reset}\n`);

  console.log(`${colors.cyan}📊 Résumé:${colors.reset}`);
  console.log(`- 10 scénarios testés`);
  console.log(`- Catalogue avec 8 produits`);
  console.log(`- Tests en arabe et anglais`);
  console.log(`- Vérification des recommandations personnalisées`);
  console.log(`\n${colors.yellow}💡 Vérifiez les résultats ci-dessus pour valider que le bot:${colors.reset}`);
  console.log(`  1. Comprend les problèmes des clients`);
  console.log(`  2. Recommande les bons produits`);
  console.log(`  3. Utilise les descriptions personnalisées`);
  console.log(`  4. Répond en arabe/anglais correctement`);
  console.log(`  5. Anticipe les besoins et pose des questions pertinentes\n`);

  process.exit(0);
}

// Exécuter les tests
runTests().catch(error => {
  console.error(`${colors.red}❌ Erreur fatale:${colors.reset}`, error);
  process.exit(1);
});
