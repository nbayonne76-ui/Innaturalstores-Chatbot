@echo off
chcp 65001 >nul
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║          🌿 INnatural Chatbot - Lancement Local 🌿              ║
echo ║              Backend Docker: http://localhost:5001                ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.
echo 📋 Démarrage du chatbot interactif...
echo.

node chatbot-local.js

pause
