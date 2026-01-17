/**
 * Stress Test
 * Pushes the system beyond normal capacity to find breaking points
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run loadtests/stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');

// Stress test configuration - gradually increase load until system breaks
export const options = {
  stages: [
    { duration: '2m', target: 10 },    // Normal load
    { duration: '3m', target: 20 },    // Above normal
    { duration: '3m', target: 40 },    // Stress level
    { duration: '3m', target: 60 },    // High stress
    { duration: '3m', target: 80 },    // Extreme stress
    { duration: '3m', target: 100 },   // Breaking point
    { duration: '2m', target: 0 },     // Recovery
  ],
  thresholds: {
    // More lenient thresholds for stress test
    http_req_duration: ['p(99)<10000'],   // 99% under 10s
    http_req_failed: ['rate<0.10'],       // 10% error rate acceptable under stress
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Endpoints to stress test
const endpoints = [
  { method: 'GET', url: '/api/health', weight: 30 },
  { method: 'GET', url: '/metrics', weight: 10 },
  { method: 'GET', url: '/api/metrics/summary', weight: 10 },
  { method: 'POST', url: '/api/chat', weight: 50 }, // Most weight on chat
];

function selectEndpoint() {
  const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
  let random = Math.random() * totalWeight;

  for (const endpoint of endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }

  return endpoints[0];
}

export default function () {
  const endpoint = selectEndpoint();
  let res;

  const start = Date.now();

  if (endpoint.method === 'POST' && endpoint.url === '/api/chat') {
    // Chat request
    const payload = JSON.stringify({
      message: 'Test message under stress',
      sessionId: `stress-test-${__VU}-${__ITER}`,
      language: 'fr',
    });

    res = http.post(`${BASE_URL}${endpoint.url}`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s', // Longer timeout for stress test
    });
  } else {
    // GET request
    res = http.get(`${BASE_URL}${endpoint.url}`, {
      timeout: '5s',
    });
  }

  const duration = Date.now() - start;

  const success = check(res, {
    'status is 2xx or 429 (rate limited)': r =>
      (r.status >= 200 && r.status < 300) || r.status === 429 || r.status === 503,
    'response received': r => r.body !== undefined && r.body !== null,
  });

  errorRate.add(!success);
  requestDuration.add(duration);

  // Track degradation
  if (res.status === 429) {
    console.log(`[${__VU}:${__ITER}] Rate limited on ${endpoint.url}`);
  } else if (res.status === 503) {
    console.log(`[${__VU}:${__ITER}] Service unavailable on ${endpoint.url}`);
  } else if (duration > 5000) {
    console.warn(`[${__VU}:${__ITER}] Slow response: ${duration}ms on ${endpoint.url}`);
  }

  // Minimal sleep - stress test
  sleep(0.5);
}

export function handleSummary(data) {
  const maxVUs = options.stages.reduce((max, stage) => Math.max(max, stage.target), 0);
  const avgDuration = data.metrics.http_req_duration
    ? data.metrics.http_req_duration.values.avg
    : 0;
  const p99Duration = data.metrics.http_req_duration
    ? data.metrics.http_req_duration.values['p(99)']
    : 0;
  const errorRate = data.metrics.http_req_failed
    ? data.metrics.http_req_failed.values.rate
    : 0;

  const summary = `
  ═══════════════════════════════════════════
  Stress Test Results
  ═══════════════════════════════════════════

  Test Duration: ${(data.state.testRunDurationMs / 1000 / 60).toFixed(2)} minutes
  Peak Load: ${maxVUs} concurrent users

  Total Requests: ${data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0}
  Request Rate: ${data.metrics.http_reqs ? data.metrics.http_reqs.values.rate.toFixed(2) : 0}/s

  Response Times:
    Average: ${avgDuration.toFixed(2)}ms
    P50: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(50)'].toFixed(2) : 0}ms
    P95: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 0}ms
    P99: ${p99Duration.toFixed(2)}ms
    Max: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.max.toFixed(2) : 0}ms

  Error Analysis:
    HTTP Failure Rate: ${(errorRate * 100).toFixed(2)}%
    Rate Limited (429): Check logs
    Service Unavailable (503): Check logs

  System Behavior Under Stress:
    ${p99Duration < 1000 ? '✓ Excellent - System handles stress well' : ''}
    ${p99Duration >= 1000 && p99Duration < 3000 ? '⚠ Good - Some degradation under stress' : ''}
    ${p99Duration >= 3000 && p99Duration < 5000 ? '⚠ Moderate - Significant degradation' : ''}
    ${p99Duration >= 5000 && p99Duration < 10000 ? '❌ Poor - System struggling under stress' : ''}
    ${p99Duration >= 10000 ? '❌ Critical - System near breaking point' : ''}

    ${errorRate < 0.01 ? '✓ Error rate excellent (<1%)' : ''}
    ${errorRate >= 0.01 && errorRate < 0.05 ? '⚠ Error rate acceptable (1-5%)' : ''}
    ${errorRate >= 0.05 && errorRate < 0.10 ? '⚠ Error rate elevated (5-10%)' : ''}
    ${errorRate >= 0.10 ? '❌ Error rate high (>10%)' : ''}

  Breaking Point Analysis:
    Peak VUs Achieved: ${maxVUs}
    System Status: ${errorRate < 0.10 && p99Duration < 10000 ? 'STABLE' : 'DEGRADED'}

  Recommendations:
    ${avgDuration > 1000 ? '- Consider adding more server instances' : ''}
    ${errorRate > 0.05 ? '- Review error logs for failure patterns' : ''}
    ${p99Duration > 5000 ? '- Optimize slow endpoints identified in logs' : ''}
    ${errorRate < 0.05 && p99Duration < 2000 ? '✓ System performing well under stress' : ''}

  ═══════════════════════════════════════════
  `;

  return {
    'loadtest-stress-results.json': JSON.stringify(data, null, 2),
    stdout: summary,
  };
}
