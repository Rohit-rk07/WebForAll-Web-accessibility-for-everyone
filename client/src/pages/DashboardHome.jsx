import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
  Alert,
  AlertTitle,
  Button,
  useTheme,
} from "@mui/material";
import {
  CheckCircleOutline,
  KeyboardArrowRight,
  SearchOff,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getUserFacingError } from "../utils/userFacingError";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { apiJson } from "../services/apiClient";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorPanel from "../components/ui/ErrorPanel";

const UploadCard = lazy(() => import("../components/UploadCard"));

const SCAN_STEPS = [
  "Checking the page loads",
  "Running WCAG rules",
  "Collecting results",
];

const formatRelativeDate = (iso) => {
  if (!iso) return "-";
  const date = new Date(iso);
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
};

/**
 * ScanProgress - intentional, stable loading surface.
 * Animated step list communicates activity honestly; no fabricated
 * percentages because the backend does not provide them.
 */
const ScanProgress = () => {
  const theme = useTheme();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(SCAN_STEPS.length - 1, s + 1));
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        mt: 3,
        borderRadius: 1,
        p: { xs: 2.5, md: 4 },
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
      }}
    >
      <Box role="status" aria-live="polite">
        <Typography variant="h4" component="p" sx={{ mb: 0.5 }}>
          Analyzing accessibility…
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          This can take up to a minute for large pages.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {SCAN_STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {done ? (
                  <CheckCircleOutline
                    sx={{ color: "success.main", fontSize: 18 }}
                  />
                ) : current ? (
                  <CircularProgress size={18} thickness={5} />
                ) : (
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `2px solid ${theme.palette.divider}`,
                    }}
                  />
                )}
                <Typography
                  variant="body2"
                  color={done || current ? "text.primary" : "text.disabled"}
                >
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
};

const DashboardHome = () => {
  const theme = useTheme();
  const online = useOnlineStatus();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const uploadRef = useRef(null);
  const navigate = useNavigate();

  const fetchRecent = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const data = await apiJson("/history?limit=100");
      const items = Array.isArray(data.items) ? data.items : [];
      const mapped = items
        .map((it, idx) => ({
          id: it.id || String(idx),
          url: it.input_ref || "",
          name:
            it.input_type === "url"
              ? (() => {
                  try {
                    return new URL(it.input_ref || "").hostname;
                  } catch {
                    return it.input_ref || "Unknown URL";
                  }
                })()
              : it.input_type || "analysis",
          date: it.created_at || null,
          violations_count:
            typeof it.violations_count === "number" ? it.violations_count : 0,
        }))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setReports(mapped);
    } catch (e) {
      setHistoryError(getUserFacingError(e, "Unable to load recent scans."));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const handleAnalyze = (analysisResult) => {
    if (analysisResult?.id) {
      navigate(`/dashboard/results/${analysisResult.id}`);
      return;
    }
    setError(
      "The scan finished but could not be saved. Open History and try again, or run another scan.",
    );
  };

  const handleError = (errorMessage) => {
    setError(getUserFacingError({ message: errorMessage }, errorMessage));
  };

  const clearError = () => {
    setError(null);
  };

  const totalIssues = reports.reduce(
    (sum, r) => sum + (r.violations_count || 0),
    0,
  );

  return (
    <Box>
      <PageHeader
        label="Dashboard"
        title="Start a scan"
        subtitle="Analyze a URL, an HTML file, or pasted code for WCAG compliance."
        action={
          <Button
            variant="outlined"
            onClick={() => navigate("/dashboard/history")}
          >
            View history
          </Button>
        }
      />

      {!online && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You are offline. Reconnect before starting a scan.
        </Alert>
      )}

      <Box ref={uploadRef}>
        <Suspense
          fallback={
            <Paper
              elevation={0}
              sx={{ p: 4, borderRadius: 1, border: (t) => `1px solid ${t.palette.divider}` }}
            >
              <LoadingState label="Loading scan options…" />
            </Paper>
          }
        >
          <UploadCard
            onAnalyze={handleAnalyze}
            defaultTab={0}
            isLoading={loading}
            setIsLoading={setLoading}
            onError={handleError}
            clearError={clearError}
          />
        </Suspense>
      </Box>

      {loading && <ScanProgress />}

      {error && (
        <Alert
          severity="error"
          sx={{ width: "100%", mt: 3, wordBreak: "break-word" }}
          action={
            <Button color="inherit" size="small" onClick={clearError}>
              Dismiss
            </Button>
          }
        >
          <AlertTitle>Analysis failed</AlertTitle>
          {error} Check the URL or HTML, then try again.
        </Alert>
      )}

      {/* Supporting stats */}
      {reports.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(3, 1fr)", md: "repeat(3, 1fr)" },
            gap: 3,
            mt: 5,
            py: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box>
            <Typography variant="h3">{reports.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Scans run
            </Typography>
          </Box>
          <Box>
            <Typography variant="h3">{totalIssues}</Typography>
            <Typography variant="body2" color="text.secondary">
              Issues found
            </Typography>
          </Box>
          <Box>
            <Typography variant="h3">
              {reports.length > 0 ? (
                reports[0].violations_count ?? 0
              ) : (
                0
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Issues in last scan
            </Typography>
          </Box>
        </Box>
      )}

      {/* Recent analyses */}
      <Section
        label="Reports"
        title="Recent analyses"
        sx={{ mt: 4 }}
        action={
          reports.length > 0 ? (
            <Button
              size="small"
              color="inherit"
              onClick={() => navigate("/dashboard/history")}
              sx={{ textTransform: "none" }}
            >
              View all
            </Button>
          ) : undefined
        }
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
          }}
        >
          {historyLoading ? (
            <LoadingState label="Loading recent scans…" />
          ) : historyError ? (
            <ErrorPanel title="Couldn't load recent scans" body={historyError} onRetry={fetchRecent} />
          ) : reports.length === 0 ? (
            <EmptyState
              icon={<SearchOff sx={{ fontSize: 40 }} />}
              title="No scans yet"
              body="Run your first scan above — results are saved to your history automatically."
              action={
                <Button
                  variant="contained"
                  size="small"
                  onClick={() =>
                    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                >
                  Start a scan
                </Button>
              }
            />
          ) : (
            reports.slice(0, 5).map((report, i) => (
              <Box
                key={report.id}
                component="button"
                type="button"
                onClick={() => navigate(`/dashboard/results/${report.id}`)}
                aria-label={`Open report for ${report.name}`}
                sx={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: { xs: 2, md: 2.5 },
                  py: 1.5,
                  cursor: "pointer",
                  border: "none",
                  borderTop:
                    i === 0 ? "none" : `1px solid ${theme.palette.divider}`,
                  bgcolor: "transparent",
                  color: "text.primary",
                  fontFamily: "inherit",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, truncate: true }} noWrap>
                    {report.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatRelativeDate(report.date)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {(report.violations_count ?? 0).toLocaleString()}{" "}
                  {report.violations_count === 1 ? "issue" : "issues"}
                </Typography>
                <KeyboardArrowRight
                  color="action"
                  fontSize="small"
                  aria-hidden="true"
                />
              </Box>
            ))
          )}
        </Paper>
      </Section>
    </Box>
  );
};

export default DashboardHome;