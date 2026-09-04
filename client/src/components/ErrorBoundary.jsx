import React, { Component } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Container,
} from "@mui/material";
import { RefreshCw, Home as HomeIcon } from "lucide-react";

/**
 * Error Boundary Component
 * Catches JavaScript errors in component tree and displays fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and could be sent to error tracking service
    console.error("Error caught by Error Boundary:", error, errorInfo);
    this.setState({ errorInfo });

    // Optional: Send error to error tracking service
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.handleReset();
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            p: 3,
          }}
        >
          <Container maxWidth="md">
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                alignItems: "center",
              }}
            >
              <AlertTitle>Something went wrong</AlertTitle>
              {this.state.error && (
                <Typography
                  variant="body2"
                  sx={{ mt: 1, fontFamily: "monospace" }}
                >
                  {this.state.error.toString()}
                </Typography>
              )}
            </Alert>

            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                We encountered an unexpected error
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This error has been logged. You can try refreshing the page or
                going back to the home page.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                startIcon={<RefreshCw size={18} />}
                onClick={this.handleReset}
                sx={{ minWidth: 140 }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon size={18} />}
                onClick={this.handleGoHome}
                sx={{ minWidth: 140 }}
              >
                Go Home
              </Button>
            </Box>

            {import.meta.env.DEV && this.state.errorInfo && (
              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  Error Details (Development Mode):
                </Typography>
                <Box
                  sx={{
                    bgcolor: "grey.900",
                    color: "grey.100",
                    p: 2,
                    borderRadius: 1,
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    overflow: "auto",
                    maxHeight: 300,
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </Box>
              </Box>
            )}
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
