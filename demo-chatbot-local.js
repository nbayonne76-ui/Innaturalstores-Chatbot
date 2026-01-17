#!/usr/bin/env node
/**
 * Démonstration locale du chatbot avec le catalogue amélioré
 * Simule des interactions client pour tester les nouvelles descriptions
 */

const readline = require('readline');
const ProductKnowledge = require('./backend/productKnowledge');

// Configuration console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Couleurs pour le terminal
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

function printBot(message) {
  print('\n🤖 INnatural Bot:', 'cyan');
  print(message, 'bright');
}

function printUser(message) {
  print('\n👤 Vous:', 'yellow');
  print(message);
}

function printDivider() {
  print('\n' + '─'.repeat(70), 'blue');
}

// Simulation du chatbot
class ChatbotDemo {
  constructor() {
    this.conversationHistory = [];
    this.userProfile = {
      language: 'en',
      hairType: null,
      concerns: []
    };
  }

  processMessage(userMessage) {
    userMessage = userMessage.trim().toLowerCase();

    // Recherche de produit spécifique
    if (userMessage.includes('body butter') || userMessage.includes('almond')) {
      const product = ProductKnowledge.findProduct('almond body butter', 'en');
      if (product) {
        return this.formatProductResponse(product, 'en');
      }
    }

    if (userMessage.includes('body cream') || userMessage.includes('coconut')) {
      const product = ProductKnowledge.findProduct('coconut body cream', 'en');
      if (product) {
        return this.formatProductResponse(product, 'en');
      }
    }

    if (userMessage.includes('shampoo') || userMessage.includes('rosemary')) {
      const product = ProductKnowledge.findProduct('rosemary shampoo', 'en');
      if (product) {
        return this.formatProductResponse(product, 'en');
      }
    }

    if (userMessage.includes('hand cream') || userMessage.includes('hands')) {
      const product = ProductKnowledge.findProduct('hand cream', 'en');
      if (product) {
        return this.formatProductResponse(product, 'en');
      }
    }

    // Recommandations par type de cheveux
    if (userMessage.includes('dry hair') || userMessage.includes('cheveux secs')) {
      const recommendations = ProductKnowledge.getRecommendations('dry', ['dryness'], 'en');
      return this.formatRecommendationsResponse(recommendations, 'en');
    }

    if (userMessage.includes('curly') || userMessage.includes('frisés')) {
      const recommendations = ProductKnowledge.getRecommendations('curly', ['frizz'], 'en');
      return this.formatRecommendationsResponse(recommendations, 'en');
    }

    // Liste des produits
    if (userMessage.includes('all products') || userMessage.includes('tous les produits')) {
      const products = ProductKnowledge.getAllProducts();
      return `We have ${products.length} amazing natural hair and body care products!

Here are some categories:
🧴 Body Care (Body Butter, Body Cream, Body Scrub, Hand Cream)
💇 Hair Care (Shampoo, Conditioner, Leave-in, Mask, Serum, Oil)

Ask me about a specific product or type!`;
    }

    // Aide
    if (userMessage.includes('help') || userMessage.includes('aide')) {
      return this.getHelpMessage();
    }

    // Message par défaut
    return `Hello! I'm here to help you find the perfect natural hair and body care products! ✨

You can ask me:
- "Show me the almond body butter"
- "Tell me about rosemary shampoo"
- "I have dry hair, what do you recommend?"
- "Show me all products"

What would you like to know?`;
  }

  formatProductResponse(product, language) {
    const name = product.name[language];
    const description = product.description?.[language] || 'No description available.';
    const benefits = product.benefits?.[language] || [];
    const price = product.price;
    const size = product.size || 'N/A';

    let response = `${name}\n\n`;
    response += `💰 Price: LE ${price}`;
    if (size !== 'N/A') response += ` | 📦 Size: ${size}`;
    response += '\n\n';

    if (benefits.length > 0) {
      response += `✨ Benefits:\n`;
      benefits.forEach(benefit => {
        response += `   • ${benefit}\n`;
      });
      response += '\n';
    }

    response += `📝 Description:\n${description}\n`;

    return response;
  }

  formatRecommendationsResponse(recommendations, language) {
    if (!recommendations || recommendations.length === 0) {
      return "I couldn't find specific recommendations for that. Could you tell me more about your hair type or concerns?";
    }

    let response = `Based on your needs, I recommend these products:\n\n`;

    recommendations.slice(0, 3).forEach((product, i) => {
      const name = product.name[language];
      const benefits = product.benefits?.[language] || [];

      response += `${i + 1}. ${name} (LE ${product.price})\n`;
      if (benefits.length > 0) {
        response += `   ✨ ${benefits.slice(0, 2).join(', ')}\n`;
      }
      response += '\n';
    });

    response += `Would you like to know more about any of these products?`;

    return response;
  }

  getHelpMessage() {
    return `🤖 INnatural Chatbot - Help

I can help you with:

1️⃣ Product Information
   - "Show me the almond body butter"
   - "Tell me about rosemary shampoo"
   - "What is coconut body cream?"

2️⃣ Product Recommendations
   - "I have dry hair"
   - "I have curly hair"
   - "My hair is damaged"

3️⃣ Browse Catalog
   - "Show me all products"
   - "What body products do you have?"

4️⃣ Contact
   - WhatsApp/Call: +20155 5590333

Type your question or 'quit' to exit.`;
  }
}

// Démonstration automatique
function runDemo() {
  const chatbot = new ChatbotDemo();

  print('\n╔═══════════════════════════════════════════════════════════════════╗', 'green');
  print('║          🌿 INnatural Chatbot - Démonstration Locale 🌿          ║', 'green');
  print('║                  Catalogue Amélioré v4.1.0                        ║', 'green');
  print('╚═══════════════════════════════════════════════════════════════════╝', 'green');

  print('\n📋 Mode: Démonstration Interactive', 'cyan');
  print('💡 Tapez "help" pour voir les commandes disponibles', 'cyan');
  print('💡 Tapez "demo" pour voir une démonstration automatique', 'cyan');
  print('💡 Tapez "quit" pour quitter\n', 'cyan');

  function askQuestion() {
    rl.question(colors.yellow + '👤 Vous: ' + colors.reset, (input) => {
      const message = input.trim();

      if (message.toLowerCase() === 'quit' || message.toLowerCase() === 'exit') {
        print('\n👋 Merci d\'avoir utilisé INnatural Chatbot! À bientôt! ✨\n', 'green');
        rl.close();
        return;
      }

      if (message.toLowerCase() === 'demo') {
        runAutomatedDemo(chatbot);
        return;
      }

      if (message) {
        const response = chatbot.processMessage(message);
        printBot(response);
        printDivider();
      }

      askQuestion();
    });
  }

  askQuestion();
}

// Démonstration automatique
function runAutomatedDemo(chatbot) {
  print('\n🎬 DÉMONSTRATION AUTOMATIQUE - Nouveau Catalogue Amélioré\n', 'magenta');

  const demoQueries = [
    {
      query: 'Show me the almond body butter',
      description: '📦 Test: Produit body avec description enrichie'
    },
    {
      query: 'Tell me about coconut body cream',
      description: '📦 Test: Produit body avec bénéfices corrigés'
    },
    {
      query: 'Show me rosemary shampoo',
      description: '💇 Test: Produit capillaire (comparaison)'
    },
    {
      query: 'What about hand cream?',
      description: '🙌 Test: Crème pour les mains'
    }
  ];

  let index = 0;

  function showNext() {
    if (index >= demoQueries.length) {
      print('\n✅ Démonstration terminée!\n', 'green');
      print('Observations:', 'cyan');
      print('• Les produits BODY ont des descriptions riches et détaillées', 'bright');
      print('• Les bénéfices parlent de PEAU (pas de cheveux)', 'bright');
      print('• Emojis et call-to-action WhatsApp inclus', 'bright');
      print('• Format bilingue préservé (EN + AR)\n', 'bright');

      printDivider();
      print('\n💡 Tapez une question ou "quit" pour quitter\n', 'cyan');
      return;
    }

    const demo = demoQueries[index];

    setTimeout(() => {
      printDivider();
      print(`\n${demo.description}`, 'magenta');
      printUser(demo.query);

      const response = chatbot.processMessage(demo.query);
      printBot(response);

      index++;
      showNext();
    }, 2000);
  }

  showNext();
}

// Démarrage
runDemo();
