#!/usr/bin/env node
/**
 * Serveur Web pour l'interface chatbot
 * Résout les problèmes de CORS en servant le HTML via HTTP
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = 'localhost';

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/' || req.url === '/index.html') {
    // Servir le fichier HTML
    const htmlPath = path.join(__dirname, 'chatbot-web.html');

    fs.readFile(htmlPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Erreur lors du chargement du chatbot');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page non trouvée');
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;

  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                   ║');
  console.log('║          🌿 INnatural Chatbot - Serveur Web Démarré 🌿          ║');
  console.log('║                                                                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Serveur web en cours d'exécution`);
  console.log(`📍 URL: ${url}`);
  console.log('');
  console.log('🌐 Ouvrez cette URL dans votre navigateur:');
  console.log(`   ${url}`);
  console.log('');
  console.log('🔗 Backend API: http://localhost:5001');
  console.log('');
  console.log('💡 Pour arrêter le serveur, appuyez sur Ctrl+C');
  console.log('');

  // Essayer d'ouvrir automatiquement le navigateur (Windows)
  const { exec } = require('child_process');
  exec(`start ${url}`, (error) => {
    if (error) {
      console.log('⚠️  Impossible d\'ouvrir automatiquement le navigateur.');
      console.log('   Ouvrez manuellement:', url);
    }
  });
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n\n👋 Arrêt du serveur web...');
  server.close(() => {
    console.log('✅ Serveur arrêté.\n');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});
