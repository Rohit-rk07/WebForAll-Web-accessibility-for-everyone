// src/components/UploadCard/index.jsx
import React, { useState } from 'react';
import {Box, Paper, Tab, Tabs} from '@mui/material';
import {CloudUpload, Code, ContentPaste} from '@mui/icons-material';

// Import tab components
import URLTab from './URLTab';
import FileUploadTab from './FileUploadTab';
import HTMLCodeTab from './HTMLCodeTab';
import { useTheme } from '@mui/material/styles';

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
 * @param {boolean} [props.isLoading] - Loading state from parent component
 * @param {Function} [props.setIsLoading] - Function to set loading state
 * @param {Function} [props.onError] - Function to handle errors
 * @param {Function} [props.clearError] - Function to clear errors
 * @returns {JSX.Element} The upload card component
 */
const UploadCard = ({ 
  onAnalyze, 
  defaultTab = 0, 
  isLoading = false, 
  setIsLoading = () => {},
  onError = () => {},
  clearError = () => {}
}) => {
  // State management
  const [tabValue, setTabValue] = useState(defaultTab);
  // Get theme inside component to ensure it updates with theme changes
  const theme = useTheme();
  
  // Define colors using current theme
  const COLORS = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    accent: theme.palette.success.main,
    background: theme.palette.background.paper,
    border: theme.palette.divider,
    text: theme.palette.text.primary,
    lightText: theme.palette.text.secondary
  };

  /**
   * Handles tab change
   * @param {Event} event - Tab change event
   * @param {number} newValue - New tab index
   */
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    clearError();
  };

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
        <URLTab 
          onAnalyze={onAnalyze} 
          setIsLoading={setIsLoading} 
          isLoading={isLoading} 
          colors={COLORS} 
          onError={onError}
          clearError={clearError}
        />
      </TabPanel>

      {/* File Upload Tab */}
      <TabPanel value={tabValue} index={1}>
        <FileUploadTab 
          onAnalyze={onAnalyze} 
          setIsLoading={setIsLoading} 
          isLoading={isLoading} 
          colors={COLORS} 
          onError={onError}
          clearError={clearError}
        />
      </TabPanel>

      {/* HTML Code Tab */}
      <TabPanel value={tabValue} index={2}>
        <HTMLCodeTab 
          onAnalyze={onAnalyze} 
          setIsLoading={setIsLoading} 
          isLoading={isLoading} 
          colors={COLORS} 
          onError={onError}
          clearError={clearError}
        />
      </TabPanel>
    </Paper>
  );
};

export default UploadCard;
