import React from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { ExpandMore, CheckCircleOutline, Code, SmartToy, HelpOutline, Block } from '@mui/icons-material';

/**
 * ResultsTabContent Component
 * Renders the content for each results tab (violations, passes, incomplete, inapplicable)
 * 
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active tab index
 * @param {Array} props.violations - Array of violation objects
 * @param {Array} props.passes - Array of pass objects
 * @param {Array} props.incomplete - Array of incomplete objects
 * @param {Array} props.inapplicable - Array of inapplicable objects
 * @param {Object} props.theme - MUI theme object
 * @param {Object} props.severityMap - Severity configuration mapping
 * @param {Function} props.onNeedsReview - Handler for needs review button
 * @param {Object} props.needsReviewLoading - Loading state for needs review
 * @param {Object} props.needsReviewResponse - Response state for needs review
 * @param {Function} props.renderViolationItem - Function to render individual violation items
 * @returns {JSX.Element} The tab content component
 */
const ResultsTabContent = ({ 
  activeTab, 
  violations, 
  passes, 
  incomplete, 
  inapplicable, 
  theme, 
  severityMap,
  onNeedsReview,
  needsReviewLoading,
  needsReviewResponse,
  renderViolationItem
}) => {
  // Render Violations Tab
  const renderViolations = () => {
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
        {violations.map((issue, index) => renderViolationItem(issue, index))}
      </Box>
    );
  };

  // Render Passes Tab
  const renderPasses = () => {
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

  // Render Incomplete Tab
  const renderIncomplete = () => {
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNeedsReview(issue, index);
                  }}
                  disabled={needsReviewLoading[index]}
                  style={{
                    background: 'none',
                    border: '1px solid currentColor',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    cursor: needsReviewLoading[index] ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <SmartToy fontSize="small" />
                  {needsReviewLoading[index] ? 'Loading...' : 'Needs Review'}
                </button>
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
               
               {/* AI Response Display */}
               {needsReviewResponse[index] && (
                 <Box sx={{ mt: 3, p: 2, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
                   <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.primary.main }}>
                     🤖 AI Suggestion
                   </Typography>
                   <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                     {needsReviewResponse[index].explanation}
                   </Typography>
                   {needsReviewResponse[index].fix && (
                     <Box>
                       <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                         💡 How to Fix
                       </Typography>
                       <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                         {needsReviewResponse[index].fix}
                       </Typography>
                     </Box>
                   )}
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

  // Render Inapplicable Tab
  const renderInapplicable = () => {
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
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMore />}
              sx={{ 
                backgroundColor: theme.palette.action.hover,
                '&:hover': { backgroundColor: theme.palette.action.selected }
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

export default ResultsTabContent;