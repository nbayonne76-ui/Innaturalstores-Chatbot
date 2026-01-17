/**
 * Spike Test
 * Tests system behavior under sudden traffic spikes (viral events, marketing campaigns)
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run loadtests/spike-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const recoveryTime = new Trend('recovery_time');
const spikeRequests = new Counter('spike_requests');

// Spike test configuration - sudden traffic bursts
export const options = {
  stages: [
    { duration: '1m', target: 5 },     // Normal baseline traffic
    { duration: '10s', target: 100 },  // SPIKE! Sudden 20x increase
    { duration: '2m', target: 100 },   // Sustain spike
    { duration: '10s', target: 5 },    // Drop back to normal
    { duration: '1m', target: 5 },     // Recovery period
    { duration: '10s', target: 50 },   // Second smaller spike
    { duration: '1m', target: 50 },    // Sustain
    { duration: '10s', target: 5 },    // Back to normal
    { duration: '1m', target: 5 },     // Final recovery
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],    // Accept slower responses during spike
    http_req_failed: ['rate<0.15'],       // 15% error rate acceptable during spike
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

let spikeStartTime = null;
let spikeEndTime = null;
let inSpike = false;

export default function () {
  const currentVUs = __ENV.K6_VUS || 1;

  // Detect spike (more than 30 VUs)
  if (currentVUs > 30 && !inSpike) {
    inSpike = true;
    spikeStartTime = Date.now();
    console.log(`🚀 SPIKE DETECTED! VUs: ${currentVUs} at ${new Date().toISOString()}`);
  } else if (currentVUs <= 30 && inSpike) {
    inSpike = false;
    spikeEndTime = Date.now();
    if (spikeStartTime) {
      const spikeDuration = (spikeEndTime - spikeStartTime) / 1000;
      console.log(`📉 SPIKE ENDED. Duration: ${spikeDuration}s`);
      recoveryTime.add(spikeDuration);
    }
  }

  // Test health endpoint (fast, should always work)
  const healthStart = Date.now();
  const healthRes = http.get(`${BASE_URL}/api/health`, { timeout: '5s' });
  const healthDuration = Date.now() - healthStart;

  const healthOk = check(healthRes, {
    'health status ok': r => r.status === 200 || r.status === 503,
    'health responds': r => r.body && r.body.length > 0,
  });

  if (!healthOk) {
    errorRate.add(1);
    console.error(`❌ Health check failed during ${inSpike ? 'SPIKE' : 'normal'} load: ${healthRes.status}`);
  }

  if (inSpike) {
    spikeRequests.add(1);

    // During spike, test critical endpoint (chat)
    if (Math.random() < 0.7) {
      // 70% of spike traffic is chat
      const chatStart = Date.now();
      const chatRes = http.post(
        `${BASE_URL}/api/chat`,
        JSON.stringify({
          message: 'Urgent question during spike',
          sessionId: `spike-${__VU}-${__ITER}`,
          language: 'fr',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: '10s',
        }
      );
      const chatDuration = Date.now() - chatStart;

      const chatOk = check(chatRes, {
        'chat responds': r => r.status !== undefined,
        'chat not timeout': () => chatDuration < 10000,
        'chat acceptable status': r =>
          r.status === 200 || r.status === 429 || r.status === 503,
      });

      if (!chatOk) {
        errorRate.add(1);
      }

      if (chatRes.status === 429) {
        console.log(`⏸ Rate limited during spike (expected behavior)`);
      } else if (chatRes.status === 503) {
        console.warn(`⚠ Service unavailable during spike`);
      } else if (chatDuration > 5000) {
        console.warn(`⏱ Slow chat response during spike: ${chatDuration}ms`);
      }
    }

    // Minimal sleep during spike (simulate real traffic burst)
    sleep(0.1 + Math.random() * 0.2); // 100-300ms
  } else {
    // Normal traffic - more relaxed
    sleep(1 + Math.random() * 2); // 1-3s
  }
}

export function handleSummary(data) {
  const totalRequests = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
  const spikeRequestCount = data.metrics.spike_requests
    ? data.metrics.spike_requests.values.count
    : 0;
  const errorRateValue = data.metrics.http_req_failed
    ? data.metrics.http_req_failed.values.rate
    : 0;
  const p95Duration = data.metrics.http_req_duration
    ? data.metrics.http_req_duration.values['p(95)']
    : 0;
  const p99Duration = data.metrics.http_req_duration
    ? data.metrics.http_req_duration.values['p(99)']
    : 0;
  const maxDuration = data.metrics.http_req_duration
    ? data.metrics.http_req_duration.values.max
    : 0;

  const summary = `
  ═══════════════════════════════════════════
  Spike Test Results
  ═══════════════════════════════════════════

  Test Scenario: Sudden traffic spikes (20x increase)
  Test Duration: ${(data.state.testRunDurationMs / 1000 / 60).toFixed(2)} minutes

  Traffic Profile:
    Total Requests: ${totalRequests}
    Spike Requests: ${spikeRequestCount}
    Normal Requests: ${totalRequests - spikeRequestCount}
    Peak Request Rate: ${data.metrics.http_reqs ? data.metrics.http_reqs.values.rate.toFixed(2) : 0}/s

  Response Times During Spike:
    P50: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(50)'].toFixed(2) : 0}ms
    P95: ${p95Duration.toFixed(2)}ms
    P99: ${p99Duration.toFixed(2)}ms
    Max: ${maxDuration.toFixed(2)}ms

  Error Analysis:
    Overall Error Rate: ${(errorRateValue * 100).toFixed(2)}%
    Failed Requests: ${data.metrics.http_req_failed ? data.metrics.http_req_failed.values.count : 0}

  System Resilience:
    ${p95Duration < 2000 ? '✓ Excellent - System handles spikes gracefully' : ''}
    ${p95Duration >= 2000 && p95Duration < 5000 ? '⚠ Good - Acceptable degradation during spikes' : ''}
    ${p95Duration >= 5000 && p95Duration < 10000 ? '⚠ Moderate - Significant slowdown during spikes' : ''}
    ${p95Duration >= 10000 ? '❌ Poor - System struggles with sudden spikes' : ''}

    ${errorRateValue < 0.05 ? '✓ Error rate excellent (<5%)' : ''}
    ${errorRateValue >= 0.05 && errorRateValue < 0.10 ? '⚠ Error rate acceptable (5-10%)' : ''}
    ${errorRateValue >= 0.10 && errorRateValue < 0.15 ? '⚠ Error rate elevated (10-15%)' : ''}
    ${errorRateValue >= 0.15 ? '❌ Error rate high (>15%)' : ''}

  Spike Handling Assessment:
    ${errorRateValue < 0.10 && p95Duration < 3000 ? '✅ PASS - System is spike-resistant' : ''}
    ${errorRateValue >= 0.10 || p95Duration >= 3000 ? '❌ FAIL - System needs spike protection' : ''}

  Recommendations:
    ${errorRateValue > 0.10 ? '- Implement auto-scaling to handle traffic spikes\n    - Add request queuing for burst traffic\n    - Consider CDN for static content' : ''}
    ${p95Duration > 3000 ? '- Optimize slow endpoints before marketing campaigns\n    - Add caching layer for frequently accessed data\n    - Implement circuit breakers for external services' : ''}
    ${errorRateValue < 0.05 && p95Duration < 2000
      ? '✓ System ready for viral events and marketing campaigns\n    ✓ Consider current capacity sufficient for 20x traffic spikes'
      : ''}

  Real-World Scenarios:
    ${errorRateValue < 0.10 ? '✓ Can handle successful marketing campaign' : '❌ May fail under marketing campaign'}
    ${p95Duration < 5000 ? '✓ Can handle viral social media post' : '❌ May timeout under viral traffic'}
    ${errorRateValue < 0.05 && p95Duration < 3000 ? '✓ Ready for Black Friday / sales events' : '❌ Not ready for high-traffic events'}

  ═══════════════════════════════════════════
  `;

  return {
    'loadtest-spike-results.json': JSON.stringify(data, null, 2),
    stdout: summary,
  };
}
