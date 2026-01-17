# Performance Benchmarking Scripts

This directory contains scripts for measuring and comparing API performance.

## Overview

- **`benchmark.js`** - Main benchmarking tool that measures response times, throughput, and cache performance
- **`compare-benchmarks.js`** - Comparison tool to analyze performance improvements between two benchmark runs

## Quick Start

### 1. Run Initial Benchmark (Before Optimizations)

```bash
# Start your server first
npm start

# In another terminal, run the benchmark
node scripts/benchmark.js

# Save the baseline results
mv benchmark-results.json benchmark-before.json
```

### 2. Apply Optimizations

Make your performance improvements (Phase 5):
- Enable caching
- Add compression
- Optimize queries
- etc.

### 3. Run New Benchmark (After Optimizations)

```bash
# Server should still be running
node scripts/benchmark.js

# Save the new results
mv benchmark-results.json benchmark-after.json
```

### 4. Compare Results

```bash
node scripts/compare-benchmarks.js benchmark-before.json benchmark-after.json
```

This will show you:
- Response time improvements
- Throughput increases
- Cache hit rates
- Performance gains per endpoint

## Detailed Usage

### benchmark.js

Runs a comprehensive performance test against all API endpoints.

**What it measures:**
- Response times (average, median, P95, P99, min, max)
- Throughput (requests per second)
- Success/failure rates
- Response sizes
- Cache hit rates
- Overall performance assessment

**Configuration:**

You can customize the benchmark by setting environment variables:

```bash
# Change base URL (default: http://localhost:5000)
BASE_URL=http://production-url.com node scripts/benchmark.js

# Or edit the script directly:
# NUM_REQUESTS = 100  (requests per endpoint)
# CONCURRENCY = 10    (concurrent requests)
```

**Endpoints tested:**
- Health checks (comprehensive, liveness, readiness)
- Prometheus metrics
- Metrics summary
- Cache statistics
- Products list
- Greeting endpoint
- Monitoring metrics

**Output:**

The script produces:
1. **Console output** - Real-time results with color-coded performance assessment
2. **JSON file** - `benchmark-results.json` with detailed metrics for later analysis

**Example output:**

```
Benchmarking: Health Check (Comprehensive)
  Method: GET /api/health
  Requests: 50
  Concurrency: 10

Results:
  ✓ Successful: 50/50

  Response Times:
    Average: 45.23ms
    Median:  42.10ms
    P95:     68.50ms
    P99:     82.30ms
    Min:     28.10ms
    Max:     95.40ms

  Throughput:
    Requests/sec: 156.32
    Total time:   0.32s

  Response Size:
    Average: 2.34 KB

  Cache Performance:
    Hit Rate: 84.00%

  Assessment: Excellent
```

**Performance Ratings:**
- **Excellent**: < 100ms average
- **Good**: 100-500ms average
- **Acceptable**: 500-1000ms average
- **Slow**: 1000-2000ms average
- **Critical**: > 2000ms average

### compare-benchmarks.js

Analyzes two benchmark results to show performance improvements.

**Usage:**

```bash
node scripts/compare-benchmarks.js <before-file> <after-file>
```

**Example:**

```bash
node scripts/compare-benchmarks.js benchmark-before.json benchmark-after.json
```

**What it shows:**

1. **Per-endpoint comparison**
   - Response time changes
   - P95 percentile changes
   - Throughput changes

2. **Overall statistics**
   - Average improvement across all endpoints
   - Best and worst performing endpoints
   - Cache performance changes

3. **Assessment**
   - Color-coded improvements (green = good, red = regression)
   - Recommendations for further optimization

**Example output:**

```
╔═══════════════════════════════════════════════════════╗
║         Benchmark Comparison Report                  ║
╚═══════════════════════════════════════════════════════╝

Before: 2024-01-15T10:30:00.000Z
After:  2024-01-15T11:00:00.000Z

====================================================================================================
Endpoint                      Avg Before     Avg After      Change         P95 Change     RPS Change
----------------------------------------------------------------------------------------------------
Health Check (Comprehensive)  125.34ms       45.23ms        -63.9%        -68.2%         +178.5%
Products List                 234.56ms       52.10ms        -77.8%        -82.1%         +350.2%
Metrics Summary               89.23ms        28.45ms        -68.1%        -71.3%         +213.6%
====================================================================================================

Overall Performance Change:
  Average Response Time:  -69.9%
  P95 Response Time:      -73.9%
  Requests Per Second:    +247.4%

Highlights:
  Best Improvement:  Products List (-77.8% avg response time)
  Worst Improvement: Cache Stats (-45.2% avg response time)

Cache Performance:
  Before: 12.5% hit rate
  After:  84.0% hit rate

Assessment:
  ✓ Excellent improvement! 69.9% faster on average
```

## Workflow for Performance Testing

### During Development

1. **Establish Baseline**
   ```bash
   node scripts/benchmark.js
   cp benchmark-results.json benchmarks/baseline-$(date +%Y%m%d).json
   ```

2. **Make Changes**
   - Implement caching
   - Add compression
   - Optimize database queries
   - etc.

3. **Measure Impact**
   ```bash
   node scripts/benchmark.js
   node scripts/compare-benchmarks.js benchmarks/baseline-*.json benchmark-results.json
   ```

4. **Iterate**
   - If improvement is good, keep changes
   - If regression, investigate and adjust
   - Repeat until target performance achieved

### Before Production Deployment

Run comprehensive benchmarks to ensure:
- ✅ Response times meet SLA requirements
- ✅ Throughput can handle expected load
- ✅ No performance regressions
- ✅ Caching is working effectively

### After Production Deployment

- Run benchmarks weekly to detect performance drift
- Compare against baseline to catch regressions early
- Use results to plan future optimizations

## Integration with Load Testing

These benchmarks complement the k6 load tests:

**Benchmarks (scripts/benchmark.js):**
- Quick performance checks
- Per-endpoint detailed metrics
- Easy to run locally
- Good for development iteration

**Load Tests (loadtests/*.js):**
- Comprehensive stress testing
- Multi-user scenarios
- Breaking point identification
- Good for production readiness

**Recommended workflow:**
1. Use **benchmarks** during development for quick feedback
2. Use **load tests** before deployment for comprehensive validation

## Tips for Accurate Benchmarking

### 1. Consistent Environment

- Run on same machine/server
- Close other applications
- Use same database state
- Same network conditions

### 2. Warm-up

The first few requests may be slower due to:
- JIT compilation
- Cache warming
- Database connection pooling

Consider running a warm-up round before measuring.

### 3. Multiple Runs

For critical measurements:
```bash
# Run 3 times and average results
for i in {1..3}; do
  node scripts/benchmark.js
  mv benchmark-results.json benchmark-run-$i.json
done
```

### 4. Production-like Data

- Use realistic database size
- Test with actual data volumes
- Consider database indexes

### 5. Monitor System Resources

While benchmarking, monitor:
- CPU usage
- Memory consumption
- Network I/O
- Database connections

## Troubleshooting

### "Connection refused" errors

```bash
# Ensure server is running
npm start

# Or check if different port
BASE_URL=http://localhost:3000 node scripts/benchmark.js
```

### Slow benchmarks

```bash
# Reduce number of requests for faster tests
# Edit benchmark.js:
const NUM_REQUESTS = 20;  // Instead of 100
const CONCURRENCY = 5;    // Instead of 10
```

### High variance in results

- Close other applications
- Run multiple times and average
- Increase number of requests for more stable statistics
- Check for background processes (virus scanners, backups, etc.)

### Out of memory

```bash
# Reduce concurrency
# Edit benchmark.js:
const CONCURRENCY = 5;  // Lower value
```

## Advanced Usage

### Custom Endpoints

Edit `benchmark.js` to add your own endpoints:

```javascript
// Add custom endpoint benchmark
stats = await benchmark.benchmarkEndpoint(
  'My Custom Endpoint',
  'POST',
  '/api/my-endpoint',
  { payload: 'data' },
  50  // number of requests
);
benchmark.printStats(stats);
```

### Custom Analysis

Load and analyze results programmatically:

```javascript
const { loadResults } = require('./compare-benchmarks');

const results = loadResults('benchmark-results.json');

// Find slowest endpoint
const slowest = results.results.reduce((max, r) =>
  r.averageDuration > max.averageDuration ? r : max
);

console.log('Slowest endpoint:', slowest.name, slowest.averageDuration);
```

### CI/CD Integration

Add to GitHub Actions or other CI:

```yaml
- name: Run performance benchmarks
  run: |
    node scripts/benchmark.js

- name: Check performance thresholds
  run: |
    node -e "
      const results = require('./benchmark-results.json');
      const avgResponseTime = results.results.reduce((sum, r) =>
        sum + r.averageDuration, 0) / results.results.length;

      if (avgResponseTime > 500) {
        console.error('Performance threshold exceeded!');
        process.exit(1);
      }
    "

- name: Upload benchmark results
  uses: actions/upload-artifact@v3
  with:
    name: benchmark-results
    path: benchmark-results.json
```

## Output Files

After running benchmarks, you'll have:

- `benchmark-results.json` - Latest benchmark results
- `benchmark-before.json` - Baseline (manual save)
- `benchmark-after.json` - After optimizations (manual save)

**JSON structure:**

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "baseUrl": "http://localhost:5000",
  "configuration": {
    "numRequests": 100,
    "concurrency": 10
  },
  "results": [
    {
      "name": "Health Check",
      "method": "GET",
      "path": "/api/health",
      "totalRequests": 50,
      "successfulRequests": 50,
      "averageDuration": 45.23,
      "p95Duration": 68.50,
      "requestsPerSecond": 156.32,
      "cacheHitRate": "84.00"
    }
  ]
}
```

## Best Practices

1. **Establish Baseline Early**
   - Run benchmarks before any optimizations
   - Keep baseline results for comparison

2. **Test One Change at a Time**
   - Isolate the impact of each optimization
   - Makes it easier to identify what works

3. **Document Your Results**
   - Keep a log of benchmarks and changes
   - Track performance over time

4. **Set Performance Budgets**
   - Define acceptable response times
   - Fail CI if budgets exceeded

5. **Regular Monitoring**
   - Weekly benchmarks to catch drift
   - Alert on significant regressions

## Resources

- [Performance Testing Best Practices](https://web.dev/performance/)
- [HTTP Benchmarking Guide](https://www.nginx.com/blog/http-benchmarking-best-practices/)
- [Node.js Performance Tips](https://nodejs.org/en/docs/guides/simple-profiling/)

## Support

For issues with benchmarking:
1. Check server is running and accessible
2. Review benchmark configuration (requests, concurrency)
3. Ensure consistent test environment
4. Check system resources during tests
