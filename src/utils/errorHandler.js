/**
 * Secure Error Handling Middleware
 * 
 * Implements OWASP-compliant error responses that prevent sensitive information
 * leakage in production while providing detailed debugging info in development.
 * 
 * @module src/utils/errorHandler
 */

const crypto = require('crypto');

/**
 * Determines if the current environment is production
 * @returns {boolean} True if NODE_ENV is 'production'
 */
const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Generates a unique error reference ID for production error tracking
 * @returns {string} UUID for error reference
 */
const generateErrorReferenceId = () => crypto.randomUUID();

/**
 * Sanitizes error message to remove potentially sensitive information
 * @param {string} message - Original error message
 * @returns {string} Sanitized message safe for logging
 */
const sanitizeForLogging = (message) => {
  if (!message) return 'Unknown error';
  // Remove potential file paths and sensitive patterns
  return message
    .replace(/\/[^\s]+/g, '[PATH_REDACTED]')
    .replace(/at\s+[^\s]+\s+\([^)]+\)/g, '[STACK_REDACTED]');
};

/**
 * Gets the appropriate HTTP status code for the error
 * @param {Error} err - Error object
 * @returns {number} HTTP status code
 */
const getStatusCode = (err) => {
  // Check for explicit status code on error
  if (err.statusCode) return err.statusCode;
  if (err.status) return err.status;
  
  // Handle Joi ValidationError
  if (err.name === 'ValidationError' || err.isJoi) return 400;
  
  // Handle JSON parsing SyntaxError
  if (err instanceof SyntaxError && err.message.includes('JSON')) return 400;
  
  // Default to 500 Internal Server Error
  return 500;
};

/**
 * Express error handling middleware
 * 
 * Handles all errors passed through next(err) and formats appropriate
 * responses based on the current environment (NODE_ENV).
 * 
 * @param {Error} err - Error object passed from previous middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Generate unique reference ID for error tracking
  const errorReferenceId = generateErrorReferenceId();
  const timestamp = new Date().toISOString();
  const statusCode = getStatusCode(err);
  
  // Log error securely with timestamp for audit trail
  console.error(JSON.stringify({
    timestamp,
    errorReferenceId,
    statusCode,
    method: req.method,
    path: req.path,
    message: isProduction() ? sanitizeForLogging(err.message) : err.message,
    name: err.name || 'Error',
    ...(isProduction() ? {} : { stack: err.stack })
  }));
  
  // Set appropriate Content-Type header
  res.setHeader('Content-Type', 'application/json');
  
  // Construct response based on environment
  if (isProduction()) {
    // PRODUCTION: Return generic error message without sensitive details
    const response = {
      success: false,
      error: {
        message: statusCode === 400 
          ? 'Bad Request: Invalid input provided'
          : 'An unexpected error occurred',
        statusCode,
        errorReferenceId // Include reference ID for support debugging
      }
    };
    
    return res.status(statusCode).json(response);
  }
  
  // DEVELOPMENT: Return full error details for debugging
  const response = {
    success: false,
    error: {
      message: err.message || 'An error occurred',
      name: err.name || 'Error',
      statusCode,
      errorReferenceId,
      stack: err.stack,
      details: err.details || null // Include Joi validation details if present
    }
  };
  
  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
