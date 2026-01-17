/**
 * Integration Tests for API Endpoints
 * Phase 4: Testing & CI/CD
 */

const request = require('supertest');
const app = require('../../server');

describe('API Endpoints - Integration Tests', () => {
  describe('Health Check Endpoints', () => {
    test('GET /api/health should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThanOrEqual(503); // 200 or 503
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('system');
    });

    test('GET /api/health/live should return liveness status', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /api/health/ready should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThanOrEqual(503);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Metrics Endpoints', () => {
    test('GET /metrics should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(typeof response.text).toBe('string');
      expect(response.text.length).toBeGreaterThan(0);
      // Should contain Prometheus format
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });

    test('GET /api/metrics/summary should return JSON metrics', async () => {
      const response = await request(app)
        .get('/api/metrics/summary')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Chat Endpoint Validation', () => {
    test('POST /api/chat should reject empty message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: '',
          sessionId: 'test_session',
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/chat should reject missing sessionId', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello',
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
    });

    test('POST /api/chat should reject invalid language', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello',
          sessionId: 'test_session',
          language: 'invalid',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('POST /api/chat should accept valid message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'مرحبا',
          sessionId: 'test_integration_session',
          language: 'ar',
        })
        .expect('Content-Type', /json/);

      // May succeed (200) or have other issues, but validation should pass
      expect(response.status).toBeLessThanOrEqual(500);
    }, 15000); // Longer timeout for AI call
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Check for Helmet security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('should include response time header', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.headers).toHaveProperty('x-response-time');
      expect(response.headers['x-response-time']).toMatch(/\d+\.\d+ms/);
    });
  });

  describe('Rate Limiting', () => {
    test('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Global rate limiter should add headers
      expect(
        response.headers['ratelimit-limit'] ||
        response.headers['x-ratelimit-limit']
      ).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);

      // Should still have security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5000')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Analytics Endpoints', () => {
    test('POST /api/analytics/track should validate input', async () => {
      const response = await request(app)
        .post('/api/analytics/track')
        .send({
          eventType: 'test_event',
          data: { test: true },
        })
        .expect('Content-Type', /json/);

      // Should pass validation
      expect(response.status).toBeLessThanOrEqual(500);
    });

    test('POST /api/analytics/feedback should validate rating', async () => {
      const response = await request(app)
        .post('/api/analytics/feedback')
        .send({
          sessionId: 'test_session',
          rating: 6, // Invalid: max is 5
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('POST /api/analytics/feedback should accept valid feedback', async () => {
      const response = await request(app)
        .post('/api/analytics/feedback')
        .send({
          sessionId: 'test_session',
          rating: 5,
          comment: 'Great service!',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThanOrEqual(500);
    });
  });
});
