// src/App.jsx
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  CssBaseline,
  Box,
} from "@mui/material";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { useThemeMode } from "./contexts/useThemeMode";
import { useAuth } from "./contexts/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader from "./components/PageLoader";
import OfflineBanner from "./components/OfflineBanner";
const AiChatbot = lazy(
  () => import(/* webpackChunkName: "ai-chatbot" */ "./components/AiChatbot"),
);

// Lazy-loaded Pages with webpack chunk names for better debugging
const Home = lazy(() => import(/* webpackChunkName: "home" */ "./pages/Home"));
const Login = lazy(
  () => import(/* webpackChunkName: "login" */ "./pages/Login"),
);
const Signup = lazy(
  () => import(/* webpackChunkName: "signup" */ "./pages/Signup"),
);
const DashboardHome = lazy(
  () =>
    import(/* webpackChunkName: "dashboard-home" */ "./pages/DashboardHome"),
);
const History = lazy(
  () => import(/* webpackChunkName: "history" */ "./pages/History"),
);
const ResultsPage = lazy(
  () => import(/* webpackChunkName: "results" */ "./pages/ResultsPage"),
);
const ForgotPassword = lazy(
  () =>
    import(/* webpackChunkName: "forgot-password" */ "./pages/ForgotPassword"),
);
const ResetPassword = lazy(
  () =>
    import(/* webpackChunkName: "reset-password" */ "./pages/ResetPassword"),
);

// Lazy-loaded Layouts
const DashboardLayout = lazy(
  () =>
    import(
      /* webpackChunkName: "dashboard-layout" */ "./layouts/DashboardLayout"
    ),
);

/**
 * Protected Route Component
 *
 * Redirects to login if not authenticated
 */
const ProtectedRoute = () => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <PageLoader label="Checking your session..." />;
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
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#4361ee",
        light: "#738eef",
        dark: "#2f4bc7",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#3a0ca3",
        light: "#5e3db8",
        dark: "#2a0875",
        contrastText: "#ffffff",
      },
      background: {
        default: darkMode ? "#181a1b" : "#f8f9fa",
        paper: darkMode ? "#23272f" : "#ffffff",
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
      button: { fontWeight: 500, textTransform: "none" },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            minHeight: 44,
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: 44,
            minHeight: 44,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.08)" },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: darkMode ? "#181a1b" : "#f4f6fb",
            minHeight: "100vh",
            width: "100%",
            overflowWrap: "anywhere",
          },
          "*:focus-visible": {
            outline: `3px solid ${darkMode ? "#8aa4ff" : "#2f4bc7"}`,
            outlineOffset: "2px",
          },
          "@media (prefers-reduced-motion: reduce)": {
            "html": { scrollBehavior: "auto" },
            "*, *::before, *::after": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important",
              scrollBehavior: "auto !important",
            },
          },
        },
      },
    },
  });
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <Box sx={{ width: "100vw", height: "100vh", overflow: "auto" }}>
            {/* Skip Navigation Link for Accessibility */}
            <Box
              component="a"
              href="#main-content"
              sx={{
                position: "absolute",
                left: -9999,
                top: 4,
                zIndex: 9999,
                padding: 2,
                backgroundColor: "primary.main",
                color: "white",
                textDecoration: "none",
                borderRadius: 1,
                "&:focus": {
                  left: 4,
                  top: 4,
                },
              }}
            >
              Skip to main content
            </Box>

            <BrowserRouter>
              <OfflineBanner />
              <Suspense fallback={<PageLoader label="Loading page..." />}>
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
                      <Route
                        index
                        element={<Navigate to="/dashboard/home" replace />}
                      />
                      <Route path="home" element={<DashboardHome />} />
                      <Route path="results/:id" element={<ResultsPage />} />
                      <Route path="history" element={<History />} />
                    </Route>
                  </Route>
                  {/* Fallback Route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
              <ChatbotHost />
            </BrowserRouter>
          </Box>
        </AuthProvider>
      </ErrorBoundary>
    </MuiThemeProvider>
  );
}

function ChatbotHost() {
  const { isLoggedIn, loading } = useAuth();
  if (loading || !isLoggedIn) {
    return null;
  }
  return (
    <Suspense fallback={null}>
      <AiChatbot />
    </Suspense>
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
