/**
 * Test manuel simple - un message à la fois
 */
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/chat';

async function testMessage(message, language = 'ar') {
  console.log('\n' + '='.repeat(80));
  console.log(`👤 Client (${language}): ${message}`);
  console.log('⏳ En attente de la réponse...\n');

  try {
    const response = await axios.post(API_URL, {
      message,
      sessionId: `manual-test-${Date.now()}`,
      userProfile: { language }
    }, {
      timeout: 30000
    });

    console.log(`🤖 Bot: ${response.data.message}\n`);
    console.log('✅ Test réussi!');
    console.log('='.repeat(80));

    return response.data;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.log('='.repeat(80));
    return null;
  }
}

// Fonction principale
async function main() {
  const scenario = process.argv[2] || '1';

  console.log('\n🚀 TEST MANUEL DU CHATBOT INNATURAL\n');

  switch(scenario) {
    case '1':
      console.log('📋 SCENARIO 1: Cheveux secs');
      await testMessage('شعري جاف جدا ومحتاجة منتج يرطبه', 'ar');
      break;

    case '2':
      console.log('📋 SCENARIO 2: Cheveux gras et pellicules');
      await testMessage('عندي شعر دهني وقشرة', 'ar');
      break;

    case '3':
      console.log('📋 SCENARIO 3: Chute de cheveux');
      await testMessage('شعري بيقع كتير ومحتاجة حل', 'ar');
      break;

    case '4':
      console.log('📋 SCENARIO 4: Cheveux bouclés');
      await testMessage('شعري مجعد ومتشابك وخشن', 'ar');
      break;

    case '5':
      console.log('📋 SCENARIO 5: Cheveux colorés');
      await testMessage('شعري مصبوغ ومعمول له كيراتين', 'ar');
      break;

    case '6':
      console.log('📋 SCENARIO 6: English test');
      await testMessage('I have dry and frizzy hair', 'en');
      break;

    case '7':
      console.log('📋 SCENARIO 7: Question sur prix');
      await testMessage('كام سعر Africa Shea Butter؟', 'ar');
      break;

    case '8':
      console.log('📋 SCENARIO 8: Demande routine');
      await testMessage('عايزة روتين كامل لشعري', 'ar');
      break;

    default:
      console.log('Usage: node manual-test.js [1-8]');
      console.log('Scenarios:');
      console.log('  1 - Cheveux secs');
      console.log('  2 - Cheveux gras et pellicules');
      console.log('  3 - Chute de cheveux');
      console.log('  4 - Cheveux bouclés');
      console.log('  5 - Cheveux colorés');
      console.log('  6 - English test');
      console.log('  7 - Question sur prix');
      console.log('  8 - Demande routine');
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
