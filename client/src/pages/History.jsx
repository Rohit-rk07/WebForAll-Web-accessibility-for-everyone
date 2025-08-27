import React, { useState, useEffect } from 'react';

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
  CircularProgress
} from '@mui/material';
import { 
  Delete, 
  Edit, 
  Visibility, 
  Search, 
  SortByAlpha,
  CalendarMonth,
  FilterList
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Get severity level based on score
 * @param {number} score - Accessibility score
 * @returns {Object} Severity level info
 */
const getSeverityLevel = (score) => {
  if (score >= 90) {
    return { level: 'Excellent', color: 'success' };
  } else if (score >= 80) {
    return { level: 'Good', color: 'success' };
  } else if (score >= 70) {
    return { level: 'Fair', color: 'warning' };
  } else if (score >= 60) {
    return { level: 'Poor', color: 'warning' };
  } else {
    return { level: 'Critical', color: 'error' };
  }
};

const History = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const theme = useTheme();

  // Load reports from backend on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE_URL}/history?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to load history (${res.status})`);
        }
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        // Normalize to table shape
        const mapped = items.map((it, idx) => ({
          id: it.id || String(idx),
          url: it.input_ref || '',
          name: it.input_type === 'url' ? new URL(it.input_ref || '', window.location.origin).hostname : it.input_type,
          date: it.created_at || null,
          violations_count: typeof it.violations_count === 'number' ? it.violations_count : 0,
        }));
        setReports(mapped);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Filter reports based on search term
  const filteredReports = reports.filter(report => 
    (report.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (report.url || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort reports based on sort field and direction
  const sortedReports = [...filteredReports].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'violations') {
      comparison = (a.violations_count || 0) - (b.violations_count || 0);
    } else if (sortField === 'date') {
      comparison = new Date(a.date || 0) - new Date(b.date || 0);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle view report (navigate to deep-linked results)
  const handleViewReport = (report) => {
    if (!report?.id) return;
    navigate(`/dashboard/results/${report.id}`);
  };

  // Handle edit report name
  const handleEditClick = (report) => {
    setCurrentReport({ ...report });
    setEditDialogOpen(true);
  };

  // Save edited report name
  const handleSaveEdit = () => {
    if (currentReport) {
      setReports(reports.map(report => 
        report.id === currentReport.id ? currentReport : report
      ));
      setEditDialogOpen(false);
    }
  };

  // Handle delete report
  const handleDeleteClick = (report) => {
    setCurrentReport(report);
    setDeleteDialogOpen(true);
  };

  // Confirm delete report (calls backend)
  const handleConfirmDelete = async () => {
    if (!currentReport) return;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/history/${currentReport.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      const updated = reports.filter(r => r.id !== currentReport.id);
      setReports(updated);
      setDeleteDialogOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Analysis History
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Track your accessibility testing progress and revisit previous reports
        </Typography>
      </Paper>
      
      {/* Search and Filter Section */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <TextField
          placeholder="Search websites..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant={sortField === 'name' ? 'contained' : 'outlined'}
            startIcon={<SortByAlpha />}
            onClick={() => handleSort('name')}
            size="small"
          >
            Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Button>
          
          <Button 
            variant={sortField === 'date' ? 'contained' : 'outlined'}
            startIcon={<CalendarMonth />}
            onClick={() => handleSort('date')}
            size="small"
          >
            Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Button>
          
          <Button 
            variant={sortField === 'violations' ? 'contained' : 'outlined'}
            startIcon={<FilterList />}
            onClick={() => handleSort('violations')}
            size="small"
          >
            Violations {sortField === 'violations' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Button>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'primary.50' }}>
                <TableCell><Typography fontWeight="bold">Website</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">URL / Input</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Date</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Violations</Typography></TableCell>
                <TableCell align="right"><Typography fontWeight="bold">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedReports.length > 0 ? (
                sortedReports.map((report) => {
                  return (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Typography fontWeight="medium">{report.name}</Typography>
                      </TableCell>
                      <TableCell>{report.url}</TableCell>
                      <TableCell>{report.date ? new Date(report.date).toLocaleString() : '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${report.violations_count ?? 0}`}
                          color={(report.violations_count ?? 0) === 0 ? 'success' : (report.violations_count < 10 ? 'warning' : 'error')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewReport(report)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditClick(report)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(report)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No matching reports found' : 'No reports available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Website Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Website Name"
            fullWidth
            variant="outlined"
            value={currentReport?.name || ''}
            onChange={(e) => setCurrentReport({ ...currentReport, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the report for "{currentReport?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default History; 