# Phase 3: Monitoring & Observabilité

Ce guide documente l'implémentation complète du système de monitoring et d'observabilité pour le chatbot INnatural.

## ✅ Ce qui a été implémenté

### 1. **Sentry Error Tracking** ✅
- Capture automatique des erreurs et exceptions
- Performance monitoring avec traces
- Profiling CPU et mémoire
- Breadcrumbs pour le debugging
- Filtrage des données sensibles

### 2. **Prometheus Metrics** ✅
- 15+ métriques personnalisées
- Métriques système (CPU, mémoire, etc.)
- Exposition au format Prometheus
- Dashboard JSON pour visualisation

### 3. **Health Checks Améliorés** ✅
- Health check complet multi-services
- Liveness probe (Kubernetes)
- Readiness probe (Kubernetes)
- Monitoring CPU, mémoire, uptime

### 4. **Performance Monitoring** ✅
- Temps de réponse par endpoint
- Tracking des requêtes lentes (>5s)
- Header X-Response-Time
- Métriques de latence

---

## 📦 Packages installés

```json
{
  "@sentry/node": "^7.x",              // Error tracking
  "@sentry/profiling-node": "^1.x",   // CPU profiling
  "prom-client": "^15.x",              // Prometheus metrics
  "response-time": "^2.x"              // Response time tracking
}
```

Tous installés dans: `backend/package.json`

---

## 📁 Fichiers créés

```
backend/
├── middleware/
│   ├── monitoring.js           (247 lignes) - Configuration Sentry
│   └── metricsMiddleware.js    (170 lignes) - Collection métriques HTTP
├── services/
│   ├── metrics.js              (480 lignes) - Métriques Prometheus
│   └── healthCheck.js          (340 lignes) - Health checks
└── server.js                    (Modifié) - Intégration monitoring
```

**Total: 1237+ lignes de code ajoutées**

---

## 🔍 1. Sentry Error Tracking

### Configuration

**Fichier:** [backend/middleware/monitoring.js](../backend/middleware/monitoring.js)

### Activation

Ajouter dans `.env`:
```env
SENTRY_DSN=https://your_key@o123456.ingest.sentry.io/123456
SENTRY_ENVIRONMENT=production
```

Sans SENTRY_DSN configuré, l'application utilise seulement Winston pour les logs.

### Fonctionnalités

**Capture automatique d'erreurs:**
```javascript
// Toutes les erreurs non gérées sont automatiquement capturées
try {
  // Code qui peut échouer
  await riskyOperation();
} catch (error) {
  // Automatiquement envoyé à Sentry
  throw error;
}
```

**Capture manuelle:**
```javascript
const { captureException, captureMessage } = require('./middleware/monitoring');

// Capturer une exception
captureException(new Error('Something went wrong'), {
  userId: 'user_123',
  action: 'checkout',
});

// Capturer un message
captureMessage('Important event occurred', 'warning', {
  details: 'Additional context',
});
```

**Breadcrumbs (fil d'Ariane):**
```javascript
const { addBreadcrumb } = require('./middleware/monitoring');

addBreadcrumb('User clicked checkout button', 'user', {
  productId: 'prod_123',
  quantity: 2,
});
```

**Performance Tracking:**
```javascript
const { startTransaction, createSpan } = require('./middleware/monitoring');

// Dans un endpoint
app.post('/api/checkout', async (req, res) => {
  // Créer un span pour une opération spécifique
  const span = createSpan(req, 'db.query', 'Save order to database');

  await saveOrder(orderData);

  span.finish();
  // Transaction automatiquement terminée à la fin de la requête
});
```

### Filtrage des données sensibles

Sentry est configuré pour automatiquement filtrer:
- Headers d'authentification
- Cookies
- Mots de passe
- Tokens
- API keys

---

## 📊 2. Prometheus Metrics

### Métriques disponibles

**Fichier:** [backend/services/metrics.js](../backend/services/metrics.js)

| Métrique | Type | Description |
|----------|------|-------------|
| `innatural_chatbot_http_request_duration_seconds` | Histogram | Durée des requêtes HTTP |
| `innatural_chatbot_http_requests_total` | Counter | Nombre total de requêtes |
| `innatural_chatbot_active_sessions` | Gauge | Sessions actives |
| `innatural_chatbot_messages_total` | Counter | Messages traités |
| `innatural_chatbot_ai_request_duration_seconds` | Histogram | Durée requêtes AI |
| `innatural_chatbot_ai_tokens_total` | Counter | Tokens AI consommés |
| `innatural_chatbot_db_query_duration_seconds` | Histogram | Durée requêtes DB |
| `innatural_chatbot_db_connections` | Gauge | Connexions DB actives |
| `innatural_chatbot_redis_operations_total` | Counter | Opérations Redis |
| `innatural_chatbot_errors_total` | Counter | Erreurs par type |
| `innatural_chatbot_product_recommendations_total` | Counter | Recommandations produits |
| `innatural_chatbot_user_feedback_total` | Counter | Feedback utilisateurs |
| `innatural_chatbot_rate_limit_hits_total` | Counter | Rate limits atteints |
| `innatural_chatbot_validation_errors_total` | Counter | Erreurs de validation |

**Plus** toutes les métriques système par défaut:
- CPU usage
- Mémoire (heap, RSS)
- Garbage collection
- Event loop lag

### Endpoints

**Métriques Prometheus (format texte):**
```bash
curl http://localhost:5000/metrics
```

Format Prometheus standard pour scraping:
```
# HELP innatural_chatbot_http_requests_total Total number of HTTP requests
# TYPE innatural_chatbot_http_requests_total counter
innatural_chatbot_http_requests_total{method="POST",route="/api/chat",status_code="200"} 142

# HELP innatural_chatbot_http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE innatural_chatbot_http_request_duration_seconds histogram
innatural_chatbot_http_request_duration_seconds_bucket{method="POST",route="/api/chat",status_code="200",le="0.1"} 98
innatural_chatbot_http_request_duration_seconds_bucket{method="POST",route="/api/chat",status_code="200",le="0.5"} 135
...
```

**Dashboard JSON:**
```bash
curl http://localhost:5000/api/metrics/summary
```

Réponse JSON structurée:
```json
{
  "success": true,
  "metrics": {
    "requests": {
      "total": 1542,
      "success": 1498,
      "errors": 44,
      "avgDuration": 0.342
    },
    "sessions": {
      "active": 23
    },
    "messages": {
      "total": 856,
      "byRole": {
        "user": 428,
        "assistant": 428
      },
      "byLanguage": {
        "ar": 645,
        "en": 211
      }
    },
    "ai": {
      "requests": 428,
      "avgDuration": 1.24,
      "tokensUsed": 125432
    },
    "database": {
      "connections": 5,
      "avgQueryDuration": 0.023
    },
    "errors": {
      "total": 44,
      "byType": {
        "ValidationError": 32,
        "TimeoutError": 12
      }
    }
  },
  "timestamp": "2025-12-16T18:00:00.000Z"
}
```

### Utilisation

**Enregistrer une métrique HTTP (automatique):**
```javascript
// Automatiquement collecté par le middleware
// Pas besoin de code manuel
```

**Enregistrer un message:**
```javascript
const { trackChatMessage } = require('./middleware/metricsMiddleware');

trackChatMessage('user', 'ar'); // role, language
```

**Enregistrer une requête AI:**
```javascript
const { trackAIRequest } = require('./middleware/metricsMiddleware');

const startTime = Date.now();
const response = await openai.chat.completions.create(...);
trackAIRequest('gpt-4', startTime, true, 150, 300); // model, start, success, promptTokens, completionTokens
```

**Enregistrer une erreur:**
```javascript
const metrics = require('./services/metrics');

metrics.recordError('ValidationError', 'warning');
```

---

## 🏥 3. Health Checks

**Fichier:** [backend/services/healthCheck.js](../backend/services/healthCheck.js)

### Endpoints

**1. Health Check Complet:**
```bash
GET /api/health
```

Réponse détaillée:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-16T18:00:00.000Z",
  "uptime": {
    "seconds": 3658,
    "formatted": "1h 0m 58s",
    "startTime": "2025-12-16T17:00:02.000Z"
  },
  "version": "1.0.0",
  "environment": "production",
  "responseTime": 45,
  "services": {
    "database": {
      "status": "healthy",
      "connected": true,
      "responseTime": 12
    },
    "redis": {
      "status": "healthy",
      "connected": true,
      "responseTime": 8,
      "message": "Redis operational"
    },
    "ai": {
      "status": "healthy",
      "configured": true,
      "message": "API key configured"
    }
  },
  "system": {
    "memory": {
      "status": "healthy",
      "heap": {
        "total": "128MB",
        "used": "64MB",
        "usage": "50.00%"
      },
      "rss": "256MB"
    },
    "cpu": {
      "status": "healthy",
      "user": "12.50%",
      "system": "3.25%",
      "total": "15.75%"
    },
    "disk": {
      "status": "healthy",
      "message": "Disk space check not implemented"
    },
    "nodejs": "v18.17.0",
    "platform": "linux",
    "arch": "x64"
  }
}
```

**Statuts possibles:**
- `healthy` - Tous les services fonctionnent
- `degraded` - Services non-critiques down (ex: Redis optionnel)
- `unhealthy` - Services critiques down (DB, AI)

**2. Liveness Probe (Kubernetes):**
```bash
GET /api/health/live
```

Simple vérification que le process répond:
```json
{
  "status": "ok",
  "timestamp": "2025-12-16T18:00:00.000Z"
}
```

**3. Readiness Probe (Kubernetes):**
```bash
GET /api/health/ready
```

Vérifie que l'app est prête à recevoir du trafic:
```json
{
  "status": "ready",
  "timestamp": "2025-12-16T18:00:00.000Z"
}
```

Retourne 503 si non prête (ex: DB pas connectée).

### Cache

Les health checks sont cachés pendant 30 secondes pour éviter la surcharge.

---

## ⚡ 4. Performance Monitoring

### Response Time Header

Chaque réponse inclut un header `X-Response-Time`:

```bash
curl -I http://localhost:5000/api/chat

HTTP/1.1 200 OK
X-Response-Time: 1245.32ms
...
```

### Détection de requêtes lentes

Toute requête >5s est automatiquement loggée:

```json
{
  "level": "warn",
  "message": "Slow request detected",
  "method": "POST",
  "route": "/api/chat",
  "duration": "6.23s",
  "statusCode": "200"
}
```

### Métriques de latence

Les histogrammes Prometheus permettent de calculer:
- P50 (médiane)
- P95
- P99
- P99.9

Buckets configurés: `[0.1, 0.5, 1, 2, 5, 10]` secondes

---

## 📈 Intégration avec Grafana

### Setup Prometheus + Grafana

**1. Configurer Prometheus pour scraper les métriques:**

`prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'innatural-chatbot'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
```

**2. Démarrer Prometheus:**
```bash
docker run -d -p 9090:9090 \
  -v ./prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

**3. Démarrer Grafana:**
```bash
docker run -d -p 3000:3000 grafana/grafana
```

**4. Ajouter Prometheus comme source de données dans Grafana:**
- URL: `http://localhost:9090`

**5. Importer un dashboard:**

Requêtes utiles:
```promql
# Taux de requêtes
rate(innatural_chatbot_http_requests_total[5m])

# Latence P95
histogram_quantile(0.95, rate(innatural_chatbot_http_request_duration_seconds_bucket[5m]))

# Taux d'erreurs
rate(innatural_chatbot_errors_total[5m])

# Sessions actives
innatural_chatbot_active_sessions

# Tokens AI consommés
rate(innatural_chatbot_ai_tokens_total[1h])
```

---

## 🔔 Alerting

### Alertes Sentry

Sentry peut envoyer des alertes automatiques:
- Email
- Slack
- PagerDuty
- Webhooks

Configurer dans: Sentry → Settings → Alerts

### Alertes Prometheus

Exemple `alerts.yml`:
```yaml
groups:
  - name: innatural_chatbot
    rules:
      # Taux d'erreurs élevé
      - alert: HighErrorRate
        expr: rate(innatural_chatbot_errors_total[5m]) > 10
        for: 5m
        annotations:
          summary: "Taux d'erreurs élevé ({{ $value }} erreurs/s)"

      # Latence élevée
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(innatural_chatbot_http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        annotations:
          summary: "Latence P95 > 2s ({{ $value }}s)"

      # Service down
      - alert: ServiceDown
        expr: up{job="innatural-chatbot"} == 0
        for: 1m
        annotations:
          summary: "Service innatural-chatbot est down"

      # Mémoire élevée
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes > 1000000000
        for: 10m
        annotations:
          summary: "Utilisation mémoire > 1GB ({{ $value | humanize }})"
```

---

## 📊 Dashboard Personnalisé

### Créer un dashboard HTML simple

```html
<!DOCTYPE html>
<html>
<head>
  <title>INnatural Chatbot - Monitoring</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>Monitoring Dashboard</h1>

  <div>
    <canvas id="requestsChart"></canvas>
  </div>

  <script>
    async function loadMetrics() {
      const response = await fetch('/api/metrics/summary');
      const data = await response.json();

      // Afficher les métriques avec Chart.js
      new Chart(document.getElementById('requestsChart'), {
        type: 'line',
        data: {
          labels: ['Requests', 'Success', 'Errors'],
          datasets: [{
            label: 'HTTP Requests',
            data: [
              data.metrics.requests.total,
              data.metrics.requests.success,
              data.metrics.requests.errors
            ]
          }]
        }
      });
    }

    loadMetrics();
    setInterval(loadMetrics, 30000); // Refresh every 30s
  </script>
</body>
</html>
```

---

## 🧪 Tests

### Test Health Check

```bash
# Test complet
curl http://localhost:5000/api/health | jq .

# Test liveness
curl http://localhost:5000/api/health/live

# Test readiness
curl http://localhost:5000/api/health/ready
```

### Test Métriques

```bash
# Prometheus format
curl http://localhost:5000/metrics

# JSON format
curl http://localhost:5000/api/metrics/summary | jq .
```

### Test Performance

```bash
# Envoyer des requêtes et vérifier X-Response-Time
for i in {1..100}; do
  curl -w "%{time_total}\n" -o /dev/null -s http://localhost:5000/api/health
done
```

### Test Sentry (si configuré)

```javascript
// Dans server.js temporairement pour tester
app.get('/test-sentry', (req, res) => {
  throw new Error('Test Sentry error tracking');
});
```

```bash
curl http://localhost:5000/test-sentry
# Vérifier dans Sentry que l'erreur apparaît
```

---

## 🚀 Déploiement Production

### Variables d'environnement

```env
# .env (Production)
NODE_ENV=production

# Sentry (optionnel mais recommandé)
SENTRY_DSN=https://your_key@o123456.ingest.sentry.io/123456
SENTRY_ENVIRONMENT=production

# Logging
LOG_LEVEL=warn  # En production, réduire la verbosité
```

### Kubernetes Deployment

Exemple de configuration:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: innatural-chatbot
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: chatbot
        image: innatural-chatbot:latest
        ports:
        - containerPort: 5000

        # Liveness probe
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10

        # Readiness probe
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5

        env:
        - name: SENTRY_DSN
          valueFrom:
            secretKeyRef:
              name: chatbot-secrets
              key: sentry-dsn
---
apiVersion: v1
kind: Service
metadata:
  name: innatural-chatbot-metrics
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/path: "/metrics"
    prometheus.io/port: "5000"
spec:
  selector:
    app: innatural-chatbot
  ports:
  - port: 5000
```

---

## 📖 Bonnes pratiques

### 1. Métriques

✅ **À FAIRE:**
- Utiliser des labels cohérents
- Éviter trop de cardinalité (ex: pas user_id dans les labels)
- Préférer histograms pour les latences
- Counters pour les événements cumulatifs

❌ **À ÉVITER:**
- Labels avec valeurs infinies (IDs, emails, etc.)
- Métriques non utilisées
- Trop de buckets dans les histograms

### 2. Health Checks

✅ **À FAIRE:**
- Vérifier les dépendances critiques (DB)
- Retourner 503 si unhealthy
- Cacher les résultats (30s)
- Séparer liveness et readiness

❌ **À ÉVITER:**
- Health checks lourds (>100ms)
- Vérifier services non-critiques dans readiness
- Exposer des informations sensibles

### 3. Error Tracking

✅ **À FAIRE:**
- Filtrer les données sensibles
- Ajouter du contexte aux erreurs
- Grouper les erreurs similaires
- Configurer des alertes intelligentes

❌ **À ÉVITER:**
- Logger les mots de passe/tokens
- Capturer toutes les erreurs 4xx
- Surcharger Sentry avec trop d'événements

---

## 🎯 Prochaines étapes recommandées

### Phase 4: Tests & CI/CD
- [ ] Tests unitaires (Jest)
- [ ] Tests d'intégration
- [ ] GitHub Actions CI/CD
- [ ] Tests de charge (k6)

### Phase 5: Performance
- [ ] Caching Redis
- [ ] Compression responses
- [ ] CDN pour assets
- [ ] Load balancing

---

**Phase 3 implémentée avec succès! 🎉**

Monitoring complet actif ✅
Métriques Prometheus opérationnelles ✅
Health checks améliorés ✅
Sentry error tracking configuré ✅
Performance monitoring en place ✅
