import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import UploadCard from '../components/UploadCard';
import ResultCard from '../components/ResultCard';
import { Box, Typography, Paper, CircularProgress, Alert, AlertTitle, Container, useTheme } from '@mui/material';

// API base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Home page component
 * Serves as the landing page with HTML upload/paste functionality
 * and displays accessibility analysis results
 */
const Home = () => {
  // State management
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();

  /**
   * Handles analysis results from any source
   * @param {Object} data - The analysis result data
   */
  const handleAnalysisResult = (data) => {
    // Ensure the result has a consistent structure
    const formattedResult = {
      ...data,
      results: data.results || {},
      mode: data.mode || 'static_only'
    };
    
    setResult(formattedResult);
  };

  /**
   * Clears any error messages
   */
  const clearError = () => {
    setError(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default,
      }}
    >
      <Navbar />
      
      {/* Hero Section */}
      <Box 
        sx={{ 
          py: 6, 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          px: 3,
          width: '100%',
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          sx={{ 
            fontWeight: 700, 
            mb: 2,
            color: theme.palette.text.primary,
          }}
        >
          Accessibility Analyzer
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            maxWidth: 800, 
            mb: 3,
            fontWeight: 400,
            color: theme.palette.text.secondary,
          }}
        >
          Analyze your HTML code for accessibility issues and get recommendations to improve inclusivity
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: 3, 
          maxWidth: 900,
          mb: 5
        }}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'rgba(67, 97, 238, 0.05)',
              border: '1px solid rgba(67, 97, 238, 0.1)',
              flex: '1 1 250px',
              maxWidth: '280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <Box 
              component="img" 
              src="/ai-explain.svg" 
              alt="" 
              sx={{ height: 60, mb: 1, opacity: 0.9 }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              AI Explanations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get AI-powered explanations for accessibility issues with step-by-step fixes and code examples
            </Typography>
          </Paper>
          
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'rgba(67, 97, 238, 0.05)',
              border: '1px solid rgba(67, 97, 238, 0.1)',
              flex: '1 1 250px',
              maxWidth: '280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <Box 
              component="img" 
              src="/ai-chat.svg" 
              alt="" 
              sx={{ height: 60, mb: 1, opacity: 0.9 }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              AI Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chat with our AI assistant to learn about accessibility best practices and WCAG guidelines
            </Typography>
          </Paper>
          
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'rgba(67, 97, 238, 0.05)',
              border: '1px solid rgba(67, 97, 238, 0.1)',
              flex: '1 1 250px',
              maxWidth: '280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <Box 
              component="img" 
              src="/ai-summary.svg" 
              alt="" 
              sx={{ height: 60, mb: 1, opacity: 0.9 }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              AI Summary Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate comprehensive accessibility reports with prioritized recommendations and impact analysis
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ flex: 1, mb: 6 }}>
        {/* Upload/Paste Component - Default to URL tab (index 0) */}
        <UploadCard 
          onAnalyze={handleAnalysisResult} 
          defaultTab={0} 
          isLoading={loading}
          setIsLoading={setLoading}
          onError={setError}
          clearError={clearError}
        />
        
        {/* Loading State */}
        {loading && (
          <Paper elevation={3} sx={{ width: '100%', mt: 3, borderRadius: 3, p: 4, bgcolor: theme.palette.background.paper }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 6 }}>
              <CircularProgress />
              <Typography variant="body1" color={theme.palette.text.secondary}>
                Analyzing your content...
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
        <ResultCard result={result} />
      </Container>
    </Box>
  );
};

export default Home;