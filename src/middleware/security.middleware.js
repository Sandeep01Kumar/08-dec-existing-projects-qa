/**
 * Aggregated Security Middleware Module
 * 
 * Exports all security-related Express middleware pre-configured for application use.
 * Implements defense-in-depth security strategy following OWASP guidelines.
 * 
 * Middleware Order (Applied in this sequence for optimal security):
 * 1. Rate Limiter - Block abusive requests early (OWASP A04:2021)
 * 2. Helmet - Set security headers (OWASP A05:2021, A03:2021)
 * 3. CORS - Handle cross-origin requests (OWASP A01:2021)
 * 4. HPP - Sanitize parameters (OWASP A03:2021)
 * 
 * @module middleware/security
 */

'use strict';

// External security middleware packages
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Security configuration modules
const helmetConfig = require('../config/helmet.config');
const corsOptions = require('../config/cors.config');
const rateLimitOptions = require('../config/rateLimit.config');

/**
 * Pre-configured Helmet middleware for HTTP security headers.
 * Sets 15+ security headers including CSP, HSTS, X-Frame-Options.
 * 
 * OWASP Categories Addressed:
 * - A05:2021 Security Misconfiguration
 * - A03:2021 Injection (XSS prevention via CSP)
 * 
 * @type {Function} Express middleware
 */
const helmetMiddleware = helmet(helmetConfig);

/**
 * Pre-configured CORS middleware for cross-origin access control.
 * Implements whitelist-based origin validation.
 * 
 * OWASP Category: A01:2021 Broken Access Control
 * 
 * @type {Function} Express middleware
 */
const corsMiddleware = cors(corsOptions);

/**
 * Pre-configured rate limiter middleware for request throttling.
 * Limits requests to 100 per 15-minute window per IP address.
 * 
 * OWASP Category: A04:2021 Insecure Design (DoS protection)
 * 
 * @type {Function} Express middleware
 */
const rateLimiterMiddleware = rateLimit(rateLimitOptions);

/**
 * Pre-configured HPP middleware for HTTP Parameter Pollution protection.
 * Prevents parameter pollution attacks by selecting last parameter value.
 * 
 * OWASP Category: A03:2021 Injection
 * 
 * @type {Function} Express middleware
 */
const hppMiddleware = hpp();

/**
 * Applies all security middleware to an Express application in the correct order.
 * 
 * Middleware Application Order:
 * 1. rateLimiterMiddleware - First to block abusive requests early
 * 2. helmetMiddleware - Second to set security headers on all responses
 * 3. corsMiddleware - Third to handle CORS before request processing
 * 4. hppMiddleware - Fourth to sanitize request parameters
 * 
 * @param {Object} app - Express application instance
 * @returns {void}
 * 
 * @example
 * const express = require('express');
 * const { applySecurityMiddleware } = require('./middleware/security.middleware');
 * 
 * const app = express();
 * applySecurityMiddleware(app);
 */
const applySecurityMiddleware = (app) => {
  if (!app || typeof app.use !== 'function') {
    throw new Error('applySecurityMiddleware requires a valid Express app instance');
  }

  // Apply middleware in security-optimal order
  app.use(rateLimiterMiddleware); // 1. Rate limiting (block abusive requests first)
  app.use(helmetMiddleware);       // 2. Security headers (protect all responses)
  app.use(corsMiddleware);         // 3. CORS (validate cross-origin requests)
  app.use(hppMiddleware);          // 4. HPP (sanitize parameters)
};

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  rateLimiterMiddleware,
  hppMiddleware,
  applySecurityMiddleware
};
