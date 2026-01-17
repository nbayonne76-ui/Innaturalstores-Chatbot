/**
 * Benchmark Comparison Tool
 * Compares two benchmark results to show performance improvements
 *
 * Usage: node scripts/compare-benchmarks.js before.json after.json
 */

const fs = require('fs');
const path = require('path');

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function loadResults(filename) {
  const filepath = path.resolve(filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  const data = fs.readFileSync(filepath, 'utf8');
  return JSON.parse(data);
}

function formatImprovement(before, after) {
  const improvement = ((before - after) / before) * 100;
  const sign = improvement > 0 ? '-' : '+';
  const absImprovement = Math.abs(improvement);
  const color = improvement > 0 ? colors.green : colors.red;

  return `${color}${sign}${absImprovement.toFixed(1)}%${colors.reset}`;
}

function formatValue(value, unit = 'ms') {
  return `${value.toFixed(2)}${unit}`;
}

function compareResults(before, after) {
  console.log(`${colors.bold}
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║         Benchmark Comparison Report                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`\n${colors.cyan}Before:${colors.reset} ${before.timestamp}`);
  console.log(`${colors.cyan}After:${colors.reset}  ${after.timestamp}`);

  // Match endpoints by name
  const beforeMap = new Map(before.results.map((r) => [r.name, r]));
  const afterMap = new Map(after.results.map((r) => [r.name, r]));

  // Find common endpoints
  const commonEndpoints = [...beforeMap.keys()].filter((name) => afterMap.has(name));

  if (commonEndpoints.length === 0) {
    console.log(`\n${colors.yellow}⚠ No common endpoints found to compare${colors.reset}`);
    return;
  }

  console.log(`\n${'='.repeat(100)}`);
  console.log(
    'Endpoint'.padEnd(30) +
      'Avg Before'.padEnd(15) +
      'Avg After'.padEnd(15) +
      'Change'.padEnd(15) +
      'P95 Change'.padEnd(15) +
      'RPS Change'
  );
  console.log('-'.repeat(100));

  const improvements = [];

  commonEndpoints.forEach((name) => {
    const beforeStats = beforeMap.get(name);
    const afterStats = afterMap.get(name);

    const avgBefore = beforeStats.averageDuration;
    const avgAfter = afterStats.averageDuration;
    const p95Before = beforeStats.p95Duration;
    const p95After = afterStats.p95Duration;
    const rpsBefore = beforeStats.requestsPerSecond;
    const rpsAfter = afterStats.requestsPerSecond;

    const avgImprovement = ((avgBefore - avgAfter) / avgBefore) * 100;
    const p95Improvement = ((p95Before - p95After) / p95Before) * 100;
    const rpsImprovement = ((rpsAfter - rpsBefore) / rpsBefore) * 100;

    improvements.push({
      name,
      avgImprovement,
      p95Improvement,
      rpsImprovement,
    });

    console.log(
      name.substring(0, 28).padEnd(30) +
        formatValue(avgBefore).padEnd(15) +
        formatValue(avgAfter).padEnd(15) +
        formatImprovement(avgBefore, avgAfter).padEnd(25) +
        formatImprovement(p95Before, p95After).padEnd(25) +
        formatImprovement(rpsBefore, rpsAfter)
    );
  });

  console.log('='.repeat(100));

  // Calculate overall improvements
  const avgAvgImprovement =
    improvements.reduce((sum, i) => sum + i.avgImprovement, 0) / improvements.length;
  const avgP95Improvement =
    improvements.reduce((sum, i) => sum + i.p95Improvement, 0) / improvements.length;
  const avgRpsImprovement =
    improvements.reduce((sum, i) => sum + i.rpsImprovement, 0) / improvements.length;

  console.log(`\n${colors.bold}Overall Performance Change:${colors.reset}`);
  console.log(`  Average Response Time:  ${formatImprovement(100, 100 - avgAvgImprovement)}`);
  console.log(`  P95 Response Time:      ${formatImprovement(100, 100 - avgP95Improvement)}`);
  console.log(`  Requests Per Second:    ${formatImprovement(100, 100 + avgRpsImprovement)}`);

  // Identify best and worst improvements
  const sorted = [...improvements].sort((a, b) => b.avgImprovement - a.avgImprovement);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  console.log(`\n${colors.bold}Highlights:${colors.reset}`);
  console.log(
    `  ${colors.green}Best Improvement:${colors.reset}  ${best.name} (${best.avgImprovement > 0 ? '-' : '+'}${Math.abs(best.avgImprovement).toFixed(1)}% avg response time)`
  );
  console.log(
    `  ${colors.yellow}Worst Improvement:${colors.reset} ${worst.name} (${worst.avgImprovement > 0 ? '-' : '+'}${Math.abs(worst.avgImprovement).toFixed(1)}% avg response time)`
  );

  // Cache performance comparison (if available)
  const beforeCache = before.results.find((r) => r.cacheHitRate > 0);
  const afterCache = after.results.find((r) => r.cacheHitRate > 0);

  if (beforeCache && afterCache) {
    console.log(`\n${colors.bold}Cache Performance:${colors.reset}`);
    console.log(`  Before: ${beforeCache.cacheHitRate}% hit rate`);
    console.log(`  After:  ${afterCache.cacheHitRate}% hit rate`);
  }

  // Overall assessment
  console.log(`\n${colors.bold}Assessment:${colors.reset}`);
  if (avgAvgImprovement > 20) {
    console.log(
      `  ${colors.green}✓ Excellent improvement! ${avgAvgImprovement.toFixed(1)}% faster on average${colors.reset}`
    );
  } else if (avgAvgImprovement > 10) {
    console.log(
      `  ${colors.green}✓ Good improvement! ${avgAvgImprovement.toFixed(1)}% faster on average${colors.reset}`
    );
  } else if (avgAvgImprovement > 0) {
    console.log(
      `  ${colors.yellow}Modest improvement. ${avgAvgImprovement.toFixed(1)}% faster on average${colors.reset}`
    );
  } else {
    console.log(
      `  ${colors.red}⚠ Performance degraded. ${Math.abs(avgAvgImprovement).toFixed(1)}% slower on average${colors.reset}`
    );
  }

  // Recommendations
  if (avgAvgImprovement < 0) {
    console.log(`\n${colors.bold}Recommendations:${colors.reset}`);
    console.log(`  - Review recent changes that may have impacted performance`);
    console.log(`  - Check if caching is properly configured and working`);
    console.log(`  - Investigate slow endpoints identified above`);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.log(`
${colors.bold}Usage:${colors.reset} node scripts/compare-benchmarks.js <before.json> <after.json>

${colors.bold}Example:${colors.reset}
  node scripts/compare-benchmarks.js benchmark-before.json benchmark-after.json

${colors.bold}Description:${colors.reset}
  Compares two benchmark result files and shows performance improvements
  or regressions between them.

${colors.bold}Workflow:${colors.reset}
  1. Run baseline benchmark: node scripts/benchmark.js
  2. Save results: mv benchmark-results.json benchmark-before.json
  3. Apply optimizations (caching, compression, etc.)
  4. Run new benchmark: node scripts/benchmark.js
  5. Save results: mv benchmark-results.json benchmark-after.json
  6. Compare: node scripts/compare-benchmarks.js benchmark-before.json benchmark-after.json
    `);
    process.exit(1);
  }

  try {
    const beforeFile = args[0];
    const afterFile = args[1];

    console.log(`Loading ${beforeFile}...`);
    const before = loadResults(beforeFile);

    console.log(`Loading ${afterFile}...`);
    const after = loadResults(afterFile);

    compareResults(before, after);

    console.log(`\n${colors.green}✓ Comparison completed${colors.reset}\n`);
  } catch (error) {
    console.error(`\n${colors.red}Error:${colors.reset} ${error.message}\n`);
    process.exit(1);
  }
}

module.exports = { compareResults, loadResults };
