# Accessibility Analyzer API Documentation

**Version:** 2.0  
**Base URL:** `http://localhost:8000`  
**Authentication:** JWT Bearer Token

---

## Overview

The Accessibility Analyzer API provides endpoints for analyzing web content for accessibility compliance, AI-powered explanations, and user management. All analysis endpoints require authentication except for health checks.

---

## Authentication

### JWT Token Authentication

Most endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### POST /token
Login endpoint to obtain JWT token.

**Request:**
```http
POST /token
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=password123
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Rate Limiting:** 5 requests per minute

#### POST /register
Register a new user account.

**Request:**
```http
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "full_name": "John Doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "email": "user@example.com"
}
```

**Rate Limiting:** 3 requests per minute

#### POST /demo-login
Demo login endpoint for testing without credentials.

**Request:**
```http
POST /demo-login
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "email": "demo@example.com",
    "full_name": "Demo User"
  }
}
```

---

## Health & System

#### GET /
Root endpoint with basic status.

**Response:**
```json
{
  "status": "ok",
  "message": "Accessibility Analyzer API is running",
  "version": "2.0"
}
```

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "2.0",
  "platform": "Linux",
  "python_version": "3.11.0"
}
```

#### GET /health/playwright
Playwright browser health check.

**Response:**
```json
{
  "status": "healthy",
  "browsers_available": 3,
  "browser_pool_initialized": true
}
```

---

## Analysis Endpoints

### Analyze URL

#### POST /analyze/url
Analyze a URL for accessibility issues.

**Request:**
```http
POST /analyze/url
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com",
  "wcag_options": {
    "wcag_version": "wcag21",
    "level": "aa"
  }
}
```

**Parameters:**
- `url` (string, required): URL to analyze
- `wcag_options` (object, optional):
  - `wcag_version` (string): WCAG version, one of `wcag2` (2.0), `wcag21` (2.1), `wcag22` (2.2)
  - `level` (string): Conformance level, one of `a`, `aa`, `aaa` (lowercase)
  - `best_practice` (boolean, default `true`): Include best-practice checks

**Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "violations": [
    {
      "id": "color-contrast",
      "description": "Elements must have sufficient color contrast",
      "impact": "serious",
      "tags": ["wcag2aa", "wcag142", "wcag21aa"],
      "nodes": [
        {
          "html": "<p style='color: #999; background: #fff'>Text</p>",
          "target": ["p"]
        }
      ]
    }
  ],
  "passes": [
    {
      "id": "html-lang",
      "description": "Document has a lang attribute"
    }
  ],
  "incomplete": [],
  "wcag_compliance": {
    "version": "2.1",
    "level": "AA",
    "compliance_percentage": 85.5,
    "is_compliant": false
  }
}
```

**Response Time:** Typically 10-30 seconds depending on page complexity

### Analyze HTML Code

#### POST /analyze/html
Analyze HTML code for accessibility issues.

**Request:**
```http
POST /analyze/html
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "<html><body><h1>Heading</h1></body></html>",
  "wcag_options": {
    "wcag_version": "wcag21",
    "level": "aa"
  }
}
```

**Parameters:**
- `content` (string, required): HTML document to analyze (max 5 MB)
- `base_url` (string, optional): Base URL to resolve relative resources against
- `wcag_options` (object, optional): Same shape as `POST /analyze/url`

**Response:** Same format as URL analysis

### Analyze File Upload

#### POST /analyze/file
Analyze an uploaded HTML file.

**Request:**
```http
POST /analyze/file
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <HTML file>
wcag_options: {"wcag_version": "wcag21", "level": "aa", "best_practice": true}
```

**Parameters:**
- `file` (file, required): HTML file to analyze (must end in `.html` or `.htm`, max 5 MB, UTF-8 encoded)
- `wcag_options` (string, optional): JSON string encoding the same shape as `POST /analyze/url`. Invalid versions/levels are rejected with a `400` response.

**Response:** Same format as URL analysis

---

## AI Integration Endpoints

### AI Chat

#### POST /ai/chat
Send a message to the AI chatbot for accessibility questions.

**Request:**
```http
POST /ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "How do I fix color contrast issues?"}
  ],
  "model": "gemini-2.5-flash",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response:**
```json
{
  "content": "To fix color contrast issues, ensure the ratio between text and background colors meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)...",
  "model": "gemini-2.5-flash",
  "usage": {
    "total_tokens": 42
  },
  "metrics": {
    "response_time_ms": 1250,
    "filter_confidence": 0.8
  }
}
```

**Content Filtering:** AI responses are filtered for accessibility topics and harmful content

### Issue Explanation

#### POST /ai/explain
Get AI explanation for a specific accessibility issue.

**Request:**
```http
POST /ai/explain
Authorization: Bearer <token>
Content-Type: application/json

{
  "issue": {
    "id": "color-contrast",
    "description": "Elements must have sufficient color contrast",
    "impact": "serious",
    "tags": ["wcag2aa", "wcag142"]
  }
}
```

**Response:**
```json
{
  "explanation": "Color contrast is crucial for users with visual impairments. This issue occurs when the difference between text and background colors is insufficient...",
  "fixedCode": "<p style='color: #333; background: #fff'>Text</p>",
  "ruleId": "color-contrast",
  "impact": "serious",
  "generated_at": "2026-09-04T12:00:00Z"
}
```

**Caching:** Explanations are cached for 2 hours

### Summary Generation

#### POST /ai/summary
Generate a summary of accessibility analysis results.

**Request:**
```http
POST /ai/summary
Authorization: Bearer <token>
Content-Type: application/json

{
  "results": {
    "violations": [...],
    "passes": [...],
    "incomplete": [...],
    "inapplicable": [...]
  }
}
```

**Response:**
```json
{
  "summary": "Found 5 violations, 10 passes, 2 incomplete checks, and 0 inapplicable checks.",
  "score": 52,
  "counts": {
    "violations": 5,
    "passes": 10,
    "incomplete": 2,
    "inapplicable": 0
  },
  "severity": {
    "critical": 1,
    "serious": 2,
    "moderate": 1,
    "minor": 1
  }
}
```

**Note:** This endpoint computes a score and summary locally from the provided results; it does not call an external AI provider.

### AI Metrics

#### GET /ai/metrics
Get AI service performance metrics. Requires authentication.

**Request:**
```http
GET /ai/metrics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_requests": 1250,
  "successful_requests": 1180,
  "failed_requests": 70,
  "cached_responses": 350,
  "average_response_time_ms": 1250,
  "cache_hit_rate": 28.0
}
```

---

## User Management

#### GET /users/me
Get current user information.

**Request:**
```http
GET /users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "disabled": false
}
```

#### DELETE /users/me
Permanently delete the current user's account and all associated data (analyses, password-reset tokens). Requires authentication.

**Request:**
```http
DELETE /users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Account and all associated data deleted"
}
```

---

## History Management

#### GET /history
Get user's analysis history.

**Request:**
```http
GET /history?limit=50&skip=0
Authorization: Bearer <token>
```

**Parameters:**
- `limit` (integer, optional): Items per page (default: 50, max: 100)
- `skip` (integer, optional): Number of items to skip (default: 0)

**Response:**
```json
{
  "items": [
    {
      "id": "analysis_id",
      "input_type": "url",
      "input_ref": "https://example.com",
      "wcag_options": { "wcag_version": "wcag21", "level": "aa" },
      "violations_count": 5,
      "created_at": "2026-09-04T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 50,
    "skip": 0,
    "has_more": false
  }
}
```

**Note:** The list view omits the bulky `result` and `summary` payloads for performance. Fetch a single item via `GET /history/{id}` for full details.

#### GET /history/{id}
Get specific analysis details.

**Request:**
```http
GET /history/analysis_id
Authorization: Bearer <token>
```

**Response:** Full analysis results

#### DELETE /history/{id}
Delete a specific analysis. Only the owning user can delete it.

**Request:**
```http
DELETE /history/analysis_id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Analysis deleted"
}
```

---

## Security Endpoints

#### GET /csrf-token
Get CSRF token for state-changing operations.

**Response:**
```json
{
  "csrf_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Usage:** Include token in `X-CSRF-Token` header for POST/PUT/DELETE requests

---

## Error Responses

All endpoints may return error responses:

```json
{
  "detail": "Error message",
  "status_code": 400
}
```

### Common Error Codes

- `400`: Bad Request - Invalid input parameters
- `401`: Unauthorized - Missing or invalid token, or disabled account
- `403`: Forbidden - Insufficient permissions or CSRF validation failed
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource already exists (e.g. duplicate registration email)
- `413`: Payload Too Large - Request body or uploaded file exceeds limits
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error (AI errors include a traceable `Reference` id)
- `502`: Bad Gateway - Browser analysis failed to produce results
- `504`: Gateway Timeout - Analysis or AI request exceeded its deadline

---

## Rate Limiting

| Endpoint | Rate Limit |
|----------|------------|
| /token | 5 requests/minute |
| /register | 3 requests/minute |
| /demo-login | 5 requests/minute |
| /forgot-password | 5 requests/minute |
| /reset-password | 10 requests/minute |
| /ai/* | 30 requests/minute |
| /analyze/url | 10 requests/minute |
| /analyze/html | 10 requests/minute |
| /analyze/file | 10 requests/minute |
| GET /history, GET /history/{id} | 60 requests/minute |
| DELETE /history/{id} | 30 requests/minute |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

---

## Performance Benchmarks

### Target Response Times

| Endpoint | Target p50 | Target p95 |
|----------|-----------|-----------|
| /token | 200ms | 500ms |
| /analyze/url | 30s | 60s |
| /analyze/html | 10s | 20s |
| /ai/chat | 5s | 10s |
| /ai/explain | 3s | 5s |
| /history | 200ms | 500ms |

### Current Performance Metrics

Access performance metrics via `/metrics` endpoint (if implemented).

---

## CORS Configuration

**Allowed Origins:** Configured via `ALLOWED_ORIGINS` environment variable  
**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS  
**Allowed Headers:** Authorization, Content-Type, X-CSRF-Token  
**Max Age:** 3600 seconds

---

## Data Models

### Analysis Result

```typescript
interface AnalysisResult {
  success: boolean;
  url?: string;
  violations: Violation[];
  passes: Pass[];
  incomplete: Incomplete[];
  wcag_compliance?: WCAGCompliance;
}

interface Violation {
  id: string;
  description: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  tags: string[];
  nodes: Node[];
  help?: string;
  helpUrl?: string;
}

interface WCAGCompliance {
  version: string;
  level: string;
  compliance_percentage: number;
  is_compliant: boolean;
}
```

### AI Response

```typescript
interface AIResponse {
  response: string;
  model: string;
  metrics: {
    response_time_ms: number;
    cached: boolean;
  };
}
```

---

## Webhooks (Future)

Webhook support for analysis completion notifications (planned feature).

---

## SDK Examples

### Python

```python
import requests

# Login
response = requests.post('http://localhost:8000/token', data={
    'username': 'user@example.com',
    'password': 'password123'
})
token = response.json()['access_token']

# Analyze URL
headers = {'Authorization': f'Bearer {token}'}
response = requests.post('http://localhost:8000/analyze/url', 
                        json={'url': 'https://example.com'},
                        headers=headers)
results = response.json()
```

### JavaScript

```javascript
// Login
const response = await fetch('http://localhost:8000/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'username=user@example.com&password=password123'
});
const { access_token } = await response.json();

// Analyze URL
const headers = {'Authorization': `Bearer ${access_token}`};
const results = await fetch('http://localhost:8000/analyze/url', {
    method: 'POST',
    headers: {
        ...headers,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({url: 'https://example.com'})
}).then(r => r.json());
```

---

## Changelog

### Version 2.0 (2026-09-04)
- Added AI integration with content filtering
- Implemented browser pooling for performance
- Added response caching for AI endpoints
- Added WCAG compliance verification
- Added performance monitoring
- Enhanced security with CSRF protection
- Added rate limiting to authentication endpoints

### Version 1.0 (Initial Release)
- Basic accessibility analysis
- User authentication
- Analysis history
- AI chatbot

---

## Support

For API support and questions, refer to the project documentation or contact the development team.

---

*Last Updated: 2026-09-04*  
*API Version: 2.0*