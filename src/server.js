/**
 * HTTPS-Capable Server Entry Point
 * 
 * Starts the Express application with TLS configuration support.
 * Handles server initialization, graceful shutdown, and environment-aware
 * port binding.
 * 
 * Features:
 * - HTTP server in development mode
 * - HTTPS-ready with TLS configuration in production
 * - Graceful shutdown handling (SIGTERM, SIGINT)
 * - Unhandled rejection and uncaught exception handlers
 * - Secure error logging (no stack traces in production)
 * 
 * Environment Variables:
 * - PORT: Server port (default: 3000)
 * - NODE_ENV: Environment mode (development|production)
 * - TLS_CERT_PATH: Path to TLS certificate file (production only)
 * - TLS_KEY_PATH: Path to TLS private key file (production only)
 * 
 * @module server
 * @requires http
 * @requires https
 * @requires fs
 * @requires dotenv
 * @requires ./app
 */

'use strict';

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Load environment variables from .env file at application entry point.
 * This must be called first before any other modules are imported to ensure
 * PORT, TLS_CERT_PATH, and other server configuration is available.
 */
require('dotenv').config();

// ============================================================================
// Core Dependencies
// ============================================================================

const http = require('http');
const https = require('https');
const fs = require('fs');

// ============================================================================
// Application Import
// ============================================================================

/**
 * Import the configured Express application with complete security middleware stack.
 * The app includes: helmet, cors, rate limiting, hpp, and input validation.
 */
const app = require('./app');

// ============================================================================
// Server Configuration
// ============================================================================

/**
 * Server port number parsed from environment or default to 3000.
 * @type {number}
 */
const PORT = parseInt(process.env.PORT, 10) || 3000;

/**
 * Current Node.js environment (development, production, test).
 * @type {string}
 */
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Flag indicating if running in production mode.
 * @type {boolean}
 */
const isProduction = NODE_ENV === 'production';

/**
 * Path to TLS certificate file for HTTPS server.
 * @type {string|undefined}
 */
const TLS_CERT_PATH = process.env.TLS_CERT_PATH;

/**
 * Path to TLS private key file for HTTPS server.
 * @type {string|undefined}
 */
const TLS_KEY_PATH = process.env.TLS_KEY_PATH;

// ============================================================================
// Server Creation
// ============================================================================

/**
 * HTTP or HTTPS server instance.
 * @type {http.Server|https.Server}
 */
let server;

/**
 * Create HTTP or HTTPS server based on environment and TLS configuration.
 * 
 * In production mode with TLS certificates configured:
 * - Creates HTTPS server with TLS encryption for data in transit
 * - Falls back to HTTP if certificate loading fails
 * 
 * In development mode or without TLS configuration:
 * - Creates HTTP server (HSTS headers still enforced via helmet)
 */
if (isProduction && TLS_CERT_PATH && TLS_KEY_PATH) {
  // Production: Create HTTPS server with TLS certificates
  try {
    const tlsOptions = {
      cert: fs.readFileSync(TLS_CERT_PATH),
      key: fs.readFileSync(TLS_KEY_PATH)
    };
    server = https.createServer(tlsOptions, app);
    console.log('[SERVER] HTTPS server created with TLS certificates');
  } catch (err) {
    // Log error securely without exposing full path in production
    console.error('[SERVER] Failed to load TLS certificates:', isProduction ? 'Certificate error' : err.message);
    console.log('[SERVER] Falling back to HTTP server');
    server = http.createServer(app);
  }
} else {
  // Development or no TLS config: Create HTTP server
  server = http.createServer(app);
  
  if (isProduction) {
    console.warn('[SERVER] WARNING: Running production without HTTPS. Set TLS_CERT_PATH and TLS_KEY_PATH.');
  }
}

// ============================================================================
// Server Startup
// ============================================================================

/**
 * Start the server and listen on configured port.
 * Displays startup banner with server information and security features.
 */
server.listen(PORT, () => {
  const protocol = server instanceof https.Server ? 'https' : 'http';
  const rateLimitMax = process.env.RATE_LIMIT_MAX || 100;
  const rateLimitWindowMs = process.env.RATE_LIMIT_WINDOW_MS || 900000;
  const rateLimitMinutes = rateLimitWindowMs / 60000;
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    Secure Express API Server                    ║
╠════════════════════════════════════════════════════════════════╣
║  URL:         ${protocol}://localhost:${PORT.toString().padEnd(32)}║
║  Environment: ${NODE_ENV.padEnd(41)}║
║  Process ID:  ${process.pid.toString().padEnd(41)}║
║  Protocol:    ${(server instanceof https.Server ? 'HTTPS (TLS)' : 'HTTP').padEnd(41)}║
╚════════════════════════════════════════════════════════════════╝

Security features enabled:
  ✓ Rate limiting (${rateLimitMax} requests per ${rateLimitMinutes} minutes)
  ✓ Helmet security headers (15+ headers)
  ✓ CORS protection (whitelist-based)
  ✓ HTTP Parameter Pollution protection
  ✓ Input validation (Joi schemas)
  ✓ Secure error handling

Endpoints:
  Health check: ${protocol}://localhost:${PORT}/health
  API endpoint: ${protocol}://localhost:${PORT}/api
`);
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Timeout for forced shutdown (30 seconds).
 * @type {number}
 */
const SHUTDOWN_TIMEOUT = 30000;

/**
 * Flag to prevent multiple shutdown attempts.
 * @type {boolean}
 */
let isShuttingDown = false;

/**
 * Gracefully shut down the server.
 * 
 * Closes all connections and allows in-flight requests to complete.
 * If graceful shutdown takes longer than SHUTDOWN_TIMEOUT, forces exit.
 * 
 * @param {string} signal - The signal that triggered shutdown (e.g., SIGTERM, SIGINT)
 */
const gracefulShutdown = (signal) => {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) {
    console.log('[SERVER] Shutdown already in progress...');
    return;
  }
  isShuttingDown = true;
  
  console.log(`\n[SERVER] ${signal} received. Starting graceful shutdown...`);
  
  // Set a timeout to force exit if graceful shutdown fails
  const shutdownTimer = setTimeout(() => {
    console.error('[SERVER] Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
  
  // Prevent the timer from keeping the process alive
  shutdownTimer.unref();
  
  // Close the server and wait for connections to terminate
  server.close((err) => {
    clearTimeout(shutdownTimer);
    
    if (err) {
      console.error('[SERVER] Error during server close:', isProduction ? 'Server close error' : err.message);
      process.exit(1);
    }
    
    console.log('[SERVER] Server closed. All connections terminated gracefully.');
    process.exit(0);
  });
};

// Register shutdown signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================================================
// Global Error Handlers
// ============================================================================

/**
 * Handle unhandled promise rejections.
 * 
 * Logs the error securely without exposing stack traces in production.
 * In production, initiates graceful shutdown to allow process manager to restart.
 * 
 * @param {Error|any} reason - The rejection reason
 * @param {Promise} promise - The rejected promise
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER] Unhandled Promise Rejection:', {
    timestamp: new Date().toISOString(),
    reason: isProduction ? 'Unhandled rejection occurred' : reason,
    promise: isProduction ? undefined : promise
  });
  
  // In production, graceful shutdown allows process manager to restart
  if (isProduction) {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

/**
 * Handle uncaught exceptions.
 * 
 * Logs the error securely without exposing stack traces in production.
 * Always initiates graceful shutdown as the process state may be corrupted.
 * 
 * @param {Error} err - The uncaught exception
 */
process.on('uncaughtException', (err) => {
  console.error('[SERVER] Uncaught Exception:', {
    timestamp: new Date().toISOString(),
    name: err.name,
    message: isProduction ? 'Uncaught exception occurred' : err.message,
    stack: isProduction ? undefined : err.stack
  });
  
  // Always restart on uncaught exception - process state may be corrupted
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// ============================================================================
// Export Server
// ============================================================================

/**
 * Export the HTTP/HTTPS server instance.
 * 
 * The exported server provides the following methods:
 * - listen(port, callback): Start listening for connections
 * - close(callback): Stop accepting new connections
 * - address(): Get the bound address
 * - on(event, listener): Attach event listeners
 * 
 * @type {http.Server|https.Server}
 */
module.exports = server;
