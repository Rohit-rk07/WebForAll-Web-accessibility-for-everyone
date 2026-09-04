import React, { useState, useEffect, useCallback } from "react";

import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  TablePagination,
} from "@mui/material";
import {
  Delete,
  Visibility,
  Search,
  SortByAlpha,
  CalendarMonth,
  FilterList,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { apiDelete, apiJson } from "../services/apiClient";
import { getUserFacingError } from "../utils/userFacingError";

const PAGE_SIZE = 10;

const History = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const [currentReport, setCurrentReport] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const theme = useTheme();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await apiJson("/history?limit=100");
      const items = Array.isArray(data.items) ? data.items : [];
      const mapped = items.map((it, idx) => ({
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
      }));
      setReports(mapped);
    } catch (e) {
      setLoadError(
        getUserFacingError(e, "Unable to load analysis history."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredReports = reports.filter(
    (report) =>
      (report.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.url || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedReports = [...filteredReports].sort((a, b) => {
    let comparison = 0;

    if (sortField === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === "violations") {
      comparison = (a.violations_count || 0) - (b.violations_count || 0);
    } else if (sortField === "date") {
      comparison = new Date(a.date || 0) - new Date(b.date || 0);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const pagedReports = sortedReports.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(0);
  };

  const handleViewReport = (report) => {
    if (!report?.id) return;
    navigate(`/dashboard/results/${report.id}`);
  };

  const handleDeleteClick = (report) => {
    setCurrentReport(report);
    setActionError("");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentReport || deleting) return;
    setDeleting(true);
    setActionError("");
    try {
      await apiDelete(`/history/${currentReport.id}`);
      setReports((prev) => prev.filter((r) => r.id !== currentReport.id));
      setDeleteDialogOpen(false);
    } catch (e) {
      setActionError(
        getUserFacingError(e, "Could not delete this report. Try again."),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: "background.paper",
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Analysis History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search, sort, open, or delete previous scans.
        </Typography>
      </Paper>

      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <TextField
          label="Search history"
          placeholder="Search by website or URL"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search aria-hidden="true" />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant={sortField === "name" ? "contained" : "outlined"}
            startIcon={<SortByAlpha />}
            onClick={() => handleSort("name")}
            size="small"
            aria-pressed={sortField === "name"}
          >
            Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
          </Button>

          <Button
            variant={sortField === "date" ? "contained" : "outlined"}
            startIcon={<CalendarMonth />}
            onClick={() => handleSort("date")}
            size="small"
            aria-pressed={sortField === "date"}
          >
            Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
          </Button>

          <Button
            variant={sortField === "violations" ? "contained" : "outlined"}
            startIcon={<FilterList />}
            onClick={() => handleSort("violations")}
            size="small"
            aria-pressed={sortField === "violations"}
          >
            Violations{" "}
            {sortField === "violations" &&
              (sortDirection === "asc" ? "↑" : "↓")}
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box
          sx={{ display: "flex", justifyContent: "center", py: 8 }}
          role="status"
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading history...</Typography>
        </Box>
      ) : loadError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchHistory}>
              Retry
            </Button>
          }
          sx={{ wordBreak: "break-word" }}
        >
          {loadError}
        </Alert>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography fontWeight="bold">Website</Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">URL / Input</Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">Date</Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">Violations</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight="bold">Actions</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedReports.length > 0 ? (
                pagedReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{report.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280, wordBreak: "break-all" }}>
                      {report.url}
                    </TableCell>
                    <TableCell>
                      {report.date
                        ? new Date(report.date).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${report.violations_count ?? 0}`}
                        color={
                          (report.violations_count ?? 0) === 0
                            ? "success"
                            : report.violations_count < 10
                              ? "warning"
                              : "error"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewReport(report)}
                        aria-label={`View report for ${report.name}`}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(report)}
                        aria-label={`Delete report for ${report.name}`}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm
                        ? "No matching reports found. Clear search to see all scans."
                        : "No reports yet. Run a scan from the dashboard to create one."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={sortedReports.length}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
          />
        </TableContainer>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        aria-labelledby="delete-report-title"
      >
        <DialogTitle id="delete-report-title">Delete this report?</DialogTitle>
        <DialogContent>
          <Typography sx={{ wordBreak: "break-word" }}>
            This will permanently delete the report for "{currentReport?.name}".
            This cannot be undone.
          </Typography>
          {actionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default History;
