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
  
  // Handle Joi ValidationError (direct or via express-joi-validation)
  if (err.name === 'ValidationError' || err.isJoi) return 400;
  
  // Handle express-joi-validation wrapped errors
  if (err.error && (err.error.isJoi || err.error.name === 'ValidationError')) return 400;
  
  // Handle type field from express-joi-validation
  if (err.type && ['body', 'query', 'params', 'headers'].includes(err.type)) return 400;
  
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
    // For validation errors (400), we can include field-level errors
    let prodMessage = 'An unexpected error occurred';
    let prodDetails = null;
    
    if (statusCode === 400) {
      prodMessage = 'Bad Request: Invalid input provided';
      // In production, include which fields failed but not the exact values
      if (err.error && err.error.details) {
        prodDetails = err.error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message.replace(/"[^"]*"/g, 'value') // Remove actual values
        }));
      }
    }
    
    const response = {
      success: false,
      error: {
        message: prodMessage,
        statusCode,
        errorReferenceId, // Include reference ID for support debugging
        ...(prodDetails && { validationErrors: prodDetails })
      }
    };
    
    return res.status(statusCode).json(response);
  }
  
  // Extract validation details from express-joi-validation
  let validationDetails = null;
  if (err.error && err.error.details) {
    validationDetails = err.error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message,
      type: d.type
    }));
  } else if (err.details) {
    validationDetails = err.details;
  }

  // DEVELOPMENT: Return full error details for debugging
  const response = {
    success: false,
    error: {
      message: err.error?.message || err.message || 'An error occurred',
      name: err.error?.name || err.name || 'Error',
      statusCode,
      errorReferenceId,
      stack: err.stack,
      details: validationDetails // Include Joi validation details if present
    }
  };
  
  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
