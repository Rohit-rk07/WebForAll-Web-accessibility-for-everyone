# Contributing Guidelines

Thank you for your interest in contributing to the Accessibility Analyzer! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- MongoDB Atlas account
- Git

### Development Setup

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/your-username/accessibility-analyzer.git
   cd accessibility-analyzer
   ```

2. **Install Dependencies**
   ```bash
   # Server
   cd server
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python setup_playwright.py
   
   # Client
   cd ../client
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Server
   cd server
   cp .env.example .env
   # Edit .env with your credentials
   
   # Client
   cd client
   cp .env.example .env
   # Edit .env with your API URL
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1 - Server
   cd server
   uvicorn main:app --reload
   
   # Terminal 2 - Client
   cd client
   npm run dev
   ```

## Code Style Guidelines

### Python (Backend)
- Follow PEP 8 style guide
- Use `black` for code formatting
- Use `flake8` for linting
- Maximum line length: 100 characters
- Use type hints where appropriate
- Document functions with docstrings

### JavaScript/React (Frontend)
- Follow Airbnb JavaScript Style Guide
- Use ESLint for linting
- Use Prettier for formatting (recommended)
- Maximum line length: 100 characters
- Use functional components with hooks
- Prefer async/await over promises

### File Naming
- **Python**: `snake_case.py`
- **JavaScript/React**: `PascalCase.jsx` for components, `camelCase.js` for utilities
- **CSS**: `kebab-case.css`

## Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Urgent production fixes

### Commit Guidelines
- Follow conventional commits format:
  - `feat: add new feature`
  - `fix: fix bug`
  - `docs: update documentation`
  - `style: code style changes`
  - `refactor: code refactoring`
  - `test: add/update tests`
  - `chore: maintenance tasks`

- Write clear, descriptive commit messages
- Keep commits atomic and focused
- Reference related issues: `fixes #123`

### Pull Request Process
1. Create a feature branch from `develop`
2. Make your changes and test thoroughly
3. Update documentation if needed
4. Ensure all tests pass
5. Submit a pull request to `develop`
6. Address review feedback
7. Wait for approval and merge

## Testing Requirements

### Frontend Tests
```bash
cd client
npm test              # Run all tests
npm run test:ui       # Run tests with UI
```

### Backend Tests
```bash
cd server
pytest                # Run all tests
pytest -v             # Verbose output
pytest tests/test_api_endpoints.py  # Specific test file
```

### Test Coverage
- Aim for >80% code coverage
- Write tests for new features
- Update tests when fixing bugs
- Test critical paths thoroughly

## Accessibility Requirements

Since this is an accessibility analyzer, all UI components must meet WCAG 2.1 AA standards:

### Requirements
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Color contrast ratios (4.5:1 for text)
- Screen reader compatibility
- Alt text for images
- Form labels and error messages

### Testing
- Test with keyboard only
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Use axe-core for automated testing
- Manual testing with accessibility tools

## Code Review Process

### Before Submitting
- Run linting tools
- Run all tests
- Check for accessibility issues
- Update documentation
- Self-review your changes

### During Review
- Address all review comments
- Explain complex changes
- Be responsive to feedback
- Keep discussions constructive

### After Approval
- Ensure CI/CD checks pass
- Update changelog if needed
- Delete your feature branch after merge

## Issue Reporting

### Bug Reports
- Use the issue template
- Provide detailed description
- Include steps to reproduce
- Add screenshots if applicable
- Specify environment details

### Feature Requests
- Describe the feature clearly
- Explain the use case
- Suggest implementation approach
- Consider accessibility implications

## Documentation

### When to Update Documentation
- Adding new features
- Changing existing functionality
- Updating dependencies
- Modifying architecture
- Adding configuration options

### Documentation Types
- **README.md**: Project overview and setup
- **ARCHITECTURE.md**: System architecture
- **API.md**: API documentation
- **CONTRIBUTING.md**: This file
- **Code comments**: Complex logic explanation

## Security Guidelines

### Sensitive Data
- Never commit credentials
- Use environment variables
- Follow security best practices
- Report vulnerabilities privately
- Update dependencies regularly

### Code Security
- Validate all inputs
- Sanitize outputs
- Use parameterized queries
- Implement rate limiting
- Follow OWASP guidelines

## Performance Guidelines

### Frontend Performance
- Lazy load components
- Optimize images
- Minimize bundle size
- Use code splitting
- Implement caching strategies

### Backend Performance
- Use async operations
- Optimize database queries
- Implement caching
- Use connection pooling
- Monitor response times

## Getting Help

### Resources
- **Documentation**: Check existing docs first
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions
- **Email**: Contact maintainers for private questions

### Communication
- Be respectful and constructive
- Provide context when asking questions
- Share relevant code snippets
- Follow up on responses

## License

By contributing, you agree that your contributions will be licensed under the project's license.

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to making the web more accessible!