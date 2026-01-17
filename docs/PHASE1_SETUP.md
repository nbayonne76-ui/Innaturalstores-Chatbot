# Phase 1: Configuration Base de données & Logging

Ce guide vous explique comment configurer la base de données PostgreSQL et le logging structuré pour le chatbot INnatural.

## ✅ Ce qui a été implémenté

### 1. Schéma de base de données Prisma
- **8 tables créées** : User, Conversation, Message, ProductRecommendation, Lead, AnalyticsEvent, SystemMetric, Feedback
- **Relations définies** entre les tables
- **Indexes optimisés** pour les requêtes fréquentes
- **Timestamps automatiques** (createdAt, updatedAt)

### 2. Système de logging Winston
- **Logs structurés** en JSON (production) ou formatés (développement)
- **Rotation quotidienne** des fichiers de logs
- **3 fichiers de logs** : error, combined, http
- **Rétention automatique** : 30 jours (errors/combined), 14 jours (http)
- **Helper methods** pour logging structuré

### 3. Service de base de données
- **Service singleton** avec connexion Prisma
- **Méthodes CRUD** pour toutes les entités
- **Gestion des erreurs** intégrée
- **Health checks** pour monitoring

### 4. Intégration dans server.js
- **Logger remplace console.log**
- **Initialisation DB au démarrage**
- **Graceful shutdown** (déconnexion propre)
- **Logging des requêtes HTTP**

---

## 🚀 Configuration requise

### Prérequis

1. **PostgreSQL installé** (version 12+)
2. **Node.js** (version 16+)
3. **Git Bash ou WSL** (pour Windows)

---

## 📋 Étapes de configuration

### Étape 1: Installer PostgreSQL

#### Option A: Installation locale (Windows)

1. Télécharger PostgreSQL : https://www.postgresql.org/download/windows/
2. Installer avec les options par défaut
3. Noter le mot de passe du superuser `postgres`
4. Ajouter PostgreSQL au PATH

```bash
# Vérifier l'installation
psql --version
```

#### Option B: Utiliser Docker (Recommandé)

```bash
# Créer un conteneur PostgreSQL
docker run --name innatural-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=innatural_chatbot \
  -p 5432:5432 \
  -d postgres:15

# Vérifier que le conteneur tourne
docker ps
```

#### Option C: Utiliser un service cloud

- **Supabase** : https://supabase.com (Gratuit, PostgreSQL managé)
- **Render** : https://render.com/docs/databases (Gratuit avec limitations)
- **Railway** : https://railway.app (Gratuit, $5/mois ensuite)
- **Heroku Postgres** : https://www.heroku.com/postgres

### Étape 2: Créer la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE innatural_chatbot;

# Créer un utilisateur dédié (optionnel mais recommandé)
CREATE USER innatural_user WITH PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE innatural_chatbot TO innatural_user;

# Quitter psql
\q
```

### Étape 3: Configurer les variables d'environnement

Copier `.env.example` vers `.env` et configurer :

```bash
cp .env.example .env
```

Éditer `.env` :

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-votre_cle_api

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5000,https://innaturalstores.com

# Database Configuration (PostgreSQL)
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/innatural_chatbot?schema=public

# OU pour un utilisateur dédié:
# DATABASE_URL=postgresql://innatural_user:votre_mot_de_passe@localhost:5432/innatural_chatbot?schema=public

# OU pour une base cloud (exemple Supabase):
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
SESSION_TTL=3600

# Logging Configuration
LOG_LEVEL=info
LOG_DIR=./logs
```

### Étape 4: Générer le client Prisma et créer les tables

```bash
cd backend

# Générer le client Prisma
npx prisma generate

# Créer les tables dans la base de données
npx prisma migrate dev --name init

# Vous devriez voir:
# ✔ Generated Prisma Client
# ✔ The migration has been created successfully
# ✔ Applied migration(s): 20231215000000_init
```

### Étape 5: Vérifier la configuration

```bash
# Voir les tables créées
npx prisma studio

# Cela ouvrira une interface web sur http://localhost:5555
# Vous pourrez voir toutes vos tables et données
```

### Étape 6: Tester le serveur

```bash
# Démarrer le serveur
npm start

# Vous devriez voir:
# ✅ Database connected successfully
# ✅ Database ready - conversations will be persisted
# 🌿 INnatural Chatbot API Server Running!
```

---

## 🧪 Vérification de l'installation

### Test 1: Connexion à la base de données

```bash
# Dans un autre terminal
curl http://localhost:5000/api/health

# Réponse attendue:
# {"status":"ok","message":"INnatural Chatbot API is running"}
```

### Test 2: Logs fonctionnent

```bash
# Vérifier que les logs sont créés
ls -la backend/logs/

# Vous devriez voir:
# combined-2023-12-15.log
# error-2023-12-15.log
# http-2023-12-15.log
```

### Test 3: Base de données fonctionne

```bash
# Tester l'enregistrement d'une conversation
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "مرحبا",
    "language": "ar",
    "sessionId": "test-session-123",
    "userProfile": {"language": "ar"}
  }'

# Puis vérifier dans Prisma Studio que la conversation a été enregistrée
npx prisma studio
```

---

## 📁 Structure des fichiers créés

```
backend/
├── prisma/
│   └── schema.prisma          # Schéma de la base de données
├── services/
│   └── database.js            # Service de base de données
├── utils/
│   └── logger.js              # Configuration Winston
├── logs/                      # Dossier des logs (auto-créé)
│   ├── combined-YYYY-MM-DD.log
│   ├── error-YYYY-MM-DD.log
│   └── http-YYYY-MM-DD.log
└── .env                       # Variables d'environnement
```

---

## 🗄️ Tables de la base de données

### 1. `users` - Utilisateurs/Visiteurs
- Stocke les informations des visiteurs du chatbot
- Lien avec sessionId pour tracking cross-device
- Profil capillaire (hairType, concerns)

### 2. `conversations` - Conversations
- Une conversation = une session de chat
- Métadonnées : langue, user-agent, IP
- Statut : active, completed, abandoned

### 3. `messages` - Messages
- Messages individuels user/assistant
- Métadonnées AI : model, tokens, responseTime
- Lien avec recommendations

### 4. `product_recommendations` - Recommandations produits
- Produits recommandés pendant le chat
- Tracking : clicked, purchased
- Raison de la recommandation

### 5. `leads` - Leads commerciaux
- Clients potentiels ayant montré de l'intérêt
- Qualification : budget, timeline, interest
- Statut : new, contacted, converted, lost

### 6. `analytics_events` - Événements analytiques
- Tracking comportement utilisateur
- Événements : clicks, actions, navigation
- Données JSON flexibles

### 7. `system_metrics` - Métriques système
- Performances API (response time, errors)
- Monitoring application
- Dimensions personnalisables

### 8. `feedback` - Feedback utilisateurs
- Notes 1-5 étoiles
- Commentaires textuels
- Catégorisation

---

## 🔧 Commandes Prisma utiles

```bash
# Générer le client après modification du schéma
npx prisma generate

# Créer une nouvelle migration
npx prisma migrate dev --name nom_migration

# Appliquer les migrations en production
npx prisma migrate deploy

# Voir l'état des migrations
npx prisma migrate status

# Réinitialiser la base de données (DANGER: efface tout)
npx prisma migrate reset

# Ouvrir Prisma Studio (interface web)
npx prisma studio

# Seed la base avec des données de test
npx prisma db seed
```

---

## 📊 Utilisation du service database

### Exemple: Sauvegarder une conversation

```javascript
const db = require('./services/database');

// 1. Créer/trouver l'utilisateur
const user = await db.findOrCreateUser('session_123', {
  language: 'ar',
  hairType: 'dry',
  concerns: ['dryness', 'breakage']
});

// 2. Créer une conversation
const conversation = await db.createConversation(user.id, 'session_123', {
  language: 'ar',
  source: 'widget'
});

// 3. Sauvegarder un message utilisateur
await db.saveMessage(conversation.id, 'user', 'شعري جاف جدا', {
  language: 'ar'
});

// 4. Sauvegarder la réponse du bot
const botMessage = await db.saveMessage(
  conversation.id,
  'assistant',
  'أنصحك بزيت الخروع...',
  {
    language: 'ar',
    model: 'gpt-4-turbo-preview',
    tokensUsed: 250,
    responseTime: 1500
  }
);

// 5. Enregistrer une recommandation produit
await db.saveProductRecommendation(
  botMessage.id,
  'mixoil-castor',
  'MixOil Castor Hair Oil',
  'Perfect for dry hair needing deep moisture'
);
```

### Exemple: Récupérer l'historique

```javascript
// Récupérer une conversation
const conversation = await db.getConversationBySessionId('session_123');

// Récupérer tous les messages
const messages = await db.getConversationHistory(conversation.id);

console.log(`Conversation avec ${messages.length} messages`);
```

---

## 📈 Utilisation du logger

### Niveaux de log

```javascript
const logger = require('./utils/logger');

// Différents niveaux
logger.error('Erreur critique', { context: 'details' });
logger.warn('Avertissement');
logger.info('Information');
logger.http('Requête HTTP');
logger.debug('Debug détaillé');
```

### Méthodes helper

```javascript
// Log d'une requête HTTP
logger.logRequest(req, res, duration);

// Log d'une erreur
logger.logError(error, { context: 'additional info' });

// Log d'un appel AI
logger.logAIRequest('gpt-4', 250, 1500, true);

// Log d'événement conversation
logger.logConversation('session_123', 'start', { userId: 'user_456' });

// Log d'événement sécurité
logger.logSecurity('rate_limit', { ip: '1.2.3.4' });
```

---

## ⚠️ Troubleshooting

### Problème: Erreur "database does not exist"

```bash
# Solution: Créer la base de données
psql -U postgres -c "CREATE DATABASE innatural_chatbot;"
```

### Problème: Erreur "relation does not exist"

```bash
# Solution: Exécuter les migrations
npx prisma migrate dev
```

### Problème: Cannot connect to PostgreSQL

```bash
# Vérifier que PostgreSQL tourne
# Windows:
services.msc # Chercher "postgresql"

# Linux/Mac:
sudo systemctl status postgresql

# Docker:
docker ps  # Vérifier que le conteneur est running
```

### Problème: Prisma Client not generated

```bash
# Solution: Générer le client
npx prisma generate
```

### Problème: Logs directory permission denied

```bash
# Solution: Créer le dossier manuellement
mkdir -p backend/logs
chmod 755 backend/logs
```

---

## 🎯 Prochaines étapes

Phase 1 ✅ TERMINÉE! Vous pouvez maintenant:

1. **Tester l'application** avec persistance DB
2. **Analyser les logs** dans `backend/logs/`
3. **Explorer les données** avec Prisma Studio
4. **Passer à la Phase 2** : Sécurité & Validation

### Phase 2 à venir:
- [ ] Validation des inputs (Joi/Zod)
- [ ] Headers de sécurité (Helmet)
- [ ] Authentification JWT
- [ ] Rate limiting avancé
- [ ] Monitoring avec Sentry

---

## 📞 Support

Si vous rencontrez des problèmes:

1. Vérifier les logs : `backend/logs/error-*.log`
2. Tester la connexion DB : `npx prisma studio`
3. Vérifier les variables d'environnement : `.env`
4. Consulter la documentation Prisma : https://www.prisma.io/docs

---

**Phase 1 implémentée avec succès! 🎉**

Base de données configurée ✅
Logging structuré actif ✅
Service DB opérationnel ✅
Intégration server.js complète ✅
