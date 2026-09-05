import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Link as MuiLink,
  InputAdornment,
  IconButton,
  Paper,
  Avatar,
  Container,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  AccessibilityNew,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

/**
 * Login page component
 * Handles user authentication
 */
const Login = () => {
  // State management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Hooks
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();
  const theme = useTheme();

  /**
   * Handles form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await login({ email, password });
      navigate("/dashboard/home");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles demo login
   */
  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await demoLogin();
      navigate("/dashboard/home");
    } catch (err) {
      console.error("Demo login error:", err);
      setError(err.message || "Demo login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Toggles password visibility
   */
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="sm">
        <MuiLink
          component={Link}
          to="/"
          underline="hover"
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, mb: 3, color: "text.secondary" }}
        >
          <ArrowBack fontSize="small" aria-hidden="true" />
          Back to home
        </MuiLink>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
          }}
        >
          {/* Logo and Brand */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              <AccessibilityNew fontSize="small" />
            </Avatar>
            <Typography variant="h5" component="span" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
              Accessibility Analyzer
            </Typography>
          </Box>

          {/* Page Title */}
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1, letterSpacing: "-0.02em" }}>
            Welcome back
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to run scans and review your accessibility reports
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, wordBreak: "break-word" }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            {/* Email Field */}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              variant="outlined"
              autoComplete="email"
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Password Field */}
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              variant="outlined"
              autoComplete="current-password"
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={toggleShowPassword}
                      edge="end"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Forgot Password Link */}
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <MuiLink
                component={Link}
                to="/forgot-password"
                variant="body2"
                underline="hover"
              >
                Forgot password?
              </MuiLink>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              aria-label={isSubmitting ? "Signing in" : "Sign in"}
              sx={{ py: 1.5, mt: 1 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign in"
              )}
            </Button>

            {/* Demo Login */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 1 }}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>

            <Button
              onClick={handleDemoLogin}
              variant="outlined"
              size="large"
              fullWidth
              disabled={isSubmitting}
              aria-label="Continue as demo user"
              sx={{ py: 1.5 }}
            >
              {isSubmitting ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Continue as Demo User"
              )}
            </Button>

            {/* Sign Up Link */}
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2">
                Don't have an account?{" "}
                <MuiLink
                  component={Link}
                  to="/signup"
                  fontWeight="medium"
                  underline="hover"
                >
                  Sign up
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;