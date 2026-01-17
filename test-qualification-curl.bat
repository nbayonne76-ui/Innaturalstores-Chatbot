@echo off
echo.
echo ============================================================
echo    TEST DU FLOW DE QUALIFICATION - INnatural Chatbot
echo ============================================================
echo.

set API_URL=http://localhost:5001
set SESSION_ID=test_session_%RANDOM%_%TIME:~6,5%

echo Session ID: %SESSION_ID%
echo.

echo ------------------------------------------------------------
echo ETAPE 0: Demarrage du flow de qualification
echo ------------------------------------------------------------
curl -X POST %API_URL%/api/qualification/start ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionId\":\"%SESSION_ID%\",\"language\":\"ar\"}"
echo.
echo.

echo ------------------------------------------------------------
echo ETAPE 1: Selection de la categorie (Cheveux)
echo ------------------------------------------------------------
curl -X POST %API_URL%/api/qualification/answer ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionId\":\"%SESSION_ID%\",\"language\":\"ar\",\"step\":1,\"answer\":{\"selected\":\"hair\"}}"
echo.
echo.

echo ------------------------------------------------------------
echo ETAPE 2: Selection des problemes (Secheresse, Chute)
echo ------------------------------------------------------------
curl -X POST %API_URL%/api/qualification/answer ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionId\":\"%SESSION_ID%\",\"language\":\"ar\",\"step\":2,\"answer\":{\"selected\":[\"dryness\",\"hair-loss\"]}}"
echo.
echo.

echo ------------------------------------------------------------
echo ETAPE 3: Selection de l'objectif (Hydratation)
echo ------------------------------------------------------------
curl -X POST %API_URL%/api/qualification/answer ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionId\":\"%SESSION_ID%\",\"language\":\"ar\",\"step\":3,\"answer\":{\"selected\":\"hydration\"}}"
echo.
echo.

echo ------------------------------------------------------------
echo RECUPERATION DES RECOMMANDATIONS
echo ------------------------------------------------------------
curl -X GET "%API_URL%/api/qualification/recommendations/%SESSION_ID%?language=ar&limit=3"
echo.
echo.

echo ============================================================
echo                    TEST TERMINE!
echo ============================================================
echo.
pause
