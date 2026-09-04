import React, { useState, useMemo, useCallback } from 'react';
import { Chip, Stack } from '@mui/material';
import { ErrorOutline, WarningAmber, InfoOutlined, CheckCircleOutline } from '@mui/icons-material';
import ViolationItem from './ViolationItem';
import ResultsTabContent from './ResultsTabContent';
import { extractAxeResults, getSeverityConfig, getNormalizedSeverity } from '../../utils/resultsUtils';
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
  const [needsReviewResponse, setNeedsReviewResponse] = useState({});
  const [severityFilter, setSeverityFilter] = useState("all");

  const icons = useMemo(() => ({
    ErrorOutline: (props) => <ErrorOutline {...props} />,
    WarningAmber: (props) => <WarningAmber {...props} />,
    InfoOutlined: (props) => <InfoOutlined {...props} />,
    CheckCircleOutline: (props) => <CheckCircleOutline {...props} />
  }), []);
  const { severityMap } = useMemo(() => getSeverityConfig(theme, icons), [theme, icons]);
  const violations = useMemo(() => extractAxeResults(result, 'violations'), [result]);
  const visibleViolations = useMemo(() => {
    if (severityFilter === 'all') return violations;
    return violations.filter((issue) => getNormalizedSeverity(issue) === severityFilter);
  }, [violations, severityFilter]);
  const passes = useMemo(() => extractAxeResults(result, 'passes'), [result]);
  const incomplete = useMemo(() => extractAxeResults(result, 'incomplete'), [result]);
  const inapplicable = useMemo(() => extractAxeResults(result, 'inapplicable'), [result]);

  /**
   * Handle Needs Review button click
   */
  const handleNeedsReview = useCallback(async (issue, index) => {
    setNeedsReviewLoading(prev => ({ ...prev, [index]: true }));
    
    try {
      const response = await aiService.getIssueExplanation(issue);
      setNeedsReviewResponse(prev => ({ ...prev, [index]: response }));
    } catch (error) {
      console.error('Error getting needs review:', error);
      setNeedsReviewResponse(prev => ({ 
        ...prev, 
        [index]: {
          explanation: 'Unable to get AI suggestion at this time.',
          fix: 'Please refer to the issue description for guidance.'
        }
      }));
    } finally {
      setNeedsReviewLoading(prev => ({ ...prev, [index]: false }));
    }
  }, []);

  /**
   * Render individual violation item
   */
  const renderViolationItem = (issue, index) => {
    return (
      <ViolationItem
        key={index}
        issue={issue}
        index={index}
        severityMap={severityMap}
        theme={theme}
      />
    );
  };

  return (
    <>
      {activeTab === 0 && violations.length > 0 && (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }} role="group" aria-label="Filter violations by severity">
          {['all', 'critical', 'serious', 'moderate', 'minor'].map((level) => (
            <Chip
              key={level}
              label={level === 'all' ? 'All severities' : level}
              color={severityFilter === level ? 'primary' : 'default'}
              onClick={() => setSeverityFilter(level)}
              variant={severityFilter === level ? 'filled' : 'outlined'}
              clickable
            />
          ))}
        </Stack>
      )}
    <ResultsTabContent
      activeTab={activeTab}
      violations={visibleViolations}
      passes={passes}
      incomplete={incomplete}
      inapplicable={inapplicable}
      theme={theme}
      severityMap={severityMap}
      onNeedsReview={handleNeedsReview}
      needsReviewLoading={needsReviewLoading}
      needsReviewResponse={needsReviewResponse}
      renderViolationItem={renderViolationItem}
    />
    </>
  );
};

export default ResultsContent;
