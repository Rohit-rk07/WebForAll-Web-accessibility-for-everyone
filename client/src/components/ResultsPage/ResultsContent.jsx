import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Paper
} from '@mui/material';
import {
  ExpandMore,
  CheckCircleOutline,
  HelpOutline,
  Block,
  Code,
  SmartToy,
  WarningAmber
} from '@mui/icons-material';
import ViolationItem from './ViolationItem';
import { extractAxeResults, getNormalizedSeverity, getSeverityConfig } from '../../utils/resultsUtils';
import aiService from '../../services/aiService';

/**
 * Results Content Component
 * Displays the content for each tab (violations, passes, incomplete, inapplicable)
 */
const ResultsContent = ({ 
  activeTab, 
  result, 
  theme 
}) => {
  const [needsReviewLoading, setNeedsReviewLoading] = useState({});

  // Get severity configuration
  const icons = {
    ErrorOutline: (props) => <ErrorOutline {...props} />,
    WarningAmber: (props) => <WarningAmber {...props} />,
    InfoOutlined: (props) => <InfoOutlined {...props} />,
    CheckCircleOutline: (props) => <CheckCircleOutline {...props} />
  };
  const { severityMap } = getSeverityConfig(theme, icons);

  /**
   * Handle Needs Review button click
   */
  const handleNeedsReview = async (issue, index) => {
    setNeedsReviewLoading(prev => ({ ...prev, [index]: true }));
    
    try {
      const response = await aiService.explainIssue(issue);
      // Handle the response - could show in a dialog or popover
      console.log('Needs Review response:', response);
    } catch (error) {
      console.error('Error getting needs review:', error);
    } finally {
      setNeedsReviewLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  /**
   * Render Violations Tab
   */
  const renderViolations = () => {
    const violations = extractAxeResults(result, 'violations');
    
    if (violations.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: theme.palette.success.light + '20' }}>
          <CheckCircleOutline sx={{ fontSize: 48, color: theme.palette.success.main, mb: 2 }} />
          <Typography variant="h6" color="success.main" gutterBottom>
            No Accessibility Violations Found!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Great job! Your page meets the selected accessibility standards.
          </Typography>
        </Paper>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Accessibility Violations ({violations.length})
        </Typography>
        {violations.map((issue, index) => (
          <ViolationItem
            key={index}
            issue={issue}
            index={index}
            severityMap={severityMap}
            theme={theme}
          />
        ))}
      </Box>
    );
  };

  /**
   * Render Passes Tab
   */
  const renderPasses = () => {
    const passes = extractAxeResults(result, 'passes');
    
    if (passes.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Passed Tests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No accessibility tests were passed.
          </Typography>
        </Paper>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Passed Accessibility Tests ({passes.length})
        </Typography>
        {passes.map((issue, index) => (
          <Accordion 
            key={index}
            sx={{ 
              mb: 2,
              '&:before': { display: 'none' },
              boxShadow: theme.shadows[1],
              border: `1px solid ${theme.palette.success.light}`
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMore />}
              sx={{ 
                backgroundColor: theme.palette.success.light + '10',
                '&:hover': { backgroundColor: theme.palette.success.light + '20' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <CheckCircleOutline color="success" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    {issue.id || 'Unknown Rule'}
                  </Typography>
                  <Chip 
                    label="Passed" 
                    color="success" 
                    size="small" 
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {issue.help || issue.description || 'This accessibility test passed successfully.'}
              </Typography>
              {issue.helpUrl && (
                <Typography variant="body2" color="primary" component="a" href={issue.helpUrl} target="_blank">
                  Learn more about this rule
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  /**
   * Render Incomplete Tab
   */
  const renderIncomplete = () => {
    const incomplete = extractAxeResults(result, 'incomplete');
    
    if (incomplete.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Incomplete Tests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All applicable tests were completed successfully.
          </Typography>
        </Paper>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Incomplete Tests ({incomplete.length})
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          These tests could not be completed automatically and may require manual review.
        </Typography>
        
        {incomplete.map((issue, index) => (
          <Accordion 
            key={index}
            sx={{ 
              mb: 2,
              '&:before': { display: 'none' },
              boxShadow: theme.shadows[1],
              border: `1px solid ${theme.palette.warning.light}`
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMore />}
              sx={{ 
                backgroundColor: theme.palette.warning.light + '10',
                '&:hover': { backgroundColor: theme.palette.warning.light + '20' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <HelpOutline color="warning" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    {issue.id || 'Unknown Rule'}
                  </Typography>
                  <Chip 
                    label="Needs Review" 
                    color="warning" 
                    size="small" 
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SmartToy />}
                  onClick={() => handleNeedsReview(issue, index)}
                  disabled={needsReviewLoading[index]}
                  sx={{ mr: 1 }}
                >
                  {needsReviewLoading[index] ? 'Loading...' : 'Needs Review'}
                </Button>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {issue.help || issue.description || 'This test requires manual review.'}
              </Typography>
              
              {issue.nodes && issue.nodes.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Elements to Review ({issue.nodes.length})
                  </Typography>
                  <List dense>
                    {issue.nodes.slice(0, 3).map((node, nodeIndex) => (
                      <ListItem key={nodeIndex} sx={{ pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Code fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography 
                              variant="body2" 
                              component="code"
                              sx={{ 
                                backgroundColor: theme.palette.background.default,
                                padding: '2px 6px',
                                borderRadius: 1,
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                              }}
                            >
                              {node.html || 'No HTML available'}
                            </Typography>
                          }
                          secondary={node.target ? `Selector: ${node.target.join(', ')}` : null}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              {issue.helpUrl && (
                <Typography variant="body2" color="primary" component="a" href={issue.helpUrl} target="_blank">
                  Learn more about this rule
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  /**
   * Render Inapplicable Tab
   */
  const renderInapplicable = () => {
    const inapplicable = extractAxeResults(result, 'inapplicable');
    
    if (inapplicable.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Inapplicable Tests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All tests were applicable to this page.
          </Typography>
        </Paper>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Inapplicable Tests ({inapplicable.length})
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          These tests were not applicable to the content on this page.
        </Typography>
        
        {inapplicable.map((issue, index) => (
          <Accordion 
            key={index}
            sx={{ 
              mb: 2,
              '&:before': { display: 'none' },
              boxShadow: theme.shadows[1],
              border: `1px solid ${theme.palette.grey[300]}`
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMore />}
              sx={{ 
                backgroundColor: theme.palette.grey[50],
                '&:hover': { backgroundColor: theme.palette.grey[100] }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Block color="disabled" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    {issue.id || 'Unknown Rule'}
                  </Typography>
                  <Chip 
                    label="Not Applicable" 
                    color="default" 
                    size="small" 
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {issue.help || issue.description || 'This test was not applicable to the page content.'}
              </Typography>
              {issue.helpUrl && (
                <Typography variant="body2" color="primary" component="a" href={issue.helpUrl} target="_blank">
                  Learn more about this rule
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  // Render content based on active tab
  switch (activeTab) {
    case 0:
      return renderViolations();
    case 1:
      return renderPasses();
    case 2:
      return renderIncomplete();
    case 3:
      return renderInapplicable();
    default:
      return renderViolations();
  }
};

export default ResultsContent;
