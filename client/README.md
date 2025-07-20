# Accessibility Analyzer Client

This is the frontend client for the Accessibility Analyzer application. It provides a user-friendly interface for analyzing web content for accessibility issues.

## Features

- Multiple input methods:
  - URL analysis
  - HTML file upload
  - Direct HTML code input
- Comprehensive accessibility reports
- Score visualization
- Issue categorization and filtering
- WCAG compliance information

## Setup

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Install dependencies:

```bash
# Using npm
npm install

# Using yarn
yarn
```

2. Create a `.env` file in the root directory with the following content:

```
# API Configuration
VITE_API_URL=http://localhost:8000

# Environment
VITE_APP_ENV=development
```

> **Note**: Adjust the `VITE_API_URL` if your backend server is running on a different host or port.

## Running the Client

Start the development server:

```bash
# Using npm
npm run dev

# Using yarn
yarn dev
```

The client will be available at http://localhost:5173.

## Building for Production

Build the client for production:

```bash
# Using npm
npm run build

# Using yarn
yarn build
```

The built files will be in the `dist` directory.

## Project Structure

- `src/components`: Reusable UI components
- `src/pages`: Page components
- `src/contexts`: React contexts for state management
- `src/layouts`: Layout components
- `src/assets`: Static assets

## Technologies Used

- React
- Material-UI
- React Router
- Vite
