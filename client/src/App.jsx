// src/App.jsx
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ThemeProvider as MuiThemeProvider, CssBaseline, Box } from "@mui/material";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { useThemeMode } from "./contexts/useThemeMode";
import { useAuth } from "./contexts/useAuth";
import { createAppTheme } from "./theme";
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
  const theme = createAppTheme(darkMode);
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
