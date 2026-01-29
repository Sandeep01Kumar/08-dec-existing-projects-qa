/**
 * Jest Configuration for Robust Server Test Suite
 * 
 * Configures Jest to run server.test.js with Node.js environment
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server.test.js'],
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true
};
