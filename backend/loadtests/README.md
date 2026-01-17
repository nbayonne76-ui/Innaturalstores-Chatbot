# Load Testing Suite

This directory contains k6 load testing scripts for the INnatural Chatbot API.

## Prerequisites

### Install k6

**Windows:**
```bash
choco install k6
# or
winget install k6
```

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

Or download from: https://k6.io/docs/getting-started/installation/

## Test Scripts

### 1. Basic Load Test (`basic-load.js`)

Tests basic API endpoints with moderate load.

**What it tests:**
- Health check endpoint
- Metrics endpoints
- Basic system responsiveness

**Load profile:**
- Ramp up: 10 → 20 users over 4 minutes
- Duration: ~5 minutes total

**Run:**
```bash
k6 run loadtests/basic-load.js
```

**Custom base URL:**
```bash
k6 run -e BASE_URL=http://production-url.com loadtests/basic-load.js
```

### 2. Chat Load Test (`chat-load.js`)

Tests the chat endpoint with realistic conversation patterns.

**What it tests:**
- Chat API endpoint (`/api/chat`)
- AI response times
- Multi-message conversations
- Session handling

**Load profile:**
- Progressive: 5 → 10 → 15 concurrent users
- Each user sends 3-5 messages per conversation
- Duration: ~12 minutes total

**Run:**
```bash
k6 run loadtests/chat-load.js
```

**Thresholds:**
- P95 response time: < 3 seconds
- Error rate: < 2%
- AI response time: < 3.5 seconds

### 3. Stress Test (`stress-test.js`)

Pushes the system beyond normal capacity to find breaking points.

**What it tests:**
- Maximum capacity
- System degradation under stress
- Breaking point identification
- Recovery behavior

**Load profile:**
- Progressive increase: 10 → 20 → 40 → 60 → 80 → 100 users
- Duration: ~19 minutes total
- Tests all endpoints with weighted distribution

**Run:**
```bash
k6 run loadtests/stress-test.js
```

**Endpoint weights:**
- Chat: 50% (most critical)
- Health: 30%
- Metrics: 20%

**Expected behavior:**
- System may show degradation at high loads
- Rate limiting (429) is expected and acceptable
- Monitor when error rate exceeds 10%

### 4. Spike Test (`spike-test.js`)

Tests system behavior under sudden traffic spikes (viral events, marketing campaigns).

**What it tests:**
- Response to sudden traffic bursts
- Auto-scaling capability
- Service resilience
- Recovery time

**Load profile:**
- Normal: 5 users
- Spike 1: 5 → 100 users in 10 seconds (20x increase!)
- Sustain: 100 users for 2 minutes
- Spike 2: 5 → 50 users
- Duration: ~8 minutes total

**Run:**
```bash
k6 run loadtests/spike-test.js
```

**Use cases:**
- Marketing campaign readiness
- Viral social media post handling
- Black Friday / sales event preparation

## Running Tests

### Basic Usage

```bash
# Run a single test
k6 run loadtests/basic-load.js

# Run with custom base URL
k6 run -e BASE_URL=http://localhost:5000 loadtests/chat-load.js

# Run with custom VUs and duration (override configuration)
k6 run --vus 50 --duration 5m loadtests/stress-test.js
```

### Output Options

```bash
# Save results to JSON
k6 run --out json=results.json loadtests/basic-load.js

# Save results to InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 loadtests/chat-load.js

# Quiet mode (less output)
k6 run --quiet loadtests/basic-load.js

# Summary only
k6 run --summary-export=summary.json loadtests/basic-load.js
```

### Running All Tests

```bash
# Windows (PowerShell)
Get-ChildItem loadtests/*.js | ForEach-Object { k6 run $_.FullName }

# Unix/Linux/macOS
for test in loadtests/*.js; do k6 run "$test"; done
```

## Interpreting Results

### Success Criteria

**Basic Load Test:**
- ✅ P95 < 500ms
- ✅ Error rate < 1%

**Chat Load Test:**
- ✅ P95 < 3s (AI calls are inherently slower)
- ✅ Error rate < 2%

**Stress Test:**
- ✅ P99 < 10s under maximum load
- ✅ Error rate < 10% (some degradation acceptable)
- ✅ System recovers after load decrease

**Spike Test:**
- ✅ P95 < 5s during spike
- ✅ Error rate < 15% during spike
- ✅ No complete outages

### Key Metrics

**Response Time (http_req_duration):**
- P50 (median): 50% of requests faster than this
- P95: 95% of requests faster than this (key SLA metric)
- P99: 99% of requests faster than this
- Max: Slowest request

**Error Rate (http_req_failed):**
- Percentage of requests that failed (4xx, 5xx errors)
- Target: < 1% for normal load, < 10% for stress

**Throughput (http_reqs):**
- Requests per second the system can handle
- Higher is better

**Custom Metrics:**
- `chat_duration`: Time to get chat response
- `errors`: Custom error tracking
- `spike_requests`: Requests during spike periods

### Warning Signs

🚨 **Critical Issues:**
- Error rate > 5% during normal load
- P95 > 5s for chat endpoint
- Complete service unavailability (all requests fail)
- Memory/CPU exhaustion

⚠️ **Performance Warnings:**
- P95 > 1s for health checks
- P95 > 3s for chat responses
- Error rate > 1% during basic load
- Slow recovery after stress (> 2 minutes)

✅ **Good Performance:**
- P95 < 500ms for basic endpoints
- P95 < 2s for chat endpoints
- Error rate < 1%
- Graceful degradation under stress
- Quick recovery (< 30s)

## Test Results

Results are saved to:
- `loadtest-results.json` (basic load)
- `loadtest-chat-results.json` (chat load)
- `loadtest-stress-results.json` (stress test)
- `loadtest-spike-results.json` (spike test)

These files contain detailed metrics and can be analyzed with tools like:
- k6 Cloud
- Grafana
- Custom analysis scripts

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run load tests
  run: |
    k6 run --quiet --no-color loadtests/basic-load.js
    k6 run --quiet --no-color loadtests/chat-load.js

- name: Check thresholds
  run: |
    # Tests will fail if thresholds not met
    exit $?
```

### Pre-deployment Checklist

Before deploying to production:
- [ ] Run basic-load.js - all thresholds pass
- [ ] Run chat-load.js - P95 < 3s
- [ ] Run stress-test.js - identify capacity limits
- [ ] Run spike-test.js - verify spike readiness
- [ ] Review error logs for any failures
- [ ] Verify database performance
- [ ] Confirm Redis availability

## Best Practices

### When to Run Load Tests

1. **Before Production Deployment**
   - Run all tests to establish baseline
   - Document capacity limits

2. **After Major Changes**
   - New features added
   - Database schema changes
   - Third-party API integrations

3. **Regular Testing**
   - Weekly: basic-load.js
   - Monthly: full suite
   - Before marketing campaigns: spike-test.js

4. **After Performance Issues**
   - Reproduce issue with custom test
   - Verify fix doesn't break other endpoints

### Test Environment

- Use production-like environment
- Same database size/load
- Same server specifications
- Isolated from actual users
- Monitor system resources (CPU, memory, network)

### Monitoring During Tests

Watch these metrics:
- Server CPU usage (should stay < 80%)
- Memory usage (watch for leaks)
- Database connections (should not exhaust pool)
- Redis memory (cache efficiency)
- Network bandwidth

## Troubleshooting

### Test Fails to Connect

```bash
# Error: connect ECONNREFUSED
# Solution: Ensure server is running
npm start

# Or check BASE_URL is correct
k6 run -e BASE_URL=http://localhost:5000 loadtests/basic-load.js
```

### High Error Rate

```bash
# Check server logs
tail -f logs/error-*.log

# Reduce load to find working capacity
k6 run --vus 5 loadtests/chat-load.js
```

### Slow Responses

```bash
# Enable database query logging
# Check for N+1 queries or missing indexes

# Review AI API latency
# Consider caching responses

# Check Redis connection
# Verify cache hit rate
```

### Rate Limited (429 errors)

```bash
# Expected behavior under high load
# Verify rate limits in middleware/rateLimiter.js

# Adjust rate limits for load testing
# Or add test-specific bypass (not in production!)
```

## Advanced Configuration

### Custom Scenarios

```javascript
export const options = {
  scenarios: {
    normal_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
    },
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 0 },
      ],
      startTime: '5m', // Start after normal load
    },
  },
};
```

### Custom Thresholds

```javascript
export const options = {
  thresholds: {
    'http_req_duration{endpoint:chat}': ['p(95)<3000'],
    'http_req_duration{endpoint:health}': ['p(95)<200'],
    'http_req_failed{endpoint:chat}': ['rate<0.02'],
  },
};
```

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Performance Testing Guide](https://k6.io/docs/testing-guides/)
- [Grafana k6 Cloud](https://grafana.com/products/cloud/k6/)

## Support

For issues with load tests:
1. Check server logs: `logs/error-*.log`
2. Review test output for specific errors
3. Monitor system resources during tests
4. Adjust thresholds if needed for your environment
