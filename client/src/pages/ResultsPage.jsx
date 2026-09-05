import React, {
  useEffect,
  useState,
  useRef,
  lazy,
  Suspense,
  useMemo,
  useCallback,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { Download } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

// Import our modular components
import ScoreCard from "../components/ResultsPage/ScoreCard";
import ResultsTabs from "../components/ResultsPage/ResultsTabs";
import ResultsContent from "../components/ResultsPage/ResultsContent";
import PageHeader from "../components/ui/PageHeader";
import LoadingState from "../components/ui/LoadingState";
import ErrorPanel from "../components/ui/ErrorPanel";
const ExportDialog = lazy(
  () => import("../components/ResultsPage/ExportDialog"),
);

// Import utility functions
import {
  calculateAccessibilityScore,
  calculateResultCounts,
} from "../utils/resultsUtils";
import { apiJson } from "../services/apiClient";

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
  const [analyzedUrl, setAnalyzedUrl] = useState("");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const { id } = useParams();

  useEffect(() => {
    const loadById = async () => {
      if (!id) {
        navigate("/dashboard/home");
        return;
      }
      try {
        const doc = await apiJson(`/history/${id}`);
        const analyzed = doc.result || doc;
        setResult(analyzed);
        const analyzedUrlValue =
          analyzed?.url ||
          analyzed?.pageUrl ||
          (doc?.input_type === "url" ? doc?.input_ref : "");
        setAnalyzedUrl(analyzedUrlValue || "");
        setLoading(false);
      } catch (e) {
        setLoadError(e.message || "Unable to load this analysis.");
        setLoading(false);
      }
    };
    loadById();
  }, [id, navigate, reloadKey]);

  const scoreData = useMemo(
    () => calculateAccessibilityScore(result),
    [result],
  );
  const resultCounts = useMemo(() => calculateResultCounts(result), [result]);
  const score = scoreData.score;
  const totalIssues = scoreData.totalIssues;
  const severityCounts = scoreData.severityCounts;

  /**
   * Handle tab change
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
    navigate("/dashboard/home");
  }, [navigate]);

  if (loading) {
    return <LoadingState label="Loading results…" />;
  }

  if (!result) {
    return (
      <ErrorPanel
        title="No report found"
        body={loadError || "No results found"}
        onRetry={() => {
          setLoading(true);
          setLoadError("");
          setReloadKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <Box>
      <PageHeader
        label="Reports"
        title="Analysis results"
        subtitle={
          analyzedUrl ? (
            <>
              <strong>Analyzed URL:</strong>{" "}
              <a
                href={analyzedUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ wordBreak: "break-all", color: theme.palette.primary.main }}
              >
                {analyzedUrl}
              </a>
            </>
          ) : (
            "Full WCAG report grouped by severity"
          )
        }
        onBack={handleBackClick}
        action={
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportClick}
          >
            Export
          </Button>
        }
      />

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
        <ResultsContent activeTab={activeTab} result={result} theme={theme} />
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