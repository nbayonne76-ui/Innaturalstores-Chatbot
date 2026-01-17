# Guide d'Implémentation: Knowledge Base Modulaire pour Produits Corps et Cheveux

## 🎯 Objectif
Optimiser l'expérience client en permettant au bot d'anticiper et de répondre efficacement aux questions sur les produits selon leur catégorie (Corps ou Cheveux).

## 📋 Table des Matières
1. [Architecture Recommandée](#architecture)
2. [Structure de la Knowledge Base](#structure)
3. [Étapes d'Implémentation](#implementation)
4. [Exemples Concrets](#exemples)
5. [Optimisations Performance](#performance)

---

## 🏗️ Architecture Recommandée {#architecture}

### Option Choisie: Knowledge Base Modulaire Unifiée

```
INnatural_Chatbot_Knowledge_Base_v2.json
│
├── metadata
├── config
├── synonyms (ar/en)
├── categories
│   ├── HAIR_PRE_PURCHASE
│   │   └── scenarios (recommandations cheveux)
│   ├── HAIR_INGREDIENTS
│   │   └── scenarios (ingrédients cheveux)
│   ├── HAIR_USAGE
│   │   └── scenarios (utilisation cheveux)
│   ├── BODY_PRE_PURCHASE  ← NOUVEAU
│   │   └── scenarios (recommandations corps)
│   ├── BODY_INGREDIENTS   ← NOUVEAU
│   │   └── scenarios (ingrédients corps)
│   └── BODY_USAGE         ← NOUVEAU
│       └── scenarios (utilisation corps)
```

### Avantages de cette Architecture

✅ **Performance**
- Un seul fichier chargé en mémoire
- Recherche unifiée avec filtrage rapide
- Pas de duplication de code

✅ **Maintenabilité**
- Structure cohérente
- Ajout facile de nouvelles catégories
- Gestion centralisée

✅ **Intégration**
- Utilise le guided flow existant
- Modifications minimales du code
- Compatible avec le système actuel

---

## 📊 Structure de la Knowledge Base {#structure}

### 1. Métadonnées Mises à Jour

```json
{
  "metadata": {
    "version": "3.0",
    "last_updated": "2025-01-26",
    "primary_language": "ar",
    "supported_languages": ["ar", "en"],
    "total_scenarios": 22,        ← Augmenté (11 hair + 11 body)
    "total_categories": 6,         ← Augmenté (3 hair + 3 body)
    "product_types": ["hair", "body"],
    "description": "INnatural Chatbot Knowledge Base v3.0 - Hair & Body Care",
    "brand": "INnatural Stores"
  }
}
```

### 2. Nouveaux Synonymes pour Produits Corps

```json
{
  "synonyms": {
    "ar": {
      // Cheveux (existant)
      "شعر جاف": [...],

      // Corps (NOUVEAU)
      "بشرة جافة": ["جلد جاف", "بشرة ناشفة", "بشرة تحتاج ترطيب", "جلد خشن"],
      "بشرة دهنية": ["جلد دهني", "بشرة زيتية", "بشرة تلمع"],
      "ترطيب البشرة": ["تنعيم البشرة", "ترطيب الجسم", "تغذية البشرة"],
      "تقشير": ["سكراب", "تنظيف عميق", "إزالة الجلد الميت"],
      "كريم الجسم": ["لوشن", "مرطب الجسم", "body cream"],
      "زبدة الجسم": ["بودي بتر", "body butter", "كريم مركز"],
      "كريم اليدين": ["hand cream", "مرطب اليدين", "كريم اليد"],
      "بشرة حساسة": ["جلد حساس", "بشرة رقيقة", "تهيج البشرة"]
    },
    "en": {
      // Cheveux (existant)
      "dry hair": [...],

      // Corps (NOUVEAU)
      "dry skin": ["dehydrated skin", "rough skin", "flaky skin"],
      "oily skin": ["greasy skin", "shiny skin"],
      "moisturize": ["hydrate", "nourish", "soften"],
      "exfoliate": ["scrub", "polish", "buff"],
      "body cream": ["body lotion", "moisturizer"],
      "body butter": ["rich cream", "intensive moisturizer"],
      "hand cream": ["hand lotion", "hand moisturizer"],
      "sensitive skin": ["delicate skin", "irritated skin"]
    }
  }
}
```

### 3. Nouvelles Catégories Corps

#### Catégorie: BODY_PRE_PURCHASE

```json
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
    {
      "scenario_id": "DRY_SKIN_MOISTURIZATION",
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
      },
      "tags": {
        "ar": ["بشرة جافة", "ترطيب", "نعومة", "كريم الجسم", "زبدة الجسم"],
        "en": ["dry skin", "moisturize", "hydration", "body cream", "body butter"]
      },
      "keywords": {
        "ar": ["جافة", "ناشفة", "خشنة", "ترطيب", "تنعيم"],
        "en": ["dry", "dehydrated", "rough", "moisturize", "hydrate"]
      },
      "user_queries": {
        "ar": [
          "بشرتي جافة كتير",
          "عندي جفاف في الجلد",
          "بشرتي خشنة ومحتاجة ترطيب",
          "عايزة كريم يرطب بشرتي",
          "جلدي ناشف قوي"
        ],
        "en": [
          "I have dry skin",
          "my skin is very dry",
          "need moisturizer",
          "skin feels rough"
        ]
      },
      "responses": [
        {
          "response_type": "detailed",
          "language": "ar",
          "text": "أهلاً حبيبتي 💚 البشرة الجافة محتاجة ترطيب عميق ومكثف!\n\nأنصحك بـ **كريم الجسم CocoShea** - الحل المثالي للبشرة الجافة:\n✨ يرطب البشرة الجافة بفعالية\n✨ تركيبة خفيفة تمتص بسرعة\n✨ غني بزبدة الشيا وزيت جوز الهند\n✨ مناسب للاستخدام اليومي\n\nأو إذا كنتي محتاجة ترطيب أعمق:\n**زبدة الجسم MixOil باللوز** - تركيبة مركزة:\n✨ ترطيب مكثف للبشرة الجافة جداً\n✨ تنعيم فوري للمناطق الخشنة\n✨ تحافظ على الرطوبة طوال اليوم\n\n💡 استخدميها بعد الاستحمام مباشرة على البشرة الرطبة للحصول على أفضل نتائج!\n\nتحبي تعرفي أكتر عن أي منتج؟ 🛍️"
        },
        {
          "response_type": "detailed",
          "language": "en",
          "text": "Hello dear 💚 Dry skin needs deep and intensive hydration!\n\nI recommend **CocoShea Body Cream** - perfect for dry skin:\n✨ Effectively moisturizes dry skin\n✨ Lightweight formula absorbs quickly\n✨ Enriched with shea butter and coconut oil\n✨ Suitable for daily use\n\nOr if you need deeper hydration:\n**MixOil Almond Body Butter** - concentrated formula:\n✨ Intensive hydration for very dry skin\n✨ Instant smoothing of rough areas\n✨ Maintains moisture all day\n\n💡 Apply right after shower on damp skin for best results!\n\nWould you like to know more? 🛍️"
        },
        {
          "response_type": "brief",
          "language": "ar",
          "text": "حبيبتي، للبشرة الجافة أنصحك بكريم CocoShea 💚 خفيف وبيرطب بعمق! أو زبدة الجسم MixOil للترطيب المكثف. عايزة تفاصيل؟"
        },
        {
          "response_type": "consultative",
          "language": "ar",
          "text": "أهلاً يا قمر 💕\n\nخليني أساعدك نختار المنتج الأنسب:\n\n❓ الجفاف عندك:\n• في كل الجسم؟\n• في مناطق معينة (كوع، ركب)؟\n• طول السنة ولا في الشتاء بس؟\n\n❓ تفضلي:\n• كريم خفيف يمتص بسرعة؟\n• زبدة مركزة للترطيب العميق؟\n\nعلشان أرشحلك المنتج المناسب بالظبط 🎯"
        }
      ],
      "follow_up_questions": {
        "ar": [
          "تحبي تعرفي سعر المنتجات دي؟",
          "عايزة تعرفي طريقة الاستخدام الصحيحة؟",
          "محتاجة توصيات لمنتجات تانية معاها؟"
        ],
        "en": [
          "Would you like to know the prices?",
          "Want to know how to use it properly?",
          "Need recommendations for complementary products?"
        ]
      },
      "related_products": [
        {
          "product_id": "cocoshea-body-cream",
          "relevance_score": 0.95,
          "reason": "Best for daily dry skin hydration"
        },
        {
          "product_id": "mixoil-almond-body-butter",
          "relevance_score": 0.90,
          "reason": "Intensive care for very dry skin"
        },
        {
          "product_id": "mixoil-coconut-body-cream",
          "relevance_score": 0.85,
          "reason": "Alternative rich cream option"
        }
      ]
    }
  ]
}
```

---

## 🔧 Étapes d'Implémentation {#implementation}

### Étape 1: Étendre la Knowledge Base (2-3 heures)

**Fichier à modifier:** `config/INnatural_Chatbot_Knowledge_Base_v2.json`

**Actions:**
1. Mettre à jour les métadonnées (version 3.0)
2. Ajouter les synonymes pour produits Corps
3. Créer 3 nouvelles catégories:
   - `BODY_PRE_PURCHASE`
   - `BODY_INGREDIENTS`
   - `BODY_USAGE`
4. Créer au minimum 11 scénarios Corps (miroir des 11 scénarios Cheveux)

**Scénarios Corps à créer:**
- Peau sèche → Recommander body cream/butter
- Exfoliation → Recommander body scrub
- Mains sèches → Recommander hand cream
- Peau sensible → Recommander produits doux
- Routine complète → Bundle corps
- Ingrédients naturels → Composition produits
- Allergies → Ingrédients à éviter
- Fréquence utilisation → Instructions
- Application correcte → Mode d'emploi
- Résultats attendus → Timeline
- Stockage produits → Conservation

### Étape 2: Modifier le Service de Recherche (1 heure)

**Fichier à modifier:** `backend/claudeService.js`

**Modification 1: Ajouter le filtre de catégorie**

```javascript
// Ligne 38 - Modifier searchKnowledgeBase pour accepter productType
searchKnowledgeBase(userMessage, language = 'ar', productType = null) {
  if (!userMessage) return [];

  const messageLower = userMessage.toLowerCase();
  const normalizedQuery = synonymsHelper.normalizeQuery(userMessage, language);
  const normalizedLower = normalizedQuery.toLowerCase();
  const termsFound = synonymsHelper.findTermsInQuery(userMessage, language);
  const relevantScenarios = [];

  // Filtrer les catégories selon le type de produit
  let categoriesToSearch = this.knowledgeBase.categories;

  if (productType) {
    // Filtrer seulement les catégories du type demandé (hair ou body)
    categoriesToSearch = this.knowledgeBase.categories.filter(cat => {
      // Vérifier si la catégorie a un product_type défini
      if (cat.product_type) {
        return cat.product_type === productType;
      }
      // Pour compatibilité avec anciennes catégories sans product_type
      // On assume que si category_id contient "HAIR" c'est cheveux
      // et tout le reste est pour le corps si productType === 'body'
      if (productType === 'hair') {
        return cat.category_id.includes('HAIR') ||
               !cat.category_id.includes('BODY');
      } else {
        return cat.category_id.includes('BODY');
      }
    });

    console.log(`🔍 Searching ${categoriesToSearch.length} ${productType} categories`);
  }

  // Continuer avec la recherche normale sur les catégories filtrées
  for (const category of categoriesToSearch) {
    for (const scenario of category.scenarios) {
      // ... reste du code de scoring inchangé
    }
  }

  // ... reste de la fonction inchangée
}
```

**Modification 2: Passer le productType depuis le chat**

```javascript
// Ligne ~180 - Dans la fonction chat(), modifier l'appel à searchKnowledgeBase
async chat(userMessage, sessionId, userProfile = {}) {
  const language = userProfile.language || this.detectLanguage(userMessage);

  // NOUVEAU: Détecter le type de produit depuis le contexte utilisateur
  const productType = userProfile.selectedCategory || null; // 'hair', 'body', ou null

  try {
    // Rechercher dans la knowledge base avec filtre de type
    const kbResults = this.searchKnowledgeBase(
      userMessage,
      language,
      productType  // ← NOUVEAU paramètre
    );

    // ... reste inchangé
  }
}
```

### Étape 3: Intégrer avec le Guided Flow (30 min)

**Fichier à modifier:** `backend/server.js`

**Modification: Passer le contexte de catégorie**

```javascript
// Ligne ~525 - Dans le handler du chat SSE
// Après détection de la catégorie par le guided flow

if (flowResult.type === 'category_selected') {
  // Stocker la catégorie sélectionnée dans le profil utilisateur
  userProfile.selectedCategory = flowResult.category.id; // 'corps' ou 'cheveux'

  // Mapper les IDs français vers les types anglais pour la KB
  const categoryMapping = {
    'corps': 'body',
    'cheveux': 'hair'
  };

  userProfile.productType = categoryMapping[flowResult.category.id] || null;
}

// Plus tard, lors de l'appel au chatbot
const response = await claudeService.chat(message, sessionId, {
  language: userLanguage,
  sessionId: sessionId,
  selectedCategory: userProfile.selectedCategory,
  productType: userProfile.productType  // ← Passer le type de produit
});
```

### Étape 4: Tester et Valider (1 heure)

**Tests à effectuer:**

1. **Test Cheveux**
   - Sélectionner catégorie "Cheveux"
   - Poser question: "شعري بيقع كتير"
   - Vérifier que le bot répond avec produits cheveux uniquement

2. **Test Corps**
   - Sélectionner catégorie "Corps"
   - Poser question: "بشرتي جافة"
   - Vérifier que le bot répond avec produits corps uniquement

3. **Test Sans Catégorie**
   - Ne pas sélectionner de catégorie
   - Poser question générale
   - Vérifier que le bot cherche dans toutes les catégories

4. **Test Changement de Catégorie**
   - Démarrer avec "Cheveux"
   - Revenir au menu
   - Sélectionner "Corps"
   - Vérifier que le contexte change correctement

---

## 📝 Exemples Concrets {#exemples}

### Exemple 1: Scénario BODY_EXFOLIATION

```json
{
  "scenario_id": "BODY_EXFOLIATION",
  "priority": 9,
  "usage_count": 0,
  "metadata": {
    "intent": "product_recommendation",
    "skin_concerns": ["dead_skin", "rough_skin", "dullness"],
    "recommended_products": [
      "cocoshea-body-scrub",
      "mixoil-coconut-body-scrub",
      "mixoil-almond-body-scrub"
    ],
    "product_type": "body",
    "confidence_threshold": 0.7
  },
  "tags": {
    "ar": ["تقشير", "سكراب", "جلد ميت", "نعومة", "تجديد البشرة"],
    "en": ["exfoliation", "scrub", "dead skin", "smoothing", "skin renewal"]
  },
  "keywords": {
    "ar": ["تقشير", "سكراب", "جلد ميت", "خشونة", "تنظيف عميق"],
    "en": ["exfoliate", "scrub", "dead skin", "rough", "deep clean"]
  },
  "user_queries": {
    "ar": [
      "عايزة حاجة للتقشير",
      "محتاجة سكراب للجسم",
      "جلدي خشن ومحتاج تنظيف عميق",
      "عايزة أشيل الجلد الميت"
    ],
    "en": [
      "need body scrub",
      "want to exfoliate",
      "remove dead skin",
      "rough skin needs smoothing"
    ]
  },
  "responses": [
    {
      "response_type": "detailed",
      "language": "ar",
      "text": "أهلاً حبيبتي 💚 التقشير مهم جداً لبشرة ناعمة ومشرقة!\n\nعندنا 3 أنواع سكراب مميزة:\n\n1. **سكراب CocoShea** - الأفضل مبيعاً:\n✨ تقشير فعال مع ترطيب عميق\n✨ خليط مثالي من زيت جوز الهند وزبدة الشيا\n✨ آمن لكل أنواع البشرة\n\n2. **سكراب MixOil بجوز الهند**:\n✨ تقشير لطيف للبشرة الحساسة\n✨ ينعم ويرطب في نفس الوقت\n\n3. **سكراب MixOil باللوز**:\n✨ تقشير عميق للمناطق الخشنة (كوع، ركب)\n✨ يجدد خلايا البشرة\n\n💡 استخدميه 2-3 مرات أسبوعياً للحصول على بشرة ناعمة كالحرير!\n\nأي نوع يناسبك أكتر؟ 🛍️"
    },
    {
      "response_type": "brief",
      "language": "ar",
      "text": "للتقشير عندنا 3 أنواع سكراب رائعة 💚 CocoShea (الأشهر)، MixOil جوز الهند (لطيف)، أو MixOil لوز (عميق). تحبي تعرفي أكتر؟"
    }
  ],
  "follow_up_questions": {
    "ar": [
      "تحبي تعرفي الفرق بين الأنواع الثلاثة؟",
      "محتاجة نصائح لطريقة الاستخدام الصحيحة؟",
      "عايزة تعرفي السعر؟"
    ]
  },
  "related_products": [
    {
      "product_id": "cocoshea-body-scrub",
      "relevance_score": 0.95,
      "reason": "Best seller, suitable for all skin types"
    },
    {
      "product_id": "mixoil-coconut-body-scrub",
      "relevance_score": 0.85,
      "reason": "Gentle exfoliation for sensitive skin"
    },
    {
      "product_id": "mixoil-almond-body-scrub",
      "relevance_score": 0.85,
      "reason": "Deep exfoliation for rough areas"
    }
  ]
}
```

### Exemple 2: Scénario BODY_INGREDIENTS

```json
{
  "scenario_id": "COCONUT_OIL_BENEFITS_BODY",
  "priority": 7,
  "usage_count": 0,
  "metadata": {
    "intent": "ingredient_information",
    "ingredient_focus": "coconut_oil",
    "product_type": "body",
    "confidence_threshold": 0.6
  },
  "tags": {
    "ar": ["زيت جوز الهند", "مكونات", "فوائد", "طبيعي"],
    "en": ["coconut oil", "ingredients", "benefits", "natural"]
  },
  "user_queries": {
    "ar": [
      "إيه فوائد زيت جوز الهند للبشرة؟",
      "زيت جوز الهند كويس للجسم؟",
      "منتجاتكم فيها إيه من المكونات؟"
    ],
    "en": [
      "what are coconut oil benefits for skin?",
      "is coconut oil good for body?",
      "what ingredients in your products?"
    ]
  },
  "responses": [
    {
      "response_type": "detailed",
      "language": "ar",
      "text": "زيت جوز الهند من أفضل المكونات الطبيعية للبشرة! 💚\n\n✨ **فوائده:**\n• ترطيب عميق وطويل الأمد\n• مضاد للبكتيريا والالتهابات\n• غني بفيتامين E المغذي\n• يمتص بسرعة دون ترك أثر دهني\n• مناسب للبشرة الحساسة\n\nموجود في:\n🧴 كريم CocoShea Body Cream\n🧴 سكراب MixOil Coconut Scrub\n🧴 زبدة MixOil Coconut Body Butter\n\nكل منتجاتنا طبيعية 100% ومصنوعة بعناية فائقة! تحبي تعرفي أكتر عن أي منتج؟"
    }
  ]
}
```

---

## ⚡ Optimisations Performance {#performance}

### 1. Cache des Résultats de Recherche

```javascript
class ClaudeService {
  constructor(apiKey) {
    // ... existing code
    this.searchCache = new Map(); // Cache pour les recherches
    this.cacheMaxSize = 100;
    this.cacheTTL = 3600000; // 1 heure en ms
  }

  searchKnowledgeBase(userMessage, language = 'ar', productType = null) {
    // Créer une clé de cache unique
    const cacheKey = `${userMessage}-${language}-${productType || 'all'}`;

    // Vérifier le cache
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        console.log('✅ Cache hit for KB search');
        return cached.results;
      }
    }

    // Effectuer la recherche normale
    const results = /* ... code de recherche existant ... */;

    // Stocker dans le cache
    this.searchCache.set(cacheKey, {
      results: results,
      timestamp: Date.now()
    });

    // Limiter la taille du cache
    if (this.searchCache.size > this.cacheMaxSize) {
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }

    return results;
  }
}
```

### 2. Index de Recherche Pré-calculé

```javascript
class ClaudeService {
  constructor(apiKey) {
    // ... existing code
    this.buildSearchIndex();
  }

  buildSearchIndex() {
    console.log('🔨 Building search index...');
    this.searchIndex = {
      hair: { scenarios: [], keywords: new Set() },
      body: { scenarios: [], keywords: new Set() }
    };

    for (const category of this.knowledgeBase.categories) {
      const productType = category.product_type ||
        (category.category_id.includes('BODY') ? 'body' : 'hair');

      for (const scenario of category.scenarios) {
        this.searchIndex[productType].scenarios.push({
          id: scenario.scenario_id,
          category: category.category_id,
          keywords: [
            ...scenario.keywords.ar,
            ...scenario.keywords.en,
            ...scenario.tags.ar,
            ...scenario.tags.en
          ]
        });

        // Ajouter tous les mots-clés à l'index
        scenario.keywords.ar.forEach(k =>
          this.searchIndex[productType].keywords.add(k.toLowerCase())
        );
        scenario.keywords.en.forEach(k =>
          this.searchIndex[productType].keywords.add(k.toLowerCase())
        );
      }
    }

    console.log(`✅ Index built: ${this.searchIndex.hair.scenarios.length} hair scenarios, ${this.searchIndex.body.scenarios.length} body scenarios`);
  }
}
```

### 3. Métriques de Performance

```javascript
searchKnowledgeBase(userMessage, language = 'ar', productType = null) {
  const startTime = Date.now();

  // ... recherche normale ...

  const duration = Date.now() - startTime;
  console.log(`⏱️ KB search completed in ${duration}ms (${productType || 'all'} categories)`);

  // Logger pour analytics
  if (this.config.enable_analytics) {
    this.logSearchMetrics({
      query: userMessage,
      language: language,
      productType: productType,
      duration: duration,
      resultsCount: relevantScenarios.length,
      timestamp: new Date().toISOString()
    });
  }

  return relevantScenarios;
}
```

---

## 📊 Métriques de Succès

### KPIs à Suivre

1. **Précision des Réponses**
   - % de réponses pertinentes (score > 0.7)
   - % de questions routées vers la bonne catégorie

2. **Performance**
   - Temps de recherche moyen (cible: < 50ms)
   - Utilisation du cache (cible: > 40%)

3. **Engagement Utilisateur**
   - Taux de questions follow-up
   - Taux de conversion (question → achat)

4. **Couverture**
   - % de questions trouvant une réponse dans la KB
   - Identification des gaps dans la KB

---

## 🚀 Prochaines Étapes

### Phase 1: Implémentation de Base (Cette Semaine)
- ✅ Créer la structure KB pour produits Corps
- ✅ Modifier le service de recherche
- ✅ Intégrer avec le guided flow
- ✅ Tests de base

### Phase 2: Enrichissement (Semaine Prochaine)
- 📝 Ajouter plus de scénarios Corps
- 📝 Affiner les réponses basées sur feedback
- 📝 Optimiser les synonymes
- 📝 Ajouter analytics détaillées

### Phase 3: Optimisation (Semaine 3)
- ⚡ Implémenter le cache
- ⚡ Construire l'index de recherche
- ⚡ Tests de performance
- ⚡ Fine-tuning des scores de pertinence

---

## 💡 Recommandations Additionnelles

### 1. Gestion des Questions Mixtes

Parfois les utilisateurs peuvent poser des questions qui concernent à la fois cheveux ET corps:

```javascript
// Dans searchKnowledgeBase
if (!productType && isAmbiguousQuery(userMessage)) {
  // Demander clarification à l'utilisateur
  return [{
    type: 'clarification_needed',
    message: {
      ar: 'حبيبتي، السؤال ده ممكن يكون عن الشعر أو البشرة. تقصدي إيه بالظبط؟ 😊',
      en: 'Dear, this could be about hair or skin. Which one do you mean? 😊'
    },
    options: [
      { id: 'hair', label: { ar: 'الشعر', en: 'Hair' } },
      { id: 'body', label: { ar: 'البشرة', en: 'Skin/Body' } }
    ]
  }];
}
```

### 2. Apprentissage Continu

Loggez toutes les recherches pour identifier:
- Questions fréquentes non couvertes
- Nouveaux synonymes à ajouter
- Scénarios à créer

### 3. A/B Testing

Testez différentes versions de réponses:
- Brief vs Detailed
- Avec/sans emojis
- Différents niveaux de formalité

---

## 📞 Support & Questions

Si vous avez des questions pendant l'implémentation:
1. Vérifiez les logs de recherche KB dans la console
2. Testez avec différentes formulations
3. Ajustez les scores de pertinence si nécessaire
4. N'hésitez pas à demander de l'aide!

---

**Version:** 1.0
**Date:** 2025-01-26
**Auteur:** Claude Code Assistant
**Statut:** ✅ Prêt pour Implémentation
