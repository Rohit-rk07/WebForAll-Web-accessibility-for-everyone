import React, { useState } from 'react';
import { Box, Button, Typography, IconButton, FormHelperText } from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';
import WCAGOptions from './WCAGOptions';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiForm } from '../../services/apiClient';

// Default WCAG options
const DEFAULT_WCAG_OPTIONS = {
  wcag_version: "wcag21",
  level: "aa",
  best_practice: true
};

const ACCEPTED_EXTENSIONS = ['.html', '.htm'];

const hasAcceptedExtension = (name = '') =>
  ACCEPTED_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));

/**
 * FileUploadTab component for analyzing HTML files
 */
const FileUploadTab = ({
  onAnalyze,
  setIsLoading,
  isLoading,
  onError = () => {},
  clearError = () => {}
}) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [wcagOptions, setWcagOptions] = useState(DEFAULT_WCAG_OPTIONS);

  const theme = useTheme();
  const navigate = useNavigate();

  const COLORS = {
    primary: theme.palette.primary.main,
    background: theme.palette.background.paper,
    border: theme.palette.divider,
    text: theme.palette.text.primary,
    lightText: theme.palette.text.secondary,
    hover: theme.palette.action.hover
  };

  const chooseFile = (candidate) => {
    if (!candidate) return;
    if (!hasAcceptedExtension(candidate.name)) {
      setLocalError('Only .html and .htm files are supported.');
      setFile(null);
      clearError();
      return;
    }
    setFile(candidate);
    setLocalError(null);
    clearError();
  };

  const openFilePicker = () => {
    document.getElementById('file-input')?.click();
  };

  /**
   * Handles file selection from input
   */
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      chooseFile(e.target.files[0]);
    }
  };

  /**
   * Handles file drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      chooseFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e, isActive) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(isActive);
  };

  const clearFile = () => {
    setFile(null);
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async () => {
    if (!file) return;

    setIsLoading(true);
    setLocalError(null);
    clearError();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wcag_options', JSON.stringify(wcagOptions));

      const result = await apiForm('/analyze/file', formData, { timeoutMs: 110000 });

      if (result && result.id) {
        navigate(`/dashboard/results/${result.id}`);
        return;
      }
      onAnalyze(result);
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
      <Box
        role="button"
        tabIndex={0}
        aria-label={file ? `Selected file: ${file.name}. Choose a different file.` : 'Choose an HTML file to upload'}
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
          }
        }}
        onDragOver={(e) => handleDrag(e, true)}
        onDragEnter={(e) => handleDrag(e, true)}
        onDragLeave={(e) => handleDrag(e, false)}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? COLORS.primary : COLORS.border,
          borderRadius: 1,
          p: 4,
          width: '100%',
          textAlign: 'center',
          bgcolor: dragActive ? 'action.selected' : COLORS.background,
          cursor: 'pointer',
          transition: 'border-color 150ms ease, background-color 150ms ease',
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <input
          id="file-input"
          type="file"
          accept=".html,.htm"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <CloudUpload sx={{ fontSize: 44, color: COLORS.lightText, mb: 1.5 }} aria-hidden="true" />

        {file ? (
          <>
            <Typography variant="body1" fontWeight={600} color={COLORS.text}>
              {file.name}
            </Typography>
            <Typography variant="body2" color={COLORS.lightText}>
              {(file.size / 1024).toFixed(2)} KB · click to replace
            </Typography>
            <IconButton
              size="small"
              aria-label="Remove selected file"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                '&:hover': { bgcolor: COLORS.hover },
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </>
        ) : (
          <>
            <Typography variant="h4" fontWeight={600} color={COLORS.text}>
              Drop an HTML file
            </Typography>
            <Typography variant="body2" color={COLORS.lightText} sx={{ mt: 0.5 }}>
              or click to browse — .html, .htm up to 2 MB
            </Typography>
          </>
        )}
      </Box>

      {localError && (
        <FormHelperText error id="file-error">
          {localError}
        </FormHelperText>
      )}

      <WCAGOptions
        options={wcagOptions}
        onChange={setWcagOptions}
        colors={COLORS}
      />

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!file || isLoading}
        fullWidth
        sx={{ py: 1.5, mt: 1 }}
      >
        {isLoading ? 'Analyzing…' : 'Analyze Accessibility'}
      </Button>
    </Box>
  );
};

export default FileUploadTab;