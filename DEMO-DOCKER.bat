@echo off
chcp 65001 >nul
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║       🌿 INnatural Chatbot - Démonstration Docker API 🌿        ║
echo ║              Backend: http://localhost:5001                       ║
echo ║              Catalogue Amélioré v4.1.0                           ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.
echo 📋 Lancement de la démonstration Docker...
echo.

node demo-chatbot-docker.js

pause
