#!/usr/bin/env python3
"""
Script to generate products.json from actual website data
Source: https://innaturalstores.com/
Date: 2025-12-21
"""

import json

# Website product data (scraped from innaturalstores.com)
products_data = {
    "metadata": {
        "lastUpdated": "2025-12-21",
        "source": "https://innaturalstores.com/",
        "currency": "LE",
        "version": "2.0.0"
    },
    "promotions": {
        "bulk_discount": {
            "threshold": 1000,
            "discount_percentage": 25,
            "description": {
                "ar": "احصلي على خصم 25% على الطلبات أكثر من 1000 جنيه",
                "en": "Get 25% discount on orders over LE 1,000"
            }
        },
        "free_shipping": {
            "threshold": 1000,
            "description": {
                "ar": "شحن مجاني للطلبات فوق 1000 جنيه",
                "en": "Free shipping on orders over LE 1,000"
            }
        }
    },
    "collections": [
        {
            "id": "mixoil-anti-hair-loss",
            "name": {"ar": "مجموعة ميكس أويل - مضادة لتساقط الشعر", "en": "MixOil Collection - Anti-Hair Loss Line"},
            "description": {"ar": "مجموعة متكاملة بالروزماري واللوز", "en": "Complete line with Rosemary + Almond"},
            "concerns": ["hair-loss", "weak-hair"]
        },
        {
            "id": "mixoil-hydration",
            "name": {"ar": "مجموعة ميكس أويل - للترطيب", "en": "MixOil Collection - Hydration Line"},
            "description": {"ar": "مجموعة للترطيب العميق", "en": "Deep hydration line"},
            "concerns": ["dryness", "frizz"]
        },
        {
            "id": "cocoshea-split-end-repair",
            "name": {"ar": "مجموعة كوكوشيا - إصلاح التقصف", "en": "CocoShea Collection - Split End Repair"},
            "description": {"ar": "لإصلاح الأطراف المتقصفة", "en": "Split end repair line"},
            "concerns": ["split-ends", "damaged-hair"]
        },
        {
            "id": "curly-hair",
            "name": {"ar": "مجموعة الشعر الكيرلي", "en": "Curly Hair Collection"},
            "description": {"ar": "خاصة للشعر الكيرلي", "en": "For curly hair"},
            "hairTypes": ["curly", "coily"]
        },
        {
            "id": "africa",
            "name": {"ar": "مجموعة أفريكا", "en": "Africa Collection"},
            "description": {"ar": "للشعر الأفريقي", "en": "For African hair"},
            "hairTypes": ["african", "coarse"]
        }
    ],
    "products": [],
    "bundles": [
        {
            "id": "hair-care-bundle-antiloss",
            "name": {"ar": "باكدج العناية بالشعر - مضاد للتساقط", "en": "Hair Care Bundle - Anti-Hair Loss"},
            "originalPrice": 1215,
            "salePrice": 935,
            "discount": 23,
            "description": {"ar": "وفري 280 جنيه", "en": "Save LE 280"}
        },
        {
            "id": "hydration-bundle",
            "name": {"ar": "باكدج الترطيب", "en": "Hydration Bundle"},
            "originalPrice": 1740,
            "salePrice": 975,
            "discount": 43,
            "description": {"ar": "وفري 765 جنيه!", "en": "Save LE 765!"}
        },
        {
            "id": "hair-routine-bundle-cocoshea",
            "name": {"ar": "باكدج الروتين اليومي - كوكوشيا", "en": "Hair Routine Bundle - CocoShea"},
            "originalPrice": 1105,
            "salePrice": 770,
            "discount": 30,
            "description": {"ar": "وفري 335 جنيه", "en": "Save LE 335"}
        }
    ]
}

# Add all products programmatically
collections_products = {
    "mixoil-anti-hair-loss": [
        ("shampoo", "Shampoo (Rosemary + Almond)", "شامبو ميكس أويل", 180, "250ml"),
        ("conditioner", "Conditioner", "بلسم ميكس أويل", 180, "250ml"),
        ("leave-in", "Leave-in Conditioner", "ليف-إن كونديشنر", 180, "200ml"),
        ("mask", "Hair Mask", "ماسك الشعر", 290, "300ml"),
        ("oil", "Hair Oil", "زيت الشعر", 325, "100ml"),
        ("mist", "Hair Mist", "بخاخ الشعر", 165, "150ml"),
        ("body-butter", "Body Butter (Almond)", "زبدة الجسم باللوز", 200, "200ml"),
    ],
    "mixoil-hydration": [
        ("shampoo", "Hydration Shampoo (Castor + Coconut + Jojoba)", "شامبو الترطيب", 180, "250ml"),
        ("conditioner", "Hydration Conditioner", "بلسم الترطيب", 180, "250ml"),
        ("leave-in", "Hydration Leave-in", "ليف-إن للترطيب", 180, "200ml"),
        ("serum", "Hair Serum", "سيروم الشعر", 220, "50ml"),
        ("body-cream", "Body Cream (Coconut)", "كريم الجسم بجوز الهند", 180, "200ml"),
        ("body-scrub", "Body Scrub", "مقشر الجسم", 200, "250ml"),
        ("body-butter", "Body Butter (Coconut)", "زبدة الجسم بجوز الهند", 200, "200ml"),
    ],
    "cocoshea-split-end-repair": [
        ("shampoo", "CocoShea Shampoo", "شامبو كوكوشيا", 180, "250ml"),
        ("conditioner", "CocoShea Conditioner", "بلسم كوكوشيا", 180, "250ml"),
        ("leave-in", "CocoShea Leave-in", "ليف-إن كوكوشيا", 180, "200ml"),
        ("mask", "CocoShea Hair Mask", "ماسك كوكوشيا", 220, "300ml"),
        ("serum", "CocoShea Hair Serum", "سيروم كوكوشيا", 220, "50ml"),
        ("body-scrub", "CocoShea Body Scrub", "مقشر الجسم كوكوشيا", 200, "250ml"),
        ("body-cream", "CocoShea Body Cream", "كريم الجسم كوكوشيا", 180, "200ml"),
        ("hand-cream", "CocoShea Hand Cream", "كريم اليدين كوكوشيا", 180, "75ml"),
        ("mist", "CocoShea Hair Mist", "بخاخ الشعر كوكوشيا", 165, "150ml"),
    ],
    "curly-hair": [
        ("shampoo", "Curly Hair Shampoo", "شامبو الشعر الكيرلي", 220, "250ml"),
        ("conditioner", "Curly Hair Conditioner", "بلسم الشعر الكيرلي", 220, "250ml"),
        ("mask", "Curly Hair Mask", "ماسك الشعر الكيرلي", 290, "300ml"),
        ("leave-in", "Curly Hair Leave-in Treatment", "تريتمنت الشعر الكيرلي", 220, "200ml"),
    ],
    "africa": [
        ("shampoo", "Africa Shampoo", "شامبو أفريكا", 220, "250ml"),
        ("conditioner", "Africa Conditioner", "بلسم أفريكا", 220, "250ml"),
        ("treatment", "Africa Treatment", "تريتمنت أفريكا", 220, "200ml"),
        ("mask", "Africa Hair Mask", "ماسك أفريكا", 290, "300ml"),
    ]
}

# Generate products
for collection_id, items in collections_products.items():
    for item_type, name_en, name_ar, price, size in items:
        product_id = f"{collection_id}-{item_type}"
        product = {
            "id": product_id,
            "collection": collection_id,
            "name": {"ar": name_ar, "en": name_en},
            "type": item_type,
            "price": price,
            "size": size,
            "hairTypes": ["all"],
            "concerns": []
        }
        products_data["products"].append(product)

# Save to file
output_path = "../config/products.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(products_data, f, ensure_ascii=False, indent=2)

print(f"[OK] Generated products.json with {len(products_data['products'])} products")
print(f"[OK] Added {len(products_data['collections'])} collections")
print(f"[OK] Added {len(products_data['bundles'])} bundles")
print(f"[OK] Added promotions: Free shipping & 25% discount over LE 1,000")
print(f"\n[FILE] Saved to: {output_path}")
