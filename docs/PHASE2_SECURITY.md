# Phase 2: Security & Validation

Ce guide documente l'implémentation des fonctionnalités de sécurité et validation pour le chatbot INnatural.

## ✅ Ce qui a été implémenté

### 1. Security Headers (Helmet)
- **Content Security Policy (CSP)** - Protection contre XSS
- **HSTS** - Force HTTPS en production
- **X-Frame-Options** - Protection contre clickjacking
- **X-Content-Type-Options** - Prévient MIME-sniffing
- **Referrer Policy** - Contrôle des informations de référence
- **Cross-Origin Policies** - Gestion sécurisée des ressources cross-origin

### 2. Input Validation (Joi)
- **Validation automatique** de tous les endpoints API
- **Sanitization XSS** - Nettoyage automatique des inputs HTML
- **Schémas de validation** pour:
  - Messages de chat
  - Requêtes produits
  - FAQ
  - Feedback utilisateur
  - Leads commerciaux
  - Événements analytics

### 3. Rate Limiting Avancé
- **Rate limiting global** - 200 requêtes/5min
- **Chat limiter** - 20 messages/min par session
- **Standard limiter** - 30 requêtes/min
- **Generous limiter** - 100 requêtes/min (lecture seule)
- **Auth limiter** - 5 tentatives/15min
- **Upload limiter** - 10 uploads/heure
- **Support Redis** pour déploiement multi-serveurs

### 4. Input Sanitization
- **Nettoyage automatique** de tous les inputs
- **Suppression des tags HTML** pour prévenir XSS
- **Validation de format** pour emails, téléphones, etc.

---

## 📁 Structure des fichiers créés

```
backend/
├── middleware/
│   ├── security.js           # Configuration Helmet (security headers)
│   ├── validation.js          # Schémas Joi et middleware de validation
│   └── rateLimiter.js         # Configuration rate limiting avancé
└── server.js                  # Intégration des middlewares de sécurité
```

---

## 🔒 Fonctionnalités de sécurité

### Security Headers (Helmet)

Le fichier [middleware/security.js](../backend/middleware/security.js) configure les headers de sécurité HTTP:

#### En Production
```javascript
// Headers appliqués automatiquement en production
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

#### En Développement
Les headers sont plus permissifs pour faciliter le développement:
- CSP désactivé (permet hot-reload)
- HSTS désactivé (pas de HTTPS requis)
- Autres protections actives

### Input Validation

Tous les endpoints API sont protégés par validation automatique via Joi.

#### Exemple: Validation d'un message de chat

```javascript
const chatMessageSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(5000)
    .required(),

  sessionId: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .max(100)
    .required(),

  language: Joi.string()
    .valid('ar', 'en', 'fr')
    .default('ar'),

  userProfile: Joi.object({
    hairType: Joi.string().valid('dry', 'oily', 'normal', 'mixed'),
    concerns: Joi.array().items(Joi.string().max(100)),
    email: Joi.string().email(),
  }).optional(),
});
```

#### Validation automatique

```javascript
// Endpoint avec validation
app.post('/api/chat',
  chatLimiter,                          // Rate limiting
  validateBody(chatMessageSchema),      // Validation + sanitization
  async (req, res) => {
    // req.body est maintenant validé et sanitizé
    const { message, sessionId } = req.body;
  }
);
```

### Input Sanitization

Protection automatique contre XSS:

```javascript
// Input utilisateur
const maliciousInput = "<script>alert('XSS')</script>Hello";

// Après sanitization
const cleanInput = "Hello";  // Tags HTML supprimés
```

### Rate Limiting

#### Configuration par type d'endpoint

| Limiter | Limite | Fenêtre | Usage |
|---------|--------|---------|-------|
| `globalLimiter` | 200 req | 5 min | Tous les endpoints |
| `chatLimiter` | 20 msg | 1 min | Endpoints de chat |
| `standardLimiter` | 30 req | 1 min | Endpoints standards |
| `generousLimiter` | 100 req | 1 min | Endpoints lecture seule |
| `authLimiter` | 5 req | 15 min | Authentification |
| `uploadLimiter` | 10 req | 1 heure | Upload de fichiers |

#### Endpoints protégés

```javascript
// Chat - 20 messages/minute
app.post('/api/chat', chatLimiter, validateBody(chatMessageSchema), ...);

// Recherche produits - 100 requêtes/minute
app.get('/api/products/search', generousLimiter, ...);

// Analytics - 30 requêtes/minute
app.post('/api/analytics/track', standardLimiter, validateBody(analyticsEventSchema), ...);
```

#### Support Redis

En production, le rate limiting utilise Redis pour partager les limites entre plusieurs serveurs:

```javascript
// Activation automatique si Redis disponible
const rateLimitRedis = await initRedisStore();
// ✅ Redis-backed rate limiting enabled
```

Sans Redis, un store mémoire est utilisé (adapté pour serveur unique).

---

## 🧪 Validation des schemas

### Chat Message

```javascript
// Valide ✅
{
  "message": "مرحبا، كيف حالك؟",
  "sessionId": "session_123",
  "language": "ar",
  "userProfile": {
    "hairType": "dry",
    "concerns": ["dryness", "breakage"]
  }
}

// Invalide ❌
{
  "message": "",  // Message vide
  "sessionId": "invalid session id",  // Caractères invalides
  "language": "de"  // Langue non supportée
}
// Réponse: 400 Bad Request
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {"field": "message", "message": "Message cannot be empty"},
    {"field": "sessionId", "message": "Invalid session ID format"},
    {"field": "language", "message": "Language must be ar, en, or fr"}
  ]
}
```

### Product Search

```javascript
// Valide ✅
{
  "search": "castor oil",
  "hairType": "dry",
  "minPrice": 10,
  "maxPrice": 50,
  "limit": 20
}

// Invalide ❌
{
  "search": "a".repeat(300),  // Trop long (max 200)
  "hairType": "unknown",  // Type invalide
  "minPrice": -5,  // Prix négatif
  "limit": 200  // Limite trop élevée (max 100)
}
```

### Feedback

```javascript
// Valide ✅
{
  "sessionId": "session_123",
  "rating": 5,
  "comment": "Excellent service!",
  "category": "helpful"
}

// Invalide ❌
{
  "sessionId": "session_123",
  "rating": 6,  // Rating invalide (1-5)
  "comment": "x".repeat(2000),  // Commentaire trop long (max 1000)
}
// Réponse: 400 Bad Request
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {"field": "rating", "message": "Rating must be between 1 and 5"},
    {"field": "comment", "message": "Comment cannot exceed 1000 characters"}
  ]
}
```

### Lead Capture

```javascript
// Valide ✅
{
  "sessionId": "session_123",
  "email": "client@example.com",
  "phone": "+33 6 12 34 56 78",
  "name": "Ahmed Hassan",
  "interest": ["hair oil", "shampoo"],
  "budget": "50-100 EUR",
  "timeline": "this week"
}

// Invalide ❌
{
  "sessionId": "session_123",
  // Ni email ni phone fourni
}
// Réponse: 400 Bad Request
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {"field": "object.missing", "message": "Either email or phone is required"}
  ]
}
```

---

## 🚀 Utilisation

### Appliquer la validation à un endpoint

```javascript
const { validateBody, chatMessageSchema } = require('./middleware/validation');

app.post('/api/chat',
  validateBody(chatMessageSchema),  // Validation automatique
  async (req, res) => {
    // req.body est maintenant:
    // - Validé contre le schéma
    // - Sanitizé (XSS removed)
    // - Avec valeurs par défaut appliquées
    const { message, sessionId, language } = req.body;
  }
);
```

### Appliquer le rate limiting

```javascript
const { chatLimiter, standardLimiter } = require('./middleware/rateLimiter');

// Chat endpoint - 20 messages/minute
app.post('/api/chat', chatLimiter, ...);

// Standard endpoint - 30 requêtes/minute
app.post('/api/analytics/track', standardLimiter, ...);
```

### Créer un limiter personnalisé

```javascript
const { createLimiter } = require('./middleware/rateLimiter');

const customLimiter = createLimiter({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,  // 10 requêtes
  message: 'Custom rate limit exceeded',
});

app.post('/api/custom-endpoint', customLimiter, ...);
```

---

## 🔍 Logging de sécurité

Tous les événements de sécurité sont loggés automatiquement:

### Rate Limit Exceeded

```javascript
// Log automatique
logger.logSecurity('rate_limit_exceeded', {
  ip: '192.168.1.100',
  path: '/api/chat',
  method: 'POST',
});
```

### Validation Errors

```javascript
// Log automatique lors d'erreur de validation
{
  level: 'warn',
  message: 'Validation failed',
  fields: ['message', 'sessionId'],
  ip: '192.168.1.100',
  path: '/api/chat'
}
```

---

## 📊 Monitoring

### Vérifier le status des protections

```bash
# Health check avec détails sécurité
curl http://localhost:5000/api/health

# Réponse
{
  "status": "ok",
  "security": {
    "helmet": "enabled",
    "rateLimiting": "redis-backed",
    "validation": "active"
  }
}
```

### Headers de rate limiting

Chaque réponse inclut les headers de rate limiting:

```http
RateLimit-Limit: 20
RateLimit-Remaining: 15
RateLimit-Reset: 1234567890
```

Lors du dépassement de limite:

```http
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 20
RateLimit-Remaining: 0
RateLimit-Reset: 1234567890
Retry-After: 60

{
  "success": false,
  "error": "Too many requests",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": "60"
}
```

---

## ⚙️ Configuration

### Variables d'environnement

```env
# .env
NODE_ENV=production  # Active les protections strictes

# Redis pour rate limiting distribué (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Personnalisation des headers de sécurité

Éditer [middleware/security.js](../backend/middleware/security.js):

```javascript
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://trusted-cdn.com"],
      // Ajouter vos domaines de confiance
    },
  },
  // Autres configurations...
});
```

### Personnalisation des schémas de validation

Éditer [middleware/validation.js](../backend/middleware/validation.js):

```javascript
const customSchema = Joi.object({
  // Vos règles de validation personnalisées
  customField: Joi.string().min(5).max(100).required(),
});
```

---

## 🛡️ Bonnes pratiques de sécurité

### 1. Validation stricte des inputs

✅ **À FAIRE:**
```javascript
// Valider TOUS les inputs
app.post('/api/endpoint', validateBody(schema), ...);
```

❌ **À ÉVITER:**
```javascript
// Pas de validation = vulnérabilité
app.post('/api/endpoint', (req, res) => {
  const { userInput } = req.body;  // Dangereux!
  // ...
});
```

### 2. Sanitization systématique

✅ **À FAIRE:**
```javascript
// Validation Joi inclut sanitization automatique
validateBody(schema)  // Supprime HTML automatiquement
```

❌ **À ÉVITER:**
```javascript
// Afficher directement l'input utilisateur
res.send(`<div>${req.body.message}</div>`);  // XSS!
```

### 3. Rate limiting adapté

✅ **À FAIRE:**
```javascript
// Endpoints sensibles = rate limit strict
app.post('/api/login', authLimiter, ...);  // 5 req/15min
app.post('/api/chat', chatLimiter, ...);   // 20 req/min
```

❌ **À ÉVITER:**
```javascript
// Pas de rate limiting = abuse possible
app.post('/api/expensive-operation', ...);  // Dangereux!
```

### 4. Headers de sécurité en production

✅ **À FAIRE:**
```javascript
// Utiliser Helmet en production
app.use(getSecurityMiddleware());  // Headers auto
```

❌ **À ÉVITER:**
```javascript
// Pas de headers de sécurité = vulnérabilités
// (XSS, clickjacking, etc.)
```

### 5. Logging des événements de sécurité

✅ **À FAIRE:**
```javascript
// Logger les tentatives d'abuse
logger.logSecurity('rate_limit_exceeded', { ip, path });
logger.logSecurity('validation_failed', { fields, ip });
```

---

## 🧪 Tests de sécurité

### Test 1: Validation des inputs

```bash
# Test message invalide
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "",
    "sessionId": "invalid@session"
  }'

# Attendu: 400 Bad Request avec détails des erreurs
```

### Test 2: XSS Protection

```bash
# Test injection XSS
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "<script>alert(\"XSS\")</script>Hello",
    "sessionId": "test_session"
  }'

# Attendu: Message sanitizé sans <script> tag
```

### Test 3: Rate Limiting

```bash
# Envoyer 25 requêtes rapidement (limite = 20/min)
for i in {1..25}; do
  curl -X POST http://localhost:5000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"Test '$i'","sessionId":"test"}' &
done

# Attendu: Après 20 requêtes, recevoir 429 Too Many Requests
```

### Test 4: Security Headers

```bash
# Vérifier les headers de sécurité
curl -I http://localhost:5000/api/health

# Attendu (en production):
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
```

---

## ⚠️ Troubleshooting

### Problème: Rate limiting trop strict

```javascript
// Solution: Ajuster les limites
const customLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 50,  // Augmenter la limite
});
```

### Problème: Validation rejette des inputs valides

```javascript
// Solution: Assouplir le schéma
const schema = Joi.object({
  field: Joi.string()
    .min(1)  // Réduire la longueur min
    .max(10000),  // Augmenter la longueur max
});
```

### Problème: Redis rate limiting ne fonctionne pas

```bash
# Vérifier que Redis tourne
redis-cli ping
# Réponse attendue: PONG

# Vérifier les variables d'environnement
echo $REDIS_HOST
echo $REDIS_PORT
```

### Problème: CSP bloque des ressources légitimes

```javascript
// Solution: Ajouter le domaine à la whitelist
contentSecurityPolicy: {
  directives: {
    scriptSrc: ["'self'", "https://votre-cdn.com"],
  },
}
```

---

## 📈 Métriques de sécurité

Le système track automatiquement:

- **Nombre de requêtes bloquées** par rate limiting
- **Nombre d'erreurs de validation** par endpoint
- **Tentatives d'injection XSS** détectées et bloquées
- **IPs suspectes** avec trop d'erreurs

Voir les métriques dans:
```bash
# Logs de sécurité
tail -f backend/logs/error-*.log | grep security

# Monitoring en temps réel
curl http://localhost:5000/api/monitoring
```

---

## 🎯 Prochaines étapes

Phase 2 ✅ TERMINÉE! Vous avez maintenant:

- ✅ Headers de sécurité (Helmet)
- ✅ Validation d'inputs (Joi)
- ✅ Rate limiting avancé
- ✅ Sanitization XSS
- ✅ Logging de sécurité

### Recommandations supplémentaires:

1. **Ajouter JWT Authentication** (optionnel)
2. **Configurer WAF** (Web Application Firewall)
3. **Activer HTTPS** en production
4. **Mettre en place monitoring** (Sentry, DataDog)
5. **Audit de sécurité** régulier avec OWASP ZAP

---

## 📞 Support

Pour questions sur la sécurité:

1. Consulter les logs: `backend/logs/error-*.log`
2. Vérifier les headers: `curl -I http://localhost:5000/api/health`
3. Tester la validation: Voir section Tests ci-dessus
4. Documentation Helmet: https://helmetjs.github.io/
5. Documentation Joi: https://joi.dev/api/

---

**Phase 2 implémentée avec succès! 🎉**

Security headers actifs ✅
Input validation opérationnelle ✅
Rate limiting configuré ✅
XSS protection active ✅
Logging de sécurité en place ✅
