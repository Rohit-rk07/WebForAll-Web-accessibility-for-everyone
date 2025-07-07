import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import UploadCard from '../components/UploadCard';
import ResultCard from '../components/ResultCard';
import { Box, Typography, Paper, CircularProgress, Alert, AlertTitle, Container } from '@mui/material';

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

  /**
   * Sends HTML to the backend for accessibility analysis
   * @param {string} html - The HTML code to analyze
   */
  const analyzeHTML = async (html) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
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
          width: '100%'
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          sx={{ 
            fontWeight: 700, 
            mb: 2,
            color: 'text.primary',
          }}
        >
          Accessibility Analyzer
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            maxWidth: 800, 
            mb: 5,
            fontWeight: 400,
            color: 'text.secondary'
          }}
        >
          Analyze your HTML code for accessibility issues and get recommendations to improve inclusivity
        </Typography>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ flex: 1, mb: 6 }}>
        {/* Upload/Paste Component - Default to URL tab (index 0) */}
        <UploadCard onAnalyze={analyzeHTML} defaultTab={0} />
        
        {/* Loading State */}
        {loading && (
          <Paper elevation={3} sx={{ width: '100%', mt: 3, borderRadius: 3, p: 4, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 6 }}>
              <CircularProgress />
              <Typography variant="body1" color="text.secondary">
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
        <ResultCard result={result} />
      </Container>
    </Box>
  );
};

export default Home;