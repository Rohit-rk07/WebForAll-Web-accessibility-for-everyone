import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Popover,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  ErrorOutline,
  WarningAmber,
  InfoOutlined,
  Code,
  SmartToy,
  Close,
  ContentCopy
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getNormalizedSeverity } from '../../utils/resultsUtils';
import aiService from '../../services/aiService';

/**
 * Individual Violation Item Component
 * Displays a single accessibility violation with details and AI suggestions
 */
const ViolationItem = ({ 
  issue, 
  index, 
  severityMap, 
  theme 
}) => {
  const [aiSuggestionAnchor, setAiSuggestionAnchor] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingAiSuggestion, setLoadingAiSuggestion] = useState(false);

  const severity = getNormalizedSeverity(issue);
  const severityConfig = severityMap[severity] || severityMap.minor;

  /**
   * Handle AI Suggestion click
   */
  const handleAiSuggestionClick = async (event) => {
    setAiSuggestionAnchor(event.currentTarget);
    setLoadingAiSuggestion(true);
    
    try {
      const response = await aiService.explainIssue(issue);
      setAiSuggestion(response);
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      setAiSuggestion({
        explanation: 'Unable to get AI suggestion at this time.',
        fix: 'Please refer to the issue description and help text for guidance.',
        beforeCode: issue.nodes?.[0]?.html || 'No code available',
        afterCode: 'AI suggestion unavailable'
      });
    } finally {
      setLoadingAiSuggestion(false);
    }
  };

  /**
   * Close AI Suggestion popover
   */
  const handleCloseAiSuggestion = () => {
    setAiSuggestionAnchor(null);
    setAiSuggestion(null);
  };

  /**
   * Continue in chat
   */
  const handleContinueInChat = () => {
    const htmlCode = issue.nodes?.[0]?.html || 'No HTML code available';
    
    if (window.openAiChatWithContext) {
      window.openAiChatWithContext(
        `I need help with this accessibility issue: ${issue.help || issue.description}. Here's the HTML code: ${htmlCode}`
      );
    }
    handleCloseAiSuggestion();
  };

  /**
   * Copy code to clipboard
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    });
  };

  return (
    <Accordion 
      key={`violation-${index}`}
      sx={{ 
        mb: 2,
        '&:before': { display: 'none' },
        boxShadow: theme.shadows[2],
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <AccordionSummary 
        expandIcon={<ExpandMore />}
        sx={{ 
          backgroundColor: theme.palette.background.default,
          '&:hover': { backgroundColor: theme.palette.action.hover }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          {severityConfig.icon}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              {issue.id || 'Unknown Rule'}
            </Typography>
            <Chip 
              label={severity.charAt(0).toUpperCase() + severity.slice(1)} 
              color={severityConfig.color} 
              size="small" 
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SmartToy />}
            onClick={handleAiSuggestionClick}
            sx={{ mr: 1 }}
          >
            AI Suggestion
          </Button>
        </Box>
      </AccordionSummary>
      
      <AccordionDetails sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Issue Description */}
          <Box>
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
              {issue.help || issue.description || 'No description available'}
            </Typography>
            {issue.helpUrl && (
              <Typography variant="body2" color="primary" component="a" href={issue.helpUrl} target="_blank">
                Learn more about this rule
              </Typography>
            )}
          </Box>

          {/* Affected Elements */}
          {issue.nodes && issue.nodes.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                Affected Elements ({issue.nodes.length})
              </Typography>
              <List dense>
                {issue.nodes.slice(0, 3).map((node, nodeIndex) => (
                  <ListItem key={nodeIndex} sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Code fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            component="code"
                            sx={{ 
                              backgroundColor: theme.palette.background.default,
                              padding: '2px 6px',
                              borderRadius: 1,
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                              maxWidth: '70%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {node.html || 'No HTML available'}
                          </Typography>
                          <Tooltip title="Copy HTML">
                            <IconButton 
                              size="small" 
                              onClick={() => copyToClipboard(node.html || '')}
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                      secondary={node.target ? `Selector: ${node.target.join(', ')}` : null}
                    />
                  </ListItem>
                ))}
                {issue.nodes.length > 3 && (
                  <ListItem sx={{ pl: 0 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary">
                          ... and {issue.nodes.length - 3} more elements
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </Box>
      </AccordionDetails>

      {/* AI Suggestion Popover */}
      <Popover
        open={Boolean(aiSuggestionAnchor)}
        anchorEl={aiSuggestionAnchor}
        onClose={handleCloseAiSuggestion}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: { 
            maxWidth: 800, 
            width: '90vw',
            maxHeight: '80vh',
            overflow: 'auto'
          }
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">AI Suggestion</Typography>
            <IconButton onClick={handleCloseAiSuggestion} size="small">
              <Close />
            </IconButton>
          </Box>
          
          {loadingAiSuggestion ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Getting AI suggestion...</Typography>
            </Box>
          ) : aiSuggestion && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Explanation */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Explanation
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {aiSuggestion.explanation}
                </Typography>
              </Box>

              {/* Before/After Code */}
              {aiSuggestion.beforeCode && aiSuggestion.afterCode && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Code Comparison
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="error" sx={{ fontWeight: 'bold' }}>
                        Before (Current)
                      </Typography>
                      <SyntaxHighlighter
                        language="html"
                        style={tomorrow}
                        customStyle={{
                          fontSize: '12px',
                          maxHeight: '200px',
                          margin: 0,
                          borderRadius: '4px'
                        }}
                      >
                        {aiSuggestion.beforeCode}
                      </SyntaxHighlighter>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
                        After (Fixed)
                      </Typography>
                      <SyntaxHighlighter
                        language="html"
                        style={tomorrow}
                        customStyle={{
                          fontSize: '12px',
                          maxHeight: '200px',
                          margin: 0,
                          borderRadius: '4px'
                        }}
                      >
                        {aiSuggestion.afterCode}
                      </SyntaxHighlighter>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Fix Instructions */}
              {aiSuggestion.fix && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    How to Fix
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {aiSuggestion.fix}
                  </Typography>
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={handleContinueInChat}
                  startIcon={<SmartToy />}
                >
                  Continue in Chat
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCloseAiSuggestion}
                >
                  Close
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Popover>
    </Accordion>
  );
};

export default ViolationItem;
