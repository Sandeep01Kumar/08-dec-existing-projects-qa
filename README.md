# Express Security Middleware Stack

[![Node.js](https://img.shields.io/badge/Node.js-20.x%20LTS-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21.2-blue.svg)](https://expressjs.com/)
[![Security](https://img.shields.io/badge/Security-Helmet%208.1.0-orange.svg)](https://helmetjs.github.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready Node.js/Express application implementing comprehensive web application security measures following OWASP guidelines. This project provides a complete security middleware stack including security headers, input validation, rate limiting, CORS policies, and HTTPS support.

## Table of Contents

- [Security Features](#security-features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Usage](#usage)
- [Security Verification Commands](#security-verification-commands)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Security Testing](#security-testing)
- [OWASP Compliance](#owasp-compliance)
- [Contributing](#contributing)
- [License](#license)

## Security Features

This application implements a defense-in-depth security strategy with multiple layers of protection:

### 🛡️ Security Headers (Helmet.js v8.1.0)

Helmet.js middleware configures **15+ HTTP security headers** automatically:

| Header | Purpose | Protection |
|--------|---------|------------|
| `Content-Security-Policy` | Controls allowed content sources | XSS attacks, data injection |
| `Strict-Transport-Security` | Enforces HTTPS connections | Protocol downgrade, MitM attacks |
| `X-Frame-Options` | Prevents clickjacking | UI redress attacks |
| `X-Content-Type-Options` | Prevents MIME sniffing | Content-type attacks |
| `X-DNS-Prefetch-Control` | Controls DNS prefetching | DNS leakage |
| `X-Download-Options` | Prevents file downloads from opening | IE download attacks |
| `X-Permitted-Cross-Domain-Policies` | Controls cross-domain policies | Flash/PDF attacks |
| `Referrer-Policy` | Controls referrer information | Information leakage |
| `Origin-Agent-Cluster` | Isolates browsing contexts | Cross-origin attacks |
| `Cross-Origin-Opener-Policy` | Controls cross-origin window access | Spectre attacks |
| `Cross-Origin-Resource-Policy` | Controls cross-origin resource loading | Data leakage |
| `Cross-Origin-Embedder-Policy` | Controls cross-origin embedding | Data leakage |

Additionally, Helmet removes the `X-Powered-By` header to prevent server fingerprinting.

### ⏱️ Rate Limiting (express-rate-limit v7.5.0)

Protects against denial-of-service (DoS) and brute-force attacks:

- **Window**: 15-minute sliding window
- **Limit**: 100 requests per IP per window
- **Headers**: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
- **Response**: 429 Too Many Requests when limit exceeded

### 🌐 CORS Configuration (cors v2.8.5)

Configurable Cross-Origin Resource Sharing policies:

- Whitelist-based origin validation
- Configurable allowed HTTP methods
- Custom allowed headers support
- Credentials support for authenticated requests
- Preflight request caching

### ✅ Input Validation (Joi v17.13.3)

Schema-based request validation using Joi:

- Request body validation
- Query parameter validation
- URL parameter validation
- Custom validation error messages
- Type coercion and sanitization

### 🔐 HTTPS Support

Transport Layer Security (TLS) configuration:

- HSTS header with 1-year max-age
- TLS-ready server configuration
- Automatic HTTPS redirect support (via HSTS)
- Secure cookie configuration

### 🛡️ HTTP Parameter Pollution Protection (hpp v0.2.3)

Prevents HTTP Parameter Pollution attacks:

- Protects against array/object injection via query parameters
- Sanitizes duplicate parameters
- Configurable whitelist for specific parameters

### 📦 Additional Security Measures

- **Body Parser Limits**: Maximum request body size (10kb default)
- **Secure Error Handling**: Prevents sensitive information leakage
- **Environment-Aware Configuration**: Stricter settings in production

## Prerequisites

Before installing, ensure you have the following:

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 20.x LTS | Long Term Support until April 2026 |
| **npm** | 10.x | Comes with Node.js |

### Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v20.x.x

# Check npm version
npm --version
# Expected: 10.x.x
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Install Dependencies

```bash
# Install all dependencies (production + development)
npm install
```

This will install the following security packages:

**Production Dependencies:**
- `express@^4.21.2` - Web framework with security patches
- `helmet@^8.1.0` - Security headers middleware
- `cors@^2.8.5` - CORS middleware
- `express-rate-limit@^7.5.0` - Rate limiting middleware
- `joi@^17.13.3` - Schema validation library
- `express-joi-validation@^5.0.1` - Express Joi middleware
- `hpp@^0.2.3` - HTTP Parameter Pollution protection
- `dotenv@^16.4.7` - Environment configuration

**Development Dependencies:**
- `nodemon@^3.1.9` - Development auto-restart

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env  # or your preferred editor
```

## Environment Configuration

Create a `.env` file based on `.env.example` with the following settings:

```bash
# ==============================================
# Application Environment
# ==============================================
NODE_ENV=development          # development | production
PORT=3000                     # Server port

# ==============================================
# Rate Limiting Configuration
# ==============================================
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes in milliseconds
RATE_LIMIT_MAX=100            # Max requests per window per IP

# ==============================================
# CORS Configuration
# ==============================================
CORS_ORIGIN=http://localhost:3000    # Allowed origin(s)
CORS_CREDENTIALS=true                 # Allow credentials

# ==============================================
# Security Headers Configuration
# ==============================================
HELMET_CSP_REPORT_ONLY=false         # Enforce CSP (not report-only)
HSTS_MAX_AGE=31536000                # 1 year in seconds

# ==============================================
# Request Body Configuration
# ==============================================
BODY_LIMIT=10kb                      # Maximum request body size
```

### Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Application environment |
| `PORT` | `3000` | HTTP server port |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin(s) |
| `CORS_CREDENTIALS` | `true` | Allow credentials in CORS |
| `HELMET_CSP_REPORT_ONLY` | `false` | CSP enforcement mode |
| `HSTS_MAX_AGE` | `31536000` | HSTS max-age (1 year) |
| `BODY_LIMIT` | `10kb` | Maximum request body size |

### Production Configuration

For production deployments, ensure:

1. Set `NODE_ENV=production`
2. Configure proper `CORS_ORIGIN` whitelist
3. Use environment variables or a secrets manager
4. Never commit `.env` files to version control

## Usage

### Development Mode

Start the server with hot-reload using nodemon:

```bash
npm run dev
```

The server will automatically restart when files change.

### Production Mode

Start the server in production mode:

```bash
# Set production environment
NODE_ENV=production npm start

# Or simply
npm start
```

### Available npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `node src/server.js` | Start production server |
| `dev` | `nodemon src/server.js` | Start development server |
| `security:audit` | `npm audit` | Run security audit |
| `security:fix` | `npm audit fix` | Auto-fix vulnerabilities |

## Security Verification Commands

Use these commands to verify security features are working correctly:

### 1. Verify Security Headers

```bash
# Check all security headers in response
curl -I http://localhost:3000/api/health 2>/dev/null | grep -E "^(X-|Content-Security|Strict-Transport|Referrer)"
```

**Expected output:**

```
X-DNS-Prefetch-Control: off
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-Download-Options: noopen
X-Permitted-Cross-Domain-Policies: none
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: no-referrer
```

### 2. Test Rate Limiting

```bash
# Send 105 requests to test rate limiting (limit is 100)
for i in {1..105}; do 
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
  echo "Request $i: HTTP $response"
done

# Requests 1-100 should return 200 OK
# Requests 101+ should return 429 Too Many Requests
```

### 3. Verify Rate Limit Headers

```bash
# Check rate limit headers
curl -I http://localhost:3000/api/health 2>/dev/null | grep -E "^RateLimit"

# Expected output:
# RateLimit-Limit: 100
# RateLimit-Remaining: 99
# RateLimit-Reset: <timestamp>
```

### 4. Test CORS Policy

```bash
# Test CORS from unauthorized origin (should fail)
curl -H "Origin: http://malicious-site.com" \
  -I http://localhost:3000/api/health 2>/dev/null | grep "Access-Control"

# No Access-Control-Allow-Origin header should be returned for unauthorized origins
```

```bash
# Test CORS from authorized origin (should succeed)
curl -H "Origin: http://localhost:3000" \
  -I http://localhost:3000/api/health 2>/dev/null | grep "Access-Control"

# Expected: Access-Control-Allow-Origin: http://localhost:3000
```

### 5. Test Input Validation

```bash
# Test with invalid email format (should return 400)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "name": "Test"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Expected: HTTP Status: 400
```

```bash
# Test with valid data (should return 200/201)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Expected: HTTP Status: 200 or 201
```

### 6. Test Body Size Limit

```bash
# Test with oversized payload (should return 413)
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d "$(python3 -c 'print("{\"data\":\"" + "x"*20000 + "\"}")')" \
  -w "\nHTTP Status: %{http_code}\n"

# Expected: HTTP Status: 413 (Payload Too Large)
```

## API Endpoints

### Health Check

```
GET /api/health
```

Returns application health status with security headers.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### User Validation Example

```
POST /api/users
```

Demonstrates input validation with Joi schemas.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "age": 25
}
```

**Validation Rules:**
- `email`: Required, valid email format
- `name`: Required, 2-100 characters
- `age`: Optional, integer between 0-150

**Success Response (200):**
```json
{
  "message": "User data validated successfully",
  "data": {
    "email": "user@example.com",
    "name": "John Doe",
    "age": 25
  }
}
```

**Validation Error Response (400):**
```json
{
  "error": "Validation Error",
  "details": [
    {
      "message": "\"email\" must be a valid email",
      "path": ["email"]
    }
  ]
}
```

### Data Endpoint Example

```
POST /api/data
```

Demonstrates body size limits and JSON parsing.

## Project Structure

```
project-root/
├── package.json                          # Project manifest and dependencies
├── package-lock.json                     # Locked dependency versions
├── .env.example                          # Environment variable template
├── .env                                  # Environment variables (gitignored)
├── .gitignore                            # Git ignore configuration
├── README.md                             # This documentation file
├── SECURITY.md                           # Security policy and reporting
│
├── src/
│   ├── app.js                            # Main Express application
│   ├── server.js                         # HTTPS-capable server entry point
│   │
│   ├── config/
│   │   ├── helmet.config.js              # Security headers configuration
│   │   ├── cors.config.js                # CORS policy configuration
│   │   └── rateLimit.config.js           # Rate limiting configuration
│   │
│   ├── middleware/
│   │   ├── security.middleware.js        # Aggregated security middleware
│   │   └── validation.middleware.js      # Input validation middleware
│   │
│   ├── validation/
│   │   └── schemas/
│   │       └── common.schema.js          # Common Joi validation schemas
│   │
│   ├── routes/
│   │   ├── index.js                      # Main router configuration
│   │   └── api.routes.js                 # API route definitions
│   │
│   └── utils/
│       └── errorHandler.js               # Secure error handling
│
├── test.js                               # Placeholder (integration testing)
├── test.py                               # Placeholder (integration testing)
├── test.java                             # Placeholder (integration testing)
├── test.ts                               # Placeholder (integration testing)
├── test.html                             # Placeholder (integration testing)
└── test.css                              # Placeholder (integration testing)
```

### Directory Descriptions

| Directory | Purpose |
|-----------|---------|
| `src/` | Main application source code |
| `src/config/` | Security configuration modules |
| `src/middleware/` | Express middleware components |
| `src/validation/` | Joi validation schemas |
| `src/routes/` | API route definitions |
| `src/utils/` | Utility functions and helpers |

## Security Testing

### Automated Security Audit

Run npm security audit to check for vulnerabilities in dependencies:

```bash
# Run security audit
npm audit

# View detailed audit report
npm audit --json

# Automatically fix vulnerabilities (safe fixes only)
npm audit fix

# Fix vulnerabilities including breaking changes (use with caution)
npm audit fix --force
```

### Check for Outdated Packages

```bash
# Check for outdated packages
npm outdated

# Update packages to latest versions
npm update
```

### Security Testing Checklist

Use this checklist to verify security implementation:

- [ ] **Security Headers**: All 15+ helmet headers present in responses
- [ ] **Rate Limiting**: Returns 429 after exceeding request limit
- [ ] **CORS**: Blocks requests from unauthorized origins
- [ ] **Input Validation**: Returns 400 for invalid input
- [ ] **Body Limit**: Returns 413 for oversized payloads
- [ ] **Error Handling**: No sensitive information in error responses
- [ ] **npm audit**: Zero high/critical vulnerabilities

### Recommended Security Tools

| Tool | Purpose | Command/Link |
|------|---------|--------------|
| npm audit | Dependency vulnerabilities | `npm audit` |
| OWASP ZAP | Web application scanner | [zaproxy.org](https://www.zaproxy.org/) |
| Snyk | Vulnerability scanning | [snyk.io](https://snyk.io/) |
| Lighthouse | Browser security audit | Chrome DevTools |

## OWASP Compliance

This implementation addresses the following OWASP Top 10 (2021) categories:

| OWASP Category | Implementation |
|----------------|----------------|
| **A01:2021 - Broken Access Control** | CORS whitelist, authentication hooks |
| **A02:2021 - Cryptographic Failures** | HTTPS/HSTS enforcement |
| **A03:2021 - Injection** | Input validation with Joi, CSP headers |
| **A04:2021 - Insecure Design** | Rate limiting, defense-in-depth |
| **A05:2021 - Security Misconfiguration** | Helmet security headers, secure defaults |
| **A06:2021 - Vulnerable Components** | npm audit, version pinning |
| **A07:2021 - Auth Failures** | Rate limiting (brute-force protection) |
| **A08:2021 - Data Integrity Failures** | Input validation, CSP |
| **A09:2021 - Security Logging** | Error handling, audit capability |
| **A10:2021 - Server-Side Request Forgery** | Input validation, URL validation |

### Security Standards Applied

- **OWASP Top 10 2021**: All major risks addressed
- **OWASP ASVS Level 1**: Basic security verification requirements met
- **CWE/SANS Top 25**: Input validation and injection prevention

## Contributing

We welcome contributions to improve the security of this project!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/security-improvement
   ```
3. **Make your changes**
4. **Run security audit**
   ```bash
   npm audit
   ```
5. **Test your changes**
6. **Submit a pull request**

### Contribution Guidelines

- Follow existing code style and patterns
- Add tests for new security features
- Update documentation for any changes
- Run `npm audit` before submitting
- Reference relevant security advisories or CVEs

### Reporting Security Issues

**Please do not report security vulnerabilities through public GitHub issues.**

See [SECURITY.md](SECURITY.md) for responsible disclosure guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Quick Reference

### Start Development Server
```bash
npm run dev
```

### Start Production Server
```bash
NODE_ENV=production npm start
```

### Run Security Audit
```bash
npm audit
```

### Verify Security Headers
```bash
curl -I http://localhost:3000/api/health
```

---

**Built with security in mind** 🔒

For security concerns, please see [SECURITY.md](SECURITY.md).
