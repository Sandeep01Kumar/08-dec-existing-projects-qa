/**
 * Main Router Aggregation Module
 * 
 * Central routing configuration that aggregates all application route modules
 * and exports a unified router for the Express application. Serves as the single
 * entry point for all HTTP endpoint definitions in the application.
 * 
 * Security Note: All routes inherit security middleware (helmet, cors, rate limiting)
 * applied at the application level in src/app.js before reaching this router.
 * 
 * Route Table:
 * ┌─────────────┬────────────────────────────────────────────────────────┐
 * │ Path        │ Handler                                                │
 * ├─────────────┼────────────────────────────────────────────────────────┤
 * │ GET /       │ Root endpoint - Application info                       │
 * │ GET /health │ Health check - Load balancer & monitoring endpoint     │
 * │ /api/*      │ API routes - Mounted from api.routes.js                │
 * │ *           │ 404 catch-all handler (must be last)                   │
 * └─────────────┴────────────────────────────────────────────────────────┘
 * 
 * @module routes/index
 * @requires express
 * @requires ./api.routes
 */

'use strict';

const express = require('express');
const apiRoutes = require('./api.routes');

/**
 * Express Router instance for route aggregation.
 * All route definitions are mounted on this router.
 * @type {express.Router}
 */
const router = express.Router();

// ============================================================================
// Root Endpoint
// ============================================================================

/**
 * @route GET /
 * @description Application information endpoint providing basic service metadata.
 *              Useful for service discovery and quick verification that the
 *              application is running.
 * @access Public
 * @returns {Object} Application metadata
 * @returns {string} returns.name - Application name
 * @returns {string} returns.version - Application version
 * @returns {string} returns.status - Current running status
 */
router.get('/', (req, res) => {
  res.status(200).json({
    name: 'secure-express-api',
    version: '1.0.0',
    status: 'running'
  });
});

// ============================================================================
// Health Check Endpoint
// ============================================================================

/**
 * @route GET /health
 * @description Health check endpoint for load balancers, container orchestration
 *              systems, and monitoring tools. Returns server health status and
 *              uptime information.
 * @access Public
 * @returns {Object} Health status information
 * @returns {string} returns.status - Health status ('healthy')
 * @returns {number} returns.uptime - Server uptime in seconds
 * @returns {string} returns.timestamp - Current server timestamp (ISO 8601)
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// Mount API Routes
// ============================================================================

/**
 * Mount API routes at /api prefix.
 * All routes defined in api.routes.js will be accessible under /api/*
 * 
 * Available API endpoints:
 * - GET    /api/health        - API health check
 * - GET    /api/users         - List users (paginated)
 * - GET    /api/users/:id     - Get user by ID
 * - POST   /api/users         - Create new user
 * - PUT    /api/users/:id     - Update user
 * - DELETE /api/users/:id     - Delete user
 * - POST   /api/echo          - Echo request data (testing)
 */
router.use('/api', apiRoutes);

// ============================================================================
// 404 Catch-All Handler
// ============================================================================

/**
 * 404 handler for undefined routes.
 * This middleware MUST be defined last to catch all requests that don't
 * match any defined route. Returns a standardized error response.
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = router;
