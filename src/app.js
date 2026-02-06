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
 * @requires express
 * @requires helmet
 * @requires cors
 * @requires express-rate-limit
 * @requires hpp
 * @requires dotenv
 */

'use strict';

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Load environment variables from .env file.
 * This must be called first before any other module loads to ensure
 * all configuration values are available.
 */
require('dotenv').config();

// ============================================================================
// Core Dependencies
// ============================================================================

const express = require('express');

// ============================================================================
// Security Middleware Imports
// ============================================================================

/**
 * Helmet.js - Security headers middleware
 * Sets 15+ HTTP security headers including CSP, HSTS, X-Frame-Options
 * @see https://helmetjs.github.io/
 */
const helmet = require('helmet');

/**
 * CORS middleware - Cross-Origin Resource Sharing
 * Enables secure cross-origin requests with whitelist-based origin validation
 * @see https://www.npmjs.com/package/cors
 */
const cors = require('cors');

/**
 * Express Rate Limit - Request throttling
 * Prevents DoS attacks by limiting requests per IP address
 * @see https://www.npmjs.com/package/express-rate-limit
 */
const rateLimit = require('express-rate-limit');

/**
 * HPP - HTTP Parameter Pollution protection
 * Prevents parameter pollution attacks by selecting last parameter value
 * @see https://www.npmjs.com/package/hpp
 */
const hpp = require('hpp');

// ============================================================================
// Security Configuration Imports
// ============================================================================

/**
 * Helmet configuration object with CSP, HSTS, and 15+ security header settings
 */
const helmetConfig = require('./config/helmet.config');

/**
 * CORS configuration with whitelist-based origin validation
 */
const corsOptions = require('./config/cors.config');

/**
 * Rate limiting configuration with 100 requests per 15-minute window
 */
const rateLimitOptions = require('./config/rateLimit.config');

// ============================================================================
// Application Module Imports
// ============================================================================

/**
 * Main router aggregating all application routes
 */
const routes = require('./routes');

/**
 * Secure error handling middleware preventing information leakage
 */
const errorHandler = require('./utils/errorHandler');

// ============================================================================
// Application Initialization
// ============================================================================

/**
 * Express application instance.
 * Configured with comprehensive security middleware stack.
 * @type {express.Application}
 */
const app = express();

/**
 * Configure trust proxy setting for accurate IP detection.
 * Required for rate limiting to work correctly when deployed
 * behind a reverse proxy, load balancer, or cloud provider.
 * 
 * Setting to 1 trusts the first proxy in the X-Forwarded-For chain.
 * Adjust based on your infrastructure (number of trusted proxies).
 */
app.set('trust proxy', 1);

/**
 * Disable x-powered-by header to hide Express signature.
 * This prevents attackers from easily identifying the framework.
 * Note: Helmet also disables this, but we set it explicitly for redundancy.
 */
app.disable('x-powered-by');

// ============================================================================
// Security Middleware Stack
// Order matters! Apply in this specific sequence for optimal security.
// ============================================================================

/**
 * 1. Rate Limiting (First in chain)
 * 
 * Blocks abusive requests before they consume server resources.
 * Must be applied early to prevent DoS attacks from affecting other middleware.
 * 
 * Default configuration:
 * - 100 requests per 15-minute window per IP address
 * - Returns 429 Too Many Requests when limit exceeded
 * - Uses standard RateLimit-* headers (draft-8 specification)
 * - Skips rate limiting for health check endpoints
 * 
 * OWASP Category: A04:2021 Insecure Design (DoS protection)
 */
app.use(rateLimit(rateLimitOptions));

/**
 * 2. Helmet Security Headers
 * 
 * Sets 15+ HTTP security headers for comprehensive protection.
 * Headers configured:
 * - Content-Security-Policy: Prevents XSS and injection attacks
 * - Strict-Transport-Security: Forces HTTPS connections
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME-sniffing
 * - Referrer-Policy: Controls referrer information
 * - Cross-Origin-*-Policy: Controls cross-origin resource access
 * - X-Powered-By: Removed to hide Express signature
 * 
 * OWASP Categories:
 * - A05:2021 Security Misconfiguration
 * - A03:2021 Injection (XSS prevention via CSP)
 */
app.use(helmet(helmetConfig));

/**
 * 3. CORS Middleware
 * 
 * Implements whitelist-based cross-origin access control.
 * Validates Origin header against configured whitelist.
 * 
 * Configuration includes:
 * - Whitelist-based origin validation
 * - Allowed HTTP methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
 * - Credentials support for cookies and authentication
 * - 24-hour preflight cache duration
 * - Exposed rate limit headers for client awareness
 * 
 * OWASP Category: A01:2021 Broken Access Control
 */
app.use(cors(corsOptions));

/**
 * 4. Body Parsers with Size Limits
 * 
 * Parses JSON and URL-encoded request bodies with payload size restrictions.
 * Size limits prevent large payload attacks and resource exhaustion.
 * 
 * Configuration:
 * - JSON limit: Controlled by BODY_LIMIT environment variable (default: 10kb)
 * - URL-encoded limit: Same as JSON limit
 * - Strict JSON parsing: Only accepts arrays and objects
 * - Extended URL-encoding: Disabled for simpler, safer parsing
 * 
 * Security benefit: Prevents request body attacks and resource exhaustion
 */
const bodyLimit = process.env.BODY_LIMIT || '10kb';

app.use(express.json({
  limit: bodyLimit,
  strict: true // Only accept arrays and objects, reject primitives
}));

app.use(express.urlencoded({
  extended: false, // Use querystring library for simpler parsing
  limit: bodyLimit
}));

/**
 * 5. HTTP Parameter Pollution Protection
 * 
 * Prevents parameter pollution attacks by choosing the last parameter value
 * when duplicate parameters are provided in the query string or body.
 * 
 * Attack example prevented:
 * GET /api/users?id=1&id=2 → id=2 (not array [1,2])
 * 
 * OWASP Category: A03:2021 Injection
 */
app.use(hpp());

// ============================================================================
// Routes
// ============================================================================

/**
 * Mount application routes at the root path.
 * 
 * All routes benefit from the security middleware stack applied above.
 * Routes include:
 * - GET /         - Application information
 * - GET /health   - Health check endpoint
 * - /api/*        - API routes with input validation
 * - *             - 404 catch-all handler
 */
app.use('/', routes);

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Global error handler (Last in chain)
 * 
 * Provides secure error responses that prevent information leakage:
 * - Production: Generic error messages with reference ID for support
 * - Development: Full error details including stack traces
 * 
 * Features:
 * - Unique error reference IDs for tracking
 * - Secure logging with sanitized messages
 * - Proper handling of validation errors
 * - JSON parsing error handling
 * 
 * OWASP Guideline: Error messages should not reveal sensitive information
 */
app.use(errorHandler);

// ============================================================================
// Export Application
// ============================================================================

/**
 * Export the configured Express application instance.
 * 
 * The application is fully configured with:
 * - Security middleware stack
 * - Routes
 * - Error handling
 * 
 * Usage:
 * const app = require('./app');
 * app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
 * 
 * @type {express.Application}
 */
module.exports = app;
