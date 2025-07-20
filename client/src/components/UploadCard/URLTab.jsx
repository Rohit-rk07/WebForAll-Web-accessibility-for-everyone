import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { Search } from '@mui/icons-material';
import WCAGOptions from './WCAGOptions';

// API base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Default WCAG options
const DEFAULT_WCAG_OPTIONS = {
  wcag_version: "wcag21",  // WCAG 2.1
  level: "aa",             // Level AA
  best_practice: true      // Include best practices
};

const saveToHistory = (report) => {
  const history = JSON.parse(localStorage.getItem('historyReports') || '[]');
  // Remove any existing entry for the same URL
  const filtered = history.filter(r => r.url !== report.url);
  localStorage.setItem('historyReports', JSON.stringify([
    { ...report, date: new Date().toISOString() },
    ...filtered
  ]));
};

/**
 * URLTab component for analyzing URLs
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onAnalyze - Callback function to handle analysis
 * @param {Function} props.setIsLoading - Function to set loading state
 * @param {boolean} props.isLoading - Current loading state
 * @param {Object} props.colors - Color scheme
 * @param {Function} props.onError - Function to handle errors
 * @param {Function} props.clearError - Function to clear errors
 * @returns {JSX.Element} The URL tab component
 */
const URLTab = ({ onAnalyze, setIsLoading, isLoading, colors, onError = () => {}, clearError = () => {} }) => {
  const [url, setUrl] = useState('');
  const [localError, setLocalError] = useState(null);
  const [wcagOptions, setWcagOptions] = useState(DEFAULT_WCAG_OPTIONS);

  /**
   * Submits URL for analysis
   */
  const handleSubmit = async () => {
    if (!url) return;
    
    setIsLoading(true);
    setLocalError(null);
    clearError();
    
    try {
      const response = await fetch(`${API_BASE_URL}/analyze/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url,
          wcag_options: wcagOptions
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze URL');
      }
      
      const result = await response.json();
      
      // Format the result to ensure it has the expected structure
      const formattedResult = {
        ...result,
        results: result.results || {},
        mode: result.mode || 'static_only',
        url,
        name: result.name || url,
        score: result.score || (result.results && result.results.score) || 0,
        issues: result.issues || (result.results && result.results.issues) || { errors: 0, warnings: 0, notices: 0 },
      };
      saveToHistory(formattedResult);
      onAnalyze(formattedResult);
    } catch (err) {
      console.error('Analysis error:', err);
      setLocalError(err.message);
      onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ py: 3, px: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 2,
        alignItems: 'center',
        width: '100%',
        mt: 1,
        mb: 1
      }}>
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            border: '1px solid',
            borderColor: colors.border,
            borderRadius: 2,
            px: 2,
            height: 50,
            width: '100%',
            bgcolor: colors.background
          }}
        >
          <Search color="action" sx={{ mr: 1, color: colors.lightText }} />
          <TextField
            placeholder="Type Website's URL"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setLocalError(null);
              clearError();
            }}
            fullWidth
            variant="standard"
            InputProps={{
              disableUnderline: true,
            }}
          />
        </Box>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={!url || isLoading}
          sx={{ 
            py: 1.2,
            px: { xs: 3, md: 4 },
            borderRadius: 2,
            whiteSpace: 'nowrap',
            minWidth: { xs: '100%', md: 'auto' },
            bgcolor: colors.primary,
            '&:hover': {
              bgcolor: colors.secondary,
            }
          }}
        >
          {isLoading ? 'Scanning...' : 'Scan website'}
        </Button>
      </Box>
      
      {localError && (
        <Typography 
          variant="body2" 
          color="error" 
          sx={{ mt: 2, textAlign: 'center' }}
        >
          {localError}
        </Typography>
      )}
      
      <WCAGOptions 
        options={wcagOptions}
        onChange={setWcagOptions}
        colors={colors}
      />
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="body2" color={colors.lightText} sx={{ fontSize: '0.8rem' }}>
          Checks for Compliances:
        </Typography>
        {['WCAG', 'ADA', 'EAA', 'Section 508', 'AODA'].map((standard) => (
          <Box 
            key={standard} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              color: colors.lightText,
              fontSize: '0.8rem'
            }}
          >
            <Box 
              component="span" 
              sx={{ 
                width: 14, 
                height: 14, 
                borderRadius: '50%', 
                bgcolor: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.6rem',
                fontWeight: 'bold'
              }}
            >
              ✓
            </Box>
            {standard}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default URLTab; 