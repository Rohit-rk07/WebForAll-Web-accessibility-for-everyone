import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Box,
  Typography
} from '@mui/material';
import { extractAxeResults } from '../../utils/resultsUtils';

/**
 * Export Dialog Component
 * Handles exporting results to different formats (PDF, CSV, HTML)
 */
const ExportDialog = ({ 
  open, 
  onClose, 
  result, 
  resultsRef,
  setLoading 
}) => {
  const [exportOptions, setExportOptions] = useState({
    format: 'detailed',
    exportType: 'pdf',
    includeCode: true,
    includeDetails: true,
    includePasses: false,
    includeIncomplete: true
  });

  /**
   * Updates export options
   * @param {Object} event - Change event
   */
  const handleExportOptionChange = (event) => {
    const { name, value, checked } = event.target;
    setExportOptions(prev => ({
      ...prev,
      [name]: name === 'format' || name === 'exportType' ? value : checked
    }));
  };

  /**
   * Exports the results based on selected format
   */
  const handleExport = async () => {
    onClose();
    
    if (exportOptions.exportType === 'pdf') {
      exportToPDF();
    } else if (exportOptions.exportType === 'csv') {
      exportToCSV();
    } else if (exportOptions.exportType === 'html') {
      exportToHTML();
    }
  };

  /**
   * Exports the results to CSV
   */
  const exportToCSV = () => {
    if (!result) return;
    
    try {
      setLoading(true);
      
      // Extract violations from results
      const violations = extractAxeResults(result, 'violations');
      
      // Create CSV header
      const csvHeader = 'Issue,Impact,Description,HTML Element\n';
      
      // Create CSV rows
      const csvRows = violations.map(issue => {
        const title = issue.title || issue.description || issue.help || 'Unknown Issue';
        const impact = issue.impact || issue.severity || 'Unknown';
        const description = (issue.description || issue.help || '').replace(/,/g, ';').replace(/\n/g, ' ');
        
        // Get HTML from nodes if available
        const html = issue.nodes && issue.nodes.length > 0 
          ? issue.nodes[0].html?.replace(/,/g, ';').replace(/\n/g, ' ') || 'N/A'
          : 'N/A';
        
        return `"${title}","${impact}","${description}","${html}"`;
      }).join('\n');
      
      // Combine header and rows
      const csvContent = `${csvHeader}${csvRows}`;
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `accessibility-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Failed to generate CSV. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exports the results to HTML
   */
  const exportToHTML = () => {
    if (!resultsRef.current) return;
    
    try {
      setLoading(true);
      
      // Clone the results element
      const element = resultsRef.current.cloneNode(true);
      
      // Hide code snippets if not included
      if (!exportOptions.includeCode) {
        const codeElements = element.querySelectorAll('.code-snippet');
        codeElements.forEach(el => {
          el.style.display = 'none';
        });
      }
      
      // Hide detailed descriptions if not included
      if (!exportOptions.includeDetails) {
        const detailElements = element.querySelectorAll('.issue-details');
        detailElements.forEach(el => {
          el.style.display = 'none';
        });
      }
      
      // Create HTML document
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Accessibility Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #4361ee;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
            }
            .score-card {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .issue {
              background: white;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
              border-left: 4px solid #4361ee;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .error { border-left-color: #f44336; }
            .warning { border-left-color: #ff9800; }
            .info { border-left-color: #2196f3; }
            .code-snippet {
              background: #f5f5f5;
              padding: 10px;
              border-radius: 4px;
              overflow-x: auto;
              font-family: monospace;
              font-size: 14px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <h1>Accessibility Analysis Report</h1>
          <div class="report-date">Generated on: ${new Date().toLocaleDateString()}</div>
          ${element.innerHTML}
          <div class="footer">
            Generated by Accessibility Analyzer
          </div>
        </body>
        </html>
      `;
      
      // Create a blob and download
      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `accessibility-report-${new Date().toISOString().split('T')[0]}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error generating HTML:', error);
      alert('Failed to generate HTML. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exports the results to PDF (placeholder - would need PDF library)
   */
  const exportToPDF = () => {
    // This would require a PDF generation library like jsPDF or react-pdf
    // For now, we'll show an alert
    alert('PDF export functionality would be implemented with a PDF library like jsPDF');
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Results</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select
              name="exportType"
              value={exportOptions.exportType}
              onChange={handleExportOptionChange}
              label="Export Format"
            >
              <MenuItem value="pdf">PDF Report</MenuItem>
              <MenuItem value="csv">CSV Data</MenuItem>
              <MenuItem value="html">HTML Report</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Report Detail</InputLabel>
            <Select
              name="format"
              value={exportOptions.format}
              onChange={handleExportOptionChange}
              label="Report Detail"
            >
              <MenuItem value="summary">Summary Only</MenuItem>
              <MenuItem value="detailed">Detailed Report</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Include in Export:
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                name="includeCode"
                checked={exportOptions.includeCode}
                onChange={handleExportOptionChange}
              />
            }
            label="Code Snippets"
          />

          <FormControlLabel
            control={
              <Checkbox
                name="includeDetails"
                checked={exportOptions.includeDetails}
                onChange={handleExportOptionChange}
              />
            }
            label="Detailed Descriptions"
          />

          <FormControlLabel
            control={
              <Checkbox
                name="includePasses"
                checked={exportOptions.includePasses}
                onChange={handleExportOptionChange}
              />
            }
            label="Passed Tests"
          />

          <FormControlLabel
            control={
              <Checkbox
                name="includeIncomplete"
                checked={exportOptions.includeIncomplete}
                onChange={handleExportOptionChange}
              />
            }
            label="Incomplete Tests"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleExport} variant="contained">
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
