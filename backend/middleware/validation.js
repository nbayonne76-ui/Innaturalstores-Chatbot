/**
 * Input Validation Schemas
 * Phase 2: Request validation with Joi
 */

const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');

/**
 * Sanitize HTML content to prevent XSS
 */
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return sanitizeHtml(input, {
      allowedTags: [], // No HTML tags allowed
      allowedAttributes: {},
    });
  }
  return input;
}

/**
 * Deep sanitize object properties
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
}

// ===========================================
// VALIDATION SCHEMAS
// ===========================================

/**
 * Chat message validation schema
 */
const chatMessageSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.empty': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 5000 characters',
      'any.required': 'Message is required',
    }),

  sessionId: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .max(100)
    .required()
    .messages({
      'string.pattern.base': 'Invalid session ID format',
      'any.required': 'Session ID is required',
    }),

  language: Joi.string()
    .valid('ar', 'en', 'fr')
    .default('ar')
    .messages({
      'any.only': 'Language must be ar, en, or fr',
    }),

  userProfile: Joi.object({
    language: Joi.string().valid('ar', 'en', 'fr'),
    hairType: Joi.string().valid('dry', 'oily', 'normal', 'mixed', 'damaged', 'curly', 'straight'),
    concerns: Joi.array().items(Joi.string().max(100)),
    name: Joi.string().max(100),
    email: Joi.string().email().max(255),
    phone: Joi.string().max(20),
  }).optional(),

  metadata: Joi.object().optional(),
});

/**
 * Product query validation schema
 */
const productQuerySchema = Joi.object({
  search: Joi.string().max(200).optional(),
  category: Joi.string().max(100).optional(),
  hairType: Joi.string().valid('dry', 'oily', 'normal', 'mixed', 'damaged', 'curly', 'straight').optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  limit: Joi.number().min(1).max(100).default(20),
  offset: Joi.number().min(0).default(0),
});

/**
 * Session ID validation schema
 */
const sessionIdSchema = Joi.object({
  sessionId: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .max(100)
    .required()
    .messages({
      'string.pattern.base': 'Invalid session ID format',
      'any.required': 'Session ID is required',
    }),
});

/**
 * FAQ query validation schema
 */
const faqQuerySchema = Joi.object({
  query: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Query cannot be empty',
      'string.max': 'Query cannot exceed 500 characters',
      'any.required': 'Query is required',
    }),

  language: Joi.string()
    .valid('ar', 'en', 'fr')
    .default('ar'),

  limit: Joi.number().min(1).max(20).default(5),
});

/**
 * Feedback validation schema
 */
const feedbackSchema = Joi.object({
  sessionId: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .max(100)
    .required(),

  rating: Joi.number()
    .min(1)
    .max(5)
    .integer()
    .required()
    .messages({
      'number.min': 'Rating must be between 1 and 5',
      'number.max': 'Rating must be between 1 and 5',
      'any.required': 'Rating is required',
    }),

  comment: Joi.string().max(1000).optional(),

  category: Joi.string()
    .valid('helpful', 'accurate', 'fast', 'friendly', 'other')
    .optional(),
});

/**
 * Lead capture validation schema
 */
const leadSchema = Joi.object({
  sessionId: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .max(100)
    .required(),

  email: Joi.string()
    .email()
    .max(255)
    .optional()
    .messages({
      'string.email': 'Invalid email address',
    }),

  phone: Joi.string()
    .pattern(/^[\d\s\-\+\(\)]+$/)
    .max(20)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid phone number format',
    }),

  name: Joi.string().max(100).optional(),

  interest: Joi.array().items(Joi.string().max(100)).optional(),

  budget: Joi.string().max(50).optional(),

  timeline: Joi.string().max(50).optional(),

  notes: Joi.string().max(1000).optional(),
}).or('email', 'phone') // At least one contact method required
  .messages({
    'object.missing': 'Either email or phone is required',
  });

/**
 * Analytics event validation schema
 */
const analyticsEventSchema = Joi.object({
  eventType: Joi.string()
    .max(100)
    .required()
    .messages({
      'any.required': 'Event type is required',
    }),

  eventName: Joi.string().max(100).optional(),

  sessionId: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .max(100)
    .optional(),

  data: Joi.object().optional(),
});

// ===========================================
// VALIDATION MIDDLEWARE
// ===========================================

/**
 * Create validation middleware for a schema
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    // Sanitize input first
    if (req[property]) {
      req[property] = sanitizeObject(req[property]);
    }

    // Validate against schema
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown properties
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    // Replace request data with validated and sanitized data
    req[property] = value;
    next();
  };
}

/**
 * Validate query parameters
 */
function validateQuery(schema) {
  return validate(schema, 'query');
}

/**
 * Validate URL parameters
 */
function validateParams(schema) {
  return validate(schema, 'params');
}

/**
 * Validate request body
 */
function validateBody(schema) {
  return validate(schema, 'body');
}

module.exports = {
  // Validation middleware
  validate,
  validateQuery,
  validateParams,
  validateBody,

  // Schemas
  chatMessageSchema,
  productQuerySchema,
  sessionIdSchema,
  faqQuerySchema,
  feedbackSchema,
  leadSchema,
  analyticsEventSchema,

  // Sanitization utilities
  sanitizeInput,
  sanitizeObject,
};
