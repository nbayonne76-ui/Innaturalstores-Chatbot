#!/usr/bin/env node
/**
 * Démonstration du chatbot INnatural via l'API Docker
 * Teste le backend avec le catalogue amélioré
 */

const readline = require('readline');
const https = require('http');

// Configuration
const API_URL = 'http://localhost:5001';
const SESSION_ID = `demo-${Date.now()}`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Couleurs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function print(text, color = 'reset') {
  console.log(colors[color] + text + colors.reset);
}

// Fonction pour appeler l'API du chatbot
function sendMessage(message, language = 'en') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      message: message,
      sessionId: SESSION_ID,
      language: language
    });

    const options = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Démonstration automatique
async function runDemo() {
  print('\n╔═══════════════════════════════════════════════════════════════════╗', 'green');
  print('║       🌿 INnatural Chatbot - Démonstration Docker API 🌿        ║', 'green');
  print('║              Backend: http://localhost:5001                       ║', 'green');
  print('║              Catalogue Amélioré v4.1.0                           ║', 'green');
  print('╚═══════════════════════════════════════════════════════════════════╝', 'green');

  print('\n📋 Mode: Démonstration Interactive', 'cyan');
  print('💡 Tapez "demo" pour une démonstration automatique', 'cyan');
  print('💡 Tapez "help" pour voir les commandes', 'cyan');
  print('💡 Tapez "quit" pour quitter\n', 'cyan');

  askQuestion();
}

function askQuestion() {
  rl.question(colors.yellow + '👤 Vous: ' + colors.reset, async (input) => {
    const message = input.trim();

    if (message.toLowerCase() === 'quit' || message.toLowerCase() === 'exit') {
      print('\n👋 Merci d\'avoir testé INnatural Chatbot! À bientôt! ✨\n', 'green');
      rl.close();
      return;
    }

    if (message.toLowerCase() === 'demo') {
      await runAutomatedDemo();
      askQuestion();
      return;
    }

    if (message.toLowerCase() === 'help') {
      showHelp();
      askQuestion();
      return;
    }

    if (message) {
      try {
        print('\n⏳ Envoi de la requête au chatbot...', 'cyan');
        const response = await sendMessage(message, 'en');

        print('\n🤖 INnatural Bot:', 'cyan');
        print(response.message || response.error || 'Pas de réponse', 'bright');
        print('\n' + '─'.repeat(70), 'blue');
      } catch (error) {
        print('\n❌ Erreur: ' + error.message, 'red');
        print('Assurez-vous que le backend Docker est démarré.', 'yellow');
      }
    }

    askQuestion();
  });
}

function showHelp() {
  print('\n🤖 Commandes disponibles:', 'cyan');
  print('\nQuestions à tester:', 'bright');
  print('  • "Tell me about the almond body butter"', 'yellow');
  print('  • "Show me coconut body cream"', 'yellow');
  print('  • "I need a hand cream"', 'yellow');
  print('  • "What products do you have for dry skin?"', 'yellow');
  print('  • "Tell me about rosemary shampoo"', 'yellow');
  print('\nCommandes:', 'bright');
  print('  • demo  - Lancer une démonstration automatique', 'yellow');
  print('  • help  - Afficher cette aide', 'yellow');
  print('  • quit  - Quitter\n', 'yellow');
}

async function runAutomatedDemo() {
  print('\n🎬 DÉMONSTRATION AUTOMATIQUE - Backend Docker\n', 'magenta');

  const demoQueries = [
    {
      query: 'Tell me about the almond body butter',
      description: '📦 Test: Produit body avec description enrichie'
    },
    {
      query: 'Show me coconut body cream',
      description: '📦 Test: Produit body avec bénéfices corrigés'
    },
    {
      query: 'What about hand cream?',
      description: '🙌 Test: Crème pour les mains'
    }
  ];

  for (const demo of demoQueries) {
    print('─'.repeat(70), 'blue');
    print(`\n${demo.description}`, 'magenta');
    print('\n👤 Vous:', 'yellow');
    print(demo.query, 'bright');

    try {
      print('\n⏳ Envoi de la requête...', 'cyan');
      const response = await sendMessage(demo.query, 'en');

      print('\n🤖 INnatural Bot:', 'cyan');
      print(response.message || response.error || 'Pas de réponse', 'bright');

      // Pause entre les requêtes
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      print('\n❌ Erreur: ' + error.message, 'red');
    }
  }

  print('\n─'.repeat(70), 'blue');
  print('\n✅ Démonstration terminée!\n', 'green');
  print('Observations:', 'cyan');
  print('• Le backend Docker utilise le catalogue amélioré v4.1.0', 'bright');
  print('• Les descriptions sont riches et détaillées', 'bright');
  print('• Format bilingue (EN + AR) disponible\n', 'bright');
}

// Démarrage
console.clear();
runDemo().catch(error => {
  print('\n❌ Erreur fatale: ' + error.message, 'red');
  process.exit(1);
});
