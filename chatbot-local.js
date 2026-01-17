#!/usr/bin/env node
/**
 * Chatbot INnatural Local - Interface Interactive Complète
 * Teste toutes les fonctionnalités du backend Docker
 */

const readline = require('readline');
const http = require('http');

// Configuration
const API_URL = 'http://localhost:5001';
const SESSION_ID = `session-${Date.now()}`;

// Couleurs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m'
};

function print(text, color = 'reset') {
  console.log(colors[color] + text + colors.reset);
}

// Interface readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: colors.yellow + '👤 Vous: ' + colors.reset
});

// Historique de conversation
let conversationHistory = [];

// Fonction pour faire des requêtes HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 secondes timeout
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + body));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Fonction pour envoyer un message au chatbot
async function sendMessage(message, language = 'en') {
  try {
    print('\n⏳ Envoi du message...', 'dim');

    const response = await makeRequest('POST', '/api/chat', {
      message: message,
      sessionId: SESSION_ID,
      language: language
    });

    if (response.success) {
      conversationHistory.push({
        user: message,
        bot: response.message,
        timestamp: new Date().toISOString()
      });

      print('\n🤖 INnatural Bot:', 'cyan');
      print(response.message, 'bright');

      if (response.products && response.products.length > 0) {
        print('\n📦 Produits recommandés:', 'cyan');
        response.products.forEach((product, i) => {
          print(`   ${i + 1}. ${product.name} - LE ${product.price}`, 'green');
        });
      }
    } else {
      print('\n❌ Erreur: ' + (response.error || 'Unknown error'), 'red');
    }

    print('\n' + '─'.repeat(70), 'blue');

  } catch (error) {
    print('\n❌ Erreur de connexion: ' + error.message, 'red');
    print('💡 Assurez-vous que le backend Docker est démarré.', 'yellow');
    print('   Commande: docker-compose up -d', 'dim');
    print('\n' + '─'.repeat(70), 'blue');
  }
}

// Fonction pour vérifier le statut du backend
async function checkBackendStatus() {
  try {
    const health = await makeRequest('GET', '/api/health');

    print('\n📊 Statut du Backend:', 'cyan');
    print(`   Status: ${health.status}`, health.status === 'healthy' ? 'green' : 'yellow');
    print(`   Uptime: ${health.uptime?.formatted || 'N/A'}`, 'dim');

    if (health.services) {
      print('\n   Services:', 'cyan');
      print(`   • Database: ${health.services.database?.status || 'unknown'}`,
        health.services.database?.status === 'healthy' ? 'green' : 'red');
      print(`   • Redis: ${health.services.redis?.status || 'unknown'}`,
        health.services.redis?.status === 'healthy' ? 'green' : 'red');
      print(`   • AI: ${health.services.ai?.status || 'unknown'}`,
        health.services.ai?.status === 'healthy' ? 'green' : 'red');
    }

    return health.status === 'healthy' || health.services?.database?.status === 'healthy';
  } catch (error) {
    print('\n❌ Backend non accessible: ' + error.message, 'red');
    return false;
  }
}

// Afficher l'aide
function showHelp() {
  print('\n╔═══════════════════════════════════════════════════════════════════╗', 'cyan');
  print('║                    🤖 Commandes Disponibles                       ║', 'cyan');
  print('╚═══════════════════════════════════════════════════════════════════╝', 'cyan');

  print('\n📝 Exemples de Questions:', 'yellow');
  print('   • "Bonjour, je cherche un produit pour cheveux secs"', 'bright');
  print('   • "Parle-moi du body butter à l\'amande"', 'bright');
  print('   • "Quels sont vos produits pour cheveux bouclés?"', 'bright');
  print('   • "Comment puis-je commander?"', 'bright');
  print('   • "Quelle est votre politique de livraison?"', 'bright');

  print('\n🛠️  Commandes Système:', 'yellow');
  print('   • /status   - Vérifier le statut du backend', 'bright');
  print('   • /history  - Voir l\'historique de conversation', 'bright');
  print('   • /clear    - Effacer l\'écran', 'bright');
  print('   • /help     - Afficher cette aide', 'bright');
  print('   • /quit     - Quitter le chatbot', 'bright');

  print('\n💡 Fonctionnalités Testables:', 'yellow');
  print('   ✓ Recommandations de produits', 'green');
  print('   ✓ Informations détaillées sur les produits', 'green');
  print('   ✓ FAQ et questions générales', 'green');
  print('   ✓ Gestion de session persistante', 'green');
  print('   ✓ Réponses en français et anglais', 'green');
  print('');
}

// Afficher l'historique
function showHistory() {
  if (conversationHistory.length === 0) {
    print('\n📝 Aucune conversation dans l\'historique.', 'dim');
    return;
  }

  print('\n╔═══════════════════════════════════════════════════════════════════╗', 'cyan');
  print('║                    📝 Historique de Conversation                  ║', 'cyan');
  print('╚═══════════════════════════════════════════════════════════════════╝', 'cyan');

  conversationHistory.forEach((entry, i) => {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    print(`\n[${time}] 👤 Vous:`, 'yellow');
    print(entry.user, 'dim');
    print(`\n[${time}] 🤖 Bot:`, 'cyan');
    print(entry.bot.substring(0, 150) + (entry.bot.length > 150 ? '...' : ''), 'dim');
    if (i < conversationHistory.length - 1) {
      print('─'.repeat(70), 'blue');
    }
  });
  print('');
}

// Gérer les commandes système
async function handleCommand(input) {
  const command = input.toLowerCase().trim();

  switch (command) {
    case '/help':
      showHelp();
      break;

    case '/status':
      await checkBackendStatus();
      break;

    case '/history':
      showHistory();
      break;

    case '/clear':
      console.clear();
      showWelcome();
      break;

    case '/quit':
    case '/exit':
      print('\n👋 Merci d\'avoir utilisé INnatural Chatbot!', 'green');
      print('✨ À bientôt!\n', 'cyan');
      rl.close();
      process.exit(0);
      break;

    default:
      print('\n❓ Commande inconnue. Tapez /help pour voir les commandes.', 'yellow');
  }
}

// Afficher l'écran d'accueil
function showWelcome() {
  print('╔═══════════════════════════════════════════════════════════════════╗', 'green');
  print('║                                                                   ║', 'green');
  print('║          🌿 INnatural Chatbot - Interface Locale 🌿              ║', 'green');
  print('║                                                                   ║', 'green');
  print('║              Catalogue Amélioré v4.1.0                           ║', 'green');
  print('║              Backend Docker: http://localhost:5001                ║', 'green');
  print('║                                                                   ║', 'green');
  print('╚═══════════════════════════════════════════════════════════════════╝', 'green');

  print('\n💡 Tapez /help pour voir les commandes disponibles', 'cyan');
  print('💡 Tapez /quit pour quitter\n', 'cyan');
}

// Démarrage du chatbot
async function startChatbot() {
  console.clear();
  showWelcome();

  // Vérifier le statut du backend
  print('🔍 Vérification du backend...', 'cyan');
  const isHealthy = await checkBackendStatus();

  if (!isHealthy) {
    print('\n⚠️  Le backend ne semble pas complètement opérationnel.', 'yellow');
    print('💡 Vous pouvez quand même essayer, ou redémarrer avec:', 'yellow');
    print('   docker-compose restart backend\n', 'dim');
  } else {
    print('\n✅ Backend opérationnel! Prêt à discuter.\n', 'green');
  }

  // Lancer l'interface readline
  rl.prompt();

  rl.on('line', async (input) => {
    const trimmed = input.trim();

    if (!trimmed) {
      rl.prompt();
      return;
    }

    // Vérifier si c'est une commande système
    if (trimmed.startsWith('/')) {
      await handleCommand(trimmed);
      rl.prompt();
      return;
    }

    // Envoyer le message au chatbot
    await sendMessage(trimmed, 'fr');
    rl.prompt();
  });

  rl.on('close', () => {
    print('\n👋 Au revoir!\n', 'green');
    process.exit(0);
  });
}

// Gestion des erreurs non catchées
process.on('uncaughtException', (error) => {
  print('\n❌ Erreur inattendue: ' + error.message, 'red');
  print('Le chatbot va s\'arrêter.\n', 'yellow');
  process.exit(1);
});

// Démarrer
startChatbot();
