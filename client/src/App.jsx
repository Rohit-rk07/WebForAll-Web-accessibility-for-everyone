// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { ThemeProvider, useThemeMode } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AiChatbot from './components/AiChatbot';

// Lazy-loaded Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const History = lazy(() => import('./pages/History'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Lazy-loaded Layouts
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));

/**
 * Protected Route Component
 * 
 * Redirects to login if not authenticated
 */
const ProtectedRoute = () => {
  const { isLoggedIn, loading } = useAuth();
  
  // Show nothing while checking authentication
  if (loading) {
    return null;
  }
  
  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

/**
 * Main App component
 * Handles routing and global providers
 */
function AppContent() {
  const { darkMode } = useThemeMode();
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#4361ee',
        light: '#738eef',
        dark: '#2f4bc7',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#3a0ca3',
        light: '#5e3db8',
        dark: '#2a0875',
        contrastText: '#ffffff',
      },
      background: {
        default: darkMode ? '#181a1b' : '#f8f9fa',
        paper: darkMode ? '#23272f' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 500 },
      h6: { fontWeight: 500 },
      button: { fontWeight: 500, textTransform: 'none' },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            '&:hover': { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)' },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: darkMode
              ? 'linear-gradient(135deg, #23272f 0%, #181a1b 100%)'
              : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            minHeight: '100vh',
            width: '100%',
          },
        },
      },
    },
  });
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Box sx={{ width: '100vw', height: '100vh', overflow: 'auto' }}>
          <BrowserRouter>
            <Suspense fallback={<Box sx={{ p: 4 }} />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* Dashboard Routes (Protected) */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Navigate to="/dashboard/home" replace />} />
                    <Route path="home" element={<DashboardHome />} />
                    <Route path="results/:id" element={<ResultsPage />} />
                    <Route path="history" element={<History />} />
                  </Route>
                </Route>
                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <AiChatbot />
          </BrowserRouter>
        </Box>
      </AuthProvider>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
