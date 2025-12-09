/**
 * Helmet.js Security Headers Configuration Module
 * 
 * Configures 15+ HTTP security headers to protect against common web vulnerabilities.
 * Implements OWASP security guidelines for web application protection.
 * 
 * @module config/helmet
 * @see https://helmetjs.github.io/
 */

'use strict';

/**
 * Determine if running in production environment
 * Stricter security policies are applied in production mode.
 */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Helmet.js configuration object containing all security header settings.
 * 
 * Security Headers Configured:
 * - Content-Security-Policy (CSP): Prevents XSS and injection attacks
 * - HTTP Strict Transport Security (HSTS): Enforces HTTPS connections
 * - X-Frame-Options: Prevents clickjacking attacks
 * - X-Content-Type-Options: Prevents MIME-sniffing attacks
 * - Referrer-Policy: Controls referrer information leakage
 * - Cross-Origin policies: Controls resource sharing between origins
 * 
 * @type {Object}
 */
const helmetConfig = {
  /**
   * Content Security Policy configuration
   * Restricts sources for scripts, styles, images, and other resources.
   * Uses stricter policy in production (no unsafe-inline).
   * 
   * OWASP Category: A03:2021 Injection (XSS prevention)
   */
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: isProduction ? [] : null
    },
    reportOnly: process.env.HELMET_CSP_REPORT_ONLY === 'true'
  },

  /**
   * HTTP Strict Transport Security (HSTS)
   * Forces browsers to use HTTPS for future requests.
   * 
   * Configuration:
   * - maxAge: 1 year (31536000 seconds) by default
   * - includeSubDomains: Applies to all subdomains
   * - preload: Allows inclusion in browser HSTS preload lists (production only)
   * 
   * OWASP Category: A02:2021 Cryptographic Failures
   */
  hsts: {
    maxAge: parseInt(process.env.HSTS_MAX_AGE, 10) || 31536000, // 1 year
    includeSubDomains: true,
    preload: isProduction
  },

  /**
   * X-Frame-Options: DENY
   * Prevents the page from being embedded in iframes.
   * 
   * OWASP Category: A05:2021 Security Misconfiguration (clickjacking prevention)
   */
  frameguard: {
    action: 'deny'
  },

  /**
   * X-Content-Type-Options: nosniff
   * Prevents browsers from MIME-sniffing responses.
   * 
   * OWASP Category: A05:2021 Security Misconfiguration
   */
  noSniff: true,

  /**
   * Referrer-Policy: no-referrer
   * Prevents sending referrer information to other sites.
   * 
   * Privacy and security enhancement.
   */
  referrerPolicy: {
    policy: 'no-referrer'
  },

  /**
   * X-DNS-Prefetch-Control: off
   * Disables DNS prefetching to prevent information leakage.
   */
  dnsPrefetchControl: {
    allow: false
  },

  /**
   * Cross-Origin-Opener-Policy
   * Isolates browsing context from cross-origin documents.
   */
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },

  /**
   * Cross-Origin-Resource-Policy
   * Controls cross-origin resource loading.
   */
  crossOriginResourcePolicy: {
    policy: 'same-origin'
  },

  /**
   * Cross-Origin-Embedder-Policy
   * Requires CORS or CORP for loading cross-origin resources.
   * Note: Only enabled in production to avoid development issues.
   */
  crossOriginEmbedderPolicy: isProduction ? { policy: 'require-corp' } : false,

  /**
   * X-XSS-Protection: 0
   * Disabled per helmet recommendation as browser XSS filters are buggy
   * and can introduce security issues. CSP provides better protection.
   */
  xXssProtection: false,

  /**
   * Remove X-Powered-By header
   * Prevents attackers from identifying the framework (Express).
   * 
   * OWASP Category: A05:2021 Security Misconfiguration
   */
  hidePoweredBy: true
};

module.exports = helmetConfig;
