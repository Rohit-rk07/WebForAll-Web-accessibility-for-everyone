# Accessibility Analyzer - Navigation Guide

## Navigation Before Login

When a user is not logged in:

1. **Navbar**:
   - Logo links to the home page (`/`)
   - Shows "Guidelines" and "About" links in the navigation menu
   - Shows a "Login" button in the top right
   - Mobile menu shows the same navigation options

2. **Pages Available**:
   - Home page (`/`) - Main landing page with accessibility analyzer
   - Login page (`/login`) - User authentication
   - Signup page (`/signup`) - New user registration

## Navigation After Login

When a user is logged in:

1. **Navbar**:
   - Logo links to the dashboard home (`/dashboard/home`)
   - Shows "Guidelines" and "About" links in the navigation menu
   - Shows a user avatar icon in the top right (links to account settings)
   - Mobile menu shows dashboard navigation options

2. **Dashboard Layout**:
   - Left sidebar with dashboard navigation:
     - Dashboard (home)
     - History (reports)
     - Settings

3. **Pages Available**:
   - Dashboard Home (`/dashboard/home`) - Main dashboard with accessibility analyzer
   - History (`/dashboard/history`) - Past analysis reports
   - Settings (`/dashboard/settings`) - Account settings

## Authentication Flow

- Users can log in with email/password or use the "Continue as Demo User" button
- Protected routes redirect to login if accessed without authentication
- After login, users are directed to the dashboard home
- Users can log out by clicking their avatar and selecting "Logout" from the menu

## Navigation Structure

```
Public Routes:
- / (Home)
- /login
- /signup

Protected Routes (require login):
- /dashboard/home
- /dashboard/history
- /dashboard/settings
``` 