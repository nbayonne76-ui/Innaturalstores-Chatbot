/**
 * Unit Tests for Validation Middleware
 * Phase 4: Testing & CI/CD
 */

const {
  sanitizeInput,
  sanitizeObject,
  chatMessageSchema,
  productQuerySchema,
  feedbackSchema,
  leadSchema,
} = require('../../middleware/validation');

describe('Validation Middleware - Unit Tests', () => {
  describe('sanitizeInput', () => {
    test('should remove HTML tags from string', () => {
      const input = '<script>alert("XSS")</script>Hello World';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    test('should handle non-string input', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
    });

    test('should remove all HTML tags', () => {
      const input = '<p>Test <strong>bold</strong> text</p>';
      const result = sanitizeInput(input);
      expect(result).toBe('Test bold text');
    });
  });

  describe('sanitizeObject', () => {
    test('should sanitize string properties in object', () => {
      const input = {
        message: '<script>alert("XSS")</script>Hello',
        name: '<b>John</b>',
      };
      const result = sanitizeObject(input);
      expect(result.message).toBe('Hello');
      expect(result.name).toBe('John');
    });

    test('should handle nested objects', () => {
      const input = {
        user: {
          name: '<script>XSS</script>Alice',
        },
      };
      const result = sanitizeObject(input);
      expect(result.user.name).toBe('Alice');
    });

    test('should handle arrays', () => {
      const input = ['<b>item1</b>', '<i>item2</i>'];
      const result = sanitizeObject(input);
      expect(result).toEqual(['item1', 'item2']);
    });
  });

  describe('chatMessageSchema', () => {
    test('should validate correct chat message', () => {
      const validMessage = {
        message: 'Hello, how are you?',
        sessionId: 'session_123',
        language: 'en',
      };

      const { error, value } = chatMessageSchema.validate(validMessage);
      expect(error).toBeUndefined();
      expect(value.message).toBe('Hello, how are you?');
    });

    test('should reject empty message', () => {
      const invalidMessage = {
        message: '',
        sessionId: 'session_123',
      };

      const { error } = chatMessageSchema.validate(invalidMessage);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('empty');
    });

    test('should reject missing sessionId', () => {
      const invalidMessage = {
        message: 'Hello',
      };

      const { error } = chatMessageSchema.validate(invalidMessage);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('sessionId');
    });

    test('should reject invalid language', () => {
      const invalidMessage = {
        message: 'Hello',
        sessionId: 'session_123',
        language: 'de', // Not supported
      };

      const { error } = chatMessageSchema.validate(invalidMessage);
      expect(error).toBeDefined();
    });

    test('should apply default language', () => {
      const message = {
        message: 'Hello',
        sessionId: 'session_123',
      };

      const { value } = chatMessageSchema.validate(message);
      expect(value.language).toBe('ar'); // Default
    });

    test('should reject message exceeding max length', () => {
      const invalidMessage = {
        message: 'a'.repeat(5001), // Max is 5000
        sessionId: 'session_123',
      };

      const { error } = chatMessageSchema.validate(invalidMessage);
      expect(error).toBeDefined();
    });

    test('should validate with userProfile', () => {
      const validMessage = {
        message: 'Test',
        sessionId: 'session_123',
        userProfile: {
          hairType: 'dry',
          concerns: ['dryness', 'breakage'],
        },
      };

      const { error } = chatMessageSchema.validate(validMessage);
      expect(error).toBeUndefined();
    });
  });

  describe('productQuerySchema', () => {
    test('should validate product search query', () => {
      const validQuery = {
        search: 'castor oil',
        hairType: 'dry',
        minPrice: 10,
        maxPrice: 50,
      };

      const { error } = productQuerySchema.validate(validQuery);
      expect(error).toBeUndefined();
    });

    test('should apply default limit', () => {
      const query = {
        search: 'oil',
      };

      const { value } = productQuerySchema.validate(query);
      expect(value.limit).toBe(20);
    });

    test('should reject negative price', () => {
      const invalidQuery = {
        minPrice: -10,
      };

      const { error } = productQuerySchema.validate(invalidQuery);
      expect(error).toBeDefined();
    });
  });

  describe('feedbackSchema', () => {
    test('should validate correct feedback', () => {
      const validFeedback = {
        sessionId: 'session_123',
        rating: 5,
        comment: 'Great service!',
        category: 'helpful',
      };

      const { error } = feedbackSchema.validate(validFeedback);
      expect(error).toBeUndefined();
    });

    test('should reject rating out of range', () => {
      const invalidFeedback = {
        sessionId: 'session_123',
        rating: 6, // Max is 5
      };

      const { error } = feedbackSchema.validate(invalidFeedback);
      expect(error).toBeDefined();
    });

    test('should reject rating below 1', () => {
      const invalidFeedback = {
        sessionId: 'session_123',
        rating: 0,
      };

      const { error } = feedbackSchema.validate(invalidFeedback);
      expect(error).toBeDefined();
    });
  });

  describe('leadSchema', () => {
    test('should validate lead with email', () => {
      const validLead = {
        sessionId: 'session_123',
        email: 'test@example.com',
        name: 'John Doe',
      };

      const { error } = leadSchema.validate(validLead);
      expect(error).toBeUndefined();
    });

    test('should validate lead with phone', () => {
      const validLead = {
        sessionId: 'session_123',
        phone: '+1234567890',
        name: 'John Doe',
      };

      const { error } = leadSchema.validate(validLead);
      expect(error).toBeUndefined();
    });

    test('should require at least email or phone', () => {
      const invalidLead = {
        sessionId: 'session_123',
        name: 'John Doe',
        // No email or phone
      };

      const { error } = leadSchema.validate(invalidLead);
      expect(error).toBeDefined();
    });

    test('should reject invalid email format', () => {
      const invalidLead = {
        sessionId: 'session_123',
        email: 'not-an-email',
      };

      const { error } = leadSchema.validate(invalidLead);
      expect(error).toBeDefined();
    });
  });
});
