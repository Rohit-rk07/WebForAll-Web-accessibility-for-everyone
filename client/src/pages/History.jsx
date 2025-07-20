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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const theme = useTheme();

  // Load reports on component mount
  useEffect(() => {
    const stored = localStorage.getItem('historyReports');
    setReports(stored ? JSON.parse(stored) : []);
    setLoading(false);
  }, []);

  // Filter reports based on search term
  const filteredReports = reports.filter(report => 
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    report.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort reports based on sort field and direction
  const sortedReports = [...filteredReports].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'score') {
      comparison = a.score - b.score;
    } else if (sortField === 'date') {
      comparison = new Date(a.date) - new Date(b.date);
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

  // Handle view report
  const handleViewReport = (report) => {
    // In a real app, this would navigate to the results page with the report data
    console.log('Viewing report:', report);
    // navigate('/dashboard/results', { state: { result: report } });
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

  // Confirm delete report
  const handleConfirmDelete = () => {
    if (currentReport) {
      const updated = reports.filter(report => report.id !== currentReport.id && report.url !== currentReport.url);
      setReports(updated);
      localStorage.setItem('historyReports', JSON.stringify(updated));
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Website Analysis History
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        View and manage your previous accessibility analysis reports
      </Typography>
      
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
            variant={sortField === 'score' ? 'contained' : 'outlined'}
            startIcon={<FilterList />}
            onClick={() => handleSort('score')}
            size="small"
          >
            Score {sortField === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                <TableCell><Typography fontWeight="bold">URL</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Date</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Score</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Issues</Typography></TableCell>
                <TableCell align="right"><Typography fontWeight="bold">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedReports.length > 0 ? (
                sortedReports.map((report) => {
                  const severity = getSeverityLevel(report.score);
                  return (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Typography fontWeight="medium">{report.name}</Typography>
                      </TableCell>
                      <TableCell>{report.url}</TableCell>
                      <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${report.score} - ${severity.level}`}
                          color={severity.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {report.issues.errors > 0 && (
                            <Chip 
                              label={`${report.issues.errors} Errors`}
                              color="error"
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {report.issues.warnings > 0 && (
                            <Chip 
                              label={`${report.issues.warnings} Warnings`}
                              color="warning"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
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