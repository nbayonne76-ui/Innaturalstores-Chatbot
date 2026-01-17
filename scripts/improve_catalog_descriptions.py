#!/usr/bin/env python3
"""
Script pour améliorer les descriptions du catalogue enrichi
- Corrige les bénéfices des produits body (skin vs hair)
- Enrichit les descriptions basiques avec plus de détails marketing
- Améliore la cohérence des bénéfices
"""

import json
import sys
import io
from datetime import datetime

# Configuration UTF-8 pour Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Chemins
CATALOG_PATH = "../config/products.json"
OUTPUT_PATH = "../config/products.json"

def load_catalog():
    """Charge le catalogue"""
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_catalog(catalog):
    """Sauvegarde le catalogue"""
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

def is_body_product(product_type):
    """Vérifie si c'est un produit pour le corps"""
    body_types = ['body-butter', 'body-cream', 'body-scrub', 'hand-cream']
    return product_type in body_types

def get_body_product_benefits(product_type, collection_name=""):
    """Génère des bénéfices appropriés pour les produits body"""

    # Bénéfices communs pour tous les body products
    common_benefits = {
        "en": {
            "body-butter": [
                "Deep skin hydration",
                "Softens and smooths skin",
                "Long-lasting moisture",
                "Nourishes dry skin"
            ],
            "body-cream": [
                "Lasting moisture for skin",
                "Lightweight and fast-absorbing",
                "Softens skin",
                "Daily hydration"
            ],
            "body-scrub": [
                "Exfoliates dead skin cells",
                "Reveals smoother skin",
                "Brightens skin tone",
                "Prepares skin for hydration"
            ],
            "hand-cream": [
                "Intensive hand care",
                "Protects and nourishes hands",
                "Non-greasy formula",
                "All-day protection"
            ]
        },
        "ar": {
            "body-butter": [
                "ترطيب عميق للبشرة",
                "ينعم ويملس البشرة",
                "ترطيب طويل الأمد",
                "يغذي البشرة الجافة"
            ],
            "body-cream": [
                "ترطيب دائم للبشرة",
                "خفيف وسريع الامتصاص",
                "ينعم البشرة",
                "ترطيب يومي"
            ],
            "body-scrub": [
                "يقشر خلايا الجلد الميتة",
                "يكشف عن بشرة أكثر نعومة",
                "يفتح لون البشرة",
                "يحضر البشرة للترطيب"
            ],
            "hand-cream": [
                "عناية مكثفة لليدين",
                "يحمي ويغذي اليدين",
                "تركيبة غير دهنية",
                "حماية طوال اليوم"
            ]
        }
    }

    benefits_en = common_benefits["en"].get(product_type, [
        "Nourishes skin",
        "Adds softness",
        "Improves skin texture"
    ])

    benefits_ar = common_benefits["ar"].get(product_type, [
        "يغذي البشرة",
        "يضيف نعومة",
        "يحسن ملمس البشرة"
    ])

    return {
        "en": benefits_en,
        "ar": benefits_ar
    }

def enrich_body_product_description(product):
    """Enrichit la description d'un produit body"""
    product_type = product.get("type", "")
    product_name_en = product["name"]["en"]
    product_name_ar = product["name"]["ar"]
    collection = product.get("collection", "")

    # Déterminer les ingrédients selon la collection
    ingredients_map = {
        "mixoil-rosemary-almond": {
            "en": "enriched with sweet almond oil and rosemary extract",
            "ar": "غني بزيت اللوز الحلو وخلاصة الروزماري"
        },
        "mixoil-castor-coconut-jojoba": {
            "en": "enriched with coconut oil, jojoba, and nourishing botanicals",
            "ar": "غني بزيت جوز الهند والجوجوبا والمواد النباتية المغذية"
        },
        "cocoshea": {
            "en": "enriched with coconut oil and shea butter",
            "ar": "غني بزيت جوز الهند وزبدة الشيا"
        }
    }

    ingredients = ingredients_map.get(collection, {
        "en": "enriched with natural ingredients",
        "ar": "غني بالمكونات الطبيعية"
    })

    # Templates enrichis selon le type
    if product_type == "body-butter":
        description_en = f"""Luxurious {product_name_en} that deeply hydrates and nourishes your skin 🧈✨

This rich, creamy body butter is {ingredients['en']} that penetrate deep to provide intensive moisture. Perfect for dry skin, it leaves your skin feeling soft, supple, and beautifully smooth all day long.

The thick, indulgent texture melts into your skin, creating a protective barrier that locks in moisture and keeps your skin hydrated for hours. Ideal for use after showering or bathing when your skin needs extra nourishment.

Your skin deserves the best care 💛

WhatsApp/Call: +20155 5590333"""

        description_ar = f"""زبدة الجسم الفاخرة {product_name_ar} التي ترطب وتغذي بشرتك بعمق 🧈✨

زبدة الجسم الغنية والكريمية هذه {ingredients['ar']} التي تخترق بعمق لتوفير ترطيب مكثف. مثالية للبشرة الجافة، تترك بشرتك ناعمة ومرنة ومنعشة بشكل جميل طوال اليوم.

القوام السميك واللذيذ يذوب في بشرتك، مما يخلق حاجزاً واقياً يحبس الرطوبة ويحافظ على ترطيب بشرتك لساعات. مثالي للاستخدام بعد الاستحمام عندما تحتاج بشرتك إلى تغذية إضافية.

بشرتك تستحق أفضل عناية 💛

WhatsApp / Call:
+20155 5590333"""

    elif product_type == "body-cream":
        description_en = f"""Silky smooth {product_name_en} for daily hydration ✨

This lightweight body cream is {ingredients['en']} that absorb quickly without leaving any greasy residue. Perfect for everyday use, it provides lasting moisture and leaves your skin feeling soft, smooth, and refreshed.

The fast-absorbing formula is ideal for busy mornings when you need quick, effective hydration. Your skin will feel nourished and protected throughout the day.

Beautiful skin starts here 💛

WhatsApp/Call: +20155 5590333"""

        description_ar = f"""كريم الجسم الناعم {product_name_ar} للترطيب اليومي ✨

كريم الجسم الخفيف هذا {ingredients['ar']} الذي يمتص بسرعة دون ترك أي بقايا دهنية. مثالي للاستخدام اليومي، يوفر ترطيباً دائماً ويترك بشرتك ناعمة ومنتعشة.

التركيبة سريعة الامتصاص مثالية للصباح المزدحم عندما تحتاجين إلى ترطيب سريع وفعال. ستشعرين ببشرتك مغذية ومحمية طوال اليوم.

البشرة الجميلة تبدأ من هنا 💛

WhatsApp / Call:
+20155 5590333"""

    elif product_type == "body-scrub":
        description_en = f"""Exfoliating {product_name_en} for radiant, smooth skin ✨

This gentle yet effective body scrub is {ingredients['en']} that polish away dead skin cells and reveal the soft, glowing skin beneath. Use 2-3 times per week for best results.

The fine exfoliating particles work to smooth rough patches, improve skin texture, and prepare your skin to better absorb your moisturizer. Your skin will feel incredibly soft and look noticeably brighter.

Reveal your skin's natural glow 💛

WhatsApp/Call: +20155 5590333"""

        description_ar = f"""مقشر الجسم {product_name_ar} لبشرة ناعمة ومشرقة ✨

مقشر الجسم اللطيف والفعال هذا {ingredients['ar']} الذي يزيل خلايا الجلد الميتة ويكشف عن البشرة الناعمة والمتوهجة تحتها. استخدميه 2-3 مرات في الأسبوع لأفضل النتائج.

جزيئات التقشير الدقيقة تعمل على تنعيم المناطق الخشنة، وتحسين ملمس البشرة، وتحضير بشرتك لامتصاص المرطب بشكل أفضل. ستشعرين ببشرتك ناعمة بشكل لا يصدق وتبدو أكثر إشراقاً.

اكشفي عن توهج بشرتك الطبيعي 💛

WhatsApp / Call:
+20155 5590333"""

    elif product_type == "hand-cream":
        description_en = f"""Nourishing {product_name_en} for soft, protected hands 🙌

This intensive hand cream is {ingredients['en']} that provide deep nourishment and protection for your hardworking hands. The rich formula absorbs quickly and creates a protective barrier against dryness.

Perfect for frequent use throughout the day, especially after washing hands. Keeps your hands soft, smooth, and protected even with frequent washing.

Your hands deserve special care 💛

WhatsApp/Call: +20155 5590333"""

        description_ar = f"""كريم اليد المغذي {product_name_ar} لأيادي ناعمة ومحمية 🙌

كريم اليد المكثف هذا {ingredients['ar']} الذي يوفر تغذية عميقة وحماية ليديك العاملتين. التركيبة الغنية تمتص بسرعة وتخلق حاجزاً واقياً ضد الجفاف.

مثالي للاستخدام المتكرر طوال اليوم، خاصة بعد غسل اليدين. يحافظ على يديك ناعمة ومنعشة ومحمية حتى مع الغسيل المتكرر.

يداك تستحقان عناية خاصة 💛

WhatsApp / Call:
+20155 5590333"""

    else:
        # Fallback générique
        return product.get("description", {})

    return {
        "en": description_en,
        "ar": description_ar
    }

def improve_product(product):
    """Améliore un produit"""
    product_type = product.get("type", "")

    # Si c'est un produit body avec des mauvais bénéfices
    if is_body_product(product_type):
        # Vérifier si les bénéfices parlent de cheveux (erreur)
        current_benefits = product.get("benefits", {})
        if current_benefits:
            benefits_text = str(current_benefits.get("en", []))
            if "hair" in benefits_text.lower():
                print(f"   🔧 Correction bénéfices body: {product['id']}")
                # Remplacer par des bénéfices appropriés
                product["benefits"] = get_body_product_benefits(product_type, product.get("collection", ""))

                # Enrichir la description si elle est basique
                current_desc = product.get("description", {}).get("en", "")
                if len(current_desc) < 200 or "provides lasting moisture" in current_desc:
                    print(f"   ✨ Enrichissement description: {product['id']}")
                    product["description"] = enrich_body_product_description(product)

    return product

def main():
    print("🚀 Amélioration complète du catalogue...\n")

    # Charger le catalogue
    print("📖 Chargement du catalogue...")
    catalog = load_catalog()

    total_products = len(catalog["products"])
    print(f"✅ {total_products} produits trouvés\n")

    # Améliorer chaque produit
    print("🔄 Amélioration en cours...\n")
    improved_count = 0

    for product in catalog["products"]:
        original_product = product.copy()
        improved_product = improve_product(product)

        if improved_product != original_product:
            improved_count += 1

    # Mettre à jour les métadonnées
    catalog["metadata"]["version"] = "4.1.0"
    catalog["metadata"]["lastUpdated"] = datetime.now().strftime("%Y-%m-%d")
    catalog["metadata"]["improved"] = True
    catalog["metadata"]["improvementDate"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Sauvegarder
    save_catalog(catalog)

    print(f"\n{'='*60}")
    print("✨ AMÉLIORATION TERMINÉE !\n")
    print(f"📊 Statistiques:")
    print(f"   - Total produits: {total_products}")
    print(f"   - Produits améliorés: {improved_count}")
    print(f"\n📁 Fichier mis à jour: {OUTPUT_PATH}")
    print(f"📌 Nouvelle version: 4.1.0")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    main()
