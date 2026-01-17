#!/usr/bin/env python3
"""
Script pour enrichir le catalogue produit actuel avec les descriptions détaillées du backup
Fusionne products.json (structure moderne) avec products.json.backup (descriptions riches)
"""

import json
import os
from typing import Dict, List, Any
from datetime import datetime

# Chemins des fichiers
CURRENT_CATALOG = "../config/products.json"
BACKUP_CATALOG = "../config/products.json.backup"
OUTPUT_CATALOG = "../config/products_enriched.json"

def load_json(filepath: str) -> Dict:
    """Charge un fichier JSON"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data: Dict, filepath: str):
    """Sauvegarde un dictionnaire en JSON avec formatage"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Fichier sauvegardé: {filepath}")

def create_product_mapping() -> Dict[str, str]:
    """
    Crée un mapping entre les IDs du catalogue actuel et du backup
    Basé sur les noms de produits similaires
    """
    return {
        # MixOil Rosemary + Almond Collection
        "mixoil-rosemary-shampoo": "mixoil-rosemary",  # Mapping approximatif
        "mixoil-rosemary-conditioner": None,  # Pas d'équivalent exact
        "mixoil-rosemary-leave-in": None,
        "mixoil-rosemary-mask": None,
        "mixoil-rosemary-serum": None,
        "mixoil-rosemary-oil": "mixoil-rosemary-almond",
        "mixoil-rosemary-mist": None,

        # MixOil Castor + Coconut + Jojoba Collection
        "mixoil-castor-shampoo": "mixoil-castor",
        "mixoil-castor-conditioner": None,
        "mixoil-castor-leave-in": None,
        "mixoil-castor-mask": None,
        "mixoil-castor-serum": None,
        "mixoil-castor-oil": "mixoil-triple-blend",
        "mixoil-coconut-mist": "mixoil-coconut",

        # Body products
        "mixoil-almond-body-butter": None,
        "mixoil-almond-body-cream": None,
        "mixoil-almond-body-scrub": None,
        "mixoil-coconut-body-cream": None,
        "mixoil-coconut-body-scrub": None,
        "mixoil-coconut-body-butter": None,

        # CocoShea Collection
        "cocoshea-shampoo": None,
        "cocoshea-conditioner": None,
        "cocoshea-leave-in": None,
        "cocoshea-mask": None,
        "cocoshea-serum": None,
        "cocoshea-mist": None,
        "cocoshea-body-cream": None,
        "cocoshea-body-scrub": None,
        "cocoshea-hand-cream": None,

        # Curly Hair Collection
        "curly-shampoo": "curly-shampoo",
        "curly-conditioner": "curly-conditioner",
        "curly-leave-in": "curly-leave-in",
        "curly-mask": "curly-hair-mask",

        # Africa Collection
        "africa-shampoo": None,
        "africa-conditioner": None,
        "africa-treatment": None,
        "africa-mask": "africa-shea-butter",
        "africa-serum": None,
    }

def create_enriched_product(current_product: Dict, backup_product: Dict = None) -> Dict:
    """
    Crée un produit enrichi en fusionnant les données actuelles et du backup
    """
    enriched = current_product.copy()

    if backup_product:
        # Ajouter les descriptions riches du backup
        if "description" in backup_product:
            enriched["description"] = backup_product["description"]

        # Ajouter les bénéfices
        if "benefits" in backup_product:
            enriched["benefits"] = backup_product["benefits"]

        # Ajouter les ingrédients si disponibles
        if "ingredients" in backup_product:
            enriched["ingredients"] = backup_product.get("ingredients", [])

        # Ajouter hairTypes du backup si plus détaillé
        if "hairTypes" in backup_product and backup_product["hairTypes"]:
            enriched["hairTypes"] = backup_product["hairTypes"]
    else:
        # Générer une description basique si pas de backup
        enriched["description"] = generate_basic_description(current_product)
        enriched["benefits"] = generate_basic_benefits(current_product)

    return enriched

def generate_basic_description(product: Dict) -> Dict[str, str]:
    """
    Génère une description basique pour les produits sans équivalent dans le backup
    """
    name_en = product["name"]["en"]
    collection = product.get("collection", "")
    product_type = product.get("type", "product")

    # Templates de descriptions par type
    templates = {
        "shampoo": {
            "en": f"A gentle and effective {name_en} specially formulated for your hair care needs. This premium shampoo cleanses thoroughly while nourishing your hair.",
            "ar": f"شامبو {product['name']['ar']} لطيف وفعال مصمم خصيصاً لتلبية احتياجات العناية بشعرك. ينظف بعمق مع تغذية شعرك."
        },
        "conditioner": {
            "en": f"Experience the nourishing power of {name_en}. This rich conditioner detangles, softens, and restores your hair's natural beauty.",
            "ar": f"اختبري قوة التغذية مع {product['name']['ar']}. هذا البلسم الغني يفك التشابكات، ينعم، ويعيد الجمال الطبيعي لشعرك."
        },
        "leave-in": {
            "en": f"{name_en} provides daily protection and continuous moisture throughout the day. Perfect for maintaining healthy, beautiful hair.",
            "ar": f"{product['name']['ar']} يوفر حماية يومية ورطوبة مستمرة طوال اليوم. مثالي للحفاظ على شعر صحي وجميل."
        },
        "mask": {
            "en": f"An intensive treatment with {name_en} that deeply nourishes and repairs your hair. Experience visible results with regular use.",
            "ar": f"علاج مكثف مع {product['name']['ar']} يغذي ويصلح شعرك بعمق. اختبري نتائج مرئية مع الاستخدام المنتظم."
        },
        "serum": {
            "en": f"{name_en} is a concentrated treatment that targets specific hair concerns with powerful active ingredients.",
            "ar": f"{product['name']['ar']} علاج مركز يستهدف مشاكل الشعر المحددة بمكونات نشطة قوية."
        },
        "oil": {
            "en": f"Pure and nourishing {name_en} that penetrates deep to strengthen, protect, and beautify your hair naturally.",
            "ar": f"{product['name']['ar']} نقي ومغذي يخترق بعمق ليقوي، يحمي، ويجمل شعرك بشكل طبيعي."
        },
        "mist": {
            "en": f"{name_en} is a refreshing spray that adds fragrance, moisture, and protection throughout the day.",
            "ar": f"{product['name']['ar']} بخاخ منعش يضيف عطراً، رطوبة، وحماية طوال اليوم."
        },
        "body-butter": {
            "en": f"Luxurious {name_en} that deeply hydrates and nourishes your skin, leaving it soft and supple.",
            "ar": f"{product['name']['ar']} فاخر يرطب ويغذي بشرتك بعمق، يتركها ناعمة ومرنة."
        },
        "body-cream": {
            "en": f"{name_en} provides lasting moisture and softness for your skin with a lightweight, fast-absorbing formula.",
            "ar": f"{product['name']['ar']} يوفر رطوبة ونعومة دائمة لبشرتك بتركيبة خفيفة سريعة الامتصاص."
        },
        "body-scrub": {
            "en": f"Exfoliating {name_en} that removes dead skin cells and reveals smoother, brighter skin.",
            "ar": f"{product['name']['ar']} مقشر يزيل خلايا الجلد الميتة ويكشف عن بشرة أكثر نعومة وإشراقاً."
        },
        "hand-cream": {
            "en": f"{name_en} protects and nourishes your hands with intensive care that lasts all day.",
            "ar": f"{product['name']['ar']} يحمي ويغذي يديك بعناية مكثفة تدوم طوال اليوم."
        }
    }

    return templates.get(product_type, {
        "en": f"Premium {name_en} for your hair and beauty care needs.",
        "ar": f"{product['name']['ar']} المميز لاحتياجات العناية بشعرك وجمالك."
    })

def generate_basic_benefits(product: Dict) -> Dict[str, List[str]]:
    """
    Génère des bénéfices basiques basés sur les concerns du produit
    """
    concerns = product.get("concerns", [])

    # Mapping des concerns aux bénéfices
    concern_benefits = {
        "hair-loss": {
            "en": "Reduces hair loss",
            "ar": "يقلل تساقط الشعر"
        },
        "weak-hair": {
            "en": "Strengthens hair",
            "ar": "يقوي الشعر"
        },
        "dryness": {
            "en": "Deep hydration",
            "ar": "ترطيب عميق"
        },
        "frizz": {
            "en": "Controls frizz",
            "ar": "يتحكم في التجعد"
        },
        "split-ends": {
            "en": "Repairs split ends",
            "ar": "يصلح الأطراف المتقصفة"
        },
        "damaged-hair": {
            "en": "Repairs damaged hair",
            "ar": "يصلح الشعر التالف"
        }
    }

    benefits_en = []
    benefits_ar = []

    for concern in concerns:
        if concern in concern_benefits:
            benefits_en.append(concern_benefits[concern]["en"])
            benefits_ar.append(concern_benefits[concern]["ar"])

    # Ajouter des bénéfices génériques si aucun concern spécifique
    if not benefits_en:
        benefits_en = ["Nourishes hair", "Adds shine", "Improves texture"]
        benefits_ar = ["يغذي الشعر", "يضيف لمعان", "يحسن الملمس"]

    return {
        "en": benefits_en,
        "ar": benefits_ar
    }

def main():
    # Set UTF-8 encoding for Windows console
    import sys
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    print("🚀 Démarrage de l'enrichissement du catalogue produit...\n")

    # Charger les catalogues
    print("📖 Chargement des catalogues...")
    current = load_json(CURRENT_CATALOG)
    backup = load_json(BACKUP_CATALOG)

    print(f"✅ Catalogue actuel: {current['metadata']['totalProducts']} produits")
    print(f"✅ Catalogue backup: {len(backup['products'])} produits\n")

    # Créer le mapping
    mapping = create_product_mapping()

    # Créer un dictionnaire des produits backup par ID
    backup_products = {p["id"]: p for p in backup["products"]}

    # Enrichir chaque produit du catalogue actuel
    enriched_products = []
    matched_count = 0
    generated_count = 0

    print("🔄 Enrichissement des produits en cours...\n")

    for product in current["products"]:
        product_id = product["id"]
        backup_id = mapping.get(product_id)
        backup_product = backup_products.get(backup_id) if backup_id else None

        enriched_product = create_enriched_product(product, backup_product)
        enriched_products.append(enriched_product)

        if backup_product:
            matched_count += 1
            print(f"✅ {product_id} → mappé avec {backup_id}")
        else:
            generated_count += 1
            print(f"🔧 {product_id} → description générée automatiquement")

    # Créer le catalogue enrichi
    enriched_catalog = current.copy()
    enriched_catalog["products"] = enriched_products
    enriched_catalog["metadata"]["version"] = "4.0.0"
    enriched_catalog["metadata"]["lastUpdated"] = datetime.now().strftime("%Y-%m-%d")
    enriched_catalog["metadata"]["enriched"] = True
    enriched_catalog["metadata"]["enrichmentDate"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Sauvegarder
    save_json(enriched_catalog, OUTPUT_CATALOG)

    print(f"\n{'='*60}")
    print("✨ ENRICHISSEMENT TERMINÉ !\n")
    print(f"📊 Statistiques:")
    print(f"   - Total produits: {len(enriched_products)}")
    print(f"   - Descriptions du backup: {matched_count}")
    print(f"   - Descriptions générées: {generated_count}")
    print(f"\n📁 Fichier créé: {OUTPUT_CATALOG}")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    # Changer le répertoire de travail vers le dossier du script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    main()
