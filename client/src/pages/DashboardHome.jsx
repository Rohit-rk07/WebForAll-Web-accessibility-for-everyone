import React, { useState } from 'react';
import { Box, Paper, CircularProgress, Typography, Alert, AlertTitle } from '@mui/material';
import UploadCard from '../components/UploadCard';
import ResultCard from '../components/ResultCard';

// Color scheme to match dashboard
const COLORS = {
  background: '#ffffff',
  border: '#e0e0e0',
  text: '#333333',
  lightText: '#666666',
  primary: '#4361ee'
};

/**
 * Dashboard Home page component
 * Provides HTML upload/paste functionality for logged-in users
 * and displays accessibility analysis results
 */
const DashboardHome = () => {
  // State management
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handles accessibility analysis results
   * @param {Object} analysisResult - The analysis result from the backend
   */
  const handleAnalyze = (analysisResult) => {
    setResult(analysisResult);
    // Scroll to results
    setTimeout(() => {
      const resultElement = document.getElementById('results-section');
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
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
      
      <UploadCard onAnalyze={handleAnalyze} defaultTab={0} />
      
      {/* Loading State */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 6 }}>
            <CircularProgress sx={{ color: COLORS.primary }} />
            <Typography variant="body1" color={COLORS.lightText}>
              Analyzing your HTML code...
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
      
      {/* Results Display */}
      <Box id="results-section">
        <ResultCard result={result} />
      </Box>
    </Paper>
  );
};

export default DashboardHome; 