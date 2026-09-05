import React, { useState } from 'react';
import { Box, Button, TextField, Typography, FormHelperText } from '@mui/material';
import WCAGOptions from './WCAGOptions';
import { useNavigate } from 'react-router-dom';
import { apiJson } from '../../services/apiClient';

// Default WCAG options
const DEFAULT_WCAG_OPTIONS = {
  wcag_version: "wcag21",
  level: "aa",
  best_practice: true
};

/**
 * HTMLCodeTab component for analyzing HTML code directly
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

  /**
   * Submits HTML content for analysis
   */
  const handleSubmit = async () => {
    if (!htmlContent.trim()) return;

    setIsLoading(true);
    setLocalError(null);
    clearError();

    try {
      const result = await apiJson('/analyze/html', {
        method: 'POST',
        body: JSON.stringify({
          content: htmlContent,
          wcag_options: wcagOptions
        })
      });

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
        name: 'HTML Analysis',
        url: '',
        score: result?.score || (result?.results && result?.results?.score) || 0,
        issues: result?.issues || (result?.results && result?.results?.issues) || { errors: 0, warnings: 0, notices: 0 },
      };
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
        gap: 1.5,
        py: 1,
        px: { xs: 1.5, sm: 2.5 },
      }}
    >
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
          HTML source
        </Typography>
        <Typography variant="caption" color={colors.lightText}>
          Analyze a full page or a snippet of HTML.
        </Typography>
      </Box>

      <TextField
        multiline
        rows={10}
        placeholder={"<html>\n  <body>\n    <header>…</header>\n  </body>\n</html>"}
        value={htmlContent}
        onChange={(e) => {
          setHtmlContent(e.target.value);
          setLocalError(null);
          clearError();
        }}
        fullWidth
        variant="outlined"
        inputProps={{ 'aria-label': 'HTML source code', spellCheck: 'false' }}
        InputProps={{
          sx: { fontFamily: "Consolas, Monaco, 'Courier New', monospace", fontSize: '0.85rem' }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: colors.border },
            '&:hover fieldset': { borderColor: colors.border },
            '&.Mui-focused fieldset': { borderColor: colors.primary },
          }
        }}
      />

      {localError && (
        <FormHelperText error>
          {localError}
        </FormHelperText>
      )}

      <WCAGOptions
        options={wcagOptions}
        onChange={setWcagOptions}
        colors={colors}
      />

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!htmlContent.trim() || isLoading}
        fullWidth
        sx={{ py: 1.5, mt: 1 }}
      >
        {isLoading ? 'Analyzing…' : 'Analyze Accessibility'}
      </Button>
    </Box>
  );
};

export default HTMLCodeTab;