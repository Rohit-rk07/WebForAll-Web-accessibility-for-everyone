import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Divider, 
  Chip, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  ExpandMore, 
  ErrorOutline, 
  WarningAmber, 
  CheckCircleOutline, 
  InfoOutlined,
  AccessibilityNew
} from '@mui/icons-material';

// Color scheme to match dashboard
const COLORS = {
  background: '#ffffff',
  border: '#e0e0e0',
  text: '#333333',
  lightText: '#666666',
  primary: '#4361ee',
  secondary: '#3a0ca3',
  codeBackground: '#f5f7fa'
};

/**
 * Severity level to icon/color mapping
 */
const severityMap = {
  error: { icon: <ErrorOutline sx={{ color: '#d32f2f' }} />, color: 'error' },
  warning: { icon: <WarningAmber sx={{ color: '#ed6c02' }} />, color: 'warning' },
  info: { icon: <InfoOutlined sx={{ color: COLORS.primary }} />, color: 'info' },
  success: { icon: <CheckCircleOutline sx={{ color: '#2e7d32' }} />, color: 'success' }
};

/**
 * ResultCard component
 * Displays accessibility analysis results in an organized, expandable format
 * 
 * @param {Object} props - Component props
 * @param {Object|null} props.result - Analysis result data
 * @returns {JSX.Element|null} The result card component or null if no results
 */
const ResultCard = ({ result }) => {
  // If no results, don't render anything
  if (!result) return null;

  /**
   * Gets the appropriate icon and color based on issue severity
   * @param {string} severity - The severity level
   * @returns {Object} Object containing icon and color
   */
  const getSeverityProps = (severity) => {
    return severityMap[severity.toLowerCase()] || severityMap.info;
  };

  /**
   * Formats the summary statistics for display
   * @returns {JSX.Element} Summary statistics component
   */
  const renderSummary = () => {
    const { errors = 0, warnings = 0, notices = 0, passed = 0 } = result.summary || {};
    
    return (
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Chip 
          icon={<ErrorOutline />} 
          label={`${errors} Errors`} 
          color="error" 
          variant={errors > 0 ? "filled" : "outlined"} 
        />
        <Chip 
          icon={<WarningAmber />} 
          label={`${warnings} Warnings`} 
          color="warning" 
          variant={warnings > 0 ? "filled" : "outlined"} 
        />
        <Chip 
          icon={<InfoOutlined />} 
          label={`${notices} Notices`} 
          color="info" 
          variant={notices > 0 ? "filled" : "outlined"} 
          sx={{ 
            '&.MuiChip-filledInfo': { 
              bgcolor: COLORS.primary 
            }
          }}
        />
        <Chip 
          icon={<CheckCircleOutline />} 
          label={`${passed} Passed`} 
          color="success" 
          variant={passed > 0 ? "filled" : "outlined"} 
        />
      </Box>
    );
  };

  /**
   * Renders individual issues grouped by category
   * @returns {JSX.Element} Issues component
   */
  const renderIssues = () => {
    const { issues = [] } = result;
    
    // Group issues by category
    const groupedIssues = issues.reduce((acc, issue) => {
      const category = issue.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(issue);
      return acc;
    }, {});
    
    return (
      <Box sx={{ mt: 3 }}>
        {Object.entries(groupedIssues).map(([category, categoryIssues]) => (
          <Accordion 
            key={category} 
            sx={{ 
              mb: 2,
              border: `1px solid ${COLORS.border}`,
              '&:before': {
                display: 'none',
              },
              borderRadius: '8px !important',
              overflow: 'hidden',
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMore sx={{ color: COLORS.text }} />}
              sx={{
                bgcolor: COLORS.background,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.01)',
                }
              }}
            >
              <Typography variant="subtitle1" fontWeight="medium" color={COLORS.text}>
                {category} ({categoryIssues.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2 }}>
              <List disablePadding>
                {categoryIssues.map((issue, index) => {
                  const { icon, color } = getSeverityProps(issue.severity || 'info');
                  
                  return (
                    <React.Fragment key={index}>
                      {index > 0 && <Divider component="li" sx={{ borderColor: COLORS.border }} />}
                      <ListItem alignItems="flex-start">
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight="medium" color={COLORS.text}>
                              {issue.title || 'Issue'}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" component="div" sx={{ mb: 1, color: COLORS.lightText }}>
                                {issue.description || 'No description provided'}
                              </Typography>
                              
                              {issue.element && (
                                <Box 
                                  sx={{ 
                                    bgcolor: COLORS.codeBackground, 
                                    p: 1.5, 
                                    borderRadius: 1,
                                    overflowX: 'auto',
                                    my: 1,
                                    border: `1px solid ${COLORS.border}`
                                  }}
                                >
                                  <Typography 
                                    variant="body2" 
                                    component="pre" 
                                    sx={{ 
                                      fontFamily: 'monospace', 
                                      m: 0,
                                      fontSize: '0.85rem',
                                      color: COLORS.text
                                    }}
                                  >
                                    {issue.element}
                                  </Typography>
                                </Box>
                              )}
                              
                              {issue.recommendation && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" fontWeight="medium" color={COLORS.text}>
                                    Recommendation:
                                  </Typography>
                                  <Typography variant="body2" color={COLORS.lightText}>
                                    {issue.recommendation}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        width: '100%', 
        mt: 3, 
        borderRadius: 2, 
        p: 4,
        bgcolor: COLORS.background,
        border: `1px solid ${COLORS.border}`
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AccessibilityNew sx={{ color: COLORS.primary }} fontSize="large" />
        <Typography variant="h5" fontWeight="bold" color={COLORS.text}>
          Accessibility Analysis Results
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3, borderColor: COLORS.border }} />
      
      {/* Summary */}
      <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }} color={COLORS.text}>
        Summary
      </Typography>
      {renderSummary()}
      
      {/* Issues */}
      <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }} color={COLORS.text}>
        Issues
      </Typography>
      {renderIssues()}
    </Paper>
  );
};

export default ResultCard; 