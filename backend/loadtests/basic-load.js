/**
 * Basic Load Test
 * Tests basic API endpoints with moderate load
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run loadtests/basic-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');
const metricsDuration = new Trend('metrics_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be below 1%
    errors: ['rate<0.05'],             // Custom error rate below 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Test 1: Health check
  {
    const res = http.get(`${BASE_URL}/api/health`);
    const success = check(res, {
      'health status is 200 or 503': r => r.status === 200 || r.status === 503,
      'health has status field': r => JSON.parse(r.body).status !== undefined,
    });

    errorRate.add(!success);
    healthCheckDuration.add(res.timings.duration);
  }

  sleep(1);

  // Test 2: Metrics endpoint
  {
    const res = http.get(`${BASE_URL}/metrics`);
    const success = check(res, {
      'metrics status is 200': r => r.status === 200,
      'metrics contains prometheus data': r => r.body.includes('# HELP'),
    });

    errorRate.add(!success);
    metricsDuration.add(res.timings.duration);
  }

  sleep(1);

  // Test 3: Metrics summary (JSON)
  {
    const res = http.get(`${BASE_URL}/api/metrics/summary`);
    const success = check(res, {
      'metrics summary status is 200': r => r.status === 200,
      'metrics summary has metrics field': r => JSON.parse(r.body).metrics !== undefined,
    });

    errorRate.add(!success);
  }

  sleep(2);
}

export function handleSummary(data) {
  return {
    'loadtest-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const summary = `
  ═══════════════════════════════════════════
  Load Test Summary
  ═══════════════════════════════════════════

  Duration: ${data.state.testRunDurationMs / 1000}s
  VUs: ${options.stages.reduce((max, stage) => Math.max(max, stage.target), 0)} max

  HTTP Requests:
    Total: ${data.metrics.http_reqs.values.count}
    Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s
    Failed: ${data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : 0}%

  Response Time:
    Min: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms
    Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
    P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms

  Custom Metrics:
    Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%
    Health Check Avg: ${data.metrics.health_check_duration.values.avg.toFixed(2)}ms
    Metrics Endpoint Avg: ${data.metrics.metrics_duration.values.avg.toFixed(2)}ms

  ═══════════════════════════════════════════
  `;

  return summary;
}
