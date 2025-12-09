/**
 * Main Router Aggregation Module
 * 
 * Central routing configuration that aggregates all application route modules
 * and exports a unified router for the Express application.
 * 
 * Route Table:
 * - /         -> Root endpoint (application info)
 * - /health   -> Health check endpoint
 * - /api/*    -> API routes (apiRoutes)
 * - *         -> 404 catch-all handler
 * 
 * @module routes/index
 */

'use strict';

const express = require('express');
const apiRoutes = require('./api.routes');

const router = express.Router();

// ============================================================================
// Root Endpoint
// ============================================================================

/**
 * @route GET /
 * @description Application information endpoint
 * @access Public
 * @returns {Object} Application name, version, and status
 */
router.get('/', (req, res) => {
  res.status(200).json({
    name: 'secure-express-api',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/health for health check'
  });
});

// ============================================================================
// Health Check Endpoint
// ============================================================================

/**
 * @route GET /health
 * @description Health check endpoint for load balancers and monitoring
 * @access Public (bypasses rate limiting)
 * @returns {Object} Health status and uptime
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memoryUsage: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
    }
  });
});

// ============================================================================
// Mount API Routes
// ============================================================================

/**
 * Mount API routes at /api prefix.
 * All routes defined in api.routes.js will be available under /api/*
 */
router.use('/api', apiRoutes);

// ============================================================================
// 404 Catch-All Handler
// ============================================================================

/**
 * 404 handler for undefined routes.
 * Must be defined last to catch all unmatched requests.
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'The requested resource does not exist',
      statusCode: 404,
      path: req.originalUrl,
      method: req.method
    }
  });
});

module.exports = router;
