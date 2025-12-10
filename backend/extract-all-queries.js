const fs = require('fs');
const path = require('path');

const kb = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/INnatural_Chatbot_Knowledge_Base_v2.json'), 'utf8')
);

let output = '# 📋 TOUTES LES QUESTIONS QUE LE CHATBOT PEUT ANTICIPER\n\n';
output += '## Knowledge Base v2.0 - INnatural Stores\n\n';
output += `**Date**: ${new Date().toLocaleDateString('fr-FR')}\n`;
output += `**Version KB**: ${kb.metadata.version}\n`;
output += `**Last Updated**: ${kb.metadata.last_updated}\n\n`;
output += '---\n\n';

let totalQueries = 0;
let totalArQueries = 0;
let totalEnQueries = 0;

kb.categories.forEach((category, catIdx) => {
  output += `\n## ${catIdx + 1}. ${category.category_name.ar} / ${category.category_name.en}\n\n`;
  output += `**Priority**: ${category.priority}\n`;
  output += `**Description AR**: ${category.description.ar}\n`;
  output += `**Description EN**: ${category.description.en}\n\n`;

  category.scenarios.forEach((scenario, scIdx) => {
    output += `\n### ${catIdx + 1}.${scIdx + 1} [${scenario.scenario_id}]\n`;
    output += `**Priority**: ${scenario.priority}\n\n`;

    // Arabic queries
    const arQueries = scenario.user_queries.ar || [];
    output += `#### 🇪🇬 Questions en Arabe (${arQueries.length}):\n`;
    arQueries.forEach((q, i) => {
      output += `${i + 1}. "${q}"\n`;
    });
    totalArQueries += arQueries.length;

    // English queries
    const enQueries = scenario.user_queries.en || [];
    output += `\n#### 🇬🇧 Questions en Anglais (${enQueries.length}):\n`;
    enQueries.forEach((q, i) => {
      output += `${i + 1}. "${q}"\n`;
    });
    totalEnQueries += enQueries.length;

    totalQueries += arQueries.length + enQueries.length;

    // Keywords
    output += `\n**🔑 Keywords AR**: ${(scenario.keywords.ar || []).join(', ')}\n`;
    output += `**🔑 Keywords EN**: ${(scenario.keywords.en || []).join(', ')}\n`;

    // Tags
    output += `**🏷️ Tags AR**: ${(scenario.tags.ar || []).join(', ')}\n`;
    output += `**🏷️ Tags EN**: ${(scenario.tags.en || []).join(', ')}\n\n`;
    output += '---\n';
  });
});

// Add synonyms section
output += `\n\n## 🔄 SYNONYMS SYSTEM\n\n`;
output += `Le système comprend aussi les **variations et synonymes** pour chaque terme:\n\n`;
output += `### Synonyms Arabes (${Object.keys(kb.synonyms.ar).length} termes principaux):\n\n`;
Object.entries(kb.synonyms.ar).forEach(([term, variations]) => {
  output += `- **${term}**: ${variations.join(', ')}\n`;
});

output += `\n### Synonyms Anglais (${Object.keys(kb.synonyms.en).length} termes principaux):\n\n`;
Object.entries(kb.synonyms.en).forEach(([term, variations]) => {
  output += `- **${term}**: ${variations.join(', ')}\n`;
});

// Statistics
output += `\n\n## 📊 STATISTIQUES TOTALES\n\n`;
output += `- **Total Categories**: ${kb.categories.length}\n`;
output += `- **Total Scenarios**: ${kb.metadata.total_scenarios}\n`;
output += `- **Total Questions anticipées**: ${totalQueries}\n`;
output += `  - Questions en Arabe: ${totalArQueries}\n`;
output += `  - Questions en Anglais: ${totalEnQueries}\n`;
output += `- **Total Synonyms (AR)**: ${Object.keys(kb.synonyms.ar).length} termes × ${Math.round(Object.values(kb.synonyms.ar).reduce((sum, arr) => sum + arr.length, 0) / Object.keys(kb.synonyms.ar).length)} variations avg\n`;
output += `- **Total Synonyms (EN)**: ${Object.keys(kb.synonyms.en).length} termes × ${Math.round(Object.values(kb.synonyms.en).reduce((sum, arr) => sum + arr.length, 0) / Object.keys(kb.synonyms.en).length)} variations avg\n`;

// Search capabilities
output += `\n\n## 🎯 CAPACITÉS DE RECHERCHE\n\n`;
output += `Le chatbot utilise un **système de scoring multi-critères**:\n\n`;
output += `1. **Direct Query Match** (+50 points): Questions exactes de l'utilisateur\n`;
output += `2. **Keywords Match** (+30 points): Mots-clés dans la query\n`;
output += `3. **Tags Match** (+20 points): Tags associés au scenario\n`;
output += `4. **Synonyms Match** (+15 points): Variations et synonymes détectés\n\n`;
output += `**Min Confidence Score**: ${kb.config.min_confidence_score} (30%)\n`;
output += `**Max Results**: ${kb.config.max_results} meilleurs scenarios\n\n`;

output += `\n\n---\n\n`;
output += `**Note**: Le chatbot peut aussi comprendre des **variations naturelles** de ces questions grâce au système de synonymes et au scoring intelligent.\n`;

// Save to file
const outputPath = path.join(__dirname, '../CHATBOT_ANTICIPATED_QUESTIONS.md');
fs.writeFileSync(outputPath, output, 'utf8');

console.log('✅ Liste générée avec succès!');
console.log(`📄 Fichier: ${outputPath}`);
console.log(`\n📊 Statistiques:`);
console.log(`   - ${totalQueries} questions anticipées`);
console.log(`   - ${totalArQueries} en arabe`);
console.log(`   - ${totalEnQueries} en anglais`);
console.log(`   - ${Object.keys(kb.synonyms.ar).length + Object.keys(kb.synonyms.en).length} termes avec synonymes`);
