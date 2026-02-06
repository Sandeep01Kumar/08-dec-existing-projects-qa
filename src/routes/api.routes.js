/**
 * API Routes Module
 * 
 * Defines API endpoints with comprehensive input validation using Joi schemas.
 * Demonstrates proper security patterns including input sanitization to prevent
 * injection attacks (OWASP A03:2021) and returns standardized JSON responses.
 * 
 * @module routes/api
 */

'use strict';

const express = require('express');
const Joi = require('joi');
const { validateBody, validateQuery, validateParams } = require('../middleware/validation.middleware');
const {
  emailSchema,
  passwordSchema,
  nameSchema,
  idSchema,
  pageSchema,
  limitSchema,
  sortSchema
} = require('../validation/schemas/common.schema');

const router = express.Router();

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Pagination query parameter validation schema.
 */
const paginationQuerySchema = Joi.object({
  page: pageSchema,
  limit: limitSchema,
  sort: sortSchema
}).unknown(false);

/**
 * User ID parameter validation schema.
 */
const userIdParamsSchema = Joi.object({
  id: idSchema.required()
}).unknown(false);

/**
 * Create user request body validation schema.
 */
const createUserSchema = Joi.object({
  email: emailSchema.required(),
  name: nameSchema.required(),
  password: passwordSchema.required()
}).unknown(false);

/**
 * Update user request body validation schema.
 * All fields are optional for partial updates.
 */
const updateUserSchema = Joi.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema
}).min(1).unknown(false).messages({
  'object.min': 'At least one field must be provided for update'
});

// ============================================================================
// Health Check Endpoint
// ============================================================================

/**
 * @route GET /api/health
 * @description Basic health check endpoint for monitoring systems
 * @access Public
 * @returns {Object} Health status with timestamp
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// ============================================================================
// User Endpoints (Demonstration with Validation)
// ============================================================================

/**
 * @route GET /api/users
 * @description Get paginated list of users
 * @access Public
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @query {string} sort - Sort order (default: createdAt)
 * @returns {Object} Paginated user list
 */
router.get(
  '/users',
  validateQuery(paginationQuerySchema),
  (req, res) => {
    const { page = 1, limit = 10, sort = 'createdAt' } = req.query;
    
    // Demonstration response - in production, this would query a database
    res.status(200).json({
      success: true,
      data: {
        users: [],
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          sort,
          total: 0,
          totalPages: 0
        }
      }
    });
  }
);

/**
 * @route GET /api/users/:id
 * @description Get a specific user by ID
 * @access Public
 * @param {string} id - User ID (24-character hex string)
 * @returns {Object} User data
 */
router.get(
  '/users/:id',
  validateParams(userIdParamsSchema),
  (req, res) => {
    const { id } = req.params;
    
    // Demonstration response - in production, this would query a database
    res.status(200).json({
      success: true,
      data: {
        user: {
          id,
          message: 'User endpoint demonstration'
        }
      }
    });
  }
);

/**
 * @route POST /api/users
 * @description Create a new user
 * @access Public
 * @body {string} email - Valid email address
 * @body {string} name - User name (2-100 chars)
 * @body {string} password - Password (min 8 chars, must contain uppercase, lowercase, number)
 * @returns {Object} Created user data
 */
router.post(
  '/users',
  validateBody(createUserSchema),
  (req, res) => {
    const { email, name } = req.body;
    // Note: password would be hashed before storage in production
    
    // Demonstration response - in production, this would create a database record
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: 'demo_' + Date.now().toString(16),
          email,
          name,
          createdAt: new Date().toISOString()
        }
      }
    });
  }
);

/**
 * @route PUT /api/users/:id
 * @description Update an existing user
 * @access Public
 * @param {string} id - User ID (24-character hex string)
 * @body {string} [email] - Valid email address
 * @body {string} [name] - User name (2-100 chars)
 * @body {string} [password] - Password (min 8 chars)
 * @returns {Object} Updated user data
 */
router.put(
  '/users/:id',
  validateParams(userIdParamsSchema),
  validateBody(updateUserSchema),
  (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    // Demonstration response - in production, this would update a database record
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      }
    });
  }
);

/**
 * @route DELETE /api/users/:id
 * @description Delete a user
 * @access Public
 * @param {string} id - User ID (24-character hex string)
 * @returns {Object} Deletion confirmation
 */
router.delete(
  '/users/:id',
  validateParams(userIdParamsSchema),
  (req, res) => {
    const { id } = req.params;
    
    // Demonstration response - in production, this would delete a database record
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedId: id,
        deletedAt: new Date().toISOString()
      }
    });
  }
);

// ============================================================================
// Echo Endpoint (For Testing Input Validation)
// ============================================================================

/**
 * @route POST /api/echo
 * @description Echo back request data (useful for testing validation)
 * @access Public
 * @returns {Object} Request details (method, headers, body, query, params)
 */
router.post('/echo', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      ip: req.ip,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
