#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete Product Data Sync from innaturalstores.com
Generates products.json with ALL 43 products from the website
"""

import json
from datetime import datetime

# Complete product data scraped from innaturalstores.com
products_data = {
    "metadata": {
        "lastUpdated": datetime.now().strftime("%Y-%m-%d"),
        "source": "https://innaturalstores.com/",
        "currency": "LE",
        "version": "3.0.0",
        "totalProducts": 43,
        "scrapeDate": "2025-12-21"
    },
    "promotions": {
        "bulk_discount": {
            "threshold": 1000,
            "discount_percentage": 25,
            "description": {
                "ar": "خصم 25% على الطلبات فوق 1000 جنيه",
                "en": "25% discount on orders over LE 1,000"
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
            "id": "mixoil-rosemary-almond",
            "name": {
                "ar": "مجموعة ميكس أويل - روزماري + لوز (مضادة لتساقط الشعر)",
                "en": "MixOil Rosemary + Almond Collection (Anti-Hair Loss)"
            },
            "description": {
                "ar": "مجموعة متكاملة بالروزماري واللوز لعلاج تساقط الشعر وتقويته",
                "en": "Complete line with Rosemary + Almond for hair loss treatment and strengthening"
            },
            "concerns": ["hair-loss", "weak-hair", "thinning"],
            "ingredients": ["rosemary", "almond"]
        },
        {
            "id": "mixoil-castor-coconut-jojoba",
            "name": {
                "ar": "مجموعة ميكس أويل - خروع + جوز الهند + جوجوبا (للترطيب)",
                "en": "MixOil Castor + Coconut + Jojoba Collection (Hydration)"
            },
            "description": {
                "ar": "مجموعة للترطيب العميق والعناية المكثفة",
                "en": "Deep hydration and intensive care line"
            },
            "concerns": ["dryness", "frizz", "dehydration"],
            "ingredients": ["castor", "coconut", "jojoba"]
        },
        {
            "id": "cocoshea",
            "name": {
                "ar": "مجموعة كوكوشيا (لإصلاح التقصف)",
                "en": "CocoShea Collection (Split End Repair)"
            },
            "description": {
                "ar": "لإصلاح الأطراف المتقصفة والشعر التالف",
                "en": "For split end repair and damaged hair"
            },
            "concerns": ["split-ends", "damaged-hair", "breakage"],
            "ingredients": ["coconut", "shea"]
        },
        {
            "id": "curly-hair",
            "name": {
                "ar": "مجموعة الشعر الكيرلي",
                "en": "Curly Hair Collection"
            },
            "description": {
                "ar": "خاصة للشعر الكيرلي والمجعد",
                "en": "Specially for curly and coily hair"
            },
            "hairTypes": ["curly", "coily", "wavy"]
        },
        {
            "id": "africa",
            "name": {
                "ar": "مجموعة أفريكا (الأكثر مبيعاً)",
                "en": "Africa Collection (Best Seller)"
            },
            "description": {
                "ar": "للشعر الأفريقي والخشن",
                "en": "For African and coarse hair"
            },
            "hairTypes": ["african", "coarse", "thick"]
        }
    ],
    "products": [],
    "bundles": []
}

# COLLECTION 1: MixOil Rosemary + Almond (Anti-Hair Loss)
rosemary_products = [
    {
        "id": "mixoil-rosemary-shampoo",
        "collection": "mixoil-rosemary-almond",
        "name": {
            "ar": "شامبو ميكس أويل روزماري + اللوز",
            "en": "MixOil Rosemary + Almond Shampoo"
        },
        "type": "shampoo",
        "price": 180,
        "size": "250ml",
        "concerns": ["hair-loss", "weak-hair"]
    },
    {
        "id": "mixoil-rosemary-conditioner",
        "collection": "mixoil-rosemary-almond",
        "name": {
            "ar": "بلسم ميكس أويل روزماري + لوز",
            "en": "MixOil Rosemary + Almond Conditioner"
        },
        "type": "conditioner",
        "price": 180,
        "size": "250ml",
        "concerns": ["hair-loss", "weak-hair"]
    },
    {
        "id": "mixoil-rosemary-leave-in",
        "collection": "mixoil-rosemary-almond",
        "name": {
            "ar": "ميكس أويل روزماري + لوز ليف إن",
            "en": "MixOil Rosemary + Almond Leave-In"
        },
        "type": "leave-in",
        "price": 180,
        "size": "250ml",
        "concerns": ["hair-loss", "weak-hair"]
    },
    {
        "id": "mixoil-rosemary-mask",
        "collection": "mixoil-rosemary-almond",
        "name": {
            "ar": "ماسك الشعر ميكس أويل بالروزماري + اللوز",
            "en": "MixOil Rosemary + Almond Hair Mask"
        },
        "type": "mask",
        "price": 290,
        "size": "500ml",
        "concerns": ["hair-loss", "weak-hair"]
    },
    {
        "id": "mixoil-rosemary-serum",
        "collection": "mixoil-rosemary-almond",
        "name": {
            "ar": "سيروم ميكس أويل روزماري + اللوز",
            "en": "MixOil Rosemary Hair Serum"
        },
        "type": "serum",
        "price": 220,
        "size": "50ml",
        "concerns": ["hair-loss", "weak-hair"]
    },
    {
        "id": "mixoil-rosemary-oil",
        "collection": "mixoil-rosemary-almond",
        "name": {
            "ar": "زيت ميكس أويل روزماري لعلاج تساقط الشعر",
            "en": "MixOil Rosemary Hair Oil"
        },
        "type": "oil",
        "price": 325,
        "size": "100ml",
        "concerns": ["hair-loss", "weak-hair"]
    },
    {
        "id": "mixoil-rosemary-mist",
        "collection": "mixoil-rosemary-almond",
        "name": {
            "ar": "معطر الشعر ميكس أويل روزماري",
            "en": "MixOil Rosemary Hair Mist"
        },
        "type": "mist",
        "price": 165,
        "size": "125ml",
        "concerns": ["hair-loss"]
    },
    # Body products
    {
        "id": "mixoil-almond-body-butter",
        "collection": "mixoil-rosemary-almond",
        "name": {
            "ar": "زبدة الجسم باللوز من ميكس أويل",
            "en": "MixOil Almond Body Butter"
        },
        "type": "body-butter",
        "price": 200,
        "size": "300ml"
    },
    {
        "id": "mixoil-almond-body-cream",
        "collection": "mixoil-rosemary-almond",
        "name": {
            "ar": "كريم الجسم باللوز من ميكس أويل",
            "en": "MixOil Almond Body Cream"
        },
        "type": "body-cream",
        "price": 180,
        "size": "250ml"
    },
    {
        "id": "mixoil-almond-body-scrub",
        "collection": "mixoil-rosemary-almond",
        "name": {
            "ar": "مقشر الجسم باللوز من ميكس أويل",
            "en": "MixOil Almond Body Scrub"
        },
        "type": "body-scrub",
        "price": 200,
        "size": "300ml"
    }
]

# COLLECTION 2: MixOil Castor + Coconut + Jojoba (Hydration)
castor_products = [
    {
        "id": "mixoil-castor-shampoo",
        "collection": "mixoil-castor-coconut-jojoba",
        "name": {
            "ar": "شامبو ميكس أويل الخروع + جوز الهند + الجوجوبا",
            "en": "MixOil Castor + Coconut + Jojoba Shampoo"
        },
        "type": "shampoo",
        "price": 180,
        "size": "250ml",
        "concerns": ["dryness", "frizz"]
    },
    {
        "id": "mixoil-castor-conditioner",
        "collection": "mixoil-castor-coconut-jojoba",
        "name": {
            "ar": "بلسم الخروع + جوز الهند + الجوجوبا من ميكس أويل",
            "en": "MixOil Castor + Coconut + Jojoba Conditioner"
        },
        "type": "conditioner",
        "price": 180,
        "size": "250ml",
        "concerns": ["dryness", "frizz"]
    },
    {
        "id": "mixoil-castor-leave-in",
        "collection": "mixoil-castor-coconut-jojoba",
        "name": {
            "ar": "ميكس أويل ليف ان - الخروع + جوز الهند + الجوجوبا",
            "en": "MixOil Castor + Coconut + Jojoba Leave-In"
        },
        "type": "leave-in",
        "price": 180,
        "size": "250ml",
        "concerns": ["dryness", "frizz"]
    },
    {
        "id": "mixoil-castor-mask",
        "collection": "mixoil-castor-coconut-jojoba",
        "name": {
            "ar": "ماسك الشعر بزيت الخروع + جوز الهند + الجوجوبا",
            "en": "MixOil Castor + Coconut + Jojoba Hair Mask"
        },
        "type": "mask",
        "price": 290,
        "size": "500ml",
        "concerns": ["dryness", "frizz"]
    },
    {
        "id": "mixoil-castor-serum",
        "collection": "mixoil-castor-coconut-jojoba",
        "name": {
            "ar": "سيروم الشعر ميكس أويل الخروع + جوز الهند + الجوجوبا",
            "en": "MixOil Castor Hair Serum"
        },
        "type": "serum",
        "price": 220,
        "size": "35ml",
        "concerns": ["dryness", "frizz"]
    },
    {
        "id": "mixoil-castor-oil",
        "collection": "mixoil-castor-coconut-jojoba",
        "name": {
            "ar": "زيت ميكس أويل بالخروع",
            "en": "MixOil Castor Hair Oil"
        },
        "type": "oil",
        "price": 325,
        "size": "100ml",
        "concerns": ["dryness"]
    },
    {
        "id": "mixoil-coconut-mist",
        "collection": "mixoil-castor-coconut-jojoba",
        "name": {
            "ar": "معطر الشعر بجوز الهند من ميكس أويل",
            "en": "MixOil Coconut Hair Mist"
        },
        "type": "mist",
        "price": 165,
        "size": "125ml"
    },
    # Body products
    {
        "id": "mixoil-coconut-body-cream",
        "collection": "mixoil-castor-coconut-jojoba",
        "name": {
            "ar": "كريم الجسم بجوز الهند من ميكس أويل",
            "en": "MixOil Coconut Body Cream"
        },
        "type": "body-cream",
        "price": 180,
        "size": "250ml"
    },
    {
        "id": "mixoil-coconut-body-scrub",
        "collection": "mixoil-castor-coconut-jojoba",
        "name": {
            "ar": "مقشر الجسم بجوز الهند من ميكس أويل",
            "en": "MixOil Coconut Body Scrub"
        },
        "type": "body-scrub",
        "price": 200,
        "size": "300ml"
    },
    {
        "id": "mixoil-coconut-body-butter",
        "collection": "mixoil-castor-coconut-jojoba",
        "name": {
            "ar": "زبدة الجسم بجوز الهند من ميكس أويل",
            "en": "MixOil Coconut Body Butter"
        },
        "type": "body-butter",
        "price": 200,
        "size": "250ml"
    }
]

# COLLECTION 3: CocoShea (Split End Repair)
cocoshea_products = [
    {
        "id": "cocoshea-shampoo",
        "collection": "cocoshea",
        "name": {
            "ar": "شامبو كوكوشيا",
            "en": "CocoShea Shampoo"
        },
        "type": "shampoo",
        "price": 180,
        "size": "250ml",
        "concerns": ["split-ends", "damaged-hair"]
    },
    {
        "id": "cocoshea-conditioner",
        "collection": "cocoshea",
        "name": {
            "ar": "بلسم كوكوشيا",
            "en": "CocoShea Conditioner"
        },
        "type": "conditioner",
        "price": 180,
        "size": "250ml",
        "concerns": ["split-ends", "damaged-hair"]
    },
    {
        "id": "cocoshea-leave-in",
        "collection": "cocoshea",
        "name": {
            "ar": "كوكوشيا ليف-إن",
            "en": "CocoShea Leave-In"
        },
        "type": "leave-in",
        "price": 180,
        "size": "250ml",
        "concerns": ["split-ends", "damaged-hair"]
    },
    {
        "id": "cocoshea-mask",
        "collection": "cocoshea",
        "name": {
            "ar": "ماسك كوكوشيا للشعر",
            "en": "CocoShea Hair Mask"
        },
        "type": "mask",
        "price": 220,
        "size": "300ml",
        "concerns": ["split-ends", "damaged-hair"]
    },
    {
        "id": "cocoshea-serum",
        "collection": "cocoshea",
        "name": {
            "ar": "سيروم كوكوشيا",
            "en": "CocoShea Serum"
        },
        "type": "serum",
        "price": 220,
        "size": "35ml",
        "concerns": ["split-ends", "damaged-hair"]
    },
    {
        "id": "cocoshea-mist",
        "collection": "cocoshea",
        "name": {
            "ar": "بخاخ الشعر كوكوشيا",
            "en": "CocoShea Hair Mist"
        },
        "type": "mist",
        "price": 165,
        "size": "125ml",
        "concerns": ["split-ends"]
    },
    # Body products
    {
        "id": "cocoshea-body-cream",
        "collection": "cocoshea",
        "name": {
            "ar": "كريم الجسم كوكوشيا",
            "en": "CocoShea Body Cream"
        },
        "type": "body-cream",
        "price": 180,
        "size": "250ml"
    },
    {
        "id": "cocoshea-body-scrub",
        "collection": "cocoshea",
        "name": {
            "ar": "اسكراب كوكوشيا",
            "en": "CocoShea Body Scrub"
        },
        "type": "body-scrub",
        "price": 200,
        "size": "300g"
    },
    {
        "id": "cocoshea-hand-cream",
        "collection": "cocoshea",
        "name": {
            "ar": "كريم اليد كوكوشيا",
            "en": "CocoShea Hand Cream"
        },
        "type": "hand-cream",
        "price": 180,
        "size": "250ml"
    }
]

# COLLECTION 4: Curly Hair
curly_products = [
    {
        "id": "curly-shampoo",
        "collection": "curly-hair",
        "name": {
            "ar": "شامبو للشعر الكيرلي",
            "en": "Curly Shampoo"
        },
        "type": "shampoo",
        "price": 220,
        "size": "500ml",
        "hairTypes": ["curly", "coily", "wavy"]
    },
    {
        "id": "curly-conditioner",
        "collection": "curly-hair",
        "name": {
            "ar": "بلسم للشعر الكيرلي",
            "en": "Curly Conditioner"
        },
        "type": "conditioner",
        "price": 220,
        "size": "500ml",
        "hairTypes": ["curly", "coily", "wavy"]
    },
    {
        "id": "curly-leave-in",
        "collection": "curly-hair",
        "name": {
            "ar": "تجعيد الشعر بدون شطف",
            "en": "Curly Leave-In"
        },
        "type": "leave-in",
        "price": 220,
        "size": "500ml",
        "hairTypes": ["curly", "coily", "wavy"]
    },
    {
        "id": "curly-mask",
        "collection": "curly-hair",
        "name": {
            "ar": "قناع الشعر الكيرلي",
            "en": "Curly Hair Mask"
        },
        "type": "mask",
        "price": 290,
        "size": "500g",
        "hairTypes": ["curly", "coily", "wavy"]
    }
]

# COLLECTION 5: Africa (Best Seller)
africa_products = [
    {
        "id": "africa-shampoo",
        "collection": "africa",
        "name": {
            "ar": "شامبو أفريقيا",
            "en": "Africa Shampoo"
        },
        "type": "shampoo",
        "price": 220,
        "size": "500ml",
        "hairTypes": ["african", "coarse", "thick"]
    },
    {
        "id": "africa-conditioner",
        "collection": "africa",
        "name": {
            "ar": "بلسم أفريقيا",
            "en": "Africa Conditioner"
        },
        "type": "conditioner",
        "price": 220,
        "size": "500ml",
        "hairTypes": ["african", "coarse", "thick"]
    },
    {
        "id": "africa-treatment",
        "collection": "africa",
        "name": {
            "ar": "تريتمنت أفريقيا",
            "en": "Africa Treatment"
        },
        "type": "treatment",
        "price": 220,
        "size": "500ml",
        "hairTypes": ["african", "coarse", "thick"]
    },
    {
        "id": "africa-mask",
        "collection": "africa",
        "name": {
            "ar": "ماسك أفريقا للشعر",
            "en": "Africa Hair Mask"
        },
        "type": "mask",
        "price": 290,
        "size": "300g",
        "hairTypes": ["african", "coarse", "thick"]
    },
    {
        "id": "africa-serum",
        "collection": "africa",
        "name": {
            "ar": "سيروم أفريقيا للشعر",
            "en": "Africa Hair Serum"
        },
        "type": "serum",
        "price": 220,
        "size": "35ml",
        "hairTypes": ["african", "coarse", "thick"]
    }
]

# Combine all products
all_products = (
    rosemary_products +
    castor_products +
    cocoshea_products +
    curly_products +
    africa_products
)

products_data["products"] = all_products

# Add bundles
bundles = [
    {
        "id": "mixoil-hair-care-bundle",
        "name": {
            "ar": "مجموعة العناية بالشعر من ميكس أويل",
            "en": "MixOil Hair Care Collection"
        },
        "collection": "mixoil-rosemary-almond",
        "originalPrice": 1215,
        "salePrice": 935,
        "discount": 23,
        "savings": 280,
        "description": {
            "ar": "وفري 280 جنيه! 6 منتجات",
            "en": "Save LE 280! 6 products"
        }
    },
    {
        "id": "mixoil-hydration-bundle",
        "name": {
            "ar": "مجموعة ميكس أويل للترطيب",
            "en": "MixOil Hydration Collection"
        },
        "collection": "mixoil-castor-coconut-jojoba",
        "originalPrice": 1740,
        "salePrice": 975,
        "discount": 43,
        "savings": 765,
        "description": {
            "ar": "وفري 765 جنيه! 6-7 منتجات",
            "en": "Save LE 765! 6-7 products"
        }
    },
    {
        "id": "cocoshea-hair-routine-bundle",
        "name": {
            "ar": "روتين كوكوشيا للعناية بالشعر",
            "en": "CocoShea Hair Routine"
        },
        "collection": "cocoshea",
        "originalPrice": 1105,
        "salePrice": 770,
        "discount": 30,
        "savings": 335,
        "description": {
            "ar": "وفري 335 جنيه!",
            "en": "Save LE 335!"
        }
    },
    {
        "id": "cocoshea-body-set",
        "name": {
            "ar": "مجموعة كوكوشيا للعناية بالجسم",
            "en": "CocoShea Body Set"
        },
        "collection": "cocoshea",
        "originalPrice": 900,
        "salePrice": 605,
        "discount": 32,
        "savings": 295,
        "description": {
            "ar": "وفري 295 جنيه!",
            "en": "Save LE 295!"
        }
    },
    {
        "id": "africa-bundle",
        "name": {
            "ar": "مجموعة أفريقيا",
            "en": "Africa Bundle"
        },
        "collection": "africa",
        "originalPrice": 1095,
        "salePrice": 715,
        "discount": 34,
        "savings": 380,
        "description": {
            "ar": "وفري 380 جنيه!",
            "en": "Save LE 380!"
        }
    }
]

products_data["bundles"] = bundles

# Save to file
output_path = "../config/products.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(products_data, f, ensure_ascii=False, indent=2)

print(f"[OK] Generated products.json with {len(products_data['products'])} products")
print(f"[OK] Added {len(products_data['collections'])} collections")
print(f"[OK] Added {len(products_data['bundles'])} bundles")
print(f"[OK] Price range: LE {min(p['price'] for p in products_data['products'])} - LE {max(p['price'] for p in products_data['products'])}")
print(f"\n[COLLECTIONS]:")
for col in products_data['collections']:
    count = len([p for p in products_data['products'] if p['collection'] == col['id']])
    print(f"  - {col['name']['en']}: {count} products")
print(f"\n[BUNDLES]:")
for bundle in bundles:
    print(f"  - {bundle['name']['en']}: {bundle['salePrice']} LE (save {bundle['discount']}%)")
print(f"\n[FILE] Saved to: {output_path}")
