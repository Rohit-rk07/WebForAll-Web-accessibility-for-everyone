# Architecture Documentation

## System Architecture

The Accessibility Analyzer is a full-stack web application built with a modern microservices-inspired architecture, consisting of a React frontend and FastAPI backend.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (React + Vite)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   UI Layer   │  │ State Layer  │  │ Service Layer│     │
│  │ (Components) │  │ (Contexts)   │  │ (API Client) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Server (FastAPI + Python)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  API Layer   │  │ Business     │  │  Data Layer  │     │
│  │ (Endpoints)  │  │ Logic Layer  │  │ (MongoDB)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │             │
│         │                 │                  │             │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐     │
│  │   Auth      │  │  Analysis   │  │   AI Service│     │
│  │   Module    │  │   Module    │  │   Module    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼────┐        ┌─────▼─────┐       ┌─────▼─────┐
    │ MongoDB │        │ Playwright│       │  Gemini   │
    │  Atlas  │        │  Browser  │       │    AI     │
    └─────────┘        └───────────┘       └───────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 19.1.0 with Vite 6.3.5
- **UI Library**: Material-UI (MUI) 7.2.0 with Emotion styling
- **Routing**: React Router DOM 6.23.0
- **HTTP Client**: Axios 1.10.0
- **Build Tool**: Vite with code splitting and optimization
- **Testing**: Vitest with React Testing Library

### Backend
- **Framework**: FastAPI 0.115.0 with Uvicorn 0.34.0
- **Database**: MongoDB Atlas with Motor (async driver)
- **Authentication**: JWT with PyJWT and Passlib (bcrypt)
- **Analysis**: Playwright 1.41.1 with axe-core
- **AI Integration**: Google Generative AI (Gemini)
- **Testing**: Pytest with pytest-asyncio

## Component Structure

### Frontend Directory Structure

```
client/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Home/          # Home page specific components
│   │   │   ├── FeatureCard.jsx
│   │   │   ├── HeroSection.jsx
│   │   │   └── DemoButton.jsx
│   │   ├── Navbar/        # Navigation components
│   │   ├── ResultsPage/   # Results display components
│   │   ├── UploadCard/    # Input method components
│   │   ├── AiChatbot.jsx  # AI chat interface
│   │   └── ErrorBoundary.jsx
│   ├── contexts/          # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── layouts/           # Page layout components
│   │   └── DashboardLayout.jsx
│   ├── pages/             # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── DashboardHome.jsx
│   │   ├── ResultsPage.jsx
│   │   └── History.jsx
│   ├── services/          # API service layer
│   │   ├── apiClient.js
│   │   └── aiService.js
│   ├── utils/             # Utility functions
│   │   └── resultsUtils.js
│   ├── test/              # Test configuration
│   │   └── setup.js
│   ├── App.jsx            # Root component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── package.json
├── vite.config.js
├── vitest.config.js
└── eslint.config.js
```

### Backend Directory Structure

```
server/
├── analyzer/              # Accessibility analysis modules
│   ├── __init__.py
│   ├── simple_playwright.py
│   └── playwright_helper.py
├── auth/                  # Authentication modules
│   ├── __init__.py
│   ├── auth_models.py
│   └── auth_utils.py
├── models/                # Pydantic models
│   ├── __init__.py
│   └── analysis_models.py
├── services/              # Business logic services
│   ├── __init__.py
│   ├── db.py              # Database connection
│   ├── ai_service.py      # AI integration
│   └── email_service.py   # Email notifications
├── tests/                 # Test suite
│   ├── __init__.py
│   ├── conftest.py
│   └── test_api_endpoints.py
├── main.py                # FastAPI application entry point
├── requirements.txt
├── Dockerfile
└── .env.example
```

## Data Flow

### Authentication Flow

```
User → Login Form → AuthContext → API Client → /token Endpoint
                                                      ↓
                                            Auth Utils (verify_password)
                                                      ↓
                                            MongoDB (users collection)
                                                      ↓
                                              JWT Token Generation
                                                      ↓
                                            Token Storage (localStorage)
                                                      ↓
                                            Protected API Calls (Bearer Token)
```

### Accessibility Analysis Flow

```
User Input (URL/HTML/File) → UploadCard Component
                              ↓
                        API Client (POST /analyze/*)
                              ↓
                    FastAPI Analysis Endpoint
                              ↓
                    Playwright Browser Launch
                              ↓
                    axe-core Script Injection
                              ↓
                    Accessibility Rules Execution
                              ↓
                    Results Processing & Storage
                              ↓
                    MongoDB (analyses collection)
                              ↓
                    Results Display (ResultsPage)
                              ↓
              Optional: AI Explanation (AI Service)
```

### AI Integration Flow

```
User Request → AI Service → AI Endpoint (/ai/*)
                            ↓
                    Gemini API Integration
                            ↓
                    Prompt Engineering
                            ↓
                    AI Response Processing
                            ↓
                    Response Caching (optional)
                            ↓
                    UI Display
```

## Key Design Patterns

### 1. Repository Pattern
Database operations are abstracted through the `services/db.py` module, providing a clean interface for data access.

### 2. Service Layer Pattern
Business logic is separated into service modules (`ai_service.py`, `email_service.py`) that handle specific domains.

### 3. Context Pattern (React)
Global state management using React Context for authentication and theme management.

### 4. Middleware Pattern
FastAPI middleware for CORS, GZip compression, caching, and rate limiting.

### 5. Factory Pattern
Playwright browser instances are created and managed through factory-like functions.

## Security Architecture

### Authentication
- JWT-based stateless authentication
- Password hashing with bcrypt
- Token expiration (30 minutes)
- Protected routes with dependency injection

### Authorization
- Role-based access control (RBAC) ready
- User-specific data isolation (owner_email in analyses)
- Session management through token validation

### Rate Limiting
- Login endpoint: 5 requests per minute
- Registration endpoint: 3 requests per minute
- Password reset: Cooldown period (2 minutes)

### Data Protection
- Environment variables for sensitive data
- MongoDB connection with TLS
- CORS configuration with specific origins
- Input validation on all endpoints

## Performance Optimization

### Frontend
- Code splitting with Vite
- Lazy loading of components
- Vendor chunk separation
- GZip compression
- Asset optimization

### Backend
- Async operations throughout
- MongoDB connection pooling
- Response caching middleware
- Background task processing
- Playwright browser reuse (potential)

### Database
- Connection pooling (max 50, min 5)
- Proper indexing on frequently queried fields
- TTL indexes for temporary data
- Write concern: majority

## Scalability Considerations

### Horizontal Scaling
- Stateless FastAPI application
- MongoDB Atlas (managed scaling)
- Potential for microservice decomposition

### Vertical Scaling
- Connection pooling configuration
- Async I/O operations
- Efficient memory management
- Background task offloading

### Caching Strategy
- Response caching for static endpoints
- Potential AI response caching
- Browser caching headers
- CDN readiness for static assets

## Error Handling Strategy

### Frontend
- Error Boundary component for React errors
- Specific error messages in try-catch blocks
- User-friendly error displays
- Graceful degradation for AI features

### Backend
- Comprehensive exception handling
- Structured error responses
- Logging for debugging
- Fallback mechanisms for external services

## Monitoring & Observability

### Logging
- Structured logging configuration
- Error logging with context
- Request/response logging (optional)
- Performance metrics (optional)

### Health Checks
- `/health` endpoint for basic health
- `/health/playwright` for browser status
- Database connection monitoring
- External service health checks

## Deployment Architecture

### Development
- Local development with hot reload
- Separate client and server processes
- Environment variable configuration
- Local MongoDB or MongoDB Atlas

### Production
- Docker containerization
- Render/Vercel deployment (client)
- Railway/Render deployment (server)
- MongoDB Atlas for database
- Environment-specific configuration

### CI/CD Pipeline (Recommended)
- Automated testing
- Code quality checks (ESLint, flake8)
- Security scanning
- Automated deployment
- Rollback capabilities

## API Architecture

### RESTful Design
- Resource-based endpoints
- HTTP method semantics
- Proper status codes
- Consistent response format

### Endpoint Categories
- **Authentication**: `/token`, `/register`, `/demo-login`, `/forgot-password`, `/reset-password`
- **Analysis**: `/analyze/url`, `/analyze/html`, `/analyze/file`
- **AI**: `/ai/chat`, `/ai/explain`, `/ai/summary`
- **History**: `/history`, `/history/{id}`
- **System**: `/`, `/health`, `/health/playwright`

### Response Format
```json
{
  "data": { /* response data */ },
  "error": null,
  "status": "success"
}
```

## State Management

### Client-Side State
- **AuthContext**: User authentication state
- **ThemeContext**: UI theme preferences
- **Component State**: Local component state with hooks
- **URL State**: React Router for navigation state

### Server-Side State
- **Database**: Persistent data storage
- **Session**: JWT-based stateless sessions
- **Cache**: In-memory caching (optional)
- **Background Tasks**: Async task queue

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Component testing with Vitest
- **Integration Tests**: API client testing
- **E2E Tests**: Playwright/Cypress (recommended)
- **Accessibility Tests**: axe-core integration

### Backend Testing
- **Unit Tests**: Function and class testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: MongoDB operation testing
- **External Service Tests**: Mocked external dependencies

## Future Architecture Improvements

### Planned Enhancements
1. **Microservices Decomposition**: Separate analysis service
2. **Message Queue**: RabbitMQ/Redis for background tasks
3. **Real-time Updates**: WebSocket integration
4. **Advanced Caching**: Redis implementation
5. **Monitoring**: Prometheus/Grafana integration
6. **CDN**: Cloudflare/CloudFront for static assets
7. **Load Balancing**: Nginx/HAProxy configuration
8. **Service Mesh**: Istio for microservice communication

### Scalability Roadmap
1. Implement browser pooling for Playwright
2. Add request queuing for high traffic
3. Implement database sharding if needed
4. Add read replicas for MongoDB
5. Implement content delivery network
6. Add geographic distribution

---

*Last Updated: 2026-09-04*
*Architecture Version: 2.0*