// src/App.jsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardHome from './pages/DashboardHome';
import History from './pages/History';
import AccountSettings from './pages/AccountSettings';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

/**
 * Custom theme configuration for the application
 */
const theme = createTheme({
  palette: {
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
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg,rgb(26, 220, 94) 0%,rgb(3, 19, 58) 100%)',
          minHeight: '100vh',
          width: '100%',
        },
      },
    },
  },
});

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

/**
 * Main App component
 * Handles routing and global providers
 */
function App() {
  // State for authentication (simplified for demo)
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider value={{ 
        isLoggedIn: isAuthenticated, 
        login: () => setIsAuthenticated(true), 
        logout: () => setIsAuthenticated(false) 
      }}>
        <Box sx={{ width: '100vw', height: '100vh', overflow: 'auto' }}>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Dashboard Routes (Protected) */}
              <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Navigate to="/dashboard/home" replace />} />
                  <Route path="home" element={<DashboardHome />} />
                  <Route path="history" element={<History />} />
                  <Route path="settings" element={<AccountSettings />} />
                </Route>
              </Route>
              
              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </Box>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
