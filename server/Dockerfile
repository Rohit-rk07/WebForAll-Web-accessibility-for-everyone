# Use Playwright's official Python image (includes Chromium + deps)
FROM mcr.microsoft.com/playwright/python:v1.41.1-jammy

# Set environment variables for non-interactive installation
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy application code (exclude files via .dockerignore)
COPY . .

# Run the application without root privileges.
RUN useradd --create-home --uid 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Use gunicorn with uvicorn workers for production performance
# Install gunicorn for production
RUN pip install --no-cache-dir gunicorn

# Health check - use simpler health check that doesn't require requests library
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Run the application with gunicorn for better performance
# Render sets PORT environment variable automatically
CMD ["sh", "-c", "gunicorn main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000} --timeout 120 --access-logfile - --error-logfile -"]
