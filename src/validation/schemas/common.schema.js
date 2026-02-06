/**
 * Common Joi Validation Schemas Module
 * 
 * Provides reusable validation patterns for common data types including
 * email, password, UUID, pagination, and other common fields.
 * 
 * Essential for input validation to prevent injection attacks (OWASP A03:2021)
 * and ensure data integrity across all API endpoints.
 * 
 * @module validation/schemas/common
 * @see https://joi.dev/api/
 */

'use strict';

const Joi = require('joi');

/**
 * Email validation schema.
 * Validates email format according to RFC 5322.
 * 
 * @type {Joi.StringSchema}
 */
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } }) // Allow any TLD
  .lowercase()
  .trim()
  .max(254) // Max email length per RFC 5321
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email address is too long',
    'string.empty': 'Email address is required'
  });

/**
 * Password validation schema.
 * Enforces strong password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * 
 * @type {Joi.StringSchema}
 */
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    'string.empty': 'Password is required'
  });

/**
 * Name validation schema.
 * Validates user/entity names with reasonable length constraints.
 * 
 * @type {Joi.StringSchema}
 */
const nameSchema = Joi.string()
  .trim()
  .min(2)
  .max(100)
  .pattern(/^[a-zA-Z\s'-]+$/)
  .messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
    'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes',
    'string.empty': 'Name is required'
  });

/**
 * UUID (v4) validation schema.
 * Validates UUID format for resource identifiers.
 * 
 * @type {Joi.StringSchema}
 */
const uuidSchema = Joi.string()
  .uuid({ version: 'uuidv4' })
  .messages({
    'string.guid': 'Invalid UUID format',
    'string.empty': 'UUID is required'
  });

/**
 * MongoDB ObjectId validation schema.
 * Validates 24-character hexadecimal ObjectId format using Joi's hex() method.
 * 
 * @type {Joi.StringSchema}
 */
const idSchema = Joi.string()
  .hex()
  .length(24)
  .messages({
    'string.hex': 'Invalid ID format (must contain only hexadecimal characters)',
    'string.length': 'Invalid ID format (must be exactly 24 characters)',
    'string.empty': 'ID is required'
  });

/**
 * Generic string validation schema.
 * Used for general text fields with sanitization.
 * 
 * @type {Joi.StringSchema}
 */
const stringSchema = Joi.string()
  .trim()
  .min(1)
  .max(1000)
  .messages({
    'string.min': 'Field cannot be empty',
    'string.max': 'Field must not exceed 1000 characters'
  });

/**
 * Boolean validation schema.
 * Strict boolean type checking.
 * 
 * @type {Joi.BooleanSchema}
 */
const booleanSchema = Joi.boolean()
  .strict()
  .messages({
    'boolean.base': 'Value must be a boolean (true or false)'
  });

/**
 * Date validation schema.
 * Validates ISO 8601 date format as a string.
 * Uses Joi.string().isoDate() for string-based date validation.
 * 
 * @type {Joi.StringSchema}
 */
const dateSchema = Joi.string()
  .isoDate()
  .messages({
    'string.isoDate': 'Date must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
    'string.empty': 'Date is required'
  });

/**
 * Page number schema for pagination.
 * Positive integer starting from 1.
 * 
 * @type {Joi.NumberSchema}
 */
const pageSchema = Joi.number()
  .integer()
  .positive()
  .default(1)
  .messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be a whole number',
    'number.positive': 'Page must be greater than 0'
  });

/**
 * Limit schema for pagination.
 * Number of items per page (1-100).
 * 
 * @type {Joi.NumberSchema}
 */
const limitSchema = Joi.number()
  .integer()
  .positive()
  .min(1)
  .max(100)
  .default(10)
  .messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be a whole number',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  });

/**
 * Sort order schema for pagination.
 * Allowed values: 'asc', 'desc', 'createdAt', 'updatedAt', 'name', 'email'
 * 
 * @type {Joi.StringSchema}
 */
const sortSchema = Joi.string()
  .valid('asc', 'desc', 'createdAt', 'updatedAt', 'name', 'email')
  .default('createdAt')
  .messages({
    'any.only': 'Sort must be one of: asc, desc, createdAt, updatedAt, name, email'
  });

/**
 * Pagination schema object using Joi.object().
 * Combines page, limit, and sort for query parameter validation.
 * Can be used directly for validating pagination query parameters.
 * 
 * @type {Joi.ObjectSchema}
 * @property {Joi.NumberSchema} page - Page number (default: 1)
 * @property {Joi.NumberSchema} limit - Items per page (default: 10, max: 100)
 * @property {Joi.StringSchema} sort - Sort field/order (default: 'createdAt')
 * 
 * @example
 * // Use directly for query validation
 * const { error, value } = paginationSchema.validate(req.query);
 * 
 * @example
 * // Compose with other schemas
 * const searchSchema = Joi.object({
 *   ...paginationSchema.describe().keys,
 *   query: Joi.string()
 * });
 */
const paginationSchema = Joi.object({
  page: pageSchema,
  limit: limitSchema,
  sort: sortSchema
}).messages({
  'object.base': 'Pagination parameters must be an object'
});

module.exports = {
  emailSchema,
  passwordSchema,
  nameSchema,
  uuidSchema,
  idSchema,
  stringSchema,
  booleanSchema,
  dateSchema,
  pageSchema,
  limitSchema,
  sortSchema,
  paginationSchema
};
