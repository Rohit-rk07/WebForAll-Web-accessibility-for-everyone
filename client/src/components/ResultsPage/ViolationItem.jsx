import React, { useState, memo, useCallback } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import {
  ExpandMore,
  SmartToy,
  ContentCopy,
  Chat,
  CheckCircle,
  HelpOutline,
  Place,
  ErrorOutline
} from '@mui/icons-material';
import { getNormalizedSeverity } from '../../utils/resultsUtils';
import aiService from '../../services/aiService';

const CodeBlock = ({ code, copyLabel = 'Copy code', onCopy, caption }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        p: 2,
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        overflowX: 'auto',
        position: 'relative',
      }}
    >
      {onCopy && (
        <Tooltip title={copyLabel}>
          <IconButton
            size="small"
            aria-label={copyLabel}
            onClick={onCopy}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'text.secondary' }}
          >
            <ContentCopy fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {caption && (
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          {caption}
        </Typography>
      )}
      <Typography
        variant="body2"
        component="pre"
        sx={{ fontFamily: 'monospace', m: 0, fontSize: '0.85rem', color: 'text.primary', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        {code}
      </Typography>
    </Box>
  );
};

/**
 * Individual Violation Item Component
 * Displays a single accessibility issue as What / How / Where.
 * - What: the rule and why it matters
 * - How: optional AI guidance to fix it
 * - Where: the affected elements
 */
const ViolationItem = ({
  issue,
  index,
  severityMap,
}) => {
  const theme = useTheme();
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingAiSuggestion, setLoadingAiSuggestion] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiError, setAiError] = useState("");

  const severity = getNormalizedSeverity(issue);
  const severityConfig = severityMap[severity] || severityMap.minor;

  // Don't show AI guidance for incomplete issues
  const isIncomplete = issue.incomplete === true;

  /**
   * Toggle AI guidance
   */
  const handleAiGuidanceClick = useCallback(async (event) => {
    event.stopPropagation();

    if (showAiSuggestion && aiSuggestion) {
      setShowAiSuggestion(false);
      return;
    }

    setLoadingAiSuggestion(true);
    setShowAiSuggestion(true);

    try {
      const response = await aiService.getIssueExplanation(issue);
      setAiSuggestion(response);
      setAiError("");
    } catch (error) {
      setAiSuggestion(null);
      setAiError(
        error.message ||
          "Unable to get an AI explanation. Check your connection and try again.",
      );
    } finally {
      setLoadingAiSuggestion(false);
    }
  }, [showAiSuggestion, aiSuggestion, issue]);

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

    const cleanHtmlCode = htmlCode
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '>\n<')
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<')
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

    if (window.openAiChatWithContext) {
      window.openAiChatWithContext(chatMessage);
    } else if (window.aiChatbot) {
      window.aiChatbot.addContextMessage(chatMessage);
    } else {
      console.warn('Chat functionality not available');
    }
  };

  /**
   * Copy helper
   */
  const copyToClipboard = useCallback((text) => () => {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
    });
  }, []);

  return (
    <Accordion
      expanded={isExpanded}
      onChange={handleAccordionChange}
      elevation={0}
      sx={{
        mb: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `4px solid ${theme.palette[severityConfig.color]?.main || theme.palette.info.main}`,
        borderRadius: 1,
        overflow: 'hidden',
        '&:before': { display: 'none' },
        '&.Mui-expanded': { m: 0, mb: 2 },
      }}
    >
      <AccordionSummary
        component="div"
        expandIcon={<ExpandMore />}
        sx={{
          '&:hover': { bgcolor: theme.palette.action.hover },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
          <Typography variant="subtitle1" fontWeight="600" color="text.primary" sx={{ wordBreak: 'break-word' }}>
            {issue.id || issue.rule || 'Unknown Rule'}
          </Typography>
          <Chip
            label={issue.impact || severity}
            size="small"
            color={severityConfig.color}
            sx={{ flexShrink: 0 }}
          />
          {!isIncomplete && (
            <Button
              startIcon={<SmartToy />}
              variant={showAiSuggestion ? "contained" : "outlined"}
              size="small"
              color="primary"
              onClick={handleAiGuidanceClick}
              disabled={loadingAiSuggestion}
              aria-label={showAiSuggestion ? 'Hide AI guidance' : `Get AI guidance for ${issue.id || 'issue'}`}
              sx={{ ml: 'auto', minWidth: 132, flexShrink: 0 }}
            >
              {showAiSuggestion ? 'Hide AI guidance' : 'AI guidance'}
            </Button>
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
        {/* What - the issue */}
        {(issue.description || issue.help) && (
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              The issue
            </Typography>
            <Typography variant="body2" color="text.primary">
              {issue.description || issue.help}
            </Typography>
          </Box>
        )}

        {/* Reference link */}
        {issue.helpUrl && (
          <Box sx={{ mb: 2.5 }}>
            <Button
              href={issue.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<HelpOutline />}
              size="small"
              variant="text"
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              WCAG reference for {issue.id || 'this rule'}
            </Button>
          </Box>
        )}

        {/* How - AI guidance */}
        {!isIncomplete && showAiSuggestion && (
          <Box
            sx={{
              mb: 2.5,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              wordBreak: 'break-word',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <SmartToy sx={{ color: 'text.secondary', fontSize: 20 }} aria-hidden="true" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                AI guidance
              </Typography>
            </Box>

            {loadingAiSuggestion ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }} role="status">
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Getting AI guidance…
                </Typography>
              </Box>
            ) : aiError ? (
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={handleAiGuidanceClick}>
                    Retry
                  </Button>
                }
              >
                {aiError}
              </Alert>
            ) : aiSuggestion ? (
              <Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {aiSuggestion.explanation}
                </Typography>

                {aiSuggestion.fixedCode && (
                  <CodeBlock
                    code={aiSuggestion.fixedCode}
                    copyLabel="Copy fixed code"
                    caption={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                        Suggested fixed code
                      </Box>
                    }
                    onCopy={copyToClipboard(aiSuggestion.fixedCode)}
                  />
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Chat />}
                    onClick={handleContinueInChat}
                  >
                    Continue in chat
                  </Button>
                </Box>
              </Box>
            ) : (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Unable to get AI guidance at this time.
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Where - affected elements */}
        {issue.nodes && issue.nodes.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <Place sx={{ fontSize: 18, color: 'text.secondary' }} aria-hidden="true" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Affected elements ({issue.nodes.length})
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {issue.nodes.map((node, nodeIndex) => (
                <Box key={`node-${index}-${nodeIndex}`}>
                  <CodeBlock
                    code={node.html}
                    copyLabel="Copy element HTML"
                    caption={`Element ${nodeIndex + 1} of ${issue.nodes.length}`}
                    onCopy={copyToClipboard(node.html)}
                  />
                  {node.failureSummary && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <ErrorOutline sx={{ fontSize: 16, color: 'error.main', mt: 0.25 }} aria-hidden="true" />
                      <Typography variant="body2" color="error" sx={{ wordBreak: 'break-word' }}>
                        {node.failureSummary}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default memo(ViolationItem);