# 📦 Catalog Architecture - Single Source of Truth System

**Version:** 4.2.0
**Date:** 2025-12-25
**Status:** ✅ IMPLEMENTED & VALIDATED

---

## 🎯 Objectif

Établir **products.json** comme **source unique de vérité** pour toutes les catégories, sous-catégories et données produits du chatbot INnatural.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                    │
│                                                               │
│                  config/products.json                         │
│                                                               │
│  • 38 produits avec category + type                          │
│  • Hair: 29 produits (7 types)                               │
│  • Body: 9 produits (4 types)                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ AUTO-GENERATED
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              config/bot-personality.json                      │
│                                                               │
│  guidedFlow.categories ← SYNC FROM products.json             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ USES
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              backend/productKnowledge.js                      │
│                                                               │
│  getProductsByType() ← QUERIES products.json                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ FEEDS
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    CHATBOT RESPONSES                          │
│                                                               │
│  ✅ Data garantie cohérente                                  │
│  ✅ Pas de dérive entre sources                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Structure du Catalogue

### products.json - SOURCE DE VÉRITÉ

Chaque produit contient désormais:

```json
{
  "id": "mixoil-rosemary-shampoo",
  "category": "hair",          // ← NOUVEAU: Catégorie explicite
  "type": "shampoo",           // ← Type = Sous-catégorie
  "collection": "mixoil-rosemary-almond",
  "name": {
    "ar": "شامبو ميكس أويل روزماري + اللوز",
    "en": "MixOil Rosemary + Almond Shampoo"
  },
  "price": 180,
  "size": "250ml",
  "description": { "ar": "...", "en": "..." },
  "benefits": { "ar": [...], "en": [...] },
  "concerns": ["hair-loss", "weak-hair"],
  "hairTypes": ["all", "thin", "hair-loss"]
}
```

**Champs requis:**
- ✅ `id` - Identifiant unique
- ✅ `category` - "hair" ou "body"
- ✅ `type` - Sous-catégorie (shampoo, body-butter, etc.)
- ✅ `name` - Multilingue (ar, en)
- ✅ `price` - Prix en LE
- ✅ `description` - Multilingue (ar, en)

---

## 🔄 Workflow de Synchronisation

### 1. Modifier le Catalogue (products.json)

```bash
# Éditer products.json manuellement
# OU importer depuis le scraper
```

### 2. Fixer les Problèmes (si nécessaire)

```bash
cd backend
node catalog-fixer.js

# Actions automatiques:
# ✅ Ajoute le champ 'category' manquant
# ✅ Corrige les types orphelins
# ✅ Valide la structure
```

### 3. Analyser le Catalogue

```bash
node catalog-analyzer.js

# Génère un rapport complet:
# • Distribution des types de produits
# • Mapping catégories/sous-catégories
# • Problèmes de validation
# • Statistiques
```

### 4. Synchroniser bot-personality.json

```bash
node category-generator.js

# Génère automatiquement:
# • Categories depuis products.json
# • Subcategories avec labels multilingues
# • Keywords pour la détection
```

### 5. Valider la Cohérence

```bash
node validate-catalog.js

# Tests:
# ✅ Structure des produits
# ✅ Sync products.json ↔ bot-personality.json
# ✅ Intégration ProductKnowledge
# ✅ Métadonnées

# Exit code 0 = SUCCESS
# Exit code 1 = FAILURE (pour CI/CD)
```

---

## 📊 Catégories & Sous-catégories

### Hair (29 produits)
- **shampoo** (5 produits)
- **conditioner** (5 produits)
- **mask** (6 produits) *← "treatment" fusionné ici*
- **leave-in** (4 produits)
- **serum** (4 produits)
- **mist** (3 produits)
- **oil** (2 produits)

### Body (9 produits)
- **body-cream** (3 produits)
- **body-scrub** (3 produits)
- **body-butter** (2 produits)
- **hand-cream** (1 produit)

---

## 🛠️ Scripts de Maintenance

| Script | Usage | Description |
|--------|-------|-------------|
| `catalog-analyzer.js` | `node catalog-analyzer.js` | Analyse le catalogue et génère un rapport |
| `catalog-fixer.js` | `node catalog-fixer.js [--dry-run]` | Corrige automatiquement les problèmes |
| `category-generator.js` | `node category-generator.js [--dry-run]` | Génère les catégories du bot depuis le catalogue |
| `validate-catalog.js` | `node validate-catalog.js` | Valide la cohérence (CI/CD ready) |

---

## ✅ Critères de Validation

### ✓ Tous les tests passent:

1. **Structure des Produits**
   - Tous les champs requis présents
   - Catégories valides (hair/body)
   - Multilingue (ar, en) complet

2. **Synchronisation Bot**
   - Tous les types de produits ont une sous-catégorie
   - Pas de sous-catégories vides
   - bot-personality.json = products.json

3. **Intégration Code**
   - `ProductKnowledge.getProductsByType()` fonctionne
   - Tous les types retournent des produits

4. **Métadonnées**
   - Version présente
   - totalProducts = nombre réel

---

## 🔐 Garanties du Système

✅ **Cohérence des données**: products.json est la seule source
✅ **Pas de dérive**: Validation automatique
✅ **Scalable**: Ajout de produits = sync automatique
✅ **Maintenable**: Scripts automatisés
✅ **Testable**: Exit codes pour CI/CD

---

## 🚀 Utilisation dans le Chatbot

### Backend (server.js)

Quand un utilisateur sélectionne "Body Cream":

```javascript
// 1. Flow manager détecte la sélection
const productType = "body-cream";

// 2. Récupère les produits depuis le catalogue
const products = ProductKnowledge.getProductsByType(productType);
// Retourne: 3 produits body-cream

// 3. Construit le prompt pour l'IA avec les VRAIES données
const enhancedMessage = `
[CRITICAL INSTRUCTIONS:
Show ALL Body Cream products listed below...]

**Available Body Cream Products:**
1. MixOil Almond Body Cream
   Price: LE 180
   Size: 250ml
   Description: Silky smooth body cream...
   Benefits: Lasting moisture, Fast-absorbing...

2. MixOil Coconut Body Cream
   ...
`;

// 4. L'IA reçoit les données RÉELLES et les présente
```

### Avantages

- ✅ L'IA ne peut PAS inventer de produits
- ✅ Prix toujours à jour
- ✅ Descriptions marketing cohérentes
- ✅ Multilingue automatique

---

## 📝 Changelog

### Version 4.2.0 (2025-12-25)

**BREAKING CHANGES:**
- ✅ Ajout du champ `category` à tous les produits
- ✅ Produit "treatment" → "mask"
- ✅ bot-personality.json généré depuis products.json

**New Features:**
- ✅ catalog-analyzer.js
- ✅ catalog-fixer.js
- ✅ category-generator.js
- ✅ validate-catalog.js

**Improvements:**
- ✅ ProductKnowledge.getProductsByType()
- ✅ Validation automatique de cohérence
- ✅ CI/CD ready avec exit codes

---

## 🔄 Maintenance Continue

### Quand ajouter un nouveau produit:

1. Ajouter à `config/products.json`
2. Exécuter: `node catalog-fixer.js`
3. Exécuter: `node category-generator.js`
4. Exécuter: `node validate-catalog.js`
5. Commit & Push

### En CI/CD:

```yaml
# .github/workflows/validate.yml
- name: Validate Catalog
  run: node backend/validate-catalog.js
```

---

## 📞 Support

Pour toute question sur l'architecture du catalogue:

1. Vérifier ce document
2. Lancer `node catalog-analyzer.js` pour diagnostiquer
3. Lancer `node validate-catalog.js` pour les erreurs

---

**🎯 RAPPEL: products.json est la SOURCE UNIQUE DE VÉRITÉ**
**🔒 Ne JAMAIS modifier bot-personality.json manuellement**
**✅ Toujours utiliser category-generator.js pour synchroniser**

---

*Document généré automatiquement le 2025-12-25*
