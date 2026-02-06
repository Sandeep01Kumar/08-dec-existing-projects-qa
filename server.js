'use strict';

/**
 * Robust Node.js HTTP Server Implementation
 * 
 * This server provides comprehensive production-ready features including:
 * - Global error handling (uncaughtException, unhandledRejection)
 * - Graceful shutdown (SIGTERM, SIGINT, SIGQUIT)
 * - Input validation using express-validator
 * - Resource tracking and cleanup
 * - Health check endpoints for orchestrators
 * 
 * @module server
 */

// =============================================================================
// EXTERNAL DEPENDENCIES
// =============================================================================

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

/**
 * Server configuration with environment variable overrides
 */
const CONFIG = {
  /** HTTP server port - defaults to 3000 */
  PORT: parseInt(process.env.PORT, 10) || 3000,
  
  /** Server bind address - defaults to localhost */
  HOST: process.env.HOST || 'localhost',
  
  /** Graceful shutdown timeout in milliseconds - defaults to 30 seconds */
  SHUTDOWN_TIMEOUT_MS: parseInt(process.env.SHUTDOWN_TIMEOUT_MS, 10) || 30000,
  
  /** Current environment mode */
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  /** Request body size limit */
  BODY_LIMIT: '1mb'
};

// =============================================================================
// RESOURCE TRACKING MODULE
// =============================================================================

/**
 * Resource tracking object for managing server connections, timers,
 * and shutdown state. Exported for testing purposes.
 * 
 * @property {Set} connections - Active socket connections
 * @property {Set} timers - Active timer references
 * @property {boolean} isShuttingDown - Flag indicating shutdown in progress
 * @property {Function} cleanup - Cleanup function for additional resources
 */
const resources = {
  /** Set of active socket connections for graceful shutdown */
  connections: new Set(),
  
  /** Set of active timers for cleanup during shutdown */
  timers: new Set(),
  
  /** Flag to indicate if graceful shutdown is in progress */
  isShuttingDown: false,
  
  /**
   * Add a tracked timer
   * @param {NodeJS.Timeout} timer - Timer reference to track
   * @returns {NodeJS.Timeout} The tracked timer
   */
  addTimer: function(timer) {
    this.timers.add(timer);
    return timer;
  },
  
  /**
   * Remove a tracked timer
   * @param {NodeJS.Timeout} timer - Timer reference to remove
   */
  removeTimer: function(timer) {
    this.timers.delete(timer);
  },
  
  /**
   * Clear all tracked timers
   */
  clearAllTimers: function() {
    for (const timer of this.timers) {
      clearTimeout(timer);
      clearInterval(timer);
    }
    this.timers.clear();
  },
  
  /**
   * Cleanup hook for additional resources (database connections, etc.)
   * Override this function to add custom cleanup logic
   * @returns {Promise<void>}
   */
  cleanup: async function() {
    console.log('[CLEANUP] All resources cleaned up');
    return Promise.resolve();
  }
};

// =============================================================================
// EXPRESS APPLICATION SETUP
// =============================================================================

/**
 * Express application instance
 * Configured with body parsing, logging, and security middleware
 */
const app = express();

/**
 * Request body parsing middleware with size limits
 * Limits help prevent DoS attacks from oversized payloads
 */
app.use(express.json({ limit: CONFIG.BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: CONFIG.BODY_LIMIT }));

/**
 * Request logging middleware
 * Logs method, URL, and timestamp for each request
 */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  
  console.log(`[${timestamp}] ${method} ${url}`);
  
  // Track response completion for logging
  res.on('finish', () => {
    console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode}`);
  });
  
  next();
});

/**
 * Shutdown-aware middleware
 * Rejects new requests during graceful shutdown
 */
app.use((req, res, next) => {
  if (resources.isShuttingDown) {
    res.setHeader('Connection', 'close');
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// =============================================================================
// INPUT VALIDATION MIDDLEWARE
// =============================================================================

/**
 * Validation middleware for user registration
 * Validates username, email, and password fields
 */
const validateUserRegistration = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

/**
 * Validation middleware for resource ID parameter
 * Ensures ID is a positive integer
 */
const validateResourceId = [
  param('id')
    .notEmpty()
    .withMessage('Resource ID is required')
    .isInt({ min: 1 })
    .withMessage('Resource ID must be a positive integer')
    .toInt()
];

/**
 * Validation middleware for pagination query parameters
 * Validates page number and limit with sensible defaults
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

/**
 * Middleware to handle validation results
 * Returns structured error response if validation fails
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'One or more fields failed validation',
      details: formattedErrors,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// =============================================================================
// API ROUTES WITH VALIDATION
// =============================================================================

/**
 * Health check endpoint
 * Used by orchestrators (Kubernetes, Docker) for liveness probes
 * 
 * @route GET /health
 * @returns {Object} Health status with uptime and timestamp
 */
app.get('/health', (req, res) => {
  const healthData = {
    status: resources.isShuttingDown ? 'shutting_down' : 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: CONFIG.NODE_ENV,
    memoryUsage: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };
  
  const statusCode = resources.isShuttingDown ? 503 : 200;
  res.status(statusCode).json(healthData);
});

/**
 * Root endpoint
 * Returns welcome message and server information
 * 
 * @route GET /
 * @returns {Object} Welcome message with server info
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Robust Node.js Server',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

/**
 * User registration endpoint
 * Creates a new user with validated input
 * 
 * @route POST /api/users
 * @param {string} username - User's username (3-50 chars, alphanumeric + underscore)
 * @param {string} email - User's email address
 * @param {string} password - User's password (min 8 chars, mixed case + number)
 * @returns {Object} Created user data (without password)
 */
app.post('/api/users', 
  validateUserRegistration,
  handleValidationErrors,
  (req, res) => {
    const { username, email } = req.body;
    
    // Simulate user creation (in production, this would save to database)
    const newUser = {
      id: Math.floor(Math.random() * 10000) + 1,
      username,
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log(`[USER] New user registered: ${username}`);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  }
);

/**
 * Get resource by ID endpoint
 * Retrieves a resource with validated ID parameter
 * 
 * @route GET /api/resources/:id
 * @param {number} id - Resource ID (positive integer)
 * @returns {Object} Resource data
 */
app.get('/api/resources/:id',
  validateResourceId,
  handleValidationErrors,
  (req, res) => {
    const { id } = req.params;
    
    // Simulate resource lookup (in production, this would query database)
    const resource = {
      id: parseInt(id, 10),
      name: `Resource ${id}`,
      type: 'example',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: resource
    });
  }
);

/**
 * Get paginated items list endpoint
 * Returns items with validated pagination parameters
 * 
 * @route GET /api/items
 * @query {number} [page=1] - Page number (positive integer)
 * @query {number} [limit=10] - Items per page (1-100)
 * @returns {Object} Paginated items with metadata
 */
app.get('/api/items',
  validatePagination,
  handleValidationErrors,
  (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const offset = (page - 1) * limit;
    
    // Simulate database query with pagination
    const totalItems = 100;
    const totalPages = Math.ceil(totalItems / limit);
    
    const items = [];
    for (let i = 0; i < limit && (offset + i) < totalItems; i++) {
      items.push({
        id: offset + i + 1,
        name: `Item ${offset + i + 1}`,
        createdAt: new Date().toISOString()
      });
    }
    
    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  }
);

/**
 * API documentation endpoint placeholder
 * 
 * @route GET /api/docs
 * @returns {Object} Documentation information
 */
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    message: 'API Documentation',
    endpoints: [
      { method: 'GET', path: '/', description: 'Welcome message' },
      { method: 'GET', path: '/health', description: 'Health check' },
      { method: 'POST', path: '/api/users', description: 'Create user' },
      { method: 'GET', path: '/api/resources/:id', description: 'Get resource by ID' },
      { method: 'GET', path: '/api/items', description: 'Get paginated items' }
    ]
  });
});

// =============================================================================
// 404 HANDLER FOR UNDEFINED ROUTES
// =============================================================================

/**
 * Catch-all handler for undefined routes
 * Must be placed after all defined routes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * Global error handling middleware
 * Express recognizes this as error middleware due to 4 parameters
 * Handles all uncaught errors in the request-response cycle
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
app.use((err, req, res, next) => {
  // Log error details for debugging
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  // Determine error type and appropriate response
  const isOperationalError = err.isOperational || false;
  const statusCode = err.statusCode || err.status || 500;
  
  // Build error response
  const errorResponse = {
    success: false,
    error: err.name || 'InternalServerError',
    message: CONFIG.NODE_ENV === 'production' && !isOperationalError
      ? 'An unexpected error occurred'
      : err.message,
    timestamp: new Date().toISOString()
  };
  
  // Include stack trace in development mode
  if (CONFIG.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = {
      url: req.url,
      method: req.method
    };
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
});

// =============================================================================
// HTTP SERVER CREATION
// =============================================================================

/** HTTP server instance - initialized during startup */
let server = null;

/**
 * Create and configure the HTTP server
 * Sets up connection tracking for graceful shutdown
 * 
 * @returns {http.Server} Configured HTTP server instance
 */
function createServer() {
  const http = require('http');
  server = http.createServer(app);
  
  // Track all connections for graceful shutdown
  server.on('connection', (socket) => {
    resources.connections.add(socket);
    
    socket.on('close', () => {
      resources.connections.delete(socket);
    });
  });
  
  // Handle server errors (e.g., port already in use)
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[ERROR] Port ${CONFIG.PORT} is already in use`);
      process.exit(1);
    } else if (error.code === 'EACCES') {
      console.error(`[ERROR] Port ${CONFIG.PORT} requires elevated privileges`);
      process.exit(1);
    } else {
      console.error('[ERROR] Server error:', error.message);
      throw error;
    }
  });
  
  return server;
}

// =============================================================================
// GRACEFUL SHUTDOWN FUNCTION
// =============================================================================

/**
 * Performs graceful shutdown of the server
 * - Stops accepting new connections
 * - Waits for existing requests to complete
 * - Cleans up all tracked resources
 * - Exits process with appropriate code
 * 
 * @param {string} signal - The signal that triggered shutdown (SIGTERM, SIGINT, etc.)
 * @returns {Promise<void>}
 */
async function gracefulShutdown(signal) {
  if (resources.isShuttingDown) {
    console.log('[SHUTDOWN] Shutdown already in progress, ignoring signal');
    return;
  }
  
  resources.isShuttingDown = true;
  console.log(`\n[SHUTDOWN] Received ${signal}. Starting graceful shutdown...`);
  
  // Set a timeout for forced shutdown
  const forceShutdownTimer = setTimeout(() => {
    console.error('[SHUTDOWN] Forced shutdown due to timeout');
    process.exit(1);
  }, CONFIG.SHUTDOWN_TIMEOUT_MS);
  
  // Don't let this timer keep the process alive
  forceShutdownTimer.unref();
  
  try {
    // Step 1: Stop accepting new connections
    console.log('[SHUTDOWN] Step 1: Stopping server from accepting new connections...');
    
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            console.error('[SHUTDOWN] Error closing server:', err.message);
            reject(err);
          } else {
            console.log('[SHUTDOWN] Server stopped accepting new connections');
            resolve();
          }
        });
      });
    }
    
    // Step 2: Close all active connections
    console.log(`[SHUTDOWN] Step 2: Closing ${resources.connections.size} active connections...`);
    
    for (const socket of resources.connections) {
      socket.destroy();
    }
    resources.connections.clear();
    
    // Step 3: Clear all tracked timers
    console.log(`[SHUTDOWN] Step 3: Clearing ${resources.timers.size} active timers...`);
    resources.clearAllTimers();
    
    // Step 4: Run custom cleanup hook
    console.log('[SHUTDOWN] Step 4: Cleaning up additional resources...');
    await resources.cleanup();
    
    // Clear the forced shutdown timer
    clearTimeout(forceShutdownTimer);
    
    console.log('[SHUTDOWN] Graceful shutdown completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('[SHUTDOWN] Error during graceful shutdown:', error.message);
    clearTimeout(forceShutdownTimer);
    process.exit(1);
  }
}

// =============================================================================
// PROCESS EVENT HANDLERS
// =============================================================================

/**
 * Handle uncaught exceptions
 * Logs error and initiates graceful shutdown
 */
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] UNCAUGHT EXCEPTION:`, {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
  
  // Attempt graceful shutdown
  gracefulShutdown('uncaughtException').catch(() => {
    process.exit(1);
  });
});

/**
 * Handle unhandled promise rejections
 * Logs error and initiates graceful shutdown
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] UNHANDLED REJECTION:`, {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
  
  // Attempt graceful shutdown
  gracefulShutdown('unhandledRejection').catch(() => {
    process.exit(1);
  });
});

/**
 * Handle SIGTERM signal (Docker/Kubernetes termination)
 */
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

/**
 * Handle SIGINT signal (Ctrl+C)
 */
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

/**
 * Handle SIGQUIT signal
 */
process.on('SIGQUIT', () => {
  gracefulShutdown('SIGQUIT');
});

/**
 * Handle exit event for final cleanup logging
 */
process.on('exit', (code) => {
  console.log(`[PROCESS] Process exiting with code: ${code}`);
});

/**
 * Handle warnings (e.g., deprecation warnings)
 */
process.on('warning', (warning) => {
  console.warn(`[${new Date().toISOString()}] WARNING:`, {
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });
});

// =============================================================================
// SERVER STARTUP LOGIC
// =============================================================================

/**
 * Start the HTTP server
 * Initializes the server and begins listening for requests
 * 
 * @returns {Promise<http.Server>} The started server instance
 */
async function startServer() {
  return new Promise((resolve, reject) => {
    try {
      createServer();
      
      server.listen(CONFIG.PORT, CONFIG.HOST, () => {
        console.log('='.repeat(60));
        console.log('  Robust Node.js Server Started');
        console.log('='.repeat(60));
        console.log(`  Environment: ${CONFIG.NODE_ENV}`);
        console.log(`  Server:      http://${CONFIG.HOST}:${CONFIG.PORT}`);
        console.log(`  Health:      http://${CONFIG.HOST}:${CONFIG.PORT}/health`);
        console.log(`  Shutdown:    ${CONFIG.SHUTDOWN_TIMEOUT_MS}ms timeout`);
        console.log(`  Started:     ${new Date().toISOString()}`);
        console.log('='.repeat(60));
        
        resolve(server);
      });
      
    } catch (error) {
      console.error('[STARTUP] Failed to start server:', error.message);
      reject(error);
    }
  });
}

// Start server if this is the main module (not being required for testing)
if (require.main === module) {
  startServer().catch((error) => {
    console.error('[STARTUP] Fatal error:', error.message);
    process.exit(1);
  });
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

/**
 * Export app and resources for testing
 * The app export allows supertest to make requests without starting the server
 * The resources export allows tests to verify resource tracking behavior
 */
module.exports = {
  app,
  resources,
  startServer,
  gracefulShutdown,
  createServer,
  CONFIG
};
