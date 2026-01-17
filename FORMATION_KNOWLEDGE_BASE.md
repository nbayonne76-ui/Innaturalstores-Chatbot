# 🎓 Formation: Knowledge Base Modulaire - De Zéro à Expert

## 📋 Programme de Formation

### Module 1: Comprendre l'Architecture (30 min) ✅ En cours
### Module 2: Créer Votre Premier Scénario (45 min)
### Module 3: Tester et Optimiser (30 min)
### Module 4: Implémenter le Filtrage (1h)
### Module 5: Maintenance et Évolution (30 min)

**Durée totale:** ~3h30 (à votre rythme)

---

## 📚 Module 1: Comprendre l'Architecture Knowledge Base

### 1.1 Vue d'Ensemble du Système

Votre chatbot utilise une architecture en couches:

```
┌─────────────────────────────────────────────┐
│           UTILISATEUR (Widget)              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│       Guided Flow Manager                   │
│  (Détecte: Corps vs Cheveux)               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│       Server.js (Route la requête)          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│       ClaudeService.chat()                  │
│  (Orchestre la conversation)               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   searchKnowledgeBase()                     │
│  (Cherche dans la KB)                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   INnatural_Chatbot_Knowledge_Base_v2.json  │
│  (Base de connaissances)                   │
└─────────────────────────────────────────────┘
```

### 1.2 Structure de la Knowledge Base

Ouvrez le fichier: `config/INnatural_Chatbot_Knowledge_Base_v2.json`

**Anatomie du fichier:**

```json
{
  "metadata": {
    // Informations sur la version, date, statistiques
  },

  "config": {
    // Configuration du système de recherche
    "fuzzy_matching_threshold": 0.6,  // Tolérance de matching
    "max_results": 3,                  // Nombre max de résultats
    "min_confidence_score": 0.3        // Score minimum pour match
  },

  "synonyms": {
    // Dictionnaire de synonymes AR/EN
    "ar": { "شعر جاف": ["شعر ناشف", ...] },
    "en": { "dry hair": ["dehydrated hair", ...] }
  },

  "categories": [
    {
      "category_id": "PRE_PURCHASE",
      "scenarios": [
        // Scénarios de recommandation produits
      ]
    },
    {
      "category_id": "INGREDIENTS_COMPOSITION",
      "scenarios": [
        // Scénarios sur les ingrédients
      ]
    }
    // ... autres catégories
  ]
}
```

### 1.3 Anatomie d'un Scénario

Un scénario est une "réponse intelligente pré-programmée" qui s'active quand certaines conditions sont remplies.

**Exemple de scénario simplifié:**

```json
{
  "scenario_id": "HAIR_LOSS",           // ID unique
  "priority": 10,                       // Plus haut = plus important

  "keywords": {
    "ar": ["بيقع", "تساقط", "ضعيف"],   // Mots déclencheurs AR
    "en": ["fall", "loss", "weak"]      // Mots déclencheurs EN
  },

  "user_queries": {
    "ar": [
      "شعري بيقع كتير",                 // Questions types
      "عندي تساقط شعر"
    ]
  },

  "responses": [
    {
      "response_type": "detailed",      // Type de réponse
      "language": "ar",
      "text": "أهلاً حبيبتي 💚 تساقط الشعر..."
    }
  ],

  "related_products": [
    {
      "product_id": "mixoil-rosemary-bundle",
      "relevance_score": 0.95            // Pertinence du produit
    }
  ]
}
```

### 1.4 Comment Fonctionne le Scoring?

Quand un utilisateur pose une question, le système:

1. **Normalise** la question avec les synonymes
2. **Recherche** dans tous les scénarios
3. **Calcule un score** pour chaque scénario:

```javascript
Score = 0

// +50 points : Question exacte trouvée
if (user_queries contient la question) → Score += 50

// +30 points : Mot-clé trouvé
if (keywords contiennent des mots de la question) → Score += 30

// +20 points : Tag trouvé
if (tags contiennent des mots de la question) → Score += 20

// +10 points : Synonyme trouvé
if (synonyms correspondent) → Score += 10

// Score final = Score * priority / 10
```

4. **Trie** les scénarios par score
5. **Retourne** les 3 meilleurs (max_results: 3)

### 1.5 Exercice Pratique 1: Explorer la KB

**À faire maintenant:**

1. Ouvrez: `config/INnatural_Chatbot_Knowledge_Base_v2.json`

2. Trouvez le scénario "HAIR_LOSS" (ligne ~87)

3. Répondez à ces questions:
   - ✏️ Quel est son priority? _______
   - ✏️ Combien de user_queries en arabe? _______
   - ✏️ Quel produit est recommandé? _______
   - ✏️ Quel est le relevance_score de ce produit? _______

4. Testez mentalement:
   - Si un utilisateur dit "شعري بيقع كتير"
   - Ce scénario devrait-il matcher? Pourquoi?
   - Quel serait le score approximatif?

**Réponses:**
- Priority: 10
- User queries AR: 6
- Produit: mixoil-rosemary-bundle
- Score: 0.95
- Oui, il devrait matcher car la phrase est dans user_queries (50 points) + priority 10 = score élevé

---

## 📝 Module 2: Créer Votre Premier Scénario Corps

### 2.1 Identifier le Besoin

Nous allons créer un scénario pour **"Peau sèche → Recommander Body Cream"**

**Réflexion avant de coder:**

1. Quelles questions un client pourrait poser?
   - "بشرتي جافة كتير"
   - "عايزة كريم يرطب بشرتي"
   - "جلدي ناشف قوي"
   - "I have dry skin"
   - "Need moisturizer"

2. Quels mots-clés devraient déclencher ce scénario?
   - AR: جافة, ناشفة, خشنة, ترطيب
   - EN: dry, dehydrated, rough, moisturize

3. Quels produits recommander?
   - cocoshea-body-cream (léger, quotidien)
   - mixoil-almond-body-butter (intensif)
   - mixoil-coconut-body-cream (alternative)

### 2.2 Structure de Base

Créez un nouveau fichier: `config/test-scenario-dry-skin.json`

```json
{
  "scenario_id": "DRY_SKIN_BODY",
  "priority": 10,
  "usage_count": 0,

  "metadata": {
    "intent": "product_recommendation",
    "skin_concerns": ["dry_skin", "dehydration", "rough_skin"],
    "recommended_products": [
      "cocoshea-body-cream",
      "mixoil-coconut-body-cream",
      "mixoil-almond-body-butter"
    ],
    "product_type": "body",
    "confidence_threshold": 0.7,
    "escalation_required": false
  }
}
```

**💡 Explication:**
- `priority: 10` = Très important (échelle 1-10)
- `product_type: "body"` = Pour le filtrage futur
- `confidence_threshold: 0.7` = Score minimum requis
- `escalation_required: false` = Pas besoin d'intervention humaine

### 2.3 Ajouter les Déclencheurs

Ajoutez ces sections à votre scénario:

```json
{
  "tags": {
    "ar": ["بشرة جافة", "ترطيب", "نعومة", "كريم الجسم", "زبدة الجسم", "جفاف"],
    "en": ["dry skin", "moisturize", "hydration", "body cream", "body butter", "dehydration"]
  },

  "keywords": {
    "ar": ["جافة", "ناشفة", "خشنة", "ترطيب", "تنعيم", "جفاف", "خشونة"],
    "en": ["dry", "dehydrated", "rough", "moisturize", "hydrate", "dryness"]
  },

  "user_queries": {
    "ar": [
      "بشرتي جافة كتير",
      "عندي جفاف في الجلد",
      "بشرتي خشنة ومحتاجة ترطيب",
      "عايزة كريم يرطب بشرتي",
      "جلدي ناشف قوي",
      "محتاجة حاجة للبشرة الجافة",
      "الكوع والركب خشنة عندي"
    ],
    "en": [
      "I have dry skin",
      "my skin is very dry",
      "need moisturizer for dry skin",
      "skin feels rough",
      "dry skin on body",
      "need hydration for skin"
    ]
  }
}
```

**💡 Explication:**
- **Tags**: Concepts larges (pour recherche sémantique)
- **Keywords**: Mots précis (matching direct)
- **User_queries**: Questions exactes (score le plus élevé)

### 2.4 Créer les Réponses

Ajoutez différents types de réponses:

```json
{
  "responses": [
    {
      "response_type": "detailed",
      "language": "ar",
      "text": "أهلاً حبيبتي 💚 البشرة الجافة محتاجة ترطيب عميق ومكثف!\n\nأنصحك بـ **كريم الجسم CocoShea** - الحل المثالي للبشرة الجافة:\n✨ يرطب البشرة الجافة بفعالية ويمنع التشقق\n✨ تركيبة خفيفة تمتص بسهولة دون ترك بقايا دهنية\n✨ غني بزبدة الشيا وزيت جوز الهند الطبيعيين\n✨ مناسب للاستخدام اليومي\n\n💡 أو إذا كنتي محتاجة ترطيب أعمق:\n**زبدة الجسم MixOil باللوز** - تركيبة مركزة:\n✨ ترطيب مكثف للبشرة الجافة جداً\n✨ تنعيم فوري للمناطق الخشنة (كوع، ركب، كعب)\n✨ تحافظ على الرطوبة طوال اليوم\n\nWhatsApp/Call: +20155 5590333\n\nتحبي تعرفي أكتر عن أي منتج؟ 🛍️"
    },
    {
      "response_type": "brief",
      "language": "ar",
      "text": "حبيبتي، للبشرة الجافة أنصحك بكريم CocoShea 💚 خفيف وبيرطب بعمق! أو زبدة الجسم MixOil باللوز للترطيب المكثف. عايزة تفاصيل أكتر؟"
    },
    {
      "response_type": "consultative",
      "language": "ar",
      "text": "أهلاً يا قمر 💕\n\nخليني أساعدك نختار المنتج الأنسب:\n\n❓ الجفاف عندك:\n• في كل الجسم؟\n• في مناطق معينة (كوع، ركب)؟\n• طول السنة ولا في الشتاء بس؟\n\n❓ تفضلي:\n• كريم خفيف يمتص بسرعة؟\n• زبدة مركزة للترطيب العميق؟\n\nعلشان أرشحلك المنتج المناسب بالظبط 🎯"
    }
  ]
}
```

**💡 Types de réponses:**
- **detailed**: Réponse complète avec détails produits
- **brief**: Réponse courte et directe
- **consultative**: Pose des questions pour affiner

### 2.5 Lier aux Produits

```json
{
  "related_products": [
    {
      "product_id": "cocoshea-body-cream",
      "relevance_score": 0.95,
      "reason": "Best for daily dry skin hydration, lightweight"
    },
    {
      "product_id": "mixoil-almond-body-butter",
      "relevance_score": 0.90,
      "reason": "Intensive care for very dry skin"
    },
    {
      "product_id": "mixoil-coconut-body-cream",
      "relevance_score": 0.85,
      "reason": "Alternative rich cream option with coconut oil"
    }
  ],

  "follow_up_questions": {
    "ar": [
      "تحبي تعرفي سعر المنتجات دي؟",
      "عايزة تعرفي طريقة الاستخدام الصحيحة؟",
      "محتاجة توصيات لمنتجات تانية معاها (مثل السكراب)؟"
    ],
    "en": [
      "Would you like to know the prices?",
      "Want to know how to use it properly?",
      "Need recommendations for complementary products?"
    ]
  }
}
```

### 2.6 Exercice Pratique 2: Créer Votre Scénario

**À faire maintenant:**

1. Créez le fichier complet `config/test-scenario-dry-skin.json` en assemblant toutes les sections ci-dessus

2. Vérifiez la syntaxe JSON:
```bash
cd /c/Users/v-nbayonne/innatural-chatbot-project
cat config/test-scenario-dry-skin.json | python -m json.tool
```

3. Si pas d'erreur, votre JSON est valide! ✅

**Fichier complet disponible dans:** `BODY_SCENARIOS_EXAMPLES.json` (déjà créé)

---

## 🧪 Module 3: Tester et Optimiser

### 3.1 Intégrer le Scénario dans la KB

**Étape 1: Ouvrir la KB principale**

```bash
code config/INnatural_Chatbot_Knowledge_Base_v2.json
```

**Étape 2: Créer la nouvelle catégorie BODY_PRE_PURCHASE**

Allez à la fin du tableau `categories` (ligne ~780), juste avant le `]` de fermeture.

Ajoutez une virgule après la dernière catégorie, puis:

```json
,
{
  "category_id": "BODY_PRE_PURCHASE",
  "product_type": "body",
  "category_name": {
    "ar": "ما قبل الشراء - منتجات العناية بالبشرة",
    "en": "Pre-Purchase - Body Care Products"
  },
  "priority": 1,
  "description": {
    "ar": "أسئلة العملاء حول المنتجات المناسبة لنوع بشرتهم ومشاكلهم",
    "en": "Customer questions about suitable body care products"
  },
  "scenarios": [
    // Copier votre scénario DRY_SKIN_BODY ici
  ]
}
```

**Étape 3: Mettre à jour les métadonnées**

En haut du fichier (lignes 2-10):

```json
{
  "metadata": {
    "version": "2.1",                    // ← Changer de 2.0 à 2.1
    "last_updated": "2025-01-26",        // ← Date du jour
    "primary_language": "ar",
    "supported_languages": ["ar", "en"],
    "total_scenarios": 12,               // ← Était 11, maintenant 12
    "total_categories": 4,               // ← Était 3, maintenant 4
    "product_types": ["hair", "body"],   // ← NOUVEAU
    "description": "INnatural Chatbot Knowledge Base v2.1 - Hair & Body Care",
    "brand": "INnatural Stores"
  }
}
```

**Étape 4: Ajouter les synonymes Corps**

Dans la section `"synonyms"` → `"ar"` (ligne ~32):

```json
"synonyms": {
  "ar": {
    // Synonymes cheveux existants...
    "شعر جاف": ["شعر ناشف", ...],

    // NOUVEAUX - Synonymes corps
    "بشرة جافة": ["جلد جاف", "بشرة ناشفة", "بشرة تحتاج ترطيب", "جلد خشن"],
    "ترطيب البشرة": ["تنعيم البشرة", "ترطيب الجسم", "تغذية البشرة"],
    "كريم الجسم": ["لوشن", "مرطب الجسم", "body cream"],
    "زبدة الجسم": ["بودي بتر", "body butter", "كريم مركز"]
  },
  "en": {
    // Synonymes cheveux existants...

    // NOUVEAUX - Synonymes corps
    "dry skin": ["dehydrated skin", "rough skin", "flaky skin"],
    "moisturize": ["hydrate", "nourish", "soften"],
    "body cream": ["body lotion", "moisturizer"],
    "body butter": ["rich cream", "intensive moisturizer"]
  }
}
```

### 3.2 Sauvegarder et Valider

**Validation JSON:**

```bash
# Windows
python -c "import json; json.load(open('config/INnatural_Chatbot_Knowledge_Base_v2.json'))" && echo "✅ JSON valide!"

# Si erreur, elle s'affichera avec le numéro de ligne
```

### 3.3 Redémarrer le Backend

Le backend charge la KB au démarrage:

```bash
# Trouver le processus actuel
netstat -ano | findstr :5000

# Tuer le processus (remplacer PID par le numéro)
taskkill /PID <PID> /F

# Redémarrer
cd /c/Users/v-nbayonne/innatural-chatbot-project/backend
node server.js
```

**Vérifier les logs:**

```
✅ Knowledge Base v2.1 loaded
   Primary language: ar
   Total scenarios: 12          ← Devrait être 12 maintenant
```

### 3.4 Tester le Scénario

**Test 1: Via le Widget**

1. Ouvrir le widget dans le navigateur
2. Sélectionner catégorie "Body" (Corps)
3. Taper: "بشرتي جافة كتير"
4. Observer la réponse

**Test 2: Via curl (plus rapide)**

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "بشرتي جافة كتير",
    "sessionId": "test-123",
    "language": "ar"
  }'
```

**Résultat attendu:**
```json
{
  "success": true,
  "content": "أهلاً حبيبتي 💚 البشرة الجافة محتاجة ترطيب...",
  "products": [
    {
      "id": "cocoshea-body-cream",
      "name": { "ar": "كريم الجسم كوكوشيا", "en": "CocoShea Body Cream" }
    }
  ]
}
```

### 3.5 Analyser les Scores

Dans les logs du backend, vous devriez voir:

```
🔍 KB Search for: "بشرتي جافة كتير"
   Language: ar

📊 Scenario Matches:
   1. DRY_SKIN_BODY (score: 85)
      - Reason: Direct query match (50) + keywords (30) + priority boost (5)
   2. ... autres scénarios avec scores plus faibles

✅ Returning top 1 scenario
```

### 3.6 Optimiser si Nécessaire

**Si le score est trop bas (< 50):**

1. **Ajouter plus de user_queries** similaires
2. **Ajouter plus de keywords** variés
3. **Augmenter la priority** (max 10)
4. **Ajouter des synonymes** dans la section synonyms

**Si le scénario ne match pas du tout:**

1. Vérifier que `product_type: "body"` est bien défini
2. Vérifier les keywords en arabe (caractères UTF-8)
3. Tester avec une question plus simple: "جافة"

### 3.7 Exercice Pratique 3: Débugger un Scénario

**Problème:** Le scénario ne s'active pas pour "جلدي ناشف"

**À faire:**

1. Vérifier que "ناشف" est dans les keywords ✅
2. Tester avec curl la question exacte
3. Regarder les logs pour voir le score
4. Si score = 0, ajouter "جلدي ناشف" dans user_queries
5. Redémarrer et retester

---

## 🔧 Module 4: Implémenter le Filtrage par Catégorie

### 4.1 Comprendre le Besoin

**Problème actuel:**
- Quand utilisateur sélectionne "Corps", le bot cherche dans TOUTES les catégories (cheveux + corps)
- Résultats potentiellement non pertinents

**Solution:**
- Filtrer par `product_type` avant la recherche
- Chercher uniquement dans les catégories "body" quand utilisateur veut produits corps

### 4.2 Modifier searchKnowledgeBase()

**Fichier:** `backend/claudeService.js`

**Trouvez la fonction** (ligne ~38):

```javascript
searchKnowledgeBase(userMessage, language = 'ar') {
  // Code actuel...
}
```

**Remplacez par:**

```javascript
searchKnowledgeBase(userMessage, language = 'ar', productType = null) {
  if (!userMessage) return [];

  const messageLower = userMessage.toLowerCase();
  const normalizedQuery = synonymsHelper.normalizeQuery(userMessage, language);
  const normalizedLower = normalizedQuery.toLowerCase();
  const termsFound = synonymsHelper.findTermsInQuery(userMessage, language);
  const relevantScenarios = [];

  // ========== NOUVEAU: Filtrer les catégories par type ==========
  let categoriesToSearch = this.knowledgeBase.categories;

  if (productType) {
    console.log(`🔍 Filtering for product type: ${productType}`);

    categoriesToSearch = this.knowledgeBase.categories.filter(cat => {
      // Vérifier si la catégorie a un product_type défini
      if (cat.product_type) {
        return cat.product_type === productType;
      }

      // Pour compatibilité avec anciennes catégories sans product_type
      // On assume que category_id contenant "HAIR" = cheveux
      // et tout le reste = corps si productType === 'body'
      if (productType === 'hair') {
        return cat.category_id.includes('HAIR') ||
               !cat.category_id.includes('BODY');
      } else if (productType === 'body') {
        return cat.category_id.includes('BODY');
      }

      return true; // Inclure par défaut
    });

    console.log(`   → Searching in ${categoriesToSearch.length} ${productType} categories`);
  } else {
    console.log(`🔍 Searching in all categories (no filter)`);
  }
  // ==============================================================

  // Le reste du code continue normalement avec categoriesToSearch au lieu de this.knowledgeBase.categories
  for (const category of categoriesToSearch) {  // ← Changé ici
    for (const scenario of category.scenarios) {
      let score = 0;
      let matchReasons = [];

      // ... reste du code de scoring inchangé ...
    }
  }

  // ... reste de la fonction inchangée ...
  return relevantScenarios;
}
```

**💡 Explication:**
1. Nouveau paramètre `productType` (peut être 'hair', 'body', ou null)
2. Si `productType` fourni, on filtre les catégories avant la recherche
3. Compatibilité avec anciennes catégories (pas de product_type)
4. Logs pour débugger

### 4.3 Passer le productType depuis chat()

**Dans la même fonction `chat()` (ligne ~180):**

**Trouvez:**

```javascript
async chat(userMessage, sessionId, userProfile = {}) {
  const language = userProfile.language || this.detectLanguage(userMessage);

  try {
    // Rechercher dans la knowledge base
    const kbResults = this.searchKnowledgeBase(userMessage, language);
    // ...
  }
}
```

**Modifiez:**

```javascript
async chat(userMessage, sessionId, userProfile = {}) {
  const language = userProfile.language || this.detectLanguage(userMessage);

  // ========== NOUVEAU: Extraire le type de produit du profil ==========
  const productType = userProfile.productType || null;  // 'hair', 'body', ou null

  if (productType) {
    console.log(`💡 User context: ${productType} products`);
  }
  // ====================================================================

  try {
    // Rechercher dans la knowledge base AVEC filtre
    const kbResults = this.searchKnowledgeBase(
      userMessage,
      language,
      productType  // ← NOUVEAU paramètre
    );
    // ...
  }
}
```

### 4.4 Passer le Contexte depuis server.js

**Fichier:** `backend/server.js`

**Trouvez** le handler de chat (ligne ~520):

```javascript
// Handler pour /api/chat
app.post('/api/chat', async (req, res) => {
  const { message, sessionId, language } = req.body;

  // Guided flow
  const flowResult = guidedFlowManager.processMessage(message, sessionId);

  // ... code existant ...
});
```

**Ajoutez le mapping de catégorie:**

```javascript
// Handler pour /api/chat
app.post('/api/chat', async (req, res) => {
  const { message, sessionId, language } = req.body;

  // Guided flow
  const flowResult = guidedFlowManager.processMessage(message, sessionId);

  // ========== NOUVEAU: Gérer le contexte de catégorie ==========
  let userProfile = {
    language: language || 'ar',
    sessionId: sessionId
  };

  // Si l'utilisateur a sélectionné une catégorie
  if (flowResult.type === 'category_selected') {
    const categoryMapping = {
      'corps': 'body',
      'cheveux': 'hair'
    };

    userProfile.productType = categoryMapping[flowResult.category.id] || null;

    console.log(`📂 Category selected: ${flowResult.category.id} → productType: ${userProfile.productType}`);
  }

  // Si subcategory_selected, on garde le context
  if (flowResult.type === 'subcategory_selected') {
    // Le productType est déjà dans la session, le récupérer
    const state = guidedFlowManager.getStateInfo(sessionId);
    const categoryMapping = {
      'corps': 'body',
      'cheveux': 'hair'
    };
    userProfile.productType = categoryMapping[state.selectedCategory] || null;
  }
  // =============================================================

  // Appeler le chatbot AVEC le contexte
  const response = await claudeService.chat(message, sessionId, userProfile);

  // ... reste du code ...
});
```

### 4.5 Tester le Filtrage

**Test 1: Sans catégorie sélectionnée**

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "بشرتي جافة",
    "sessionId": "test-no-category"
  }'
```

**Logs attendus:**
```
🔍 Searching in all categories (no filter)
   → Found scenarios from both HAIR and BODY categories
```

**Test 2: Avec catégorie Corps**

1. Démarrer nouvelle session
2. Sélectionner "Corps" dans le widget
3. Poser question: "بشرتي جافة"

**Logs attendus:**
```
📂 Category selected: corps → productType: body
🔍 Filtering for product type: body
   → Searching in 1 body categories
   → Found scenario: DRY_SKIN_BODY
```

### 4.6 Exercice Pratique 4: Implémenter le Filtrage

**À faire:**

1. ✅ Modifier `claudeService.js` (fonction searchKnowledgeBase)
2. ✅ Modifier `claudeService.js` (fonction chat)
3. ✅ Modifier `server.js` (handler POST /api/chat)
4. ✅ Redémarrer le backend
5. ✅ Tester avec et sans catégorie
6. ✅ Vérifier les logs

**Vérification:**

```bash
# Démarrer le backend
cd /c/Users/v-nbayonne/innatural-chatbot-project/backend
node server.js

# Dans un autre terminal, tester
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "بشرتي جافة",
    "sessionId": "test-filter-123"
  }'

# Observer les logs pour voir si le filtrage fonctionne
```

---

## 🚀 Module 5: Maintenance et Évolution

### 5.1 Ajouter de Nouveaux Scénarios

**Process standardisé:**

1. **Identifier le besoin**
   - Question fréquente non couverte
   - Nouveau produit lancé
   - Feedback client

2. **Créer le scénario** (copier template depuis BODY_SCENARIOS_EXAMPLES.json)
   - Modifier scenario_id
   - Adapter keywords, user_queries, responses
   - Lier aux bons produits

3. **Tester isolément**
   - Créer fichier temporaire
   - Valider JSON
   - Tester les questions

4. **Intégrer dans la KB**
   - Ajouter dans la bonne catégorie
   - Mettre à jour metadata.total_scenarios
   - Sauvegarder

5. **Redémarrer et valider**
   - Restart backend
   - Tester en conditions réelles
   - Monitorer les scores

### 5.2 Optimiser les Scénarios Existants

**Métriques à suivre:**

```javascript
// Dans chaque scénario
"usage_count": 0,  // Combien de fois activé
"last_triggered": null,  // Dernière activation
"avg_score": 0  // Score moyen
```

**Comment optimiser:**

1. **Scénario jamais utilisé (usage_count = 0)**
   - Keywords trop spécifiques?
   - User_queries pas assez variées?
   - Priority trop faible?

   → Ajouter plus de variantes

2. **Scénario souvent activé mais score faible**
   - Ajouter dans user_queries les questions réelles
   - Enrichir les keywords
   - Améliorer les synonymes

3. **Scénario mal classé (pas dans top 3)**
   - Augmenter la priority
   - Ajouter plus de tags pertinents
   - Vérifier la concurrence avec autres scénarios

### 5.3 Gérer les Conflits

**Problème:** Deux scénarios matchent la même question

**Exemple:**
- "كريم للبشرة" → Match DRY_SKIN_BODY et SENSITIVE_SKIN_BODY

**Solutions:**

1. **Affiner les keywords**
   - DRY_SKIN: "جافة", "ناشفة", "جفاف"
   - SENSITIVE_SKIN: "حساسة", "تهيج", "حساسية"

2. **Ajuster les priorities**
   - Plus fréquent = priority plus haute
   - DRY_SKIN: 10 (très fréquent)
   - SENSITIVE_SKIN: 8 (moins fréquent)

3. **Utiliser escalation_triggers**
   ```json
   {
     "escalation_triggers": {
       "keywords": ["حساسية", "allergie", "réaction"],
       "action": "require_clarification",
       "message": {
         "ar": "عندك حساسية من مكونات معينة؟",
         "en": "Do you have allergies to specific ingredients?"
       }
     }
   }
   ```

### 5.4 Ajouter des Analytics

**Créer un fichier:** `backend/kb-analytics.js`

```javascript
class KBAnalytics {
  constructor() {
    this.scenarioStats = new Map();
  }

  logMatch(scenarioId, score, query, language) {
    if (!this.scenarioStats.has(scenarioId)) {
      this.scenarioStats.set(scenarioId, {
        usageCount: 0,
        totalScore: 0,
        queries: [],
        languages: { ar: 0, en: 0 }
      });
    }

    const stats = this.scenarioStats.get(scenarioId);
    stats.usageCount++;
    stats.totalScore += score;
    stats.queries.push({ query, score, timestamp: new Date() });
    stats.languages[language]++;
  }

  getTopScenarios(limit = 10) {
    return Array.from(this.scenarioStats.entries())
      .map(([id, stats]) => ({
        scenarioId: id,
        usageCount: stats.usageCount,
        avgScore: stats.totalScore / stats.usageCount,
        topQueries: stats.queries
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  getUnusedScenarios(allScenarioIds) {
    return allScenarioIds.filter(id => !this.scenarioStats.has(id));
  }

  exportReport() {
    return {
      timestamp: new Date().toISOString(),
      totalSearches: Array.from(this.scenarioStats.values())
        .reduce((sum, stat) => sum + stat.usageCount, 0),
      topScenarios: this.getTopScenarios(),
      languageDistribution: this.getLanguageDistribution(),
      avgScores: this.getAvgScores()
    };
  }

  // ... autres méthodes utiles
}

module.exports = new KBAnalytics();
```

**Intégrer dans claudeService.js:**

```javascript
const kbAnalytics = require('./kb-analytics');

searchKnowledgeBase(userMessage, language = 'ar', productType = null) {
  // ... code de recherche ...

  // Logger les matches
  for (const scenario of relevantScenarios) {
    kbAnalytics.logMatch(
      scenario.scenario_id,
      scenario.score,
      userMessage,
      language
    );
  }

  return relevantScenarios;
}
```

**Créer endpoint analytics:**

```javascript
// Dans server.js
app.get('/api/kb/analytics', (req, res) => {
  const report = kbAnalytics.exportReport();
  res.json(report);
});
```

### 5.5 Checklist de Maintenance Mensuelle

**À faire chaque mois:**

- [ ] Exporter le rapport analytics: `GET /api/kb/analytics`
- [ ] Identifier scénarios jamais utilisés (usage_count = 0)
- [ ] Analyser les top 10 questions les plus fréquentes
- [ ] Vérifier si nouveaux synonymes à ajouter
- [ ] Mettre à jour les réponses avec infos produits récentes
- [ ] Tester les scénarios critiques (priority >= 9)
- [ ] Backup de la KB: `cp config/INnatural_Chatbot_Knowledge_Base_v2.json config/backups/kb-$(date +%Y%m%d).json`
- [ ] Incrémenter version dans metadata

### 5.6 Exercice Final: Plan d'Action Personnel

**Créez votre roadmap:**

1. **Cette semaine:**
   - [ ] Ajouter 3 scénarios Corps (dry skin, exfoliation, hand care)
   - [ ] Tester tous les scénarios
   - [ ] Valider les scores

2. **Semaine prochaine:**
   - [ ] Implémenter le filtrage complet
   - [ ] Ajouter les 6 scénarios restants
   - [ ] Setup analytics basiques

3. **Semaine 3:**
   - [ ] Analyser les premiers résultats
   - [ ] Optimiser les scénarios faibles
   - [ ] Former l'équipe support

---

## 📖 Ressources et Référence Rapide

### Commandes Utiles

```bash
# Valider JSON
python -m json.tool < config/INnatural_Chatbot_Knowledge_Base_v2.json > /dev/null

# Compter les scénarios
grep -c '"scenario_id"' config/INnatural_Chatbot_Knowledge_Base_v2.json

# Trouver un scénario par ID
grep -A 50 '"scenario_id": "DRY_SKIN_BODY"' config/INnatural_Chatbot_Knowledge_Base_v2.json

# Backup avant modification
cp config/INnatural_Chatbot_Knowledge_Base_v2.json config/kb-backup-$(date +%Y%m%d).json

# Redémarrer backend
cd /c/Users/v-nbayonne/innatural-chatbot-project/backend && node server.js
```

### Structure d'un Scénario (Template)

```json
{
  "scenario_id": "UNIQUE_ID",
  "priority": 10,
  "usage_count": 0,
  "metadata": {
    "intent": "product_recommendation",
    "concerns": ["concern1", "concern2"],
    "recommended_products": ["product-id-1"],
    "product_type": "body",
    "confidence_threshold": 0.7
  },
  "tags": {
    "ar": ["tag1", "tag2"],
    "en": ["tag1", "tag2"]
  },
  "keywords": {
    "ar": ["keyword1", "keyword2"],
    "en": ["keyword1", "keyword2"]
  },
  "user_queries": {
    "ar": ["question1", "question2"],
    "en": ["question1", "question2"]
  },
  "responses": [
    {
      "response_type": "detailed",
      "language": "ar",
      "text": "Response text..."
    }
  ],
  "related_products": [
    {
      "product_id": "product-id",
      "relevance_score": 0.95,
      "reason": "Why recommended"
    }
  ],
  "follow_up_questions": {
    "ar": ["question1?"],
    "en": ["question1?"]
  }
}
```

### Scoring Reference

| Élément | Points | Quand? |
|---------|--------|--------|
| user_queries exact match | 50 | Question exacte trouvée |
| keywords match | 30 | Mot-clé trouvé |
| tags match | 20 | Tag trouvé |
| synonyms match | 10 | Synonyme détecté |
| Priority boost | priority | Multiplié à la fin |

**Formule finale:**
```
Final Score = (Base Score) * (priority / 10)
```

### Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `config/INnatural_Chatbot_Knowledge_Base_v2.json` | Knowledge Base principale |
| `config/bot-personality.json` | Guided flow et catégories |
| `config/products.json` | Catalogue produits |
| `backend/claudeService.js` | Logique de recherche KB |
| `backend/server.js` | Routes et handlers |
| `backend/guided-flow-manager.js` | Gestion du flow |

---

## 🎓 Certificat de Compétence

Une fois que vous avez complété:

- ✅ Module 1: Comprendre l'architecture
- ✅ Module 2: Créer votre premier scénario
- ✅ Module 3: Tester et optimiser
- ✅ Module 4: Implémenter le filtrage
- ✅ Module 5: Plan de maintenance

**Vous maîtrisez:**
- Architecture Knowledge Base modulaire
- Création et optimisation de scénarios
- Système de scoring et matching
- Filtrage contextuel
- Maintenance et évolution de la KB

---

## 💬 Questions Fréquentes

**Q: Combien de scénarios dois-je créer?**
R: Minimum 3-5 par catégorie. Commencez par les questions les plus fréquentes.

**Q: Comment savoir si mon scénario est bon?**
R: Si usage_count > 0 et avgScore > 70 après 1 semaine.

**Q: Le bot répond mal, que faire?**
R: 1) Vérifier les logs, 2) Voir quel scénario a matché, 3) Ajuster keywords/priority.

**Q: Puis-je supprimer un scénario?**
R: Oui, mais archivez-le d'abord (copier dans un fichier backup).

**Q: Comment gérer 2 langues?**
R: Créez toutes les sections en AR et EN. Le système choisit automatiquement.

---

**Prêt à commencer? Par quel module voulez-vous débuter?**

1. Module 1: Explorer la KB actuelle
2. Module 2: Créer votre premier scénario
3. Module 4: Implémenter le filtrage immédiatement

**Ou avez-vous des questions avant de commencer?** 🚀
