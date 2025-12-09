/**
 * Main Express Application
 * 
 * Configures the complete security middleware stack implementing defense-in-depth
 * security strategy following OWASP guidelines and Express.js best practices.
 * 
 * Security Middleware Stack (in order of application):
 * 1. Rate Limiter - Block abusive requests early (OWASP A04:2021)
 * 2. Helmet - Set 15+ security headers (OWASP A05:2021, A03:2021)
 * 3. CORS - Handle cross-origin requests (OWASP A01:2021)
 * 4. Body Parser - Parse JSON/URL-encoded with size limits
 * 5. HPP - Sanitize parameters (OWASP A03:2021)
 * 6. Routes - Handle validated requests
 * 7. Error Handler - Secure error responses
 * 
 * @module app
 */

'use strict';

// Load environment variables first
require('dotenv').config();

// Core dependencies
const express = require('express');

// Security middleware
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Security configuration
const helmetConfig = require('./config/helmet.config');
const corsOptions = require('./config/cors.config');
const rateLimitOptions = require('./config/rateLimit.config');

// Application modules
const routes = require('./routes');
const errorHandler = require('./utils/errorHandler');

// ============================================================================
// Application Initialization
// ============================================================================

const app = express();

// Trust proxy for accurate IP detection behind load balancers
// Required for rate limiting to work correctly in production
app.set('trust proxy', 1);

// Disable x-powered-by header (also done by helmet, but ensuring it's off)
app.disable('x-powered-by');

// ============================================================================
// Security Middleware Stack
// ============================================================================

/**
 * 1. Rate Limiting (First in chain)
 * Blocks abusive requests before they consume server resources.
 * 100 requests per 15-minute window per IP address.
 * 
 * OWASP Category: A04:2021 Insecure Design (DoS protection)
 */
app.use(rateLimit(rateLimitOptions));

/**
 * 2. Helmet Security Headers
 * Sets 15+ HTTP security headers for comprehensive protection.
 * 
 * OWASP Categories:
 * - A05:2021 Security Misconfiguration
 * - A03:2021 Injection (XSS prevention via CSP)
 */
app.use(helmet(helmetConfig));

/**
 * 3. CORS Middleware
 * Implements whitelist-based cross-origin access control.
 * 
 * OWASP Category: A01:2021 Broken Access Control
 */
app.use(cors(corsOptions));

/**
 * 4. Body Parsers with Size Limits
 * Parses JSON and URL-encoded request bodies with payload size restrictions.
 * Prevents large payload attacks.
 * 
 * Configuration:
 * - JSON limit: BODY_LIMIT env var (default: 10kb)
 * - URL-encoded: Same limit, extended: false for simple parsing
 */
const bodyLimit = process.env.BODY_LIMIT || '10kb';

app.use(express.json({
  limit: bodyLimit,
  strict: true // Only accept arrays and objects
}));

app.use(express.urlencoded({
  extended: false, // Use simple algorithm for parsing
  limit: bodyLimit
}));

/**
 * 5. HTTP Parameter Pollution Protection
 * Prevents array injection through duplicate parameters.
 * Selects the last parameter value from duplicates.
 * 
 * OWASP Category: A03:2021 Injection
 */
app.use(hpp());

// ============================================================================
// Routes
// ============================================================================

/**
 * Mount application routes.
 * All routes benefit from the security middleware stack above.
 */
app.use('/', routes);

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Global error handler (Last in chain)
 * Provides secure error responses:
 * - Production: Generic messages without sensitive details
 * - Development: Full error details for debugging
 * 
 * Prevents information leakage following OWASP guidelines.
 */
app.use(errorHandler);

// ============================================================================
// Export Application
// ============================================================================

module.exports = app;
