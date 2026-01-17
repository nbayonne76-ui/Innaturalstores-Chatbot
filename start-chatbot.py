#!/usr/bin/env python3
"""
Serveur web simple pour le chatbot INnatural
Lance un serveur HTTP Python et ouvre le navigateur
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

PORT = 3000
HANDLER = http.server.SimpleHTTPRequestHandler

class ChatbotHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Ajouter les headers CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.path = '/chatbot-web.html'
        return super().do_GET()

def main():
    # Changer le répertoire de travail
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    # Vérifier que le fichier HTML existe
    if not Path('chatbot-web.html').exists():
        print("❌ Erreur: chatbot-web.html introuvable!")
        sys.exit(1)

    print()
    print("╔═══════════════════════════════════════════════════════════════════╗")
    print("║                                                                   ║")
    print("║          🌿 INnatural Chatbot - Serveur Web Démarré 🌿          ║")
    print("║                                                                   ║")
    print("╚═══════════════════════════════════════════════════════════════════╝")
    print()
    print(f"✅ Serveur web démarré sur le port {PORT}")
    print(f"📍 URL: http://localhost:{PORT}")
    print()
    print("🌐 Ouverture du navigateur...")
    print()
    print("🔗 Backend API: http://localhost:5001")
    print()
    print("💡 Pour arrêter le serveur, appuyez sur Ctrl+C")
    print()

    # Démarrer le serveur
    with socketserver.TCPServer(("", PORT), ChatbotHandler) as httpd:
        # Ouvrir le navigateur
        webbrowser.open(f'http://localhost:{PORT}')

        try:
            print("🚀 Serveur en cours d'exécution. Appuyez sur Ctrl+C pour arrêter.")
            print()
            httpd.serve_forever()
        except KeyboardInterrupt:
            print()
            print("👋 Arrêt du serveur...")
            print("✅ Serveur arrêté.")
            print()

if __name__ == "__main__":
    main()
