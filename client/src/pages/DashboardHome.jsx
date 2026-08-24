import React, { useState } from 'react';
import { Box, Paper, CircularProgress, Typography, Alert, AlertTitle, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UploadCard from '../components/UploadCard';

/**
 * Dashboard Home page component
 * Provides HTML upload/paste functionality for logged-in users
 * and navigates to results page after analysis
 */
const DashboardHome = () => {
  const theme = useTheme();
  // Theme-based colors
  const COLORS = {
    background: theme.palette.background.paper,
    border: theme.palette.divider,
    text: theme.palette.text.primary,
    primary: theme.palette.primary.main
  };
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  /**
   * Handles accessibility analysis results
   * @param {Object} analysisResult - The analysis result from the backend
   */
  const handleAnalyze = (analysisResult) => {
    // Navigate to results page with the analysis result
    navigate('/dashboard/results', { state: { result: analysisResult } });
  };

  /**
   * Handles error state
   * @param {string} errorMessage - Error message to display
   */
  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  /**
   * Clears error state
   */
  const clearError = () => {
    setError(null);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        p: { xs: 2, md: 4 },
        bgcolor: COLORS.background,
        border: `1px solid ${COLORS.border}`,
        height: '100%'
      }}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold" color={COLORS.text} gutterBottom>
          Accessibility Analyzer
        </Typography>
        <Typography variant="body1" color={COLORS.text} sx={{ maxWidth: 700, mx: 'auto' }}>
          Upload an HTML file, paste HTML code, or enter a URL to analyze for accessibility issues and get recommendations for improvement.
        </Typography>
      </Box>
      
      <UploadCard 
        onAnalyze={handleAnalyze} 
        defaultTab={0} 
        isLoading={loading}
        setIsLoading={setLoading}
        onError={handleError}
        clearError={clearError}
      />
      
      {/* Enhanced Loading State */}
      {loading && (
        <Paper 
          elevation={1} 
          sx={{ 
            width: '100%', 
            mt: 3, 
            borderRadius: 2, 
            p: 4, 
            bgcolor: COLORS.background,
            border: `1px solid ${COLORS.border}`
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, py: 4 }}>
            <CircularProgress size={60} sx={{ color: COLORS.primary }} />
            <Typography variant="h6" color={COLORS.text} sx={{ mt: 1 }}>
              Analyzing Accessibility
            </Typography>
            <Typography variant="body2" color={COLORS.text} sx={{ mt: 2, textAlign: 'center' }}>
              Running accessibility checks against WCAG standards...
            </Typography>
          </Box>
        </Paper>
      )}
      
      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ width: '100%', mt: 3 }}>
          <AlertTitle>Analysis Failed</AlertTitle>
          {error}
        </Alert>
      )}
    </Paper>
  );
};

export default DashboardHome;
