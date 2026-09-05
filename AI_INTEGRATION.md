# AI Integration Documentation

## Overview

The Accessibility Analyzer uses Google's Gemini AI to provide intelligent assistance for accessibility testing and remediation. This document outlines the AI integration architecture, configuration, and troubleshooting.

## Architecture

### Frontend (React)
- **aiService.js**: Handles API calls to backend AI endpoints
- **AiChatbot.jsx**: Real-time chat interface for user assistance
- **Error Handling**: Graceful degradation with user-friendly error messages

### Backend (FastAPI)
- **Gemini API Integration**: Uses Google's Generative AI SDK
- **Three AI Endpoints**:
  - `/ai/chat`: General chat functionality
  - `/ai/explain`: Explains specific accessibility issues
  - `/ai/summary`: Generates comprehensive reports
- **Fallback System**: Provides static responses when AI is unavailable

## Configuration

### Environment Variables

Create a `.env` file in the server directory with:

```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
SECRET_KEY=your_jwt_secret_key
# ... other variables
```

### API Key Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini
3. Add the key to your `.env` file
4. Restart the server

### Validation

The server automatically validates the Gemini configuration on startup:
- ✅ **Success**: "Gemini AI configured successfully"
- ❌ **Failure**: Falls back to static responses

## API Endpoints

### Chat Completion
```http
POST /ai/chat
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

### Issue Explanation
```http
POST /ai/explain
Content-Type: application/json

{
  "issue": {
    "id": "color-contrast",
    "help": "Elements must have sufficient color contrast",
    "impact": "serious"
  }
}
```

### Summary Generation
```http
POST /ai/summary
Content-Type: application/json

{
  "results": {
    "violations": [...],
    "passes": [...],
    "incomplete": [...]
  }
}
```

## Error Handling

### Frontend Error Types
- **500**: "AI service is temporarily unavailable"
- **429**: "Too many requests. Please wait a moment"
- **Network**: "Failed to connect to AI service"
- **API Key**: "AI service configuration error"

### Backend Fallbacks
- **Configuration Issues**: Returns static explanations
- **API Limits**: Provides rate limiting guidance
- **Network Issues**: Suggests connectivity checks

## Troubleshooting

### Common Issues

1. **"AI service is currently unavailable"**
   - Check GEMINI_API_KEY in .env file
   - Verify API key is valid and active
   - Check server logs for configuration errors

2. **"AI service is temporarily at capacity"**
   - Gemini API quota exceeded
   - Wait and retry, or upgrade API plan

3. **Empty or malformed responses**
   - Check network connectivity
   - Verify Gemini API status
   - Review server logs for detailed errors

### Debugging

Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check configuration status:
```bash
# Server startup should show:
# INFO: Gemini AI configured successfully
```

### Testing

Test AI endpoints manually:
```bash
curl -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## Security Considerations

- **API Key Protection**: Never commit .env files to version control
- **Rate Limiting**: `/ai/*` endpoints are limited to 30 requests/minute per IP
- **Input Validation**: All user inputs are validated (bounded lengths, model allow-list) before AI processing
- **Error Disclosure**: Sensitive error details are logged, not exposed to users; errors include an `X-Request-ID`-style `Reference` id for tracing
- **Per-User Cache Scope**: AI explanation responses are cached with a per-user scope so one user's private scan data never leaks through another user's cache entries

## Performance Optimization

- **Response Caching**: AI explanations are cached for 2 hours (in-memory, per-user scope)
- **Request Batching**: Group multiple issues for bulk processing
- **Timeout Handling**: 30-second timeout enforced server-side on all AI requests (`AI_TIMEOUT_SECONDS`, returns 504; configured via `asyncio.wait_for` around the provider call)
- **Fallback Speed**: Static responses serve immediately when AI fails

## Future Improvements

- [ ] Add response caching for common queries
- [ ] Implement request queuing for high traffic
- [ ] Add support for multiple AI providers
- [ ] Enhance fallback response quality
- [ ] Add AI response quality metrics
