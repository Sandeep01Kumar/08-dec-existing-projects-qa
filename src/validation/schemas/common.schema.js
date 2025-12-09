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
 * Validates 24-character hexadecimal ObjectId format.
 * 
 * @type {Joi.StringSchema}
 */
const idSchema = Joi.string()
  .pattern(/^[a-fA-F0-9]{24}$/)
  .messages({
    'string.pattern.base': 'Invalid ID format (must be 24-character hex string)',
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
 * Validates ISO 8601 date format.
 * 
 * @type {Joi.DateSchema}
 */
const dateSchema = Joi.date()
  .iso()
  .messages({
    'date.format': 'Date must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
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
 * Pagination schema object.
 * Combines page, limit, and sort for query parameter validation.
 * 
 * @type {Object}
 */
const paginationSchema = {
  page: pageSchema,
  limit: limitSchema,
  sort: sortSchema
};

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
