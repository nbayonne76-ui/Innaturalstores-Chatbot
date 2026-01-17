/**
 * Security Middleware Configuration
 * Phase 2: Security Headers with Helmet
 */

const helmet = require('helmet');

/**
 * Configure Helmet security headers
 * Protects against common web vulnerabilities
 */
const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.openai.com"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Allow embedding for widget
  crossOriginResourcePolicy: { policy: "cross-origin" },

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // Expect-CT (Certificate Transparency)
  expectCt: {
    maxAge: 86400,
    enforce: true,
  },

  // Frameguard (X-Frame-Options)
  frameguard: {
    action: 'sameorigin', // Allow same-origin framing for widget
  },

  // Hide Powered-By header
  hidePoweredBy: true,

  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open
  ieNoOpen: true,

  // No Sniff (X-Content-Type-Options)
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: "none" },

  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },

  // XSS Filter (X-XSS-Protection)
  xssFilter: true,
});

/**
 * Security headers for development environment
 * More permissive for local development
 */
const developmentSecurityHeaders = helmet({
  contentSecurityPolicy: false, // Disable CSP in development
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hidePoweredBy: true,
  hsts: false, // Disable HSTS in development (no HTTPS)
});

/**
 * Get appropriate security middleware based on environment
 */
function getSecurityMiddleware() {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? securityHeaders : developmentSecurityHeaders;
}

module.exports = {
  securityHeaders,
  developmentSecurityHeaders,
  getSecurityMiddleware,
};
