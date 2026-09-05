import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiJson } from '../../services/apiClient';
import { Box, Button, TextField, Typography, FormHelperText } from '@mui/material';
import { Search } from '@mui/icons-material';
import WCAGOptions from './WCAGOptions';

// Default WCAG options
const DEFAULT_WCAG_OPTIONS = {
  wcag_version: "wcag21",  // WCAG 2.1
  level: "aa",             // Level AA
  best_practice: true      // Include best practices
};

// Frontend URL validation that mirrors the analyzer's expectations.
const isValidHttpUrl = (raw) => {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * URLTab component for analyzing URLs
 */
const URLTab = ({ onAnalyze, setIsLoading, isLoading, colors, onError = () => {}, clearError = () => {} }) => {
  const [url, setUrl] = useState('');
  const [localError, setLocalError] = useState(null);
  const [wcagOptions, setWcagOptions] = useState(DEFAULT_WCAG_OPTIONS);
  const navigate = useNavigate();

  /**
   * Submits URL for analysis
   */
  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!isValidHttpUrl(trimmed)) {
      setLocalError("Enter a valid URL that starts with http:// or https://");
      return;
    }

    setIsLoading(true);
    setLocalError(null);
    clearError();

    try {
      const result = await apiJson('/analyze/url', {
        method: 'POST',
        body: JSON.stringify({
          url: trimmed,
          wcag_options: wcagOptions
        })
      });

      const formattedResult = {
        ...result,
        results: result.results || {},
        mode: result.mode || 'static_only',
        url: trimmed,
        name: result.name || trimmed,
        score: result.score || (result.results && result.results.score) || 0,
        issues: result.issues || (result.results && result.results.issues) || { errors: 0, warnings: 0, notices: 0 },
      };
      if (result && result.id) {
        navigate(`/dashboard/results/${result.id}`);
      } else {
        onAnalyze(formattedResult);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setLocalError(err.message);
      onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ py: 2, px: { xs: 1.5, sm: 2.5 } }}>
      <Typography variant="subtitle2" component="label" htmlFor="url-input" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
        Website URL
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1.5,
          alignItems: { xs: 'stretch', md: 'flex-start' },
          width: '100%',
          mt: 1,
          mb: 0.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid',
            borderColor: localError ? 'error.main' : colors.border,
            borderRadius: 1,
            px: 1.5,
            height: 46,
            width: '100%',
            bgcolor: colors.background,
            flexGrow: 1,
            transition: 'box-shadow 150ms ease, border-color 150ms ease',
            '&:focus-within': {
              borderColor: colors.primary,
              boxShadow: `0 0 0 2px ${colors.primary}1f`,
            },
          }}
        >
          <Search sx={{ mr: 1, color: colors.lightText, fontSize: 20 }} aria-hidden="true" />
          <TextField
            id="url-input"
            placeholder="https://example.com"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setLocalError(null);
              clearError();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            fullWidth
            variant="standard"
            InputProps={{ disableUnderline: true }}
            inputProps={{ 'aria-label': 'Website URL' }}
          />
        </Box>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!url.trim() || isLoading}
          sx={{
            minHeight: 46,
            minWidth: { xs: '100%', md: 180 },
            whiteSpace: 'nowrap',
            px: 3,
          }}
        >
          {isLoading ? 'Scanning…' : 'Scan website'}
        </Button>
      </Box>

      {localError ? (
        <FormHelperText error id="url-error">
          {localError}
        </FormHelperText>
      ) : (
        <FormHelperText sx={{ ml: 0 }}>
          Enter the full address of the public page you want to check.
        </FormHelperText>
      )}

      <WCAGOptions
        options={wcagOptions}
        onChange={setWcagOptions}
        colors={colors}
      />

      <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="caption" color={colors.lightText}>
          Compliance targets:
        </Typography>
        {['WCAG', 'ADA', 'EAA', 'Section 508', 'AODA'].map((standard) => (
          <Typography key={standard} variant="caption" color={colors.lightText}>
            {standard}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export default URLTab;