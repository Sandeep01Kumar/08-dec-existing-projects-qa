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
 * 
 * @module server
 */

'use strict';

// Load environment variables first
require('dotenv').config();

const http = require('http');
const https = require('https');
const fs = require('fs');
const app = require('./app');

// ============================================================================
// Configuration
// ============================================================================

const PORT = parseInt(process.env.PORT, 10) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// TLS certificate paths (for production HTTPS)
const TLS_CERT_PATH = process.env.TLS_CERT_PATH;
const TLS_KEY_PATH = process.env.TLS_KEY_PATH;

// ============================================================================
// Server Creation
// ============================================================================

let server;

/**
 * Create HTTP or HTTPS server based on environment and TLS configuration.
 */
if (isProduction && TLS_CERT_PATH && TLS_KEY_PATH) {
  // Production: Create HTTPS server with TLS certificates
  try {
    const tlsOptions = {
      cert: fs.readFileSync(TLS_CERT_PATH),
      key: fs.readFileSync(TLS_KEY_PATH)
    };
    server = https.createServer(tlsOptions, app);
    console.log('HTTPS server created with TLS certificates');
  } catch (err) {
    console.error('Failed to load TLS certificates:', err.message);
    console.log('Falling back to HTTP server');
    server = http.createServer(app);
  }
} else {
  // Development: Create HTTP server
  server = http.createServer(app);
}

// ============================================================================
// Server Startup
// ============================================================================

server.listen(PORT, () => {
  const protocol = server instanceof https.Server ? 'https' : 'http';
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                  Secure Express API                         ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: ${protocol}://localhost:${PORT.toString().padEnd(22)}║
║  Environment: ${NODE_ENV.padEnd(37)}║
║  Process ID: ${process.pid.toString().padEnd(38)}║
╚════════════════════════════════════════════════════════════╝

Security features enabled:
  ✓ Rate limiting (${process.env.RATE_LIMIT_MAX || 100} requests per ${(process.env.RATE_LIMIT_WINDOW_MS || 900000) / 60000} minutes)
  ✓ Helmet security headers (15+ headers)
  ✓ CORS protection (whitelist-based)
  ✓ HTTP Parameter Pollution protection
  ✓ Input validation (Joi schemas)
  ✓ Secure error handling

Health check: ${protocol}://localhost:${PORT}/health
API endpoint: ${protocol}://localhost:${PORT}/api
`);
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Gracefully shut down the server.
 * Closes all connections and allows in-flight requests to complete.
 * 
 * @param {string} signal - The signal that triggered shutdown
 */
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error during server close:', err.message);
      process.exit(1);
    }
    
    console.log('Server closed. All connections terminated gracefully.');
    process.exit(0);
  });
  
  // Force close after 30 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================================================
// Error Handlers
// ============================================================================

/**
 * Handle unhandled promise rejections.
 * Logs the error securely without exposing stack traces in production.
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', {
    timestamp: new Date().toISOString(),
    reason: isProduction ? 'Unhandled rejection occurred' : reason
  });
  
  // In production, we might want to restart the server
  if (isProduction) {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

/**
 * Handle uncaught exceptions.
 * Logs the error and initiates graceful shutdown.
 */
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', {
    timestamp: new Date().toISOString(),
    name: err.name,
    message: isProduction ? 'Uncaught exception occurred' : err.message,
    stack: isProduction ? undefined : err.stack
  });
  
  // Always restart on uncaught exception
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// ============================================================================
// Export Server
// ============================================================================

module.exports = server;
