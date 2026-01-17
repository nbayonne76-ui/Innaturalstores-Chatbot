/**
 * Phase 1: Benefits Analysis
 * Extracts and categorizes all benefits from the product catalog
 */

const fs = require('fs');
const path = require('path');

class BenefitsAnalyzer {
  constructor() {
    this.productsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../config/products.json'), 'utf8')
    );
  }

  /**
   * Extract all benefits from all products and categorize them
   * @returns {Object} Categorized benefits matrix
   */
  analyzeBenefits() {
    const benefitsMatrix = {
      hair: {},
      body: {},
      stats: {
        totalProducts: 0,
        hairProducts: 0,
        bodyProducts: 0,
        totalUniqueBenefits: 0
      }
    };

    const benefitOccurrences = {
      hair: {},
      body: {}
    };

    // Iterate through all products
    this.productsData.products.forEach(product => {
      benefitsMatrix.stats.totalProducts++;

      const category = product.category || 'hair'; // Default to hair if not specified

      if (category === 'hair') {
        benefitsMatrix.stats.hairProducts++;
      } else if (category === 'body') {
        benefitsMatrix.stats.bodyProducts++;
      }

      // Extract English benefits (we'll use these as canonical)
      if (product.benefits && product.benefits.en) {
        product.benefits.en.forEach(benefit => {
          // Normalize benefit text (remove extra spaces, lowercase for matching)
          const normalized = this.normalizeBenefit(benefit);
          const category_key = this.categorizeBenefit(normalized);

          // Track occurrences
          if (!benefitOccurrences[category][category_key]) {
            benefitOccurrences[category][category_key] = {
              text: benefit,
              normalized: normalized,
              products: [],
              count: 0
            };
          }

          benefitOccurrences[category][category_key].products.push({
            id: product.id,
            name: product.name.en,
            type: product.type
          });
          benefitOccurrences[category][category_key].count++;
        });
      }

      // Also track concerns (they help understand what problems products solve)
      if (product.concerns) {
        product.concerns.forEach(concern => {
          const concernKey = `concern_${concern}`;

          if (!benefitOccurrences[category][concernKey]) {
            benefitOccurrences[category][concernKey] = {
              text: concern.replace(/-/g, ' '),
              type: 'concern',
              products: [],
              count: 0
            };
          }

          benefitOccurrences[category][concernKey].products.push({
            id: product.id,
            name: product.name.en,
            type: product.type
          });
          benefitOccurrences[category][concernKey].count++;
        });
      }
    });

    // Organize benefits by frequency (only include benefits appearing in 2+ products)
    ['hair', 'body'].forEach(category => {
      Object.keys(benefitOccurrences[category]).forEach(key => {
        const data = benefitOccurrences[category][key];

        // Only include benefits that appear in at least 2 products
        if (data.count >= 2) {
          const benefitCategory = this.getBenefitCategory(key, data.text);

          if (!benefitsMatrix[category][benefitCategory]) {
            benefitsMatrix[category][benefitCategory] = [];
          }

          benefitsMatrix[category][benefitCategory].push({
            key: key,
            text: data.text,
            normalized: data.normalized,
            count: data.count,
            products: data.products,
            type: data.type || 'benefit'
          });
        }
      });

      // Sort by count (most common first)
      Object.keys(benefitsMatrix[category]).forEach(cat => {
        benefitsMatrix[category][cat].sort((a, b) => b.count - a.count);
      });
    });

    // Calculate total unique benefits
    benefitsMatrix.stats.totalUniqueBenefits =
      Object.values(benefitsMatrix.hair).flat().length +
      Object.values(benefitsMatrix.body).flat().length;

    return benefitsMatrix;
  }

  /**
   * Normalize benefit text for matching
   */
  normalizeBenefit(benefit) {
    return benefit
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[:.]/g, '');
  }

  /**
   * Categorize a benefit into a key
   */
  categorizeBenefit(benefit) {
    // Create a simple key from the benefit
    // Extract main keywords
    const keywords = benefit
      .replace(/promotes|provides|enhances|leaves|protects|prevents|reduces|repairs|restores|strengthens|nourishes|hydrates|moisturizes|revitalizes|suitable for/gi, '')
      .trim()
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 3)
      .join('_');

    return keywords || benefit.slice(0, 20).replace(/\s/g, '_');
  }

  /**
   * Group benefits into logical categories
   */
  getBenefitCategory(key, text) {
    const lowerText = text.toLowerCase();

    // Hydration/Moisture
    if (lowerText.includes('hydrat') || lowerText.includes('moisture') || lowerText.includes('moisturiz')) {
      return 'hydration';
    }

    // Growth/Density
    if (lowerText.includes('growth') || lowerText.includes('density') || lowerText.includes('thicken') || lowerText.includes('volume')) {
      return 'growth';
    }

    // Strength/Fortification
    if (lowerText.includes('strength') || lowerText.includes('fortif') || lowerText.includes('strong')) {
      return 'strength';
    }

    // Repair/Damage
    if (lowerText.includes('repair') || lowerText.includes('restor') || lowerText.includes('damage') || lowerText.includes('split')) {
      return 'repair';
    }

    // Shine/Luster
    if (lowerText.includes('shine') || lowerText.includes('luster') || lowerText.includes('glossy') || lowerText.includes('shiny')) {
      return 'shine';
    }

    // Softness
    if (lowerText.includes('soft') || lowerText.includes('smooth') || lowerText.includes('silky')) {
      return 'softness';
    }

    // Hair Loss/Anti-fall
    if (lowerText.includes('hair loss') || lowerText.includes('hair-loss') || lowerText.includes('fall') || lowerText.includes('shedding')) {
      return 'hair_loss';
    }

    // Dandruff/Scalp
    if (lowerText.includes('dandruff') || lowerText.includes('scalp') || lowerText.includes('flak')) {
      return 'scalp_health';
    }

    // Frizz Control
    if (lowerText.includes('frizz') || lowerText.includes('flyaway')) {
      return 'frizz_control';
    }

    // Nourishment
    if (lowerText.includes('nourish') || lowerText.includes('nutri')) {
      return 'nourishment';
    }

    // Protection
    if (lowerText.includes('protect') || lowerText.includes('shield')) {
      return 'protection';
    }

    // Detangling
    if (lowerText.includes('detangle') || lowerText.includes('tangle')) {
      return 'detangling';
    }

    // Curl definition
    if (lowerText.includes('curl') || lowerText.includes('coil')) {
      return 'curl_definition';
    }

    // Skin specific
    if (lowerText.includes('skin') || lowerText.includes('complexion')) {
      return 'skin_health';
    }

    // Stretch marks
    if (lowerText.includes('stretch') || lowerText.includes('scar')) {
      return 'stretch_marks';
    }

    // Other
    return 'other';
  }

  /**
   * Generate a readable report
   */
  generateReport(benefitsMatrix) {
    let report = '\n';
    report += '═══════════════════════════════════════════════════════════\n';
    report += '        📊 BENEFITS ANALYSIS REPORT - PHASE 1\n';
    report += '═══════════════════════════════════════════════════════════\n\n';

    report += `📦 Total Products: ${benefitsMatrix.stats.totalProducts}\n`;
    report += `   💇 Hair Products: ${benefitsMatrix.stats.hairProducts}\n`;
    report += `   🧴 Body Products: ${benefitsMatrix.stats.bodyProducts}\n`;
    report += `✨ Total Unique Benefits: ${benefitsMatrix.stats.totalUniqueBenefits}\n\n`;

    ['hair', 'body'].forEach(category => {
      const categoryName = category.toUpperCase();
      const categories = Object.keys(benefitsMatrix[category]);

      if (categories.length === 0) return;

      report += `\n${'═'.repeat(60)}\n`;
      report += `${categoryName} BENEFITS BREAKDOWN\n`;
      report += `${'═'.repeat(60)}\n\n`;

      categories.forEach(benefitCategory => {
        const benefits = benefitsMatrix[category][benefitCategory];

        report += `\n📌 ${benefitCategory.toUpperCase().replace(/_/g, ' ')}\n`;
        report += `${'─'.repeat(60)}\n`;

        benefits.forEach(benefit => {
          report += `\n  ✓ "${benefit.text}"\n`;
          report += `    Count: ${benefit.count} products\n`;
          report += `    Products: ${benefit.products.map(p => p.name).join(', ')}\n`;
        });
      });
    });

    report += `\n${'═'.repeat(60)}\n`;
    report += 'END OF REPORT\n';
    report += `${'═'.repeat(60)}\n`;

    return report;
  }

  /**
   * Save analysis to JSON file
   */
  saveAnalysis(benefitsMatrix, filename = 'benefitsAnalysis.json') {
    const outputPath = path.join(__dirname, '../config', filename);
    fs.writeFileSync(
      outputPath,
      JSON.stringify(benefitsMatrix, null, 2),
      'utf8'
    );
    console.log(`\n✅ Analysis saved to: ${outputPath}\n`);
  }
}

// Run the analysis
if (require.main === module) {
  const analyzer = new BenefitsAnalyzer();
  const benefitsMatrix = analyzer.analyzeBenefits();

  // Generate and display report
  const report = analyzer.generateReport(benefitsMatrix);
  console.log(report);

  // Save to file
  analyzer.saveAnalysis(benefitsMatrix);
}

module.exports = BenefitsAnalyzer;
