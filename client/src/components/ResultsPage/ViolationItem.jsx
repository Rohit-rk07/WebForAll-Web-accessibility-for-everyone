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
  Tooltip,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ExpandMore,
  ErrorOutline,
  WarningAmber,
  InfoOutlined,
  Code,
  SmartToy,
  Close,
  ContentCopy,
  Chat,
  Psychology,
  CheckCircle,
  HelpOutline
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
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingAiSuggestion, setLoadingAiSuggestion] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const severity = getNormalizedSeverity(issue);
  const severityConfig = severityMap[severity] || severityMap.minor;

  // Don't show AI suggestion for incomplete issues
  const isIncomplete = issue.incomplete === true;

  /**
   * Handle AI Fix click
   */
  const handleAiFixClick = async (event) => {
    // Prevent accordion from closing when clicking AI Fix button
    event.stopPropagation();
    
    // Expand the accordion if not already expanded
    if (!isExpanded) {
      setIsExpanded(true);
    }
    
    if (showAiSuggestion && aiSuggestion) {
      setShowAiSuggestion(false);
      return;
    }

    setLoadingAiSuggestion(true);
    setShowAiSuggestion(true);
    
    try {
      const response = await aiService.getIssueExplanation(issue);
      setAiSuggestion(response);
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      setAiSuggestion({
        fixedCode: 'Unable to generate fixed code at this time.',
        explanation: 'Unable to get AI suggestion. Please try again later.'
      });
    } finally {
      setLoadingAiSuggestion(false);
    }
  };

  /**
   * Handle accordion change
   */
  const handleAccordionChange = (event, expanded) => {
    setIsExpanded(expanded);
  };

  /**
   * Continue in chat
   */
  const handleContinueInChat = () => {
    const htmlCode = issue.nodes?.[0]?.html || issue.element || 'No HTML code available';
    
    // Clean and format the HTML code for better readability (more careful approach)
    const cleanHtmlCode = htmlCode
      .replace(/\s+/g, ' ')  // Replace multiple spaces/newlines with single space
      .replace(/>\s+</g, '>\n<')  // Add newlines between tags for readability
      .replace(/\s+>/g, '>')  // Remove spaces before closing >
      .replace(/<\s+/g, '<')  // Remove spaces after opening <
      .trim();
    
    const chatMessage = `I need help with this accessibility issue:

**Issue:** ${issue.help || issue.description || 'Accessibility Issue'}
**Rule ID:** ${issue.id}
**Impact:** ${issue.impact || 'Unknown'}

**Current HTML Code:**
\`\`\`html
${cleanHtmlCode}
\`\`\`

${aiSuggestion ? `**AI Suggestion:**
${aiSuggestion.explanation}

**Fixed Code:**
\`\`\`html
${aiSuggestion.fixedCode}
\`\`\`

` : ''}Can you help me understand this accessibility issue better and provide additional guidance for fixing it?`;
    
    // Open chat with context using global method
    if (window.openAiChatWithContext) {
      window.openAiChatWithContext(chatMessage);
    } else if (window.aiChatbot) {
      window.aiChatbot.addContextMessage(chatMessage);
    } else {
      console.warn('Chat functionality not available');
    }
  };

  /**
   * Copy code to clipboard
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  };

  return (
    <Accordion 
      key={`violation-${index}`}
      expanded={isExpanded}
      onChange={handleAccordionChange}
      elevation={0}
      sx={{ 
        mb: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `4px solid ${severityConfig.color === 'error' ? theme.palette.error.main : theme.palette.warning.main}`,
        borderRadius: 1,
        '&:before': { display: 'none' }
      }}
    >
      <AccordionSummary 
        expandIcon={<ExpandMore />}
        sx={{ 
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.02)' 
            : 'rgba(0, 0, 0, 0.02)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.04)' 
              : 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography variant="subtitle1" fontWeight="medium" color="text.primary">
            {issue.id || issue.rule || 'Unknown Rule'}
          </Typography>
          <Chip 
            label={issue.impact || severity}
            size="small"
            color={severityConfig.color}
            sx={{ ml: 2 }}
          />
          {!isIncomplete && (
            <Button
              startIcon={<SmartToy />}
              variant="outlined"
              size="small"
              color={showAiSuggestion ? "primary" : "primary"}
              onClick={handleAiFixClick}
              sx={{ 
                ml: 'auto', 
                minWidth: 120
              }}
            >
              {showAiSuggestion ? 'Hide AI Fix' : 'AI Fix'}
            </Button>
          )}
        </Box>
      </AccordionSummary>
      
      <AccordionDetails sx={{ p: 3 }}>
        {/* Issue Description */}
        {(issue.description || issue.help) && (
          <Box sx={{ mb: 2 }} className="issue-details">
            <Typography variant="body1" gutterBottom>
              {issue.description || issue.help}
            </Typography>
          </Box>
        )}
        
        {/* Help URL */}
        {issue.helpUrl && (
          <Box sx={{ mb: 2 }}>
            <Button 
              href={issue.helpUrl} 
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<HelpOutline />}
              size="small"
              variant="text"
            >
              Learn more about this issue
            </Button>
          </Box>
        )}

        {/* AI Suggestion Section - Only show for violations, not incomplete */}
        {!isIncomplete && showAiSuggestion && (
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            backgroundColor: theme.palette.mode === 'dark'
              ? theme.palette.primary.dark + '20'
              : theme.palette.primary.light + '10',
            borderRadius: 2,
            border: `1px solid ${theme.palette.primary.main}40`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SmartToy sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                🤖 AI Fix
              </Typography>
            </Box>

            {loadingAiSuggestion ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Getting AI fix...
                </Typography>
              </Box>
            ) : aiSuggestion ? (
              <Box>
                {/* Explanation */}
                <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                  {aiSuggestion.explanation}
                </Typography>

                {/* Fixed Code */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ 
                      fontWeight: 'bold', 
                      color: theme.palette.success.main 
                    }}>
                      ✅ Fixed Code
                    </Typography>
                    <Tooltip title="Copy to clipboard">
                      <IconButton size="small" onClick={() => copyToClipboard(aiSuggestion.fixedCode)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box 
                    sx={{ 
                      bgcolor: theme.palette.mode === 'dark'
                        ? theme.palette.grey[900]
                        : theme.palette.grey[100], 
                      p: 1.5, 
                      borderRadius: 1,
                      overflowX: 'auto',
                      border: `1px solid ${theme.palette.divider}`
                    }}
                    className="code-snippet"
                  >
                    <Typography 
                      variant="body2" 
                      component="pre" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        m: 0,
                        fontSize: '0.85rem',
                        color: 'text.primary',
                        display: 'block'
                      }}
                    >
                      {aiSuggestion.fixedCode}
                    </Typography>
                  </Box>
                </Box>

                {/* Action Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Chat />}
                    onClick={handleContinueInChat}
                  >
                    Continue in Chat
                  </Button>
                </Box>
              </Box>
            ) : (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Unable to get AI suggestion at this time.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
        
        {/* Affected Elements - Original Format */}
        {issue.nodes && issue.nodes.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Affected Elements ({issue.nodes.length})
            </Typography>
            
            {issue.nodes.map((node, nodeIndex) => (
              <Box 
                key={`node-${index}-${nodeIndex}`}
                sx={{ 
                  mb: 2,
                  p: 2,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? theme.palette.grey[900]
                    : theme.palette.grey[100],
                  borderRadius: 1,
                  overflow: 'auto',
                  border: `1px solid ${theme.palette.divider}`
                }}
                className="code-snippet"
              >
                <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', m: 0 }}>
                  {node.html}
                </Typography>
                
                {node.failureSummary && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="error">
                      {node.failureSummary}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ViolationItem;
