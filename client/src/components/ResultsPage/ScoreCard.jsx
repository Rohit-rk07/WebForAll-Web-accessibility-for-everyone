import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  useTheme
} from '@mui/material';
import {
  CheckCircleOutline
} from '@mui/icons-material';
import SeverityBadge from '../ui/SeverityBadge';

/**
 * Score Card Component
 * Displays the overall accessibility score and breakdown
 * Flat surfaces, hairline borders, accent-only color.
 */
const ScoreCard = ({
  score,
  totalIssues,
  severityCounts,
  resultCounts,
  result
}) => {
  const theme = useTheme();

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get score grade
  const getScoreGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const severityRows = [
    { key: 'critical', label: 'Critical' },
    { key: 'serious', label: 'Serious' },
    { key: 'moderate', label: 'Moderate' },
    { key: 'minor', label: 'Minor' },
  ];

  const severityMap = {
    critical: { color: 'error', label: 'Critical' },
    serious: { color: 'warning', label: 'Serious' },
    moderate: { color: 'info', label: 'Moderate' },
    minor: { color: 'default', label: 'Minor' },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3.5 },
        mb: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      <Grid container spacing={{ xs: 2.5, md: 3 }} alignItems="center">
        {/* Score Display */}
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h1" sx={{ fontWeight: 700, lineHeight: 1, color: getScoreColor(score) }}>
              {score}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Grade {getScoreGrade(score)} · Accessibility score
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {score >= 90
                ? 'Excellent accessibility!'
                : score >= 70
                  ? 'Good accessibility with room for improvement'
                  : 'Needs significant accessibility improvements'}
            </Typography>
          </Box>
        </Grid>

        {/* Issue Breakdown */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Issues found
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {severityRows.some(({ key }) => severityCounts[key] > 0) ? (
              severityRows.map(({ key }) =>
                severityCounts[key] > 0 ? (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SeverityBadge severity={key} severityMap={severityMap} />
                    <Typography variant="body2" fontWeight="bold">
                      {severityCounts[key]}
                    </Typography>
                  </Box>
                ) : null
              )
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                <CheckCircleOutline color="success" />
                <Typography variant="body2" color="success.main" fontWeight="600">
                  No issues found
                </Typography>
              </Box>
            )}
            {totalIssues > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, pt: 1.25, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {totalIssues}
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Test Results Summary - Right Side */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Test results
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Violations
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="error">
                {resultCounts.violations}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Passes
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">
                {resultCounts.passes}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Incomplete
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="warning.main">
                {resultCounts.incomplete}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Inapplicable
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="text.secondary">
                {resultCounts.inapplicable}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* URL Display */}
      {result?.url && (
        <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
            Analyzed URL: <strong>{result.url}</strong>
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ScoreCard;