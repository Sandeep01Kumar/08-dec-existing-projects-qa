'use strict';

/**
 * Comprehensive Jest Test Suite for server.js
 * 
 * This test suite validates the robust server implementation
 * covering all 21 tests specified in the Agent Action Plan:
 * - Health Check Endpoint tests (2 tests)
 * - Root Endpoint tests (1 test)
 * - User Registration Validation tests (6 tests)
 * - Resource ID Parameter Validation tests (4 tests)
 * - Pagination Query Parameter Validation tests (4 tests)
 * - Error Handling tests (3 tests)
 * - Resource Tracking tests (1 test)
 * 
 * @module server.test
 */

const request = require('supertest');
const { app, resources } = require('./server.js');

// =============================================================================
// TEST SUITE CONFIGURATION
// =============================================================================

describe('Robust Server.js Test Suite', () => {
  
  // ==========================================================================
  // HEALTH CHECK ENDPOINT TESTS (2 tests)
  // ==========================================================================
  
  describe('Health Check Endpoint', () => {
    
    /**
     * Test 1: Returns 200 with healthy status object
     */
    test('should return 200 with healthy status object', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
    
    /**
     * Test 2: Returns JSON with status, timestamp, uptime fields
     */
    test('should return JSON with status, timestamp, uptime fields', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      // Verify all required fields are present
      expect(response.body.status).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      
      // Verify field types
      expect(typeof response.body.status).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.uptime).toBe('number');
      
      // Verify timestamp is valid ISO string
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });
  });
  
  // ==========================================================================
  // ROOT ENDPOINT TESTS (1 test)
  // ==========================================================================
  
  describe('Root Endpoint', () => {
    
    /**
     * Test 3: Returns 200 with welcome message
     */
    test('should return 200 with welcome message', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Welcome');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
  
  // ==========================================================================
  // USER REGISTRATION VALIDATION TESTS (6 tests)
  // ==========================================================================
  
  describe('User Registration Validation', () => {
    
    /**
     * Test 4: Validates username minimum length (3 chars)
     */
    test('should validate username minimum length of 3 characters', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'ab',  // Too short
          email: 'test@example.com',
          password: 'SecurePass123'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
      
      const usernameError = response.body.details.find(d => d.field === 'username');
      expect(usernameError).toBeDefined();
    });
    
    /**
     * Test 5: Validates email format
     */
    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'validuser',
          email: 'invalid-email-format',
          password: 'SecurePass123'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      
      const emailError = response.body.details.find(d => d.field === 'email');
      expect(emailError).toBeDefined();
      expect(emailError.message).toContain('email');
    });
    
    /**
     * Test 6: Validates password minimum length (8 chars)
     */
    test('should validate password minimum length of 8 characters', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'validuser',
          email: 'test@example.com',
          password: 'Short1'  // Too short
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      
      const passwordError = response.body.details.find(d => d.field === 'password');
      expect(passwordError).toBeDefined();
    });
    
    /**
     * Test 7: Returns 400 for invalid inputs
     */
    test('should return 400 for invalid inputs', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: '',
          email: '',
          password: ''
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
      expect(response.body.details.length).toBeGreaterThan(0);
    });
    
    /**
     * Test 8: Returns 201 for valid registration
     */
    test('should return 201 for valid registration', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'validuser123',
          email: 'valid@example.com',
          password: 'SecurePass123'
        })
        .expect(201)
        .expect('Content-Type', /json/);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('User created');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.username).toBe('validuser123');
      expect(response.body.data.email).toBe('valid@example.com');
      expect(response.body.data.id).toBeDefined();
    });
    
    /**
     * Test 9: Returns structured validation error responses
     */
    test('should return structured validation error responses', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'x',
          email: 'bad',
          password: 'weak'
        })
        .expect(400);
      
      // Verify structured error response
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
      expect(response.body).toHaveProperty('timestamp');
      
      // Verify each error detail has required fields
      response.body.details.forEach(detail => {
        expect(detail).toHaveProperty('field');
        expect(detail).toHaveProperty('message');
      });
    });
  });
  
  // ==========================================================================
  // RESOURCE ID PARAMETER VALIDATION TESTS (4 tests)
  // ==========================================================================
  
  describe('Resource ID Parameter Validation', () => {
    
    /**
     * Test 10: Validates ID is a positive integer
     */
    test('should validate ID is a positive integer', async () => {
      const response = await request(app)
        .get('/api/resources/123')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(123);
    });
    
    /**
     * Test 11: Rejects negative IDs
     */
    test('should reject negative IDs', async () => {
      const response = await request(app)
        .get('/api/resources/-5')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
    
    /**
     * Test 12: Rejects non-numeric IDs
     */
    test('should reject non-numeric IDs', async () => {
      const response = await request(app)
        .get('/api/resources/abc')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
    
    /**
     * Test 13: Returns appropriate error messages
     */
    test('should return appropriate error messages for invalid IDs', async () => {
      const response = await request(app)
        .get('/api/resources/0')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.details).toBeDefined();
      
      const idError = response.body.details.find(d => d.field === 'id');
      expect(idError).toBeDefined();
      expect(idError.message).toContain('positive integer');
    });
  });
  
  // ==========================================================================
  // PAGINATION QUERY PARAMETER VALIDATION TESTS (4 tests)
  // ==========================================================================
  
  describe('Pagination Query Parameter Validation', () => {
    
    /**
     * Test 14: Validates page >= 1
     */
    test('should validate page is greater than or equal to 1', async () => {
      const response = await request(app)
        .get('/api/items?page=0')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
    
    /**
     * Test 15: Validates limit between 1 and 100
     */
    test('should validate limit is between 1 and 100', async () => {
      // Test limit too high
      const responseTooHigh = await request(app)
        .get('/api/items?limit=101')
        .expect(400);
      
      expect(responseTooHigh.body.success).toBe(false);
      
      // Test limit too low
      const responseTooLow = await request(app)
        .get('/api/items?limit=0')
        .expect(400);
      
      expect(responseTooLow.body.success).toBe(false);
      
      // Test valid limit
      const responseValid = await request(app)
        .get('/api/items?limit=50')
        .expect(200);
      
      expect(responseValid.body.pagination.limit).toBe(50);
    });
    
    /**
     * Test 16: Applies default values when omitted
     */
    test('should apply default values when pagination parameters are omitted', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
    
    /**
     * Test 17: Returns errors for out-of-range values
     */
    test('should return errors for out-of-range values', async () => {
      const response = await request(app)
        .get('/api/items?page=-1&limit=200')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details.length).toBeGreaterThan(0);
    });
  });
  
  // ==========================================================================
  // ERROR HANDLING TESTS (3 tests)
  // ==========================================================================
  
  describe('Error Handling', () => {
    
    /**
     * Test 18: 404 handler for undefined routes
     */
    test('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/undefined/route/path')
        .expect(404)
        .expect('Content-Type', /json/);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('not found');
    });
    
    /**
     * Test 19: Error middleware returns sanitized JSON responses
     */
    test('should return sanitized JSON error responses', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);
      
      // Verify response is JSON
      expect(response.headers['content-type']).toMatch(/json/);
      
      // Verify no sensitive data exposed
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
    
    /**
     * Test 20: POST to undefined routes returns 404
     */
    test('should return 404 for POST to undefined routes', async () => {
      const response = await request(app)
        .post('/api/nonexistent')
        .send({ data: 'test' })
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });
  });
  
  // ==========================================================================
  // RESOURCE TRACKING TESTS (1 test)
  // ==========================================================================
  
  describe('Resource Tracking', () => {
    
    /**
     * Test 21: Verifies resources object structure
     */
    test('should have correct resource tracking structure', () => {
      // Verify connections Set exists
      expect(resources.connections).toBeInstanceOf(Set);
      
      // Verify timers Set exists
      expect(resources.timers).toBeInstanceOf(Set);
      
      // Verify isShuttingDown boolean exists
      expect(typeof resources.isShuttingDown).toBe('boolean');
      
      // Verify resource management functions exist
      expect(typeof resources.addTimer).toBe('function');
      expect(typeof resources.removeTimer).toBe('function');
      expect(typeof resources.clearAllTimers).toBe('function');
      expect(typeof resources.cleanup).toBe('function');
    });
  });
});
