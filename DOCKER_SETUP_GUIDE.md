# Guide Docker - INnatural Chatbot

## 🐳 Configuration Docker Complète

Ce guide explique comment déployer le backend INnatural avec Docker Compose.

---

## 📋 Prérequis

- Docker Desktop installé (Windows/Mac) ou Docker Engine (Linux)
- Docker Compose V2
- Clés API (OpenAI et/ou Anthropic)

**Vérifier installation:**
```bash
docker --version
# Docker version 24.0.0 ou plus

docker-compose --version
# Docker Compose version v2.20.0 ou plus
```

---

## 🚀 Démarrage Rapide (Development)

### 1. Configuration Environnement

```bash
# Copier le fichier d'exemple
cp .env.docker.example .env

# Éditer .env et ajouter vos clés API
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Démarrer les Services

```bash
# Démarrer tous les conteneurs
docker-compose up -d

# Voir les logs
docker-compose logs -f backend

# Vérifier status
docker-compose ps
```

### 3. Initialiser la Base de Données

```bash
# Exécuter les migrations Prisma
docker-compose exec backend npx prisma migrate deploy

# (Optionnel) Seed data
docker-compose exec backend npx prisma db seed
```

### 4. Tester l'API

```bash
# Health check
curl http://localhost:5000/api/health

# Devrait retourner:
# {"status":"healthy", ...}
```

**L'API est maintenant disponible sur:** `http://localhost:5000`

---

## 📦 Services Inclus

| Service | Port | Description |
|---------|------|-------------|
| **backend** | 5000 | API Node.js/Express avec Phase 5 |
| **postgres** | 5432 | Base de données PostgreSQL 16 |
| **redis** | 6379 | Cache & Session store |

### Architecture

```
┌─────────────────────────────────────────┐
│          Docker Network                 │
│                                         │
│  ┌──────────┐    ┌──────────┐          │
│  │ Backend  │───▶│ Postgres │          │
│  │ Node.js  │    │  Port:   │          │
│  │ Port:    │    │  5432    │          │
│  │ 5000     │    └──────────┘          │
│  └────┬─────┘                           │
│       │                                 │
│       │        ┌──────────┐             │
│       └───────▶│  Redis   │             │
│                │  Port:   │             │
│                │  6379    │             │
│                └──────────┘             │
└─────────────────────────────────────────┘
```

---

## 🔧 Commandes Docker Utiles

### Gestion des Services

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Redémarrer un service
docker-compose restart backend

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# Status des conteneurs
docker-compose ps
```

### Development

```bash
# Hot reload automatique (volumes montés)
docker-compose up -d

# Exécuter une commande dans le backend
docker-compose exec backend npm run test

# Accéder au shell du backend
docker-compose exec backend sh

# Accéder à PostgreSQL
docker-compose exec postgres psql -U postgres -d innatural

# Accéder à Redis CLI
docker-compose exec redis redis-cli
```

### Debugging

```bash
# Voir les logs en temps réel
docker-compose logs -f --tail=100 backend

# Inspecter le réseau
docker network inspect innatural-network

# Stats des conteneurs
docker stats

# Variables d'environnement d'un conteneur
docker-compose exec backend printenv
```

### Nettoyage

```bash
# Arrêter et supprimer conteneurs
docker-compose down

# Supprimer volumes (⚠️ supprime données)
docker-compose down -v

# Supprimer tout (conteneurs + volumes + images)
docker-compose down -v --rmi all

# Rebuild images (après changement Dockerfile)
docker-compose build --no-cache
docker-compose up -d
```

---

## 🏭 Déploiement Production

### 1. Configuration Production

```bash
# Créer .env.production
cp .env.docker.example .env.production

# Éditer .env.production avec:
# - Mots de passe forts (POSTGRES_PASSWORD, REDIS_PASSWORD)
# - Secrets forts (JWT_SECRET, SESSION_SECRET)
# - CORS_ORIGINS avec vos domaines production
# - LOG_LEVEL=warn
# - SENTRY_DSN (optionnel)
```

### 2. Générer Secrets Forts

```bash
# Générer JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Générer SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Générer REDIS_PASSWORD
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 3. Démarrer en Production

```bash
# Utiliser docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Vérifier health
docker-compose -f docker-compose.prod.yml ps

# Voir logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 4. Migrations Production

```bash
# Exécuter migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Vérifier database
docker-compose -f docker-compose.prod.yml exec backend npx prisma db push
```

---

## 📊 Monitoring & Health Checks

### Health Checks Intégrés

Tous les services ont des health checks automatiques:

```bash
# Vérifier health status
docker-compose ps

# Backend health endpoint
curl http://localhost:5000/api/health

# Cache stats
curl http://localhost:5000/api/cache/stats

# Metrics (Prometheus)
curl http://localhost:5000/metrics
```

### Logs Persistants

Les logs sont sauvegardés dans un volume Docker:

```bash
# Accéder aux logs
docker-compose exec backend cat logs/combined-*.log
docker-compose exec backend cat logs/error-*.log

# Copier logs vers host
docker cp innatural-backend:/app/logs ./backend-logs
```

---

## 🔐 Sécurité

### Production Checklist

- [ ] ✅ Mots de passe forts pour PostgreSQL
- [ ] ✅ Password Redis activé
- [ ] ✅ JWT_SECRET généré (32+ caractères)
- [ ] ✅ SESSION_SECRET généré (32+ caractères)
- [ ] ✅ CORS limité aux domaines production
- [ ] ✅ NODE_ENV=production
- [ ] ✅ Logs niveau WARN (pas DEBUG)
- [ ] ✅ Health checks configurés
- [ ] ✅ Resource limits définis

### Recommandations

1. **Ne pas exposer PostgreSQL/Redis publiquement**
   - Ports 5432 et 6379 seulement accessibles par backend (dans Docker network)

2. **Utiliser HTTPS en production**
   - Ajouter un reverse proxy (nginx, Caddy, Traefik)

3. **Backup régulier**
   ```bash
   # Backup PostgreSQL
   docker-compose exec postgres pg_dump -U postgres innatural > backup.sql

   # Restore
   docker-compose exec -T postgres psql -U postgres innatural < backup.sql
   ```

4. **Rotation des secrets**
   - Changer JWT_SECRET, SESSION_SECRET périodiquement
   - Utiliser secrets manager en production (AWS Secrets Manager, etc.)

---

## 🚨 Troubleshooting

### Backend ne démarre pas

```bash
# Voir erreurs
docker-compose logs backend

# Vérifier que PostgreSQL est ready
docker-compose exec postgres pg_isready -U postgres

# Vérifier Redis
docker-compose exec redis redis-cli ping
```

### Database connection error

```bash
# Vérifier DATABASE_URL
docker-compose exec backend printenv DATABASE_URL

# Tester connection
docker-compose exec backend npx prisma db pull
```

### Redis connection error

```bash
# Vérifier Redis connection
docker-compose exec backend node -e "const Redis = require('ioredis'); const redis = new Redis({host: 'redis', port: 6379}); redis.ping().then(console.log)"
```

### Port déjà utilisé

```bash
# Trouver processus utilisant port 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # Mac/Linux

# Changer port dans .env
BACKEND_PORT=5001
```

### Rebuild après changements

```bash
# Rebuild images
docker-compose build --no-cache backend

# Restart
docker-compose up -d
```

---

## 📈 Performance Testing

### Benchmarks

```bash
# Accéder au backend
docker-compose exec backend sh

# Exécuter benchmarks
node scripts/benchmark.js

# Load testing
k6 run loadtests/basic-load.js
```

### Monitoring Resources

```bash
# Stats temps réel
docker stats innatural-backend innatural-postgres innatural-redis

# Limites mémoire/CPU (production)
# Définies dans docker-compose.prod.yml:
# limits: cpus: '2.0', memory: 2G
```

---

## 🎯 Optimisations Phase 5 Incluses

Le backend Docker inclut toutes les optimisations Phase 5:

✅ **Caching Multi-Layer**
- Redis cache principal
- Memory cache fallback
- X-Cache headers (HIT/MISS)

✅ **Compression**
- Gzip compression active
- Niveau 6, seuil 1KB

✅ **Performance Middleware**
- Request timeout (30s)
- Slow endpoint detection (>1s)
- Response time headers

✅ **Health Checks**
- Liveness probe
- Readiness probe
- Dependency checks (DB, Redis)

✅ **Monitoring**
- Prometheus metrics: `/metrics`
- Cache stats: `/api/cache/stats`
- Health: `/api/health`

---

## 📁 Structure Fichiers Docker

```
innatural-chatbot-project/
├── docker-compose.yml              # Development
├── docker-compose.prod.yml         # Production
├── .env.docker.example             # Template
├── .env                           # Your config (gitignored)
├── DOCKER_SETUP_GUIDE.md          # This file
└── backend/
    ├── Dockerfile                 # Multi-stage build
    ├── .dockerignore             # Optimize build
    ├── server.js                 # Entry point
    └── prisma/
        └── schema.prisma         # DB schema
```

---

## 🤝 Support

### Logs à vérifier en cas de problème

1. Backend logs: `docker-compose logs backend`
2. PostgreSQL logs: `docker-compose logs postgres`
3. Redis logs: `docker-compose logs redis`
4. Application logs: Dans volume `backend_logs`

### Commandes de diagnostic

```bash
# Health de tous les services
docker-compose ps

# Network connectivity
docker-compose exec backend ping postgres
docker-compose exec backend ping redis

# Check environment
docker-compose exec backend printenv

# Prisma status
docker-compose exec backend npx prisma migrate status
```

---

## 🎉 Prêt pour Déploiement

Suivez ces étapes:

1. ✅ Configurer `.env` avec vos secrets
2. ✅ `docker-compose up -d`
3. ✅ Migrations: `docker-compose exec backend npx prisma migrate deploy`
4. ✅ Test: `curl http://localhost:5000/api/health`
5. ✅ Vérifier cache: `curl http://localhost:5000/api/cache/stats`

**Votre backend INnatural est maintenant dockerisé avec Phase 5! 🚀**
