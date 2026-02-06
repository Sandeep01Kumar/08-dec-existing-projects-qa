/**
 * Rate Limiting Configuration Module
 * 
 * Configures express-rate-limit middleware to prevent DoS attacks and brute-force attempts.
 * Implements OWASP A04:2021 - Insecure Design protection through request throttling.
 * 
 * @module config/rateLimit
 * @see https://www.npmjs.com/package/express-rate-limit
 */

'use strict';

/**
 * Rate limiting configuration options for express-rate-limit middleware.
 * 
 * Environment Variables:
 * - RATE_LIMIT_WINDOW_MS: Time window in milliseconds (default: 900000 = 15 minutes)
 * - RATE_LIMIT_MAX: Maximum requests per window per IP (default: 100)
 * 
 * @type {Object}
 * @property {number} windowMs - Time window duration in milliseconds
 * @property {number} max - Maximum number of requests per window per IP
 * @property {string} standardHeaders - Enable standard RateLimit-* headers (draft-8)
 * @property {boolean} legacyHeaders - Disable deprecated X-RateLimit-* headers
 * @property {Object} message - Response body when rate limit is exceeded
 * @property {Function} skip - Function to skip rate limiting for certain requests
 * @property {Function} keyGenerator - Function to identify clients (uses IP address)
 */
const rateLimitOptions = {
  /**
   * Time window for rate limiting in milliseconds.
   * Default: 15 minutes (900000ms)
   */
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,

  /**
   * Maximum number of requests allowed per window per IP address.
   * Default: 100 requests
   */
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  /**
   * Enable the standard RateLimit headers recommended by the IETF.
   * Uses draft-8 specification for RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset headers.
   */
  standardHeaders: 'draft-8',

  /**
   * Disable the legacy X-RateLimit-* headers.
   * These headers are deprecated in favor of the standard headers.
   */
  legacyHeaders: false,

  /**
   * Response message sent when rate limit is exceeded.
   * Returns a JSON object with status code and descriptive message.
   */
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  },

  /**
   * Function to determine whether to skip rate limiting for a request.
   * Bypasses rate limiting for health check endpoints to ensure monitoring
   * systems can always access application health status.
   * 
   * @param {Object} req - Express request object
   * @returns {boolean} True if the request should skip rate limiting
   */
  skip: (req) => {
    const healthEndpoints = ['/health', '/api/health'];
    return healthEndpoints.includes(req.path);
  },

  /**
   * Function to generate a unique key for each client.
   * Uses the client's IP address for identification.
   * Express sets req.ip based on trust proxy settings.
   * 
   * @param {Object} req - Express request object
   * @returns {string} The client's IP address
   */
  keyGenerator: (req) => {
    return req.ip;
  }
};

module.exports = rateLimitOptions;
