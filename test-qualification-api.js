/**
 * Test Qualification API Endpoints
 *
 * This script tests the qualification flow:
 * 1. Start qualification
 * 2. Answer step 1 (category)
 * 3. Answer step 2 (concerns)
 * 4. Answer step 3 (objectives)
 * 5. Get recommendations
 */

// Use node-fetch for HTTP requests
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'http://localhost:5001';
const sessionId = `test_session_${Date.now()}`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testQualificationFlow() {
  try {
    log('\n🧪 Test du Flow de Qualification\n', 'cyan');
    log(`Session ID: ${sessionId}`, 'blue');
    log('='.repeat(60), 'blue');

    // Step 0: Start Qualification
    log('\n📝 Étape 0: Démarrage du flow de qualification...', 'yellow');
    const startResponse = await fetch(`${API_URL}/api/qualification/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        language: 'ar'
      })
    });

    const startData = await startResponse.json();
    log('✅ Response:', 'green');
    console.log(JSON.stringify(startData, null, 2));

    if (!startData.success) {
      throw new Error('Failed to start qualification');
    }

    // Step 1: Answer Category (Hair)
    log('\n📝 Étape 1: Sélection de la catégorie (Cheveux)...', 'yellow');
    const step1Response = await fetch(`${API_URL}/api/qualification/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        language: 'ar',
        step: 1,
        answer: {
          selected: 'hair'
        }
      })
    });

    const step1Data = await step1Response.json();
    log('✅ Response:', 'green');
    console.log(JSON.stringify(step1Data, null, 2));

    if (!step1Data.success) {
      throw new Error('Failed to process step 1');
    }

    // Step 2: Answer Concerns (Multi-select)
    log('\n📝 Étape 2: Sélection des problèmes (Sécheresse, Chute de cheveux)...', 'yellow');
    const step2Response = await fetch(`${API_URL}/api/qualification/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        language: 'ar',
        step: 2,
        answer: {
          selected: ['dryness', 'hair-loss']
        }
      })
    });

    const step2Data = await step2Response.json();
    log('✅ Response:', 'green');
    console.log(JSON.stringify(step2Data, null, 2));

    if (!step2Data.success) {
      throw new Error('Failed to process step 2');
    }

    // Step 3: Answer Objective (Single select)
    log('\n📝 Étape 3: Sélection de l\'objectif (Hydratation)...', 'yellow');
    const step3Response = await fetch(`${API_URL}/api/qualification/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        language: 'ar',
        step: 3,
        answer: {
          selected: 'hydration'
        }
      })
    });

    const step3Data = await step3Response.json();
    log('✅ Response:', 'green');
    console.log(JSON.stringify(step3Data, null, 2));

    if (!step3Data.success) {
      throw new Error('Failed to process step 3');
    }

    // Get Recommendations
    log('\n📊 Récupération des recommandations...', 'yellow');
    const recommendationsResponse = await fetch(
      `${API_URL}/api/qualification/recommendations/${sessionId}?language=ar&limit=3`
    );

    const recommendationsData = await recommendationsResponse.json();
    log('✅ Response:', 'green');
    console.log(JSON.stringify(recommendationsData, null, 2));

    if (!recommendationsData.success) {
      throw new Error('Failed to get recommendations');
    }

    // Summary
    log('\n' + '='.repeat(60), 'blue');
    log('✅ TEST RÉUSSI!', 'green');
    log(`\nRésultats:`, 'cyan');
    log(`- Nombre de recommandations: ${recommendationsData.count}`, 'blue');

    if (recommendationsData.recommendations.length > 0) {
      log('\nTop 3 Produits Recommandés:', 'cyan');
      recommendationsData.recommendations.forEach((product, index) => {
        const matchScore = Math.round(product.matchScore * 100);
        log(`  ${index + 1}. ${product.name} (${matchScore}% match)`, 'blue');
      });
    }

    log('\n' + '='.repeat(60), 'blue');

  } catch (error) {
    log('\n❌ ERREUR!', 'red');
    if (error.response) {
      console.error('Response error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Run the test
testQualificationFlow();
