/**
 * Helmet.js Security Headers Configuration Module
 * 
 * Configures 15+ HTTP security headers to protect against common web vulnerabilities.
 * Implements OWASP security guidelines for web application protection.
 * 
 * Security Headers Configured:
 * - Content-Security-Policy (CSP): Prevents XSS and injection attacks
 * - HTTP Strict Transport Security (HSTS): Enforces HTTPS connections
 * - X-Frame-Options: Prevents clickjacking attacks
 * - X-Content-Type-Options: Prevents MIME-sniffing attacks
 * - Referrer-Policy: Controls referrer information leakage
 * - Cross-Origin policies: Controls resource sharing between origins
 * - DNS Prefetch Control: Prevents information leakage via DNS prefetching
 * - X-XSS-Protection: Disabled per helmet recommendation (CSP is preferred)
 * - X-Powered-By: Removed to hide Express signature
 * 
 * @module config/helmet
 * @see https://helmetjs.github.io/
 * @version 8.1.0
 */

'use strict';

/**
 * Determine if running in production environment.
 * Stricter security policies are applied in production mode.
 * @type {boolean}
 */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * HSTS max-age value in seconds.
 * Default: 31536000 (1 year) as recommended by security best practices.
 * @type {number}
 */
const hstsMaxAge = parseInt(process.env.HSTS_MAX_AGE, 10) || 31536000;

/**
 * CSP report-only mode flag.
 * When true, CSP violations are reported but not blocked.
 * Useful for testing CSP policies before enforcement.
 * @type {boolean}
 */
const cspReportOnly = process.env.HELMET_CSP_REPORT_ONLY === 'true';

/**
 * Helmet.js configuration object containing all security header settings.
 * 
 * This configuration object is designed to be passed directly to helmet() middleware.
 * All security settings are environment-aware with stricter policies in production.
 * 
 * @type {Object}
 * @property {Object} contentSecurityPolicy - CSP configuration
 * @property {Object} hsts - HTTP Strict Transport Security configuration
 * @property {Object} frameguard - X-Frame-Options configuration
 * @property {boolean} noSniff - X-Content-Type-Options configuration
 * @property {Object} referrerPolicy - Referrer-Policy configuration
 * @property {Object} dnsPrefetchControl - X-DNS-Prefetch-Control configuration
 * @property {Object} crossOriginOpenerPolicy - Cross-Origin-Opener-Policy configuration
 * @property {Object} crossOriginResourcePolicy - Cross-Origin-Resource-Policy configuration
 * @property {Object|boolean} crossOriginEmbedderPolicy - Cross-Origin-Embedder-Policy configuration
 * @property {boolean} xXssProtection - X-XSS-Protection configuration (disabled)
 * @property {boolean} hidePoweredBy - Controls removal of X-Powered-By header
 */
const helmetConfig = {
  /**
   * Content Security Policy (CSP) Configuration
   * 
   * Restricts sources for scripts, styles, images, and other resources.
   * Uses stricter policy in production (no unsafe-inline for scripts).
   * 
   * Directives:
   * - defaultSrc: Fallback for other directives ('self' only)
   * - scriptSrc: Sources for JavaScript ('unsafe-inline' allowed in dev only)
   * - styleSrc: Sources for CSS ('unsafe-inline' allowed for inline styles)
   * - imgSrc: Sources for images (self, data URIs, and HTTPS sources)
   * - fontSrc: Sources for fonts ('self' only)
   * - objectSrc: Sources for plugins ('none' - disables <object>, <embed>)
   * - frameAncestors: Valid parents for frames ('none' - prevents framing)
   * - formAction: Valid targets for form submissions ('self' only)
   * - baseUri: Valid values for <base> element ('self' only)
   * - upgradeInsecureRequests: Upgrade HTTP to HTTPS (production only)
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
    reportOnly: cspReportOnly
  },

  /**
   * HTTP Strict Transport Security (HSTS) Configuration
   * 
   * Forces browsers to use HTTPS for all future requests to this domain.
   * Once set, browsers will automatically convert HTTP requests to HTTPS.
   * 
   * Settings:
   * - maxAge: Duration (in seconds) to remember HTTPS-only policy
   * - includeSubDomains: Applies policy to all subdomains
   * - preload: Allows inclusion in browser HSTS preload lists (production only)
   * 
   * Note: preload requires submission to hstspreload.org for actual inclusion.
   * 
   * OWASP Category: A02:2021 Cryptographic Failures
   */
  hsts: {
    maxAge: hstsMaxAge,
    includeSubDomains: true,
    preload: isProduction
  },

  /**
   * X-Frame-Options Configuration
   * 
   * Prevents the page from being embedded in iframes on other sites.
   * Setting to 'deny' provides maximum protection against clickjacking.
   * 
   * Options:
   * - 'deny': Page cannot be displayed in a frame
   * - 'sameorigin': Page can only be displayed in frame on same origin
   * 
   * OWASP Category: A05:2021 Security Misconfiguration (clickjacking prevention)
   */
  frameguard: {
    action: 'deny'
  },

  /**
   * X-Content-Type-Options Configuration
   * 
   * Prevents browsers from MIME-sniffing responses away from declared content-type.
   * Setting to true adds 'nosniff' header value.
   * 
   * Prevents attacks where browser incorrectly interprets content
   * (e.g., treating text/plain as text/html for XSS).
   * 
   * OWASP Category: A05:2021 Security Misconfiguration
   */
  noSniff: true,

  /**
   * Referrer-Policy Configuration
   * 
   * Controls how much referrer information is included with requests.
   * 'no-referrer' provides maximum privacy by sending no referrer header.
   * 
   * This prevents leaking sensitive URL information (including query params)
   * to external sites.
   * 
   * Privacy and security enhancement.
   */
  referrerPolicy: {
    policy: 'no-referrer'
  },

  /**
   * X-DNS-Prefetch-Control Configuration
   * 
   * Controls browser DNS prefetching behavior.
   * Setting allow: false disables DNS prefetching to prevent information leakage.
   * 
   * DNS prefetching can reveal browsing patterns to DNS providers
   * and potentially leak information about page content.
   */
  dnsPrefetchControl: {
    allow: false
  },

  /**
   * Cross-Origin-Opener-Policy Configuration
   * 
   * Isolates the browsing context from cross-origin documents.
   * 'same-origin' ensures the document won't share a browsing context group
   * with cross-origin documents.
   * 
   * This helps prevent side-channel attacks like Spectre.
   */
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },

  /**
   * Cross-Origin-Resource-Policy Configuration
   * 
   * Controls cross-origin resource loading.
   * 'same-origin' restricts resource loading to same-origin requests only.
   * 
   * Prevents other sites from loading your resources directly.
   */
  crossOriginResourcePolicy: {
    policy: 'same-origin'
  },

  /**
   * Cross-Origin-Embedder-Policy Configuration
   * 
   * Requires CORS or CORP for loading cross-origin resources.
   * Enabled only in production to avoid development complications.
   * 
   * When set to 'require-corp', the document can only load resources
   * from the same origin or resources explicitly marked as loadable.
   * 
   * Note: This may break loading of external resources without proper
   * CORS headers, so it's disabled in development.
   */
  crossOriginEmbedderPolicy: isProduction ? { policy: 'require-corp' } : false,

  /**
   * X-XSS-Protection Configuration
   * 
   * DISABLED per helmet.js recommendation.
   * The browser's XSS filter is buggy and can introduce security issues.
   * Modern protection should use Content-Security-Policy instead.
   * 
   * Setting to false sends the header with value '0', explicitly disabling
   * the filter to avoid its potential security issues.
   * 
   * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
   */
  xXssProtection: false,

  /**
   * X-Powered-By Header Removal
   * 
   * Removes the X-Powered-By header that identifies Express.js.
   * This prevents attackers from easily identifying the framework
   * and targeting known Express vulnerabilities.
   * 
   * Security through obscurity alone is not sufficient, but removing
   * unnecessary information disclosure is a best practice.
   * 
   * OWASP Category: A05:2021 Security Misconfiguration
   */
  hidePoweredBy: true
};

module.exports = helmetConfig;
