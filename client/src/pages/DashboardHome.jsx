import React, { useState, lazy, Suspense } from "react";
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
  Alert,
  AlertTitle,
  Button,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getUserFacingError } from "../utils/userFacingError";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const UploadCard = lazy(() => import("../components/UploadCard"));

const DashboardHome = () => {
  const theme = useTheme();
  const online = useOnlineStatus();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAnalyze = (analysisResult) => {
    if (analysisResult?.id) {
      navigate(`/dashboard/results/${analysisResult.id}`);
      return;
    }
    setError(
      "The scan finished but could not be saved. Open History and try again, or run another scan.",
    );
  };

  const handleError = (errorMessage) => {
    setError(getUserFacingError({ message: errorMessage }, errorMessage));
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        p: { xs: 2, md: 4 },
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        height: "100%",
      }}
    >
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          gutterBottom
        >
          Start an accessibility scan
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 700, mx: "auto" }}
        >
          Choose a URL, upload an HTML file, or paste HTML. Then run the scan to
          open a report grouped by severity.
        </Typography>
      </Box>

      {!online && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You are offline. Reconnect before starting a scan.
        </Alert>
      )}

      <Suspense
        fallback={
          <Paper elevation={0} sx={{ p: 4, mt: 3, textAlign: "center" }}>
            <CircularProgress size={32} />
          </Paper>
        }
      >
        <UploadCard
          onAnalyze={handleAnalyze}
          defaultTab={0}
          isLoading={loading}
          setIsLoading={setLoading}
          onError={handleError}
          clearError={clearError}
        />
      </Suspense>

      {loading && (
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            mt: 3,
            borderRadius: 2,
            p: 4,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              py: 2,
            }}
            role="status"
            aria-live="polite"
          >
            <CircularProgress size={48} />
            <Typography variant="h6">Analyzing accessibility</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Running WCAG checks. This can take a minute for large pages.
            </Typography>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ width: "100%", mt: 3, wordBreak: "break-word" }}
          action={
            <Button color="inherit" size="small" onClick={clearError}>
              Dismiss
            </Button>
          }
        >
          <AlertTitle>Analysis failed</AlertTitle>
          {error} Check the URL or HTML, then try again.
        </Alert>
      )}
    </Paper>
  );
};

export default DashboardHome;
