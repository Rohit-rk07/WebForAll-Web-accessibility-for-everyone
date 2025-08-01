/**
 * Utility functions for processing accessibility analysis results
 */

/**
 * Standardized data extraction utility for axe-core results
 * @param {Object} resultData - Analysis result data
 * @param {string} category - Category to extract (violations, passes, incomplete, inapplicable)
 * @returns {Array} Array of results for the specified category
 */
export const extractAxeResults = (resultData, category) => {
  if (!resultData) return [];
  
  // Handle different result data structures
  let results = [];
  if (resultData.results && resultData.results[category]) {
    results = resultData.results[category];
  } else if (resultData[category]) {
    results = resultData[category];
  }
  
  // Ensure results is always an array
  return Array.isArray(results) ? results : [];
};

/**
 * Standardized severity mapping for consistent display
 * @param {Object} issue - Issue object from axe-core
 * @returns {string} Normalized severity level
 */
export const getNormalizedSeverity = (issue) => {
  const severity = issue.severity || issue.impact || 'info';
  // Map axe-core severity levels to our display levels
  const severityMap = {
    'critical': 'critical',
    'serious': 'serious', 
    'moderate': 'moderate',
    'minor': 'minor',
    'error': 'critical',
    'warning': 'serious',
    'notice': 'moderate',
    'info': 'minor'
  };
  return severityMap[severity.toLowerCase()] || 'minor';
};

/**
 * Calculate accessibility score based on violations and passes
 * @param {Object} resultData - Analysis result data
 * @returns {Object} Score data with percentage and breakdown
 */
export const calculateAccessibilityScore = (resultData) => {
  // Extract violations and passes using standardized utility
  const violations = extractAxeResults(resultData, 'violations');
  const passes = extractAxeResults(resultData, 'passes');
  
  // Calculate severity breakdown for violations using standardized mapping
  const severityCounts = violations.reduce((acc, issue) => {
    const severity = getNormalizedSeverity(issue);
    acc[severity]++;
    return acc;
  }, { critical: 0, serious: 0, moderate: 0, minor: 0 });
  
  const totalIssues = violations.length;
  
  // Calculate score using OLD method (100 - deductions)
  // Critical: -5 points each
  // Serious: -2 points each  
  // Moderate: -1 point each
  // Minor: -0.5 points each
  const deduction = (
    severityCounts.critical * 5 +
    severityCounts.serious * 2 +
    severityCounts.moderate * 1 +
    severityCounts.minor * 0.5
  );
  
  const score = Math.max(0, Math.min(100, 100 - deduction));
  
  return {
    score: Math.round(score),
    totalIssues,
    severityCounts
  };
};

/**
 * Calculate result counts for different categories
 * @param {Object} resultData - Analysis result data
 * @returns {Object} Counts for each category
 */
export const calculateResultCounts = (resultData) => {
  return {
    violations: extractAxeResults(resultData, 'violations').length,
    passes: extractAxeResults(resultData, 'passes').length,
    incomplete: extractAxeResults(resultData, 'incomplete').length,
    inapplicable: extractAxeResults(resultData, 'inapplicable').length
  };
};

/**
 * Get severity configuration for display
 * @param {Object} theme - MUI theme object
 * @returns {Object} Severity mapping with icons and colors
 */
export const getSeverityConfig = (theme, icons) => {
  const COLORS = {
    background: theme.palette.background.paper,
    border: theme.palette.divider,
    text: theme.palette.text.primary,
    lightText: theme.palette.text.secondary,
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    codeBackground: theme.palette.background.default,
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main
  };

  return {
    colors: COLORS,
    severityMap: {
      error: { icon: icons.ErrorOutline({ sx: { color: COLORS.error } }), color: 'error' },
      warning: { icon: icons.WarningAmber({ sx: { color: COLORS.warning } }), color: 'warning' },
      info: { icon: icons.InfoOutlined({ sx: { color: COLORS.info } }), color: 'info' },
      notice: { icon: icons.InfoOutlined({ sx: { color: COLORS.info } }), color: 'info' },
      success: { icon: icons.CheckCircleOutline({ sx: { color: COLORS.success } }), color: 'success' },
      critical: { icon: icons.ErrorOutline({ sx: { color: COLORS.error } }), color: 'error' },
      serious: { icon: icons.WarningAmber({ sx: { color: COLORS.warning } }), color: 'warning' },
      moderate: { icon: icons.InfoOutlined({ sx: { color: COLORS.primary } }), color: 'info' },
      minor: { icon: icons.InfoOutlined({ sx: { color: COLORS.info } }), color: 'info' }
    }
  };
};
