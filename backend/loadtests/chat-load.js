/**
 * Chat Endpoint Load Test
 * Tests the chat API endpoint with realistic conversation load
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run loadtests/chat-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const chatDuration = new Trend('chat_duration');
const chatMessagesTotal = new Counter('chat_messages_total');
const aiResponseTime = new Trend('ai_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 5 },    // Ramp up to 5 concurrent users
    { duration: '3m', target: 5 },    // Stay at 5 users for 3 minutes
    { duration: '1m', target: 10 },   // Increase to 10 users
    { duration: '3m', target: 10 },   // Stay at 10 users
    { duration: '1m', target: 15 },   // Peak at 15 users
    { duration: '2m', target: 15 },   // Maintain peak
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],    // 95% of chat requests < 3s (AI calls are slow)
    http_req_failed: ['rate<0.02'],       // Error rate < 2%
    errors: ['rate<0.05'],                 // Custom error rate < 5%
    chat_duration: ['p(95)<3500'],         // 95% of chat responses < 3.5s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Sample chat messages for testing
const chatMessages = [
  'Bonjour, je cherche des produits pour mes cheveux bouclés',
  'Quels sont vos shampoings disponibles?',
  'Je cherche un produit pour cheveux secs et abîmés',
  'Avez-vous des huiles pour cheveux?',
  'Je voudrais des conseils pour cheveux crépus',
  'Quel est le prix du shampoing hydratant?',
  'Comment utiliser l\'huile de coco?',
  'Avez-vous des produits sans sulfates?',
  'Je voudrais créer un ticket SAV',
  'Mon produit est arrivé endommagé',
];

// Generate unique session ID per VU
function getSessionId() {
  return `load-test-session-${__VU}-${Date.now()}`;
}

export default function () {
  const sessionId = getSessionId();

  // Simulate a conversation with 3-5 messages
  const numMessages = Math.floor(Math.random() * 3) + 3;

  for (let i = 0; i < numMessages; i++) {
    const message = chatMessages[Math.floor(Math.random() * chatMessages.length)];

    const payload = JSON.stringify({
      message: message,
      sessionId: sessionId,
      language: 'fr',
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/chat`, payload, params);
    const duration = Date.now() - start;

    const success = check(res, {
      'chat status is 200': r => r.status === 200,
      'chat has response': r => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && body.response !== undefined;
        } catch (e) {
          return false;
        }
      },
      'response time acceptable': () => duration < 5000, // 5s max
    });

    errorRate.add(!success);
    chatDuration.add(duration);
    chatMessagesTotal.add(1);
    aiResponseTime.add(duration);

    // Log slow responses
    if (duration > 3000) {
      console.warn(`Slow chat response: ${duration}ms for message: "${message.substring(0, 30)}..."`);
    }

    // Wait between messages (simulate user typing)
    sleep(Math.random() * 2 + 1); // 1-3 seconds
  }

  // Longer wait before starting new conversation
  sleep(Math.random() * 5 + 3); // 3-8 seconds
}

export function handleSummary(data) {
  return {
    'loadtest-chat-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const summary = `
  ═══════════════════════════════════════════
  Chat Load Test Summary
  ═══════════════════════════════════════════

  Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s
  Max Concurrent Users: ${options.stages.reduce((max, stage) => Math.max(max, stage.target), 0)}

  Chat Messages:
    Total Sent: ${data.metrics.chat_messages_total ? data.metrics.chat_messages_total.values.count : 0}
    Rate: ${data.metrics.http_reqs ? data.metrics.http_reqs.values.rate.toFixed(2) : 0}/s
    Failed: ${data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : 0}%

  Response Times:
    Min: ${data.metrics.chat_duration ? data.metrics.chat_duration.values.min.toFixed(2) : 0}ms
    Avg: ${data.metrics.chat_duration ? data.metrics.chat_duration.values.avg.toFixed(2) : 0}ms
    Max: ${data.metrics.chat_duration ? data.metrics.chat_duration.values.max.toFixed(2) : 0}ms
    P50: ${data.metrics.chat_duration ? data.metrics.chat_duration.values['p(50)'].toFixed(2) : 0}ms
    P95: ${data.metrics.chat_duration ? data.metrics.chat_duration.values['p(95)'].toFixed(2) : 0}ms
    P99: ${data.metrics.chat_duration ? data.metrics.chat_duration.values['p(99)'].toFixed(2) : 0}ms

  AI Performance:
    Avg Response: ${data.metrics.ai_response_time ? data.metrics.ai_response_time.values.avg.toFixed(2) : 0}ms
    P95 Response: ${data.metrics.ai_response_time ? data.metrics.ai_response_time.values['p(95)'].toFixed(2) : 0}ms

  Errors:
    Error Rate: ${data.metrics.errors ? (data.metrics.errors.values.rate * 100).toFixed(2) : 0}%
    HTTP Failures: ${data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : 0}%

  Thresholds:
    ✓ P95 Response Time: ${data.metrics.chat_duration && data.metrics.chat_duration.values['p(95)'] < 3500 ? 'PASS' : 'FAIL'}
    ✓ Error Rate: ${data.metrics.errors && data.metrics.errors.values.rate < 0.05 ? 'PASS' : 'FAIL'}

  ═══════════════════════════════════════════
  `;

  return summary;
}
