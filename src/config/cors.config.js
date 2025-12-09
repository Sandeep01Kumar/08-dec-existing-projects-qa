/**
 * CORS Configuration Module
 * 
 * Configures Cross-Origin Resource Sharing (CORS) policies to control
 * which origins can access the API and what methods/headers are allowed.
 * 
 * Implements OWASP A01:2021 Broken Access Control protection through
 * whitelist-based origin validation.
 * 
 * @module config/cors
 * @see https://www.npmjs.com/package/cors
 */

'use strict';

/**
 * Parse CORS_ORIGIN environment variable to create whitelist array.
 * Supports comma-separated list of origins.
 * 
 * @returns {string[]} Array of allowed origins
 */
const parseOrigins = () => {
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  return corsOrigin.split(',').map(origin => origin.trim());
};

/**
 * Whitelist of allowed origins.
 * Read from CORS_ORIGIN environment variable (comma-separated).
 * Default: http://localhost:3000
 */
const whitelist = parseOrigins();

/**
 * Origin validation function for CORS middleware.
 * Implements whitelist-based access control.
 * 
 * @param {string|undefined} origin - Request Origin header value
 * @param {Function} callback - Callback function (error, allow)
 */
const originValidator = (origin, callback) => {
  // Allow requests with no origin (same-origin, Postman, curl, etc.)
  if (!origin) {
    return callback(null, true);
  }

  // Check if origin is in whitelist
  if (whitelist.includes(origin)) {
    return callback(null, true);
  }

  // Reject unauthorized origins
  const error = new Error(`Origin ${origin} not allowed by CORS policy`);
  error.statusCode = 403;
  return callback(error, false);
};

/**
 * CORS configuration options for cors middleware.
 * 
 * @type {Object}
 * @property {Function} origin - Origin validation function
 * @property {string[]} methods - Allowed HTTP methods
 * @property {string[]} allowedHeaders - Allowed request headers
 * @property {boolean} credentials - Allow credentials (cookies, auth)
 * @property {number} maxAge - Preflight cache duration in seconds
 * @property {string[]} exposedHeaders - Headers exposed to client
 */
const corsOptions = {
  /**
   * Origin validation using whitelist-based approach.
   * Prevents unauthorized cross-origin requests.
   * 
   * OWASP Category: A01:2021 Broken Access Control
   */
  origin: originValidator,

  /**
   * Allowed HTTP methods for cross-origin requests.
   * Includes all standard REST methods plus OPTIONS for preflight.
   */
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  /**
   * Allowed request headers.
   * Common headers for API communication and authentication.
   */
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],

  /**
   * Allow credentials in cross-origin requests.
   * Required for cookies and HTTP authentication.
   * Read from CORS_CREDENTIALS environment variable.
   */
  credentials: process.env.CORS_CREDENTIALS !== 'false',

  /**
   * Preflight request cache duration.
   * 24 hours (86400 seconds) to reduce preflight requests.
   */
  maxAge: 86400,

  /**
   * Headers exposed to the client.
   * Includes RateLimit headers for client-side rate limit awareness.
   */
  exposedHeaders: [
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset'
  ]
};

module.exports = corsOptions;
