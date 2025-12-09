/**
 * Joi Validation Middleware Factory Module
 * 
 * Provides factory functions for creating route-specific validation middleware
 * using express-joi-validation package integrated with Joi schemas.
 * 
 * Essential for input sanitization to prevent injection attacks (OWASP A03:2021)
 * and ensure data integrity across API endpoints.
 * 
 * @module middleware/validation
 * @see https://www.npmjs.com/package/express-joi-validation
 * @see https://joi.dev/
 */

'use strict';

const { createValidator } = require('express-joi-validation');
const Joi = require('joi');

/**
 * Validator instance configured for Express integration.
 * passError: true allows validation errors to be handled by Express error middleware.
 * statusCode: 400 sets the HTTP status for validation failures.
 */
const validator = createValidator({
  passError: true,
  statusCode: 400
});

/**
 * Factory function to create request body validation middleware.
 * 
 * @param {Joi.Schema} schema - Joi schema for validating request body
 * @returns {Function} Express middleware function
 * 
 * @example
 * const userSchema = Joi.object({ name: Joi.string().required() });
 * router.post('/users', validateBody(userSchema), createUser);
 */
const validateBody = (schema) => {
  if (!schema || !Joi.isSchema(schema)) {
    throw new Error('validateBody requires a valid Joi schema');
  }
  return validator.body(schema);
};

/**
 * Factory function to create query parameter validation middleware.
 * 
 * @param {Joi.Schema} schema - Joi schema for validating query parameters
 * @returns {Function} Express middleware function
 * 
 * @example
 * const querySchema = Joi.object({ page: Joi.number().default(1) });
 * router.get('/users', validateQuery(querySchema), listUsers);
 */
const validateQuery = (schema) => {
  if (!schema || !Joi.isSchema(schema)) {
    throw new Error('validateQuery requires a valid Joi schema');
  }
  return validator.query(schema);
};

/**
 * Factory function to create URL parameter validation middleware.
 * 
 * @param {Joi.Schema} schema - Joi schema for validating URL parameters
 * @returns {Function} Express middleware function
 * 
 * @example
 * const paramsSchema = Joi.object({ id: Joi.string().uuid().required() });
 * router.get('/users/:id', validateParams(paramsSchema), getUser);
 */
const validateParams = (schema) => {
  if (!schema || !Joi.isSchema(schema)) {
    throw new Error('validateParams requires a valid Joi schema');
  }
  return validator.params(schema);
};

/**
 * Factory function to create request header validation middleware.
 * 
 * @param {Joi.Schema} schema - Joi schema for validating request headers
 * @returns {Function} Express middleware function
 * 
 * @example
 * const headerSchema = Joi.object({ authorization: Joi.string().required() });
 * router.get('/protected', validateHeaders(headerSchema), protectedHandler);
 */
const validateHeaders = (schema) => {
  if (!schema || !Joi.isSchema(schema)) {
    throw new Error('validateHeaders requires a valid Joi schema');
  }
  return validator.headers(schema);
};

module.exports = {
  validator,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders
};
