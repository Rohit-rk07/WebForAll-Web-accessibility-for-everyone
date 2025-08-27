import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Tooltip } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import WCAGOptions from './WCAGOptions';
import { useNavigate } from 'react-router-dom';

// API base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Default WCAG options
const DEFAULT_WCAG_OPTIONS = {
  wcag_version: "wcag21",  // WCAG 2.1
  level: "aa",             // Level AA
  best_practice: true      // Include best practices
};

/**
 * HTMLCodeTab component for analyzing HTML code directly
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onAnalyze - Callback function to handle analysis
 * @param {Function} props.setIsLoading - Function to set loading state
 * @param {boolean} props.isLoading - Current loading state
 * @param {Object} props.colors - Color scheme
 * @param {Function} props.onError - Function to handle errors
 * @param {Function} props.clearError - Function to clear errors
 * @returns {JSX.Element} The HTML code tab component
 */
const HTMLCodeTab = ({ 
  onAnalyze, 
  setIsLoading, 
  isLoading, 
  colors, 
  onError = () => {}, 
  clearError = () => {} 
}) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [localError, setLocalError] = useState(null);
  const [wcagOptions, setWcagOptions] = useState(DEFAULT_WCAG_OPTIONS);
  const navigate = useNavigate();

  const saveToHistory = (report) => {
    const history = JSON.parse(localStorage.getItem('historyReports') || '[]');
    const filtered = history.filter(r => r.id !== report.id);
    localStorage.setItem('historyReports', JSON.stringify([
      { ...report, date: new Date().toISOString() },
      ...filtered
    ]));
  };

  /**
   * Submits HTML content for analysis
   */
  const handleSubmit = async () => {
    if (!htmlContent) return;
    
    setIsLoading(true);
    setLocalError(null);
    clearError();
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/analyze/html`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          content: htmlContent,
          wcag_options: wcagOptions
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze HTML');
      }
      
      const result = await response.json();

      // If the server persisted analysis and returned an id, navigate to results page
      if (result && result.id) {
        navigate(`/dashboard/results/${result.id}`);
        return;
      }

      // Fallback: format locally and pass up
      const formattedResult = {
        ...result,
        results: result?.results || {},
        mode: result?.mode || 'dynamic',
        id: Date.now() + Math.random(),
        name: 'HTML Analysis',
        url: '',
        score: result?.score || (result?.results && result?.results?.score) || 0,
        issues: result?.issues || (result?.results && result?.results?.issues) || { errors: 0, warnings: 0, notices: 0 },
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
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight="medium" color={colors.text}>
          Paste HTML Code
        </Typography>
        <Tooltip title="Paste HTML code directly for accessibility analysis">
          <HelpOutline fontSize="small" sx={{ color: colors.lightText }} />
        </Tooltip>
      </Box>
      
      <TextField
        multiline
        rows={10}
        placeholder="<html>\n  <body>\n    <h1>Your HTML here</h1>\n  </body>\n</html>"
        value={htmlContent}
        onChange={(e) => {
          setHtmlContent(e.target.value);
          setLocalError(null);
          clearError();
        }}
        fullWidth
        variant="outlined"
        InputProps={{
          sx: { fontFamily: 'monospace' }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: colors.border,
            },
            '&:hover fieldset': {
              borderColor: colors.primary,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary,
            },
          }
        }}
      />
      
      <WCAGOptions 
        options={wcagOptions}
        onChange={setWcagOptions}
        colors={colors}
      />
      
      {localError && (
        <Typography 
          variant="body2" 
          color="error" 
          sx={{ textAlign: 'center' }}
        >
          {localError}
        </Typography>
      )}
      
      <Button 
        variant="contained" 
        onClick={handleSubmit}
        disabled={!htmlContent || isLoading}
        fullWidth
        sx={{ 
          py: 1.5, 
          mt: 2,
          borderRadius: 2,
          bgcolor: colors.primary,
          '&:hover': {
            bgcolor: colors.secondary,
          }
        }}
      >
        {isLoading ? 'Analyzing...' : 'Analyze Accessibility'}
      </Button>
    </Box>
  );
};

export default HTMLCodeTab; 