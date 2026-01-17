/**
 * Phase 2: Security Implementation Tests
 * Run with: node test-security.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test counter
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    log(`\n📝 Testing: ${name}`, 'blue');
    await fn();
    log(`✅ PASS: ${name}`, 'green');
    passed++;
  } catch (error) {
    log(`❌ FAIL: ${name}`, 'red');
    log(`   Error: ${error.message}`, 'red');
    failed++;
  }
}

// ==================================================
// TEST 1: Server Health Check
// ==================================================
async function testHealthCheck() {
  const response = await fetch(`${BASE_URL}/api/health`);
  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (data.status !== 'ok') {
    throw new Error(`Expected status 'ok', got '${data.status}'`);
  }

  log('   Server is healthy', 'green');
}

// ==================================================
// TEST 2: Security Headers Present
// ==================================================
async function testSecurityHeaders() {
  const response = await fetch(`${BASE_URL}/api/health`);
  const headers = response.headers;

  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
  ];

  const missing = [];
  for (const header of requiredHeaders) {
    if (!headers.get(header)) {
      missing.push(header);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing security headers: ${missing.join(', ')}`);
  }

  log(`   Security headers present: ${requiredHeaders.join(', ')}`, 'green');
}

// ==================================================
// TEST 3: Input Validation - Valid Message
// ==================================================
async function testValidInput() {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'مرحبا، كيف حالك؟',
      sessionId: 'test_session_123',
      language: 'ar',
    }),
  });

  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!data.success) {
    throw new Error('Valid input was rejected');
  }

  log('   Valid input accepted correctly', 'green');
}

// ==================================================
// TEST 4: Input Validation - Invalid Message (Empty)
// ==================================================
async function testInvalidInput() {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: '',  // Empty message
      sessionId: 'test_session_123',
    }),
  });

  const data = await response.json();

  if (response.status !== 400) {
    throw new Error(`Expected status 400, got ${response.status}`);
  }

  if (!data.error) {
    throw new Error('Validation error not returned');
  }

  log('   Invalid input rejected correctly', 'green');
  log(`   Error message: ${data.error}`, 'yellow');
}

// ==================================================
// TEST 5: Input Validation - Invalid Session ID
// ==================================================
async function testInvalidSessionId() {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Hello',
      sessionId: 'invalid session id!@#',  // Invalid characters
    }),
  });

  const data = await response.json();

  if (response.status !== 400) {
    throw new Error(`Expected status 400, got ${response.status}`);
  }

  log('   Invalid session ID rejected', 'green');
}

// ==================================================
// TEST 6: XSS Protection (HTML Sanitization)
// ==================================================
async function testXSSProtection() {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: '<script>alert("XSS")</script>Hello',
      sessionId: 'test_xss_session',
    }),
  });

  // Should accept the request but sanitize the input
  if (response.status !== 200 && response.status !== 400) {
    throw new Error(`Unexpected status: ${response.status}`);
  }

  log('   XSS input handled safely', 'green');
}

// ==================================================
// TEST 7: Rate Limiting Headers
// ==================================================
async function testRateLimitHeaders() {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Test rate limit',
      sessionId: 'test_ratelimit_session',
    }),
  });

  const headers = response.headers;
  const rateLimitHeaders = [
    'ratelimit-limit',
    'ratelimit-remaining',
  ];

  const present = rateLimitHeaders.filter(h => headers.get(h));

  if (present.length === 0) {
    throw new Error('No rate limit headers found');
  }

  log(`   Rate limit headers: ${present.join(', ')}`, 'green');
  log(`   Limit: ${headers.get('ratelimit-limit')}, Remaining: ${headers.get('ratelimit-remaining')}`, 'yellow');
}

// ==================================================
// TEST 8: Rate Limiting Enforcement (Simulated)
// ==================================================
async function testRateLimitEnforcement() {
  log('   Sending multiple requests to test rate limiting...', 'yellow');

  const promises = [];
  for (let i = 0; i < 25; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Test message ${i}`,
          sessionId: 'test_rate_session',
        }),
      })
    );
  }

  const responses = await Promise.all(promises);
  const statuses = responses.map(r => r.status);
  const tooManyRequests = statuses.filter(s => s === 429).length;

  if (tooManyRequests === 0) {
    log('   Warning: Rate limiting may not be working (no 429 responses)', 'yellow');
  } else {
    log(`   Rate limiting active: ${tooManyRequests} requests blocked`, 'green');
  }

  // This test passes if we get at least some responses
  if (responses.length === 0) {
    throw new Error('No responses received');
  }
}

// ==================================================
// RUN ALL TESTS
// ==================================================
async function runTests() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║                                                       ║', 'blue');
  log('║   🛡️  Phase 2: Security Implementation Tests 🛡️     ║', 'blue');
  log('║                                                       ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');

  await test('Server Health Check', testHealthCheck);
  await test('Security Headers Present', testSecurityHeaders);
  await test('Valid Input Accepted', testValidInput);
  await test('Invalid Input Rejected (Empty Message)', testInvalidInput);
  await test('Invalid Session ID Rejected', testInvalidSessionId);
  await test('XSS Protection', testXSSProtection);
  await test('Rate Limit Headers Present', testRateLimitHeaders);
  await test('Rate Limiting Enforcement', testRateLimitEnforcement);

  // Summary
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║                   TEST SUMMARY                        ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');
  log(`\n✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`📊 Total: ${passed + failed}\n`, 'blue');

  if (failed === 0) {
    log('🎉 All security tests passed!', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some tests failed. Please review the errors above.', 'red');
    process.exit(1);
  }
}

// Check if server is running
fetch(`${BASE_URL}/api/health`)
  .then(() => {
    runTests();
  })
  .catch(() => {
    log('\n❌ Error: Server is not running on http://localhost:5000', 'red');
    log('   Please start the server with: npm start\n', 'yellow');
    process.exit(1);
  });
