import React, { useEffect, useState, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip
} from '@mui/material';
import { 
  ArrowBack,
  Download
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Import our modular components
import ScoreCard from '../components/ResultsPage/ScoreCard';
import ResultsTabs from '../components/ResultsPage/ResultsTabs';
import ResultsContent from '../components/ResultsPage/ResultsContent';
const ExportDialog = lazy(() => import('../components/ResultsPage/ExportDialog'));

// Import utility functions
import { 
  calculateAccessibilityScore, 
  calculateResultCounts 
} from '../utils/resultsUtils';
import { apiJson } from '../services/apiClient';

/**
 * Results Page component
 * Displays detailed accessibility analysis results in a structured format
 * Now modularized into smaller, manageable components
 */
const ResultsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const resultsRef = useRef(null);
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  
  const { id } = useParams();

  useEffect(() => {
    const loadById = async () => {
      if (!id) {
        navigate('/dashboard/home');
        return;
      }
      try {
        const doc = await apiJson(`/history/${id}`);
        const analyzed = doc.result || doc;
        setResult(analyzed);
        const analyzedUrlValue = analyzed?.url || analyzed?.pageUrl || (doc?.input_type === 'url' ? doc?.input_ref : '');
        setAnalyzedUrl(analyzedUrlValue || '');
        setLoading(false);
      } catch (e) {
        console.error(e);
        navigate('/dashboard/home');
      }
    };
    loadById();
  }, [id, navigate]);

  const scoreData = useMemo(() => calculateAccessibilityScore(result), [result]);
  const resultCounts = useMemo(() => calculateResultCounts(result), [result]);
  const score = scoreData.score;
  const totalIssues = scoreData.totalIssues;
  const severityCounts = scoreData.severityCounts;

  /**
   * Handle tab change
   * @param {Event} event - Change event
   * @param {number} newValue - New tab index
   */
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  /**
   * Opens the export options dialog
   */
  const handleExportClick = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  /**
   * Closes the export options dialog
   */
  const handleCloseExportDialog = useCallback(() => {
    setExportDialogOpen(false);
  }, []);

  /**
   * Navigate back to dashboard
   */
  const handleBackClick = useCallback(() => {
    navigate('/dashboard/home');
  }, [navigate]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading Results...
        </Typography>
      </Box>
    );
  }

  if (!result) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h6" color="error">
          No results found
        </Typography>
        <Button variant="contained" onClick={handleBackClick}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleBackClick} color="primary">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Accessibility Analysis Results
            </Typography>
            {analyzedUrl && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                <strong>Analyzed URL:</strong>{' '}
                <a href={analyzedUrl} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  {analyzedUrl}
                </a>
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportClick}
          >
            Export Results
          </Button>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box ref={resultsRef}>
        {/* Score Card */}
        <ScoreCard
          score={score}
          totalIssues={totalIssues}
          severityCounts={severityCounts}
          resultCounts={resultCounts}
          result={result}
        />

        {/* Results Navigation Tabs */}
        <Box sx={{ mt: 4, mb: 3, pt: 2 }}>
          <ResultsTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            resultCounts={resultCounts}
          />
        </Box>

        {/* Results Content */}
        <ResultsContent
          activeTab={activeTab}
          result={result}
          theme={theme}
        />
      </Box>

      {/* Export Dialog */}
      <Suspense fallback={null}>
        <ExportDialog
          open={exportDialogOpen}
          onClose={handleCloseExportDialog}
          result={result}
          resultsRef={resultsRef}
        />
      </Suspense>
    </Box>
  );
};

export default ResultsPage;
