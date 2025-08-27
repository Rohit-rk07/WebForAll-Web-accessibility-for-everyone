import React from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  Select, 
  MenuItem, 
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert
} from '@mui/material';
import { HelpOutline, ExpandMore, InfoOutlined } from '@mui/icons-material';

/**
 * Component for selecting WCAG options
 * 
 * @param {Object} props - Component props
 * @param {Object} props.options - Current WCAG options
 * @param {Function} props.onChange - Callback when options change
 * @param {Object} props.colors - Color scheme
 * @returns {JSX.Element} The WCAG options component
 */
const WCAGOptions = ({ options, onChange, colors }) => {
  // Get version display name
  const getVersionDisplayName = (version) => {
    switch (version) {
      case 'wcag2': return 'WCAG 2.0';
      case 'wcag21': return 'WCAG 2.1';
      case 'wcag22': return 'WCAG 2.2 (Latest)';
      default: return 'WCAG 2.0';
    }
  };

  // Handle version change
  const handleVersionChange = (event) => {
    const newVersion = event.target.value;
    
    const newOptions = {
      ...options,
      wcag_version: newVersion
    };
    
    onChange(newOptions);
  };

  // Handle level change
  const handleLevelChange = (event) => {
    const newLevel = event.target.value;
    
    const newOptions = {
      ...options,
      level: newLevel
    };
    
    onChange(newOptions);
  };

  // Handle best practice toggle
  const handleBestPracticeChange = (event) => {
    onChange({
      ...options,
      best_practice: event.target.checked
    });
  };

  return (
    <Box sx={{ mt: 3, mb: 2 }}>
      <Accordion 
        defaultExpanded={false} 
        sx={{ 
          boxShadow: 'none',
          border: '1px solid',
          borderColor: colors.border,
          borderRadius: '8px !important',
          '&:before': {
            display: 'none',
          },
          bgcolor: colors.background
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: colors.primary }} />}
          sx={{ 
            borderRadius: '8px',
            '&.Mui-expanded': {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" fontWeight="medium" color={colors.text}>
              WCAG Compliance Options
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color={colors.lightText} sx={{ mr: 1 }}>
                {getVersionDisplayName(options.wcag_version)} - Level {options.level.toUpperCase()}
              </Typography>
              <Tooltip title="Select which WCAG version and level to check against">
                <IconButton size="small">
                  <HelpOutline fontSize="small" sx={{ color: colors.lightText }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails sx={{ p: 2 }}>
          <Alert 
            severity="info" 
            icon={<InfoOutlined fontSize="inherit" />}
            sx={{ mb: 2, '& .MuiAlert-message': { width: '100%' } }}
          >
            <Typography component="div" variant="body2">
              <strong>Version Selection:</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                <li>WCAG 2.0 - Only checks 2.0 requirements</li>
                <li>WCAG 2.1 - Checks both 2.1 and 2.0 requirements</li>
                <li>WCAG 2.2 - Checks all 2.2, 2.1, and 2.0 requirements</li>
              </ul>
              <strong>Level Selection:</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                <li>Level A - Only checks Level A requirements</li>
                <li>Level AA - Checks both Level A and AA requirements</li>
                <li>Level AAA - Checks all Level A, AA, and AAA requirements</li>
              </ul>
            </Typography>
          </Alert>
          
          {/* WCAG Version Selection */}
          <Typography variant="subtitle2" fontWeight="medium" color={colors.text} gutterBottom>
            Step 1: Select WCAG Version
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Select
              value={options.wcag_version}
              onChange={handleVersionChange}
              size="small"
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.border,
                },
              }}
            >
              <MenuItem value="wcag2">WCAG 2.0 (Base)</MenuItem>
              <MenuItem value="wcag21">WCAG 2.1 (Includes 2.0)</MenuItem>
              <MenuItem value="wcag22">WCAG 2.2 (Latest, Includes 2.0 & 2.1)</MenuItem>
            </Select>
          </FormControl>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Compliance Level Selection */}
          <Typography variant="subtitle2" fontWeight="medium" color={colors.text} gutterBottom>
            Step 2: Select Compliance Level
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Select
              value={options.level}
              onChange={handleLevelChange}
              size="small"
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.border,
                },
              }}
            >
              <MenuItem value="a">Level A (Minimum)</MenuItem>
              <MenuItem value="aa">Level AA (Includes A)</MenuItem>
              <MenuItem value="aaa">Level AAA (Includes A & AA)</MenuItem>
            </Select>
          </FormControl>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Additional Options */}
          <Typography variant="subtitle2" fontWeight="medium" color={colors.text} gutterBottom>
            Step 3: Additional Options
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox 
                checked={options.best_practice} 
                onChange={handleBestPracticeChange}
                sx={{
                  color: colors.primary,
                  '&.Mui-checked': {
                    color: colors.primary,
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" color={colors.text}>
                Include Best Practices
              </Typography>
            }
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default WCAGOptions; 