/**
 * Performance Benchmarking Script
 * Measures response times and throughput for all endpoints
 *
 * Usage: node scripts/benchmark.js
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const NUM_REQUESTS = 100;
const CONCURRENCY = 10;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

class Benchmark {
  constructor() {
    this.results = [];
  }

  /**
   * Make HTTP request and measure timing
   */
  async request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        method,
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
      };

      if (body) {
        const bodyStr = JSON.stringify(body);
        options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
      }

      const startTime = Date.now();
      let responseSize = 0;
      let statusCode = 0;
      let cacheStatus = 'MISS';

      const req = client.request(options, (res) => {
        statusCode = res.statusCode;
        cacheStatus = res.headers['x-cache'] || 'MISS';

        res.on('data', (chunk) => {
          responseSize += chunk.length;
        });

        res.on('end', () => {
          const duration = Date.now() - startTime;
          resolve({
            duration,
            statusCode,
            responseSize,
            cacheStatus,
            success: statusCode >= 200 && statusCode < 300,
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.setTimeout(10000); // 10s timeout

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Run benchmark for an endpoint
   */
  async benchmarkEndpoint(name, method, path, body = null, numRequests = NUM_REQUESTS) {
    console.log(`\n${colors.cyan}Benchmarking: ${name}${colors.reset}`);
    console.log(`  Method: ${method} ${path}`);
    console.log(`  Requests: ${numRequests}`);
    console.log(`  Concurrency: ${CONCURRENCY}`);

    const results = [];
    const errors = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    const startTime = Date.now();

    // Run requests in batches (concurrency control)
    for (let i = 0; i < numRequests; i += CONCURRENCY) {
      const batch = [];
      const batchSize = Math.min(CONCURRENCY, numRequests - i);

      for (let j = 0; j < batchSize; j++) {
        batch.push(
          this.request(method, path, body)
            .then((result) => {
              results.push(result);
              if (result.cacheStatus === 'HIT') cacheHits++;
              else if (result.cacheStatus === 'MISS') cacheMisses++;
            })
            .catch((error) => {
              errors.push(error.message);
            })
        );
      }

      await Promise.all(batch);

      // Progress indicator
      const progress = Math.round(((i + batchSize) / numRequests) * 100);
      process.stdout.write(`\r  Progress: ${progress}%`);
    }

    const totalTime = Date.now() - startTime;
    process.stdout.write('\r\x1b[K'); // Clear progress line

    // Calculate statistics
    const durations = results.map((r) => r.duration);
    durations.sort((a, b) => a - b);

    const stats = {
      name,
      method,
      path,
      totalRequests: numRequests,
      successfulRequests: results.filter((r) => r.success).length,
      failedRequests: errors.length,
      totalTime,
      averageDuration: this.mean(durations),
      medianDuration: this.percentile(durations, 50),
      p95Duration: this.percentile(durations, 95),
      p99Duration: this.percentile(durations, 99),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      requestsPerSecond: (results.length / totalTime) * 1000,
      averageResponseSize: this.mean(results.map((r) => r.responseSize)),
      cacheHitRate: ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(2),
      errors,
    };

    this.results.push(stats);
    return stats;
  }

  /**
   * Calculate mean
   */
  mean(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * Calculate percentile
   */
  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Print statistics
   */
  printStats(stats) {
    console.log(`\n${colors.bold}Results:${colors.reset}`);
    console.log(
      `  ${colors.green}✓${colors.reset} Successful: ${stats.successfulRequests}/${stats.totalRequests}`
    );

    if (stats.failedRequests > 0) {
      console.log(`  ${colors.red}✗${colors.reset} Failed: ${stats.failedRequests}`);
    }

    console.log(`\n  ${colors.bold}Response Times:${colors.reset}`);
    console.log(`    Average: ${stats.averageDuration.toFixed(2)}ms`);
    console.log(`    Median:  ${stats.medianDuration.toFixed(2)}ms`);
    console.log(`    P95:     ${stats.p95Duration.toFixed(2)}ms`);
    console.log(`    P99:     ${stats.p99Duration.toFixed(2)}ms`);
    console.log(`    Min:     ${stats.minDuration.toFixed(2)}ms`);
    console.log(`    Max:     ${stats.maxDuration.toFixed(2)}ms`);

    console.log(`\n  ${colors.bold}Throughput:${colors.reset}`);
    console.log(`    Requests/sec: ${stats.requestsPerSecond.toFixed(2)}`);
    console.log(`    Total time:   ${(stats.totalTime / 1000).toFixed(2)}s`);

    console.log(`\n  ${colors.bold}Response Size:${colors.reset}`);
    console.log(`    Average: ${(stats.averageResponseSize / 1024).toFixed(2)} KB`);

    if (stats.cacheHitRate > 0) {
      console.log(`\n  ${colors.bold}Cache Performance:${colors.reset}`);
      console.log(`    Hit Rate: ${stats.cacheHitRate}%`);
    }

    // Performance assessment
    const avgDuration = stats.averageDuration;
    let assessment = '';
    let color = colors.green;

    if (avgDuration < 100) {
      assessment = 'Excellent';
      color = colors.green;
    } else if (avgDuration < 500) {
      assessment = 'Good';
      color = colors.green;
    } else if (avgDuration < 1000) {
      assessment = 'Acceptable';
      color = colors.yellow;
    } else if (avgDuration < 2000) {
      assessment = 'Slow';
      color = colors.yellow;
    } else {
      assessment = 'Critical';
      color = colors.red;
    }

    console.log(`\n  ${colors.bold}Assessment:${colors.reset} ${color}${assessment}${colors.reset}`);
  }

  /**
   * Print summary table
   */
  printSummary() {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`${colors.bold}BENCHMARK SUMMARY${colors.reset}`);
    console.log('='.repeat(80));

    console.log(
      '\n' +
        'Endpoint'.padEnd(30) +
        'Avg (ms)'.padEnd(12) +
        'P95 (ms)'.padEnd(12) +
        'RPS'.padEnd(12) +
        'Cache Hit%'
    );
    console.log('-'.repeat(80));

    this.results.forEach((stats) => {
      const name = stats.name.substring(0, 28).padEnd(30);
      const avg = stats.averageDuration.toFixed(1).padEnd(12);
      const p95 = stats.p95Duration.toFixed(1).padEnd(12);
      const rps = stats.requestsPerSecond.toFixed(1).padEnd(12);
      const cache = stats.cacheHitRate.padEnd(10);

      console.log(`${name}${avg}${p95}${rps}${cache}`);
    });

    console.log('\n' + '='.repeat(80));

    // Overall statistics
    const totalRequests = this.results.reduce((sum, r) => sum + r.totalRequests, 0);
    const successfulRequests = this.results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const averageRPS = this.mean(this.results.map((r) => r.requestsPerSecond));
    const averageResponseTime = this.mean(this.results.map((r) => r.averageDuration));

    console.log(`\n${colors.bold}Overall Statistics:${colors.reset}`);
    console.log(`  Total Requests: ${totalRequests}`);
    console.log(`  Successful: ${successfulRequests} (${((successfulRequests / totalRequests) * 100).toFixed(2)}%)`);
    console.log(`  Average RPS: ${averageRPS.toFixed(2)}`);
    console.log(`  Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
  }

  /**
   * Save results to JSON file
   */
  saveResults(filename = 'benchmark-results.json') {
    const fs = require('fs');
    const data = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      configuration: {
        numRequests: NUM_REQUESTS,
        concurrency: CONCURRENCY,
      },
      results: this.results,
    };

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`\n${colors.green}✓${colors.reset} Results saved to ${filename}`);
  }
}

/**
 * Run all benchmarks
 */
async function runBenchmarks() {
  console.log(`${colors.bold}
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║           Performance Benchmark Suite                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Requests per endpoint: ${NUM_REQUESTS}`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  const benchmark = new Benchmark();

  try {
    // Benchmark health checks (should be very fast)
    let stats = await benchmark.benchmarkEndpoint(
      'Health Check (Comprehensive)',
      'GET',
      '/api/health',
      null,
      50
    );
    benchmark.printStats(stats);

    stats = await benchmark.benchmarkEndpoint('Health Check (Liveness)', 'GET', '/api/health/live', null, 50);
    benchmark.printStats(stats);

    stats = await benchmark.benchmarkEndpoint('Health Check (Readiness)', 'GET', '/api/health/ready', null, 50);
    benchmark.printStats(stats);

    // Benchmark metrics endpoints
    stats = await benchmark.benchmarkEndpoint('Prometheus Metrics', 'GET', '/metrics', null, 50);
    benchmark.printStats(stats);

    stats = await benchmark.benchmarkEndpoint('Metrics Summary', 'GET', '/api/metrics/summary', null, 50);
    benchmark.printStats(stats);

    // Benchmark cache endpoints
    stats = await benchmark.benchmarkEndpoint('Cache Stats', 'GET', '/api/cache/stats', null, 50);
    benchmark.printStats(stats);

    // Benchmark products endpoint (should benefit from caching)
    stats = await benchmark.benchmarkEndpoint('Products List', 'GET', '/api/products?language=en', null, 100);
    benchmark.printStats(stats);

    // Benchmark greeting endpoint
    stats = await benchmark.benchmarkEndpoint('Greeting', 'GET', '/api/greeting?language=en', null, 50);
    benchmark.printStats(stats);

    // Benchmark monitoring endpoints
    stats = await benchmark.benchmarkEndpoint('Monitoring Metrics', 'GET', '/api/monitoring', null, 50);
    benchmark.printStats(stats);

    // Print summary
    benchmark.printSummary();

    // Save results
    benchmark.saveResults();

    console.log(`\n${colors.green}${colors.bold}✓ Benchmark completed successfully!${colors.reset}\n`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}✗ Benchmark failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run benchmarks
if (require.main === module) {
  runBenchmarks().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = Benchmark;
