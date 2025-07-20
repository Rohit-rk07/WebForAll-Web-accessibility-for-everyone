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
  ListItemIcon,
  useTheme
} from '@mui/material';
import { 
  ExpandMore, 
  ErrorOutline, 
  WarningAmber, 
  CheckCircleOutline, 
  InfoOutlined,
  AccessibilityNew
} from '@mui/icons-material';

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
  
  // Get theme for color values
  const theme = useTheme();
  
  // Theme-based colors
  const COLORS = {
    background: theme.palette.background.paper,
    border: theme.palette.divider,
    text: theme.palette.text.primary,
    lightText: theme.palette.text.secondary,
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    codeBackground: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.palette.grey[50]
  };
  
  // Debug output to console
  console.log('Analysis result:', result);

  // Extract violations from results (handle different API response structures)
  let violations = [];
  if (result.results && result.results.violations) {
    violations = result.results.violations;
  } else if (result.violations) {
    violations = result.violations;
  }
  
  // Ensure violations is always an array
  if (!Array.isArray(violations)) {
    violations = [];
  }
  
  const mode = result.mode || 'unknown';

  /**
   * Severity level to icon/color mapping using theme colors
   */
  const severityMap = {
    error: { icon: <ErrorOutline sx={{ color: theme.palette.error.main }} />, color: 'error' },
    warning: { icon: <WarningAmber sx={{ color: theme.palette.warning.main }} />, color: 'warning' },
    info: { icon: <InfoOutlined sx={{ color: theme.palette.info.main }} />, color: 'info' },
    notice: { icon: <InfoOutlined sx={{ color: theme.palette.info.main }} />, color: 'info' },
    success: { icon: <CheckCircleOutline sx={{ color: theme.palette.success.main }} />, color: 'success' },
    critical: { icon: <ErrorOutline sx={{ color: theme.palette.error.main }} />, color: 'error' },
    serious: { icon: <WarningAmber sx={{ color: theme.palette.warning.main }} />, color: 'warning' },
    moderate: { icon: <InfoOutlined sx={{ color: theme.palette.info.main }} />, color: 'info' },
    minor: { icon: <InfoOutlined sx={{ color: theme.palette.info.main }} />, color: 'info' }
  };

  /**
   * Gets the appropriate icon and color based on issue severity or impact
   * @param {string} severity - The severity level
   * @param {string} impact - The impact level (fallback)
   * @returns {Object} Object containing icon and color
   */
  const getSeverityProps = (severity, impact) => {
    return severityMap[severity?.toLowerCase()] || 
           severityMap[impact?.toLowerCase()] || 
           severityMap.info;
  };

  /**
   * Formats the summary statistics for display
   * @returns {JSX.Element} Summary statistics component
   */
  const renderSummary = () => {
    // Count issues by severity/impact
    const summary = violations.reduce((acc, issue) => {
      const severity = issue.severity || issue.impact || 'info';
      const severityKey = severity.toLowerCase();
      
      if (severityKey.includes('error') || severityKey.includes('critical')) {
        acc.errors += 1;
      } else if (severityKey.includes('warn') || severityKey.includes('serious')) {
        acc.warnings += 1;
      } else {
        acc.notices += 1;
      }
      return acc;
    }, { errors: 0, warnings: 0, notices: 0 });
    
    return (
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Chip 
          icon={<ErrorOutline />} 
          label={`${summary.errors} Errors`} 
          color="error" 
          variant={summary.errors > 0 ? "filled" : "outlined"} 
        />
        <Chip 
          icon={<WarningAmber />} 
          label={`${summary.warnings} Warnings`} 
          color="warning" 
          variant={summary.warnings > 0 ? "filled" : "outlined"} 
        />
        <Chip 
          icon={<InfoOutlined />} 
          label={`${summary.notices} Notices`} 
          color="info" 
          variant={summary.notices > 0 ? "filled" : "outlined"} 
        />
        <Chip 
          icon={<AccessibilityNew />} 
          label={`Analysis Mode: ${mode}`} 
          color="default" 
          variant="outlined" 
        />
      </Box>
    );
  };

  /**
   * Renders individual issues grouped by category
   * @returns {JSX.Element} Issues component
   */
  const renderIssues = () => {
    if (violations.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color={COLORS.lightText}>
            No issues found.
          </Typography>
        </Box>
      );
    }
    
    // Group issues by category/id
    const groupedIssues = violations.reduce((acc, issue) => {
      const category = issue.category || issue.id || issue.type || 'Other';
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
                  const { icon, color } = getSeverityProps(issue.severity, issue.impact);
                  const nodes = issue.nodes || [];
                  
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
                              {issue.title || issue.help || issue.description || 'Accessibility Issue'}
                            </Typography>
                          }
                          secondary={
                            <Typography component="div" variant="body2">
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" component="div" sx={{ mb: 1, color: COLORS.lightText }}>
                                  {issue.description || issue.help || 'No description provided'}
                                </Typography>
                                
                                {/* Show nodes if available */}
                                {nodes.length > 0 && nodes.map((node, nodeIndex) => (
                                  <Box key={nodeIndex} sx={{ mb: 2 }}>
                                    {node.html && (
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
                                          component="code" 
                                          sx={{ 
                                            fontFamily: 'monospace', 
                                            m: 0,
                                            fontSize: '0.85rem',
                                            color: COLORS.text,
                                            display: 'block'
                                          }}
                                        >
                                          {node.html}
                                        </Typography>
                                      </Box>
                                    )}
                                    
                                    {node.failureSummary && (
                                      <Typography variant="body2" color={COLORS.lightText}>
                                        {node.failureSummary}
                                      </Typography>
                                    )}
                                  </Box>
                                ))}
                                
                                {/* Show element if available */}
                                {issue.element && !nodes.length && (
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
                                      component="code" 
                                      sx={{ 
                                        fontFamily: 'monospace', 
                                        m: 0,
                                        fontSize: '0.85rem',
                                        color: COLORS.text,
                                        display: 'block'
                                      }}
                                    >
                                      {issue.element}
                                    </Typography>
                                  </Box>
                                )}
                                
                                {/* Show recommendation if available */}
                                {(issue.recommendation || issue.fix_suggestion || issue.help) && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" component="div" fontWeight="medium" color={COLORS.text}>
                                      Recommendation:
                                    </Typography>
                                    <Typography variant="body2" component="div" color={COLORS.lightText}>
                                      {issue.recommendation || issue.fix_suggestion || issue.help}
                                    </Typography>
                                  </Box>
                                )}
                                
                                {/* Show WCAG criteria if available */}
                                {issue.wcag_criteria && issue.wcag_criteria.length > 0 && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" component="div" fontWeight="medium" color={COLORS.text}>
                                      WCAG Criteria:
                                    </Typography>
                                    {issue.wcag_criteria.map((criterion, i) => (
                                      <Typography key={i} variant="body2" component="div" color={COLORS.lightText}>
                                        {criterion.id} - {criterion.description} (Level {criterion.level})
                                      </Typography>
                                    ))}
                                  </Box>
                                )}
                                
                                {/* Show tags if available */}
                                {issue.tags && issue.tags.length > 0 && (
                                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {issue.tags.map((tag, i) => (
                                      <Chip 
                                        key={i} 
                                        label={tag} 
                                        size="small" 
                                        variant="outlined" 
                                        sx={{ fontSize: '0.7rem' }}
                                      />
                                    ))}
                                  </Box>
                                )}
                                
                                {/* Show impact if available */}
                                {issue.impact && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" component="div" fontWeight="medium" color={COLORS.text}>
                                      Impact:
                                    </Typography>
                                    <Typography variant="body2" component="div" color={COLORS.lightText}>
                                      {issue.impact}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Typography>
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
        p: 3, 
        bgcolor: COLORS.background,
        border: `1px solid ${COLORS.border}`
      }}
    >
      <Typography variant="h5" fontWeight="bold" color={COLORS.text} gutterBottom>
        Analysis Results
      </Typography>
      
      {renderSummary()}
      
      <Divider sx={{ my: 3, borderColor: COLORS.border }} />
      
      <Typography variant="h6" fontWeight="medium" color={COLORS.text} gutterBottom>
        Accessibility Issues
      </Typography>
      
      {renderIssues()}
    </Paper>
  );
};

export default ResultCard;