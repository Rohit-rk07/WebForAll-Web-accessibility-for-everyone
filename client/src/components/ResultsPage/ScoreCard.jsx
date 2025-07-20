import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  LinearProgress,
  Chip,
  useTheme
} from '@mui/material';
import {
  AccessibilityNew,
  ErrorOutline,
  WarningAmber,
  InfoOutlined,
  CheckCircleOutline
} from '@mui/icons-material';

/**
 * Score Card Component
 * Displays the overall accessibility score and breakdown
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

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        mb: 3, 
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Grid container spacing={3} alignItems="center">
        {/* Score Display */}
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `conic-gradient(${getScoreColor(score)} ${score * 3.6}deg, ${theme.palette.grey[300]} 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <Box
                  sx={{
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.background.paper,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: getScoreColor(score) }}>
                    {score}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Grade {getScoreGrade(score)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Typography variant="h6" gutterBottom>
              Accessibility Score
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {score >= 90 ? 'Excellent accessibility!' : 
               score >= 70 ? 'Good accessibility with room for improvement' :
               'Needs significant accessibility improvements'}
            </Typography>
          </Box>
        </Grid>

        {/* Issue Breakdown */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorOutline color="error" />
            Issues Found
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {severityCounts.critical > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  icon={<ErrorOutline />} 
                  label="Critical" 
                  color="error" 
                  size="small" 
                />
                <Typography variant="body2" fontWeight="bold">
                  {severityCounts.critical}
                </Typography>
              </Box>
            )}
            {severityCounts.serious > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  icon={<WarningAmber />} 
                  label="Serious" 
                  color="warning" 
                  size="small" 
                />
                <Typography variant="body2" fontWeight="bold">
                  {severityCounts.serious}
                </Typography>
              </Box>
            )}
            {severityCounts.moderate > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  icon={<InfoOutlined />} 
                  label="Moderate" 
                  color="info" 
                  size="small" 
                />
                <Typography variant="body2" fontWeight="bold">
                  {severityCounts.moderate}
                </Typography>
              </Box>
            )}
            {severityCounts.minor > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  icon={<InfoOutlined />} 
                  label="Minor" 
                  color="default" 
                  size="small" 
                />
                <Typography variant="body2" fontWeight="bold">
                  {severityCounts.minor}
                </Typography>
              </Box>
            )}
            {totalIssues === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                <Chip 
                  icon={<CheckCircleOutline />} 
                  label="No Issues Found" 
                  color="success" 
                />
              </Box>
            )}
          </Box>
        </Grid>

        {/* Test Results Summary */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessibilityNew color="primary" />
            Test Summary
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="error">
                Violations
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="error">
                {resultCounts.violations}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="success.main">
                Passes
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">
                {resultCounts.passes}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="warning.main">
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
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" color="text.secondary">
            Analyzed URL: <strong>{result.url}</strong>
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ScoreCard;
