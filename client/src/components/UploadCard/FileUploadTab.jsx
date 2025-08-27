import React, { useState } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';
import WCAGOptions from './WCAGOptions';
import { useTheme } from '@mui/material';

// API base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Default WCAG options
const DEFAULT_WCAG_OPTIONS = {
  wcag_version: "wcag21",  // WCAG 2.1
  level: "aa",             // Level AA
  best_practice: true      // Include best practices
};

/**
 * FileUploadTab component for analyzing HTML files
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onAnalyze - Callback function to handle analysis
 * @param {Function} props.setIsLoading - Function to set loading state
 * @param {boolean} props.isLoading - Current loading state
 * @param {Object} props.colors - Color scheme
 * @param {Function} props.onError - Function to handle errors
 * @param {Function} props.clearError - Function to clear errors
 * @returns {JSX.Element} The file upload tab component
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
  
  // Update COLORS to use theme values
  const COLORS = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    background: theme.palette.background.paper,
    border: theme.palette.divider,
    text: theme.palette.text.primary,
    lightText: theme.palette.text.secondary,
    hover: theme.palette.action.hover
  };
  /**
   * Handles file selection from input
   * @param {Event} e - File input change event
   */
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLocalError(null);
      clearError();
    }
  };

  /**
   * Handles file drop event
   * @param {Event} e - Drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setLocalError(null);
      clearError();
    }
  };

  /**
   * Handles drag events
   * @param {Event} e - Drag event
   * @param {boolean} isActive - Whether drag is active
   */
  const handleDrag = (e, isActive) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(isActive);
  };

  /**
   * Clears the selected file
   */
  const clearFile = () => {
    setFile(null);
    setLocalError(null);
    clearError();
  };

  /**
   * Submits file for analysis
   */
  const handleSubmit = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setLocalError(null);
    clearError();
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wcag_options', JSON.stringify(wcagOptions));
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/analyze/file`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze file');
      }
      
      const result = await response.json();
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
        alignItems: 'center',
        gap: 2
      }}
    >
      <Box 
        sx={{ 
          border: '2px dashed',
          borderColor: dragActive ? COLORS.primary : COLORS.border,
          borderRadius: 2,
          p: 4,
          width: '100%',
          textAlign: 'center',
          bgcolor: dragActive ? 'rgba(67, 97, 238, 0.05)' : COLORS.background,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}
        onDragOver={(e) => handleDrag(e, true)}
        onDragEnter={(e) => handleDrag(e, true)}
        onDragLeave={(e) => handleDrag(e, false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".html,.htm"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        <CloudUpload sx={{ fontSize: 60, color: COLORS.primary, mb: 2 }} />
        
        {file ? (
          <>
            <Typography variant="body1" fontWeight="medium" color={COLORS.text}>
              {file.name}
            </Typography>
            <Typography variant="body2" color={COLORS.lightText}>
              {(file.size / 1024).toFixed(2)} KB
            </Typography>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              sx={{ 
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: COLORS.background,
                '&:hover': { bgcolor: COLORS.hover }

              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </>
        ) : (
          <>
            <Typography variant="h6" fontWeight="medium" color={COLORS.text}>
              Drag & Drop HTML File
            </Typography>
            <Typography variant="body2" color={COLORS.lightText} sx={{ mt: 1 }}>
              or click to browse files
            </Typography>
          </>
        )}
      </Box>
      
      <WCAGOptions 
        options={wcagOptions}
        onChange={setWcagOptions}
        colors={COLORS}
      />
      
      {localError && (
        <Typography 
          variant="body2" 
          color="error" 
          sx={{ textAlign: 'center', width: '100%' }}
        >
          {localError}
        </Typography>
      )}
      
      <Button 
        variant="contained" 
        onClick={handleSubmit}
        disabled={!file || isLoading}
        fullWidth
        sx={{ 
          py: 1.5, 
          mt: 2,
          borderRadius: 2,
          bgcolor: COLORS.primary,
          '&:hover': {
            bgcolor: COLORS.secondary,
          }
        }}
      >
        {isLoading ? 'Analyzing...' : 'Analyze Accessibility'}
      </Button>
    </Box>
  );
};

export default FileUploadTab; 