# 🛠️ Catalog Management Scripts - Quick Reference

## 📋 Scripts Overview

### 1. catalog-analyzer.js
**Purpose:** Analyze product catalog and generate comprehensive report

```bash
node catalog-analyzer.js
```

**Output:**
- Product type distribution
- Category mapping
- Validation issues
- Statistics

**When to use:**
- Before making changes to understand current state
- After changes to verify impact
- Debugging catalog issues

---

### 2. catalog-fixer.js
**Purpose:** Automatically fix common catalog issues

```bash
# Dry run (see what would change)
node catalog-fixer.js --dry-run

# Apply fixes
node catalog-fixer.js
```

**What it fixes:**
- ✅ Adds missing `category` field
- ✅ Fixes orphaned product types
- ✅ Validates required fields
- ✅ Updates version number

**When to use:**
- After adding new products
- After scraping from website
- When validation fails

---

### 3. category-generator.js
**Purpose:** Generate bot-personality.json categories from products.json

```bash
# Dry run (see what would be generated)
node category-generator.js --dry-run

# Update bot-personality.json
node category-generator.js
```

**What it does:**
- ✅ Reads all products from catalog
- ✅ Generates categories and subcategories
- ✅ Creates multilingual labels (ar, en, fr)
- ✅ Adds keywords for detection
- ✅ Updates bot-personality.json

**When to use:**
- After adding/removing product types
- After fixing catalog issues
- When bot categories are out of sync

---

### 4. validate-catalog.js
**Purpose:** Validate catalog integrity and sync with bot

```bash
node validate-catalog.js
```

**What it validates:**
- ✅ Product structure (required fields)
- ✅ Bot-personality.json sync
- ✅ ProductKnowledge integration
- ✅ Metadata accuracy

**Exit codes:**
- `0` = All validations passed ✅
- `1` = Validation failed ❌

**When to use:**
- Before committing changes
- In CI/CD pipeline
- After any catalog modification

---

## 🔄 Recommended Workflow

### Adding New Products

```bash
# 1. Add products to config/products.json

# 2. Fix any issues
node catalog-fixer.js

# 3. Sync bot categories
node category-generator.js

# 4. Validate everything
node validate-catalog.js

# 5. If validation passes, commit
git add config/products.json config/bot-personality.json
git commit -m "Add new products to catalog"
```

### Troubleshooting

```bash
# See current state
node catalog-analyzer.js

# See what needs fixing
node catalog-fixer.js --dry-run

# See validation errors
node validate-catalog.js
```

---

## 📊 Example Output

### catalog-analyzer.js
```
================================================================================
📊 CATALOG ANALYSIS REPORT - SOURCE OF TRUTH VALIDATION
================================================================================

📦 PRODUCT TYPE DISTRIBUTION:

   HAIR PRODUCTS:
   mask             6 products   [HAIR]
   shampoo          5 products   [HAIR]
   ...

🔍 VALIDATION RESULTS:
   ✅ No critical issues found

📈 STATISTICS:
   Total Products: 38
   Hair Products: 29
   Body Products: 9
```

### catalog-fixer.js
```
================================================================================
🔧 CATALOG FIXER - RUNNING FIXES
================================================================================

✅ Added 'category' field to 38 products
✅ Fixed 1 'treatment' product(s) → changed to 'mask'
✅ Saved 39 changes to products.json
```

### category-generator.js
```
================================================================================
🔄 CATEGORY GENERATOR - SYNCING BOT WITH CATALOG
================================================================================

✅ Updated bot-personality.json with categories from products.json

📈 SUMMARY:
   Total categories: 2
   Total subcategories: 11
```

### validate-catalog.js
```
================================================================================
🔍 CATALOG VALIDATION - DATA INTEGRITY CHECK
================================================================================

✅ PASSED CHECKS:
   ✅ All products have required fields
   ✅ Bot-personality.json is in sync
   ✅ ProductKnowledge can retrieve products
   ✅ Metadata is valid

Status: PASSED ✅
```

---

## 🚨 Common Issues

### Issue: "Product type X not found in bot-personality.json"
**Solution:**
```bash
node category-generator.js
```

### Issue: "Missing 'category' field"
**Solution:**
```bash
node catalog-fixer.js
```

### Issue: "metadata.totalProducts doesn't match"
**Solution:**
Edit `config/products.json` metadata or run fixer

### Issue: "ProductKnowledge.getProductsByType() returned 0 products"
**Solution:**
Check if product type in catalog matches subcategory ID in bot-personality.json

---

## 📝 CI/CD Integration

### GitHub Actions Example

```yaml
name: Validate Catalog

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: cd backend && npm install
      - name: Validate catalog
        run: node backend/validate-catalog.js
```

---

## 🔗 Related Files

- `CATALOG_ARCHITECTURE.md` - Complete architecture documentation
- `config/products.json` - Source of truth for products
- `config/bot-personality.json` - Auto-generated from products.json
- `backend/productKnowledge.js` - Product retrieval logic

---

## 💡 Tips

1. **Always run in order:** fixer → generator → validator
2. **Use --dry-run first** to preview changes
3. **Validate before committing** to catch issues early
4. **Never manually edit** bot-personality.json categories
5. **Products.json is the source of truth** - all changes start there

---

*Last updated: 2025-12-25*
