import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Divider, 
  Chip, 
  Button, 
  CircularProgress,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Tooltip,
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
  Tabs,
  Tab,
  IconButton,
  TextField,
  Popover
} from '@mui/material';
import { 
  ErrorOutline, 
  WarningAmber, 
  InfoOutlined, 
  CheckCircleOutline, 
  ExpandMore,
  ArrowBack,
  AccessibilityNew,
  Download,
  PictureAsPdf,
  HelpOutline,
  Block,
  CheckCircle,
  SmartToy,
  Close,
  AutoFixHigh,
  Psychology,
  Chat
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTheme } from '@mui/material';
import aiService from '../services/aiService';

/**
 * Results Page component
 * Displays detailed accessibility analysis results in a structured format
 */
const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'a4',
    includeDetails: true,
    includeCode: true,
    exportType: 'pdf',
    includeScreenshot: false
  });
  const [activeTab, setActiveTab] = useState(0);
  const [resultCounts, setResultCounts] = useState({
    violations: 0,
    passes: 0,
    incomplete: 0,
    inapplicable: 0
  });
  const resultsRef = React.useRef(null);
  const theme = useTheme();
  
  // ChatGPT integration states
  const [aiExplainPopover, setAiExplainPopover] = useState(null);
  const [aiExplainIssue, setAiExplainIssue] = useState(null);
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  const [aiExplainContent, setAiExplainContent] = useState('');
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryContent, setAiSummaryContent] = useState('');
  
  // Theme-based colors
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
  
  // Severity level to icon/color mapping
  const severityMap = {
    error: { icon: <ErrorOutline sx={{ color: COLORS.error }} />, color: 'error' },
    warning: { icon: <WarningAmber sx={{ color: COLORS.warning }} />, color: 'warning' },
    info: { icon: <InfoOutlined sx={{ color: COLORS.info }} />, color: 'info' },
    notice: { icon: <InfoOutlined sx={{ color: COLORS.info }} />, color: 'info' },
    success: { icon: <CheckCircleOutline sx={{ color: COLORS.success }} />, color: 'success' },
    critical: { icon: <ErrorOutline sx={{ color: COLORS.error }} />, color: 'error' },
    serious: { icon: <WarningAmber sx={{ color: COLORS.warning }} />, color: 'warning' },
    moderate: { icon: <InfoOutlined sx={{ color: COLORS.primary }} />, color: 'info' },
    minor: { icon: <InfoOutlined sx={{ color: COLORS.info }} />, color: 'info' }
  };
  
  useEffect(() => {
    // Get result from location state or redirect to dashboard
    if (location.state?.result) {
      setResult(location.state.result);
      calculateScore(location.state.result);
      calculateResultCounts(location.state.result);
      setLoading(false);
    } else {
      navigate('/dashboard/home');
    }
  }, [location, navigate]);
  
  /**
   * Standardized data extraction utility for axe-core results
   * @param {Object} resultData - Analysis result data
   * @param {string} category - Category to extract (violations, passes, incomplete, inapplicable)
   * @returns {Array} Array of results for the specified category
   */
  const extractAxeResults = (resultData, category) => {
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
  const getNormalizedSeverity = (issue) => {
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
   * Calculate accessibility score based on violations
   * @param {Object} resultData - Analysis result data
   */
  const calculateScore = (resultData) => {
    // Extract violations using standardized utility
    const violations = extractAxeResults(resultData, 'violations');
    
    // Calculate severity breakdown for violations using standardized mapping
    const severityCounts = violations.reduce((acc, issue) => {
      const severity = getNormalizedSeverity(issue);
      
      if (severity === 'critical') {
        acc.critical++;
      } else if (severity === 'serious') {
        acc.serious++;
      } else if (severity === 'moderate') {
        acc.moderate++;
      } else {
        acc.minor++;
      }
      
      return acc;
    }, { critical: 0, serious: 0, moderate: 0, minor: 0 });
    
    // Calculate score (100 - deductions)
    // Critical: -5 points each
    // Serious: -2 points each  
    // Moderate: -1 point each
    // Minor: -0.5 points each
    const deduction = (severityCounts.critical * 5) + (severityCounts.serious * 2) + (severityCounts.moderate * 1) + (severityCounts.minor * 0.5);
    const calculatedScore = Math.max(0, Math.min(100, 100 - deduction));
    
    setScore({
      value: Math.round(calculatedScore),
      severityCounts: severityCounts,
      total: severityCounts.critical + severityCounts.serious + severityCounts.moderate + severityCounts.minor
    });
  };
  
  /**
   * Calculate counts for all result categories using standardized data extraction
   * @param {Object} resultData - Analysis result data
   */
  const calculateResultCounts = (resultData) => {
    if (!resultData) return;
    
    // Use standardized extraction for all categories
    const violations = extractAxeResults(resultData, 'violations');
    const passes = extractAxeResults(resultData, 'passes');
    const incomplete = extractAxeResults(resultData, 'incomplete');
    const inapplicable = extractAxeResults(resultData, 'inapplicable');
    
    const counts = {
      violations: violations.length,
      passes: passes.length,
      incomplete: incomplete.length,
      inapplicable: inapplicable.length
    };
    
    // Calculate severity breakdown for violations
    const severityCounts = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0
    };
    
    if (Array.isArray(resultData.results.violations)) {
      resultData.results.violations.forEach(violation => {
        const severity = (violation.impact || violation.severity || '').toLowerCase();
        if (severity.includes('critical')) severityCounts.critical++;
        else if (severity.includes('serious')) severityCounts.serious++;
        else if (severity.includes('moderate')) severityCounts.moderate++;
        else severityCounts.minor++;
      });
    }
    
    setResultCounts({
      ...counts,
      severityCounts
    });
  };
  
  /**
   * Gets the appropriate icon and color based on issue severity or impact
   * @param {string} severity - The severity level
   * @param {string} impact - The impact level (fallback)
   * @returns {Object} Object containing icon and color
   */
  const getSeverityProps = (severity, impact) => {
    // Convert to lowercase and handle undefined values
    const severityKey = severity?.toLowerCase() || '';
    const impactKey = impact?.toLowerCase() || '';
    
    // Try to find by severity first, then by impact, then default to info
    return severityMap[severityKey] || 
           severityMap[impactKey] || 
           severityMap.info;
  };
  
  /**
   * Get severity level text and color
   * @param {number} scoreValue - The calculated score value
   * @returns {Object} Object with level text and color
   */
  const getSeverityLevel = (scoreValue) => {
    if (scoreValue >= 90) {
      return { level: 'Excellent', color: COLORS.success };
    } else if (scoreValue >= 80) {
      return { level: 'Good', color: '#4caf50' };
    } else if (scoreValue >= 70) {
      return { level: 'Fair', color: '#ff9800' };
    } else if (scoreValue >= 60) {
      return { level: 'Poor', color: '#ff5722' };
    } else {
      return { level: 'Critical', color: COLORS.error };
    }
  };

  /**
   * Handle tab change
   * @param {Event} event - Change event
   * @param {number} newValue - New tab index
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  /**
   * Opens the export options dialog
   */
  const handleExportClick = () => {
    setExportDialogOpen(true);
  };

  /**
   * Closes the export options dialog
   */
  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
  };

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
    setExportDialogOpen(false);
    
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
      let violations = [];
      if (result.results && result.results.violations) {
        violations = result.results.violations;
      } else if (result.violations) {
        violations = result.violations;
      }
      
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
   * Exports the results to PDF
   */
  const exportToPDF = async () => {
    if (!resultsRef.current) return;
    
    try {
      // Show loading state
      setLoading(true);
      
      // Get the element to export
      const element = resultsRef.current;
      
      // Hide code snippets if not included
      const codeElements = element.querySelectorAll('.code-snippet');
      if (!exportOptions.includeCode) {
        codeElements.forEach(el => {
          el.style.display = 'none';
        });
      }
      
      // Hide detailed descriptions if not included
      const detailElements = element.querySelectorAll('.issue-details');
      if (!exportOptions.includeDetails) {
        detailElements.forEach(el => {
          el.style.display = 'none';
        });
      }
      
      // Create canvas from the element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      // Restore display of hidden elements
      if (!exportOptions.includeCode) {
        codeElements.forEach(el => {
          el.style.display = '';
        });
      }
      
      if (!exportOptions.includeDetails) {
        detailElements.forEach(el => {
          el.style.display = '';
        });
      }
      
      // Get canvas dimensions
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with appropriate format
      let format;
      switch(exportOptions.format) {
        case 'letter':
          format = 'letter';
          break;
        case 'legal':
          format = 'legal';
          break;
        default:
          format = 'a4';
      }
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: format
      });
      
      // Get PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Add title and metadata
      pdf.setFontSize(18);
      pdf.setTextColor(67, 97, 238); // Primary color
      pdf.text('Accessibility Analysis Report', pdfWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pdfWidth / 2, 28, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      // Add summary information
      if (score) {
        pdf.text(`Accessibility Score: ${score.value}/100`, 14, 40);
        
        // Add result counts
        pdf.text(`Summary: ${resultCounts.violations} violations, ${resultCounts.passes} passes, ${resultCounts.incomplete} need review, ${resultCounts.inapplicable} not applicable`, 14, 48);
        
        // Add severity breakdown if violations exist
        if (resultCounts.violations > 0) {
          let severityText = 'Severity: ';
          if (resultCounts.severityCounts.critical > 0) {
            severityText += `${resultCounts.severityCounts.critical} Critical, `;
          }
          if (resultCounts.severityCounts.serious > 0) {
            severityText += `${resultCounts.severityCounts.serious} Serious, `;
          }
          if (resultCounts.severityCounts.moderate > 0) {
            severityText += `${resultCounts.severityCounts.moderate} Moderate, `;
          }
          if (resultCounts.severityCounts.minor > 0) {
            severityText += `${resultCounts.severityCounts.minor} Minor`;
          }
          // Remove trailing comma and space if present
          severityText = severityText.replace(/, $/, '');
          
          pdf.text(severityText, 14, 56);
        }
      }
      
      // Add horizontal line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(14, 60, pdfWidth - 14, 60);
      
      // Calculate the number of pages
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 28) / imgWidth, (pdfHeight - 70) / imgHeight);
      const imgX = 14;
      const imgY = 70;
      
      // Add image if screenshot is included
      if (exportOptions.includeScreenshot) {
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      } else {
        // Add text-based report instead
        let yPosition = 70;
        
        // Add violations section
        if (result.results && result.results.violations && result.results.violations.length > 0) {
          pdf.setFontSize(14);
          pdf.setTextColor(220, 53, 69); // Error red
          pdf.text(`Violations (${resultCounts.violations})`, 14, yPosition);
          yPosition += 8;
          
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          
          // Add each violation
          result.results.violations.forEach((issue, index) => {
            // Check if we need a new page
            if (yPosition > pdfHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            
            const title = issue.title || issue.description || issue.help || 'Unknown Issue';
            const impact = issue.impact || issue.severity || 'Unknown';
            
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${index + 1}. ${title} - ${impact}`, 14, yPosition);
            yPosition += 6;
            
            if (exportOptions.includeDetails && issue.description) {
              const description = issue.description;
              const splitDescription = pdf.splitTextToSize(description, pdfWidth - 40);
              
              pdf.text(splitDescription, 20, yPosition);
              yPosition += splitDescription.length * 5 + 4;
            }
            
            if (exportOptions.includeCode && issue.nodes && issue.nodes.length > 0 && issue.nodes[0].html) {
              const html = issue.nodes[0].html;
              const splitHtml = pdf.splitTextToSize(html, pdfWidth - 40);
              
              pdf.setFillColor(245, 245, 245);
              pdf.rect(20, yPosition, pdfWidth - 40, splitHtml.length * 5 + 4, 'F');
              
              pdf.setTextColor(50, 50, 50);
              pdf.text(splitHtml, 22, yPosition + 4);
              yPosition += splitHtml.length * 5 + 8;
            }
            
            // Add some space between issues
            yPosition += 4;
          });
        }
        
        // Add passes section (if there's room)
        if (result.results && result.results.passes && result.results.passes.length > 0) {
          // Check if we need a new page
          if (yPosition > pdfHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          
          yPosition += 8;
          pdf.setFontSize(14);
          pdf.setTextColor(40, 167, 69); // Success green
          pdf.text(`Passes (${resultCounts.passes})`, 14, yPosition);
          yPosition += 8;
          
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          
          // List the top 5 pass rules
          const topPasses = result.results.passes.slice(0, 5);
          topPasses.forEach((pass, index) => {
            if (yPosition > pdfHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            
            const title = pass.id || 'Unknown Rule';
            
            pdf.text(`${index + 1}. ${title}`, 20, yPosition);
            yPosition += 6;
          });
          
          if (result.results.passes.length > 5) {
            pdf.text(`... and ${result.results.passes.length - 5} more passing rules`, 20, yPosition);
            yPosition += 6;
          }
        }
        
        // Add incomplete section (if there's room)
        if (result.results && result.results.incomplete && result.results.incomplete.length > 0) {
          // Check if we need a new page
          if (yPosition > pdfHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          
          yPosition += 8;
          pdf.setFontSize(14);
          pdf.setTextColor(255, 193, 7); // Warning yellow
          pdf.text(`Needs Review (${resultCounts.incomplete})`, 14, yPosition);
          yPosition += 8;
          
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          
          // List the top 3 incomplete rules
          const topIncomplete = result.results.incomplete.slice(0, 3);
          topIncomplete.forEach((item, index) => {
            if (yPosition > pdfHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            
            const title = item.id || 'Unknown Rule';
            
            pdf.text(`${index + 1}. ${title}`, 20, yPosition);
            yPosition += 6;
          });
          
          if (result.results.incomplete.length > 3) {
            pdf.text(`... and ${result.results.incomplete.length - 3} more rules needing review`, 20, yPosition);
            yPosition += 6;
          }
        }
        
        // Add inapplicable section (if there's room)
        if (result.results && result.results.inapplicable && result.results.inapplicable.length > 0) {
          // Check if we need a new page
          if (yPosition > pdfHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          
          yPosition += 8;
          pdf.setFontSize(14);
          pdf.setTextColor(108, 117, 125); // Secondary gray
          pdf.text(`Not Applicable (${resultCounts.inapplicable} rules)`, 14, yPosition);
          yPosition += 8;
          
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text("These tests were not applicable to the content (e.g., image tests when no images are present).", 20, yPosition);
          yPosition += 6;
        }
      }
      
      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `accessibility-report-${date}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
      
      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Handles opening the AI explanation popover
   * @param {Object} event - Click event
   * @param {Object} issue - The issue to explain
   */
  const handleAiExplainOpen = (event, issue) => {
    setAiExplainPopover(event.currentTarget);
    setAiExplainIssue(issue);
    setAiExplainLoading(true);
    
    // Call the AI service to get an explanation
    aiService.getIssueExplanation(issue)
      .then(response => {
        setAiExplainContent(response.explanation);
        setAiExplainLoading(false);
      })
      .catch(error => {
        console.error('Error getting AI explanation:', error);
        setAiExplainContent(`
## AI Service Temporarily Unavailable

I'm currently experiencing technical difficulties with my AI service. This might be due to API limits or connectivity issues.

### About This Issue:
${issue.title || issue.help || 'Accessibility Issue'}

${issue.description || ''}

### Alternative Resources:
- Check the [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) for information about this issue
- Visit [WebAIM](https://webaim.org/) for accessibility tutorials and fixes
- Try again later when the AI service might be available
        `);
        setAiExplainLoading(false);
      });
  };
  
  /**
   * Closes the AI explanation popover
   */
  const handleAiExplainClose = () => {
    setAiExplainPopover(null);
    setAiExplainIssue(null);
    setAiExplainContent('');
  };

  /**
   * Generates an AI summary of all accessibility issues
   */
  const handleAiSummaryOpen = () => {
    setAiSummaryOpen(true);
    setAiSummaryLoading(true);
    
    // Call the AI service to get a summary
    aiService.getResultsSummary(result.results)
      .then(response => {
        setAiSummaryContent(response.summary);
        setAiSummaryLoading(false);
      })
      .catch(error => {
        console.error('Error getting AI summary:', error);
        
        // Create a basic summary with the available data
        const violations = result.results.violations || [];
        const passes = result.results.passes || [];
        const incomplete = result.results.incomplete || [];
        const inapplicable = result.results.inapplicable || [];
        
        // Count issues by severity
        const severityCounts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
        violations.forEach(v => {
          const severity = (v.impact || v.severity || '').toLowerCase();
          if (severity.includes('critical')) severityCounts.critical++;
          else if (severity.includes('serious')) severityCounts.serious++;
          else if (severity.includes('moderate')) severityCounts.moderate++;
          else severityCounts.minor++;
        });
        
        setAiSummaryContent(`
# Accessibility Analysis Summary

## AI Service Note
I'm currently experiencing technical difficulties with my AI service. This might be due to API limits or connectivity issues. Here's a basic summary based on the available data.

## Overview
This page has **${violations.length} accessibility issues** that need to be addressed, with **${passes.length} passing checks** and **${incomplete.length} items that need manual review**.

## Severity Breakdown
- **${severityCounts.critical} Critical Issues**: These severely impact users with disabilities and should be fixed immediately.
- **${severityCounts.serious} Serious Issues**: These significantly impact accessibility and should be prioritized.
- **${severityCounts.moderate} Moderate Issues**: These somewhat impact accessibility and should be addressed.
- **${severityCounts.minor} Minor Issues**: These have minimal impact but should still be fixed for optimal accessibility.

## Key Issues
${violations.slice(0, 3).map(v => v.help || v.title || 'Unknown issue').join(', ')}

## Recommendations
1. **Fix Critical Issues First**: Focus on color contrast, missing alt text, and keyboard accessibility issues.
2. **Test with Real Users**: Consider testing with users who rely on assistive technologies.
3. **Implement Regular Scans**: Make accessibility testing part of your development workflow.
        `);
        
        setAiSummaryLoading(false);
      });
  };
  
  /**
   * Closes the AI summary dialog
   */
  const handleAiSummaryClose = () => {
    setAiSummaryOpen(false);
  };
  
  /**
   * Render the score card with circular progress
   * @returns {JSX.Element} Score card component
   */
  const renderScoreCard = () => {
    if (!score) return null;
    
    const severityInfo = getSeverityLevel(score.value);
    
    return (
      <Card 
        elevation={2} 
        sx={{ 
          mb: 4, 
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${COLORS.border}`
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Grid container>
            <Grid 
              item 
              xs={12} 
              md={4} 
              sx={{ 
                bgcolor: 'rgba(67, 97, 238, 0.05)', 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: { xs: 'none', md: `1px solid ${COLORS.border}` },
                borderBottom: { xs: `1px solid ${COLORS.border}`, md: 'none' }
              }}
            >
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                <CircularProgress 
                  variant="determinate" 
                  value={score.value} 
                  size={120}
                  thickness={5}
                  sx={{ color: severityInfo.color }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="h4"
                    component="div"
                    color={COLORS.text}
                    fontWeight="bold"
                  >
                    {score.value}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" color={severityInfo.color} fontWeight="medium" gutterBottom>
                {severityInfo.level}
              </Typography>
              <Typography variant="body2" color={COLORS.lightText} textAlign="center">
                Accessibility Score
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" color={COLORS.text} fontWeight="medium" gutterBottom>
                  Summary
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="h5" color={COLORS.error} fontWeight="bold">
                        {resultCounts.violations}
                      </Typography>
                      <Typography variant="body2" color={COLORS.lightText}>
                        Violations
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="h5" color={COLORS.success} fontWeight="bold">
                        {resultCounts.passes}
                      </Typography>
                      <Typography variant="body2" color={COLORS.lightText}>
                        Passes
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="h5" color={COLORS.warning} fontWeight="bold">
                        {resultCounts.incomplete}
                      </Typography>
                      <Typography variant="body2" color={COLORS.lightText}>
                        Needs Review
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="h5" color={COLORS.info} fontWeight="bold">
                        {resultCounts.inapplicable}
                      </Typography>
                      <Typography variant="body2" color={COLORS.lightText}>
                        Not Applicable
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color={COLORS.lightText}>
                    Analysis Mode: <strong>{result?.mode || 'unknown'}</strong>
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Download />}
                    sx={{ borderRadius: 2 }}
                    onClick={handleExportClick}
                  >
                    Export Report
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  /**
   * Render tabs for different result types
   * @returns {JSX.Element} Tabs component
   */
  const renderResultTabs = () => {
    if (!result || !result.results) return null;
    
    return (
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: COLORS.border,
              '& .MuiTabs-indicator': {
                backgroundColor: COLORS.primary,
                height: 3
              }
            }}
          >
            <Tab 
              icon={<ErrorOutline />} 
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="body2">
                    Violations ({resultCounts.violations})
                  </Typography>
                  {resultCounts.severityCounts && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {resultCounts.severityCounts.critical > 0 && (
                        <Chip 
                          label={`${resultCounts.severityCounts.critical} Critical`} 
                          size="small" 
                          color="error" 
                          sx={{ height: 20, fontSize: '0.65rem' }} 
                        />
                      )}
                      {resultCounts.severityCounts.serious > 0 && (
                        <Chip 
                          label={`${resultCounts.severityCounts.serious} Serious`} 
                          size="small" 
                          color="warning" 
                          sx={{ height: 20, fontSize: '0.65rem' }} 
                        />
                      )}
                    </Box>
                  )}
                </Box>
              }
              sx={{ 
                color: activeTab === 0 ? COLORS.error : COLORS.lightText,
                '&.Mui-selected': { color: COLORS.error }
              }}
            />
            <Tab 
              icon={<CheckCircle />} 
              label={`Passes (${resultCounts.passes})`}
              sx={{ 
                color: activeTab === 1 ? COLORS.success : COLORS.lightText,
                '&.Mui-selected': { color: COLORS.success }
              }}
            />
            <Tab 
              icon={<HelpOutline />} 
              label={`Needs Review (${resultCounts.incomplete})`}
              sx={{ 
                color: activeTab === 2 ? COLORS.warning : COLORS.lightText,
                '&.Mui-selected': { color: COLORS.warning }
              }}
            />
            <Tab 
              icon={<Block />} 
              label={`Not Applicable (${resultCounts.inapplicable})`}
              sx={{ 
                color: activeTab === 3 ? COLORS.info : COLORS.lightText,
                '&.Mui-selected': { color: COLORS.info }
              }}
            />
          </Tabs>
          
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && renderViolations()}
            {activeTab === 1 && renderPasses()}
            {activeTab === 2 && renderIncomplete()}
            {activeTab === 3 && renderInapplicable()}
          </Box>
        </Paper>
      </Box>
    );
  };
  
  /**
   * Render violations (issues)
   * @returns {JSX.Element} Violations component
   */
  const renderViolations = () => {
    const violations = extractAxeResults(result, 'violations');
    
    if (violations.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CheckCircleOutline sx={{ fontSize: 60, color: COLORS.success, mb: 2 }} />
          <Typography variant="h6" gutterBottom>No Violations Found</Typography>
          <Typography color="textSecondary">
            Great job! No accessibility violations were detected.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        {violations.map((issue, index) => {
          const severity = getNormalizedSeverity(issue);
          const { icon, color } = getSeverityProps(severity);
          
          return (
            <Accordion 
              key={`violation-${index}`}
              elevation={0}
              sx={{ 
                mb: 2, 
                border: `1px solid ${COLORS.border}`,
                borderLeft: `4px solid ${COLORS[color] || COLORS.error}`,
                borderRadius: 1,
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ 
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                  borderBottom: `1px solid ${COLORS.border}`,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="medium" color={COLORS.text}>
                    {issue.id || issue.rule || 'Unknown Rule'}
                  </Typography>
                  <Chip 
                    label={issue.impact || 'impact'}
                    size="small"
                    color={color}
                    sx={{ ml: 2 }}
                  />
                  <Button
                    startIcon={<Psychology />}
                    variant="outlined"
                    size="small"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAiExplainOpen(e, issue);
                    }}
                    sx={{ ml: 'auto', minWidth: 120 }}
                  >
                    AI Suggestion
                  </Button>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3 }}>
                {issue.description && (
                  <Box sx={{ mb: 2 }} className="issue-details">
                    <Typography variant="body1" gutterBottom>
                      {issue.description}
                    </Typography>
                  </Box>
                )}
                
                {issue.helpUrl && (
                  <Box sx={{ mb: 2 }}>
                    <Button 
                      href={issue.helpUrl} 
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<HelpOutline />}
                      size="small"
                      variant="text"
                    >
                      Learn more about this issue
                    </Button>
                  </Box>
                )}
                
                {issue.nodes && issue.nodes.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Affected Elements ({issue.nodes.length})
                    </Typography>
                    
                    {issue.nodes.map((node, nodeIndex) => (
                      <Box 
                        key={`node-${index}-${nodeIndex}`}
                        sx={{ 
                          mb: 2,
                          p: 2,
                          backgroundColor: COLORS.codeBackground,
                          borderRadius: 1,
                          overflow: 'auto'
                        }}
                        className="code-snippet"
                      >
                        <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', m: 0 }}>
                          {node.html}
                        </Typography>
                        
                        {node.failureSummary && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="error">
                              {node.failureSummary}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  };
  
  /**
   * Render passes (successful checks)
   * @returns {JSX.Element} Passes component
   */
  const renderPasses = () => {
    const passes = extractAxeResults(result, 'passes');
    
    if (passes.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <InfoOutlined sx={{ fontSize: 60, color: COLORS.info, mb: 2 }} />
          <Typography variant="h5" color={COLORS.text} gutterBottom>
            No Passing Tests
          </Typography>
          <Typography variant="body1" color={COLORS.lightText}>
            No accessibility tests were passed. This may indicate serious accessibility issues.
          </Typography>
        </Box>
      );
    }
    
    // Group passes by rule
    const groupedPasses = passes.reduce((acc, pass) => {
      const rule = pass.id || 'Other';
      if (!acc[rule]) acc[rule] = [];
      acc[rule].push(pass);
      return acc;
    }, {});
    
    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" color={COLORS.text} gutterBottom>
          Passed Accessibility Tests
        </Typography>
        
        {Object.entries(groupedPasses).map(([rule, rulePasses]) => (
          <Accordion 
            key={rule} 
            sx={{ 
              mb: 2,
              borderRadius: '8px !important',
              overflow: 'hidden',
              '&:before': {
                display: 'none',
              },
              border: `1px solid ${COLORS.border}`
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMore />}
              sx={{ 
                bgcolor: 'rgba(0, 0, 0, 0.02)',
                borderBottom: `1px solid ${COLORS.border}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography variant="subtitle1" fontWeight="medium" color={COLORS.text}>
                  {rule}
                </Typography>
                <Chip 
                  label={`${rulePasses.length} ${rulePasses.length === 1 ? 'element' : 'elements'}`}
                  size="small"
                  color="success"
                  sx={{ ml: 2 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color={COLORS.text} paragraph>
                {rulePasses[0].description || rulePasses[0].help || `Test "${rule}" passed successfully.`}
              </Typography>
              
              <Typography variant="subtitle2" color={COLORS.text} sx={{ mt: 2, mb: 1 }}>
                Passing Elements:
              </Typography>
              
              <List disablePadding>
                {rulePasses.map((pass, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem 
                      sx={{ 
                        py: 1,
                        bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.01)' : 'transparent'
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <CheckCircleOutline sx={{ color: COLORS.success }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ mb: 1 }}>
                            {pass.nodes && pass.nodes.length > 0 && pass.nodes[0].html && (
                              <Box 
                                sx={{ 
                                  bgcolor: COLORS.codeBackground, 
                                  p: 1.5, 
                                  borderRadius: 1,
                                  overflowX: 'auto',
                                  my: 1,
                                  border: `1px solid ${COLORS.border}`
                                }}
                                className="code-snippet"
                              >
                                <Typography 
                                  variant="body2" 
                                  component="code" 
                                  sx={{ 
                                    fontFamily: 'monospace', 
                                    m: 0,
                                    fontSize: '0.85rem',
                                    color: COLORS.text,
                                    display: 'block'
                                  }}
                                >
                                  {pass.nodes[0].html}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };
  
  /**
   * Render incomplete (needs review) checks
   * @returns {JSX.Element} Incomplete component
   */
  const renderIncomplete = () => {
    const incomplete = extractAxeResults(result, 'incomplete');
    
    if (incomplete.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleOutline sx={{ fontSize: 60, color: COLORS.success, mb: 2 }} />
          <Typography variant="h5" color={COLORS.text} gutterBottom>
            No Tests Need Review
          </Typography>
          <Typography variant="body1" color={COLORS.lightText}>
            All tests were either passed, failed, or not applicable.
          </Typography>
        </Box>
      );
    }
    
    // Group incomplete by rule
    const groupedIncomplete = incomplete.reduce((acc, item) => {
      const rule = item.id || 'Other';
      if (!acc[rule]) acc[rule] = [];
      acc[rule].push(item);
      return acc;
    }, {});
    
    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" color={COLORS.text} gutterBottom>
          Tests Needing Manual Review
        </Typography>
        <Typography variant="body2" color={COLORS.lightText} paragraph>
          These tests couldn't be automatically verified and require human judgment.
        </Typography>
        
        {Object.entries(groupedIncomplete).map(([rule, items]) => (
          <Accordion 
            key={rule} 
            sx={{ 
              mb: 2,
              borderRadius: '8px !important',
              overflow: 'hidden',
              '&:before': {
                display: 'none',
              },
              border: `1px solid ${COLORS.border}`
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMore />}
              sx={{ 
                bgcolor: 'rgba(0, 0, 0, 0.02)',
                borderBottom: `1px solid ${COLORS.border}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography variant="subtitle1" fontWeight="medium" color={COLORS.text}>
                  {rule}
                </Typography>
                <Chip 
                  label={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
                  size="small"
                  color="warning"
                  sx={{ ml: 2 }}
                />
                <Button
                  startIcon={<Psychology />}
                  variant="outlined"
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAiExplainOpen(e, { ...items[0], type: 'incomplete' });
                  }}
                  sx={{ ml: 'auto', minWidth: 120 }}
                >
                  Needs Review
                </Button>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color={COLORS.text} paragraph>
                {items[0].description || items[0].help || `Test "${rule}" needs manual verification.`}
              </Typography>
              
              <Typography variant="subtitle2" color={COLORS.text} sx={{ mt: 2, mb: 1 }}>
                Elements to Review:
              </Typography>
              
              <List disablePadding>
                {items.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem 
                      sx={{ 
                        py: 1,
                        bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.01)' : 'transparent'
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <HelpOutline sx={{ color: COLORS.warning }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ mb: 1 }}>
                            {item.nodes && item.nodes.length > 0 && item.nodes[0].html && (
                              <Box 
                                sx={{ 
                                  bgcolor: COLORS.codeBackground, 
                                  p: 1.5, 
                                  borderRadius: 1,
                                  overflowX: 'auto',
                                  my: 1,
                                  border: `1px solid ${COLORS.border}`
                                }}
                                className="code-snippet"
                              >
                                <Typography 
                                  variant="body2" 
                                  component="code" 
                                  sx={{ 
                                    fontFamily: 'monospace', 
                                    m: 0,
                                    fontSize: '0.85rem',
                                    color: COLORS.text,
                                    display: 'block'
                                  }}
                                >
                                  {item.nodes[0].html}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                        secondary={
                          item.nodes && item.nodes.length > 0 && item.nodes[0].any && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color={COLORS.warning}>
                                <strong>Check needed:</strong> {item.nodes[0].any[0]?.message || 'Manual review required'}
                              </Typography>
                            </Box>
                          )
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };
  
  /**
   * Render inapplicable tests
   * @returns {JSX.Element} Inapplicable component
   */
  const renderInapplicable = () => {
    const inapplicable = extractAxeResults(result, 'inapplicable');
    
    if (inapplicable.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <InfoOutlined sx={{ fontSize: 60, color: COLORS.info, mb: 2 }} />
          <Typography variant="h5" color={COLORS.text} gutterBottom>
            No Inapplicable Tests
          </Typography>
          <Typography variant="body1" color={COLORS.lightText}>
            All tests were applicable to this content.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" color={COLORS.text} gutterBottom>
          Inapplicable Tests
        </Typography>
        <Typography variant="body2" color={COLORS.lightText} paragraph>
          These tests were not applicable to your content (e.g., image tests when no images are present).
        </Typography>
        
        <List 
          sx={{ 
            border: `1px solid ${COLORS.border}`,
            borderRadius: 2,
            bgcolor: COLORS.background
          }}
        >
          {inapplicable.map((rule, index) => (
            <React.Fragment key={rule.id || index}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                sx={{ 
                  py: 1.5,
                  bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.01)' : 'transparent'
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Block sx={{ color: COLORS.lightText }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" fontWeight="medium" color={COLORS.text}>
                      {rule.id || `Rule #${index + 1}`}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color={COLORS.lightText}>
                      {rule.description || rule.help || 'This test was not applicable to your content.'}
                    </Typography>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Box>
    );
  };
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard/home')}
            sx={{ mb: 3 }}
          >
            Back to Dashboard
          </Button>
          
          <Box ref={resultsRef}>
            {renderScoreCard()}
            {renderResultTabs()}
          </Box>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Psychology />}
              onClick={handleAiSummaryOpen}
            >
              AI Analysis Summary
            </Button>
          </Box>
          
          {/* AI Explanation Popover */}
          <Popover
            open={Boolean(aiExplainPopover)}
            anchorEl={aiExplainPopover}
            onClose={handleAiExplainClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              sx: {
                width: 500,
                p: 3,
                maxHeight: 600,
                overflow: 'auto'
              }
            }}
          >
            {aiExplainLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Psychology sx={{ mr: 1, color: COLORS.primary }} />
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    AI Explanation & Fix
                  </Typography>
                  <IconButton onClick={handleAiExplainClose} size="small">
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
                <Box>
                  {aiExplainContent.split('```').map((part, i) => {
                    if (i % 2 === 0) {
                      // Regular text - render markdown-style formatting
                      return (
                        <Typography key={i} variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: part.trim() ? 1 : 0 }}>
                          {part.split('**').map((textPart, j) => 
                            j % 2 === 0 ? textPart : <strong key={j}>{textPart}</strong>
                          )}
                        </Typography>
                      );
                    } else {
                      // Code block
                      const lines = part.split('\n');
                      const language = lines[0]?.trim() || 'html';
                      const code = lines.slice(1).join('\n').trim();
                      
                      if (!code) return null;
                      
                      return (
                        <Box key={i} sx={{ my: 2 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary', 
                              mb: 0.5, 
                              display: 'block',
                              textTransform: 'uppercase',
                              fontWeight: 'bold',
                              fontSize: '0.7rem'
                            }}
                          >
                            {language}
                          </Typography>
                          <Box 
                            component="pre" 
                            sx={{ 
                              bgcolor: '#f8f9fa', 
                              p: 2, 
                              borderRadius: 2, 
                              overflow: 'auto',
                              fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                              fontSize: '0.875rem',
                              lineHeight: 1.5,
                              border: '1px solid #e1e4e8',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                              m: 0,
                              '& .hljs-tag': { color: '#22863a' },
                              '& .hljs-name': { color: '#22863a' },
                              '& .hljs-attr': { color: '#6f42c1' },
                              '& .hljs-string': { color: '#032f62' },
                              '& .hljs-keyword': { color: '#d73a49', fontWeight: 'bold' },
                              '& .hljs-comment': { color: '#6a737d', fontStyle: 'italic' }
                            }}
                          >
                            <code 
                              style={{ 
                                display: 'block',
                                whiteSpace: 'pre',
                                color: '#24292e'
                              }}
                              dangerouslySetInnerHTML={{ 
                                __html: code
                                  .replace(/&/g, '&amp;')
                                  .replace(/</g, '&lt;')
                                  .replace(/>/g, '&gt;')
                                  // HTML tag highlighting
                                  .replace(/(&lt;\/?)(\w+)/g, '<span class="hljs-tag">&lt;<span class="hljs-name">$2</span></span>')
                                  .replace(/(&gt;)/g, '<span class="hljs-tag">&gt;</span>')
                                  // Attribute highlighting
                                  .replace(/(\w+)=/g, '<span class="hljs-attr">$1</span>=')
                                  // String highlighting
                                  .replace(/"([^"]*)"/g, '<span class="hljs-string">"$1"</span>')
                                  .replace(/'([^']*)'/g, '<span class="hljs-string">\&#39;$1\&#39;</span>')
                                  // Comment highlighting
                                  .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hljs-comment">$1</span>')
                              }} 
                            />
                          </Box>
                        </Box>
                      );
                    }
                  })}
                </Box>
                
                {/* Continue in Chat Button */}
                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${COLORS.divider}` }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Chat />}
                    onClick={() => {
                      // Add the explanation to chat context
                      const issueHtml = aiExplainIssue?.nodes?.[0]?.html || aiExplainIssue?.element || 'No HTML code available';
                      const chatMessage = `I need help with this accessibility issue:\n\n**Issue:** ${aiExplainIssue?.title || aiExplainIssue?.help || 'Accessibility Issue'}\n\n**HTML Code:**\n\`\`\`html\n${issueHtml}\n\`\`\`\n\n**Previous AI Suggestion:**\n${aiExplainContent}\n\nCan you help me understand this better or provide additional guidance for fixing this accessibility issue?`;
                      
                      // Close the popover
                      handleAiExplainClose();
                      
                      // Open chat with the context using global method
                      if (window.aiChatbot) {
                        window.aiChatbot.addContextMessage(chatMessage);
                      }
                    }}
                    sx={{ 
                      color: COLORS.primary,
                      borderColor: COLORS.primary,
                      '&:hover': {
                        bgcolor: `${COLORS.primary}10`,
                        borderColor: COLORS.primary
                      }
                    }}
                  >
                    Continue in Chat
                  </Button>
                </Box>
              </Box>
            )}
          </Popover>
          
          {/* AI Summary Dialog */}
          <Dialog
            open={aiSummaryOpen}
            onClose={handleAiSummaryClose}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Psychology sx={{ mr: 1, color: COLORS.primary }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  AI Accessibility Analysis
                </Typography>
                <IconButton onClick={handleAiSummaryClose} size="small">
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {aiSummaryLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Typography 
                  variant="body1" 
                  component="div" 
                  sx={{ 
                    '& h1': { 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold',
                      mb: 2
                    },
                    '& h2': { 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold',
                      mt: 3,
                      mb: 1
                    },
                    '& p': {
                      mb: 1.5
                    },
                    '& ul, & ol': {
                      pl: 2,
                      mb: 2
                    },
                    '& li': {
                      mb: 0.5
                    }
                  }}
                >
                  {aiSummaryContent}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleAiSummaryClose}>Close</Button>

            </DialogActions>
          </Dialog>
        </>
      )}
      

    </Box>
  );
};

export default ResultsPage; 