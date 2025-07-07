import React, { useState } from 'react';
import {Box, Button, Paper, TextField, Typography, Tab, Tabs, IconButton, Tooltip, Container} from '@mui/material';
import {CloudUpload, Code, ContentPaste, Delete, HelpOutline, Search} from '@mui/icons-material';

// Color scheme to match dashboard
const COLORS = {
  primary: '#4361ee',
  secondary: '#3a0ca3',
  accent: '#2e7d32',
  background: '#ffffff',
  border: '#e0e0e0',
  text: '#333333',
  lightText: '#666666'
};

/**
 * Custom TabPanel component for the upload/paste tabs
 * @param {Object} props - Component props
 * @returns {JSX.Element|null} The tab panel component
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`upload-tabpanel-${index}`}
      aria-labelledby={`upload-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * UploadCard component
 * Provides multiple ways for users to input HTML for accessibility analysis:
 * - URL input
 * - File upload
 * - Direct HTML code input
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onAnalyze - Callback function to handle HTML analysis
 * @param {number} [props.defaultTab=0] - Default tab index to show (0: URL, 1: Upload, 2: HTML)
 * @returns {JSX.Element} The upload card component
 */
const UploadCard = ({ onAnalyze, defaultTab = 0 }) => {
  // State management
  const [tabValue, setTabValue] = useState(defaultTab);
  const [htmlContent, setHtmlContent] = useState('');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handles tab change
   * @param {Event} event - Tab change event
   * @param {number} newValue - New tab index
   */
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Clear any previous errors when changing tabs
    setError(null);
  };

  /**
   * Handles file selection from input
   * @param {Event} e - File input change event
   */
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
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
      setError(null);
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
  };

  /**
   * Submits content for analysis based on active tab
   */
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (tabValue === 0 && url) {
        // URL tab
        const response = await fetch('http://localhost:8000/analyze/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to analyze URL');
        }
        
        result = await response.json();
      } 
      else if (tabValue === 1 && file) {
        // File upload tab
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('http://localhost:8000/analyze/file', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to analyze file');
        }
        
        result = await response.json();
      } 
      else if (tabValue === 2 && htmlContent) {
        // Direct HTML input tab
        const response = await fetch('http://localhost:8000/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: htmlContent }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to analyze HTML');
        }
        
        result = await response.json();
      }
      
      if (result) {
        onAnalyze(result);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if the submit button should be disabled
  const isSubmitDisabled = 
    (tabValue === 0 && !url) || 
    (tabValue === 1 && !file) || 
    (tabValue === 2 && !htmlContent) ||
    isLoading;

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        width: '100%', 
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: COLORS.background,
        maxWidth: '800px',
        mx: 'auto',
        border: `1px solid ${COLORS.border}`
      }}
    >
      {/* Tabs Navigation */}
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        variant="fullWidth"
        sx={{ 
          borderBottom: 1, 
          borderColor: COLORS.border,
          '& .MuiTabs-indicator': {
            backgroundColor: COLORS.primary,
            height: 3
          }
        }}
      >
        <Tab 
          icon={<ContentPaste />} 
          label="URL" 
          sx={{ 
            color: tabValue === 0 ? COLORS.primary : COLORS.lightText,
            '&.Mui-selected': { color: COLORS.primary }
          }}
        />
        <Tab 
          icon={<CloudUpload />} 
          label="Upload File" 
          sx={{ 
            color: tabValue === 1 ? COLORS.primary : COLORS.lightText,
            '&.Mui-selected': { color: COLORS.primary }
          }}
        />
        <Tab 
          icon={<Code />} 
          label="HTML Code" 
          sx={{ 
            color: tabValue === 2 ? COLORS.primary : COLORS.lightText,
            '&.Mui-selected': { color: COLORS.primary }
          }}
        />
      </Tabs>

      {/* URL Tab */}
      <TabPanel value={tabValue} index={0}>
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
                borderColor: COLORS.border,
                borderRadius: 2,
                px: 2,
                height: 50,
                width: '100%',
                bgcolor: COLORS.background
              }}
            >
              <Search color="action" sx={{ mr: 1, color: COLORS.lightText }} />
              <TextField
                placeholder="Type Website's URL"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
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
              disabled={isSubmitDisabled}
              sx={{ 
                py: 1.2,
                px: { xs: 3, md: 4 },
                borderRadius: 2,
                whiteSpace: 'nowrap',
                minWidth: { xs: '100%', md: 'auto' },
                bgcolor: COLORS.primary,
                '&:hover': {
                  bgcolor: COLORS.secondary,
                }
              }}
            >
              {isLoading ? 'Scanning...' : 'Scan website'}
            </Button>
          </Box>
          
          {error && (
            <Typography 
              variant="body2" 
              color="error" 
              sx={{ mt: 2, textAlign: 'center' }}
            >
              {error}
            </Typography>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="body2" color={COLORS.lightText} sx={{ fontSize: '0.8rem' }}>
              Checks for Compliances:
            </Typography>
            {['WCAG', 'ADA', 'EAA', 'Section 508', 'AODA'].map((standard) => (
              <Box 
                key={standard} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  color: COLORS.lightText,
                  fontSize: '0.8rem'
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    width: 14, 
                    height: 14, 
                    borderRadius: '50%', 
                    bgcolor: COLORS.primary,
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
      </TabPanel>

      {/* File Upload Tab */}
      <TabPanel value={tabValue} index={1}>
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
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
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
          
          {error && (
            <Typography 
              variant="body2" 
              color="error" 
              sx={{ textAlign: 'center', width: '100%' }}
            >
              {error}
            </Typography>
          )}
          
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
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
      </TabPanel>

      {/* HTML Code Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="medium" color={COLORS.text}>
              Paste HTML Code
            </Typography>
            <Tooltip title="Paste HTML code directly for accessibility analysis">
              <HelpOutline fontSize="small" sx={{ color: COLORS.lightText }} />
            </Tooltip>
          </Box>
          
          <TextField
            multiline
            rows={10}
            placeholder="<html>\n  <body>\n    <h1>Your HTML here</h1>\n  </body>\n</html>"
            value={htmlContent}
            onChange={(e) => {
              setHtmlContent(e.target.value);
              setError(null);
            }}
            fullWidth
            variant="outlined"
            InputProps={{
              sx: { fontFamily: 'monospace' }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: COLORS.border,
                },
                '&:hover fieldset': {
                  borderColor: COLORS.primary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: COLORS.primary,
                },
              }
            }}
          />
          
          {error && (
            <Typography 
              variant="body2" 
              color="error" 
              sx={{ textAlign: 'center' }}
            >
              {error}
            </Typography>
          )}
          
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
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
      </TabPanel>
    </Paper>
  );
};

export default UploadCard;
