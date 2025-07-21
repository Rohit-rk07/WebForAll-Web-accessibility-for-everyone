import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { Download } from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { extractAxeResults } from '../../utils/resultsUtils';

const ExportDialog = ({ open, onClose, result, resultsRef }) => {
  const [loading, setLoading] = useState(false);

  const exportToPDF = async () => {
    if (!resultsRef.current) return;
    
    try {
      setLoading(true);
      
      const element = resultsRef.current;
      const axeResults = extractAxeResults(result);
      const resultCounts = {
        violations: axeResults.violations?.length || 0,
        passes: axeResults.passes?.length || 0,
        incomplete: axeResults.incomplete?.length || 0,
        inapplicable: axeResults.inapplicable?.length || 0
      };
      
      // Create PDF without screenshot - structured report
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // Add title and header
      pdf.setFontSize(20);
      pdf.setTextColor(67, 97, 238);
      pdf.text('Accessibility Analysis Report', pdfWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pdfWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Add summary section
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      const score = result.score || { value: 0 };
      pdf.text(`Accessibility Score: ${score.value}/100`, 14, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(12);
      pdf.text(`Summary: ${resultCounts.violations} violations, ${resultCounts.passes} passes, ${resultCounts.incomplete} need review, ${resultCounts.inapplicable} not applicable`, 14, yPosition);
      yPosition += 8;
      
      // Add severity breakdown if violations exist
      if (resultCounts.violations > 0) {
        const severityCounts = result.severityCounts || { critical: 0, serious: 0, moderate: 0, minor: 0 };
        let severityText = 'Severity: ';
        
        if (severityCounts.critical > 0) severityText += `${severityCounts.critical} Serious, `;
        if (severityCounts.serious > 0) severityText += `${severityCounts.serious} Moderate, `;
        if (severityCounts.moderate > 0) severityText += `${severityCounts.moderate} Moderate, `;
        if (severityCounts.minor > 0) severityText += `${severityCounts.minor} Minor`;
        
        severityText = severityText.replace(/, $/, '');
        pdf.text(severityText, 14, yPosition);
        yPosition += 8;
      }
      
      // Add horizontal line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(14, yPosition, pdfWidth - 14, yPosition);
      yPosition += 10;
      
      // Violations Section
      if (axeResults.violations && axeResults.violations.length > 0) {
        // Check if we need a new page
        if (yPosition > pdfHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setTextColor(220, 53, 69); // Red color
        pdf.text(`Violations (${resultCounts.violations})`, 14, yPosition);
        yPosition += 10;
        
        axeResults.violations.forEach((violation, index) => {
          // Check if we need a new page
          if (yPosition > pdfHeight - 50) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Violation title
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          const title = violation.help || violation.id || 'Unknown Issue';
          pdf.text(`${index + 1}. ${title}`, 20, yPosition);
          yPosition += 8;
          
          // Impact level
          if (violation.impact) {
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Impact: ${violation.impact.toUpperCase()}`, 25, yPosition);
            yPosition += 6;
          }
          
          // Violation description
          if (violation.description) {
            pdf.setFontSize(10);
            pdf.setTextColor(80, 80, 80);
            const description = violation.description.replace(/<[^>]*>/g, ''); // Remove HTML tags
            const wrappedDescription = pdf.splitTextToSize(description, pdfWidth - 50);
            const linesToShow = Math.min(wrappedDescription.length, 4); // Show up to 4 lines
            pdf.text(wrappedDescription.slice(0, linesToShow), 25, yPosition);
            yPosition += linesToShow * 5 + 3;
          }
          
          // WCAG Guidelines
          if (violation.tags && violation.tags.length > 0) {
            const wcagTags = violation.tags.filter(tag => tag.startsWith('wcag'));
            if (wcagTags.length > 0) {
              pdf.setFontSize(9);
              pdf.setTextColor(100, 100, 100);
              pdf.text(`WCAG: ${wcagTags.join(', ').toUpperCase()}`, 25, yPosition);
              yPosition += 6;
            }
          }
          
          // HTML code snippet if available
          if (violation.nodes && violation.nodes.length > 0 && violation.nodes[0].html) {
            pdf.setFontSize(9);
            pdf.setTextColor(50, 50, 50);
            pdf.text('Affected Element:', 25, yPosition);
            yPosition += 5;
            
            // Add code background
            let htmlCode = violation.nodes[0].html.trim();
            if (htmlCode.length > 150) {
              htmlCode = htmlCode.substring(0, 150) + '...';
            }
            
            const wrappedCode = pdf.splitTextToSize(htmlCode, pdfWidth - 60);
            const codeHeight = Math.min(wrappedCode.length * 4 + 6, 20);
            
            pdf.setFillColor(248, 249, 250);
            pdf.rect(25, yPosition - 2, pdfWidth - 50, codeHeight, 'F');
            
            pdf.setFontSize(8);
            pdf.setTextColor(50, 50, 50);
            const codeLinesShown = Math.min(wrappedCode.length, 3);
            for (let i = 0; i < codeLinesShown; i++) {
              pdf.text(wrappedCode[i], 27, yPosition + 2 + (i * 4));
            }
            
            yPosition += codeHeight + 5;
          }
          
          yPosition += 5; // Space between violations
        });
        
        yPosition += 8;
      }
      
      // Passes Section
      if (axeResults.passes && axeResults.passes.length > 0) {
        // Check if we need a new page
        if (yPosition > pdfHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setTextColor(40, 167, 69); // Green color
        pdf.text(`Passed Tests (${resultCounts.passes})`, 14, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        pdf.text(`Great! Your website passes ${resultCounts.passes} accessibility tests.`, 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        
        // List first 15 passed tests with better formatting
        const passesToShow = Math.min(axeResults.passes.length, 15);
        axeResults.passes.slice(0, passesToShow).forEach((pass, index) => {
          if (yPosition > pdfHeight - 15) {
            pdf.addPage();
            yPosition = 20;
          }
          
          const title = pass.help || pass.id || 'Unknown Rule';
          // Wrap long titles
          const wrappedTitle = pdf.splitTextToSize(title, pdfWidth - 60);
          if (wrappedTitle.length > 1) {
            pdf.text(`${index + 1}. ${wrappedTitle[0]}`, 20, yPosition);
            yPosition += 4;
            pdf.text(`   ${wrappedTitle[1]}`, 20, yPosition);
            yPosition += 5;
          } else {
            pdf.text(`${index + 1}. ${title}`, 20, yPosition);
            yPosition += 5;
          }
        });
        
        if (axeResults.passes.length > 15) {
          pdf.setFontSize(9);
          pdf.setTextColor(120, 120, 120);
          pdf.text(`... and ${axeResults.passes.length - 15} more passing tests`, 20, yPosition);
          yPosition += 6;
        }
        
        yPosition += 8;
      }
      
      // Needs Review Section (Incomplete)
      if (axeResults.incomplete && axeResults.incomplete.length > 0) {
        // Check if we need a new page
        if (yPosition > pdfHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setTextColor(255, 193, 7); // Yellow/Orange color
        pdf.text(`Manual Review Required (${resultCounts.incomplete})`, 14, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        pdf.text(`These ${resultCounts.incomplete} items require manual testing to ensure full compliance.`, 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        
        // List incomplete tests with descriptions
        axeResults.incomplete.forEach((item, index) => {
          if (yPosition > pdfHeight - 25) {
            pdf.addPage();
            yPosition = 20;
          }
          
          const title = item.help || item.id || 'Unknown Rule';
          // Wrap long titles
          const wrappedTitle = pdf.splitTextToSize(title, pdfWidth - 60);
          if (wrappedTitle.length > 1) {
            pdf.text(`${index + 1}. ${wrappedTitle[0]}`, 20, yPosition);
            yPosition += 4;
            pdf.text(`   ${wrappedTitle[1]}`, 20, yPosition);
            yPosition += 6;
          } else {
            pdf.text(`${index + 1}. ${title}`, 20, yPosition);
            yPosition += 6;
          }
          
          // Add description if available
          if (item.description) {
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            const description = item.description.replace(/<[^>]*>/g, '').trim();
            if (description) {
              const wrappedDesc = pdf.splitTextToSize(description, pdfWidth - 60);
              const descLinesToShow = Math.min(wrappedDesc.length, 2);
              pdf.text(wrappedDesc.slice(0, descLinesToShow), 25, yPosition);
              yPosition += descLinesToShow * 4 + 3;
            }
            pdf.setFontSize(10);
            pdf.setTextColor(80, 80, 80);
          }
        });
        
        yPosition += 8;
      }
      
      // Not Applicable Section (brief summary)
      if (axeResults.inapplicable && axeResults.inapplicable.length > 0) {
        // Check if we need a new page
        if (yPosition > pdfHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(108, 117, 125); // Gray color
        pdf.text(`Not Applicable (${resultCounts.inapplicable})`, 14, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`${resultCounts.inapplicable} rules were not applicable to this page content.`, 20, yPosition);
        yPosition += 10;
      }
      
      // Not Applicable Section
      if (axeResults.inapplicable && axeResults.inapplicable.length > 0) {
        // Check if we need a new page
        if (yPosition > pdfHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setTextColor(108, 117, 125); // Gray color
        pdf.text(`Not Applicable (${resultCounts.inapplicable} rules)`, 14, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text('These tests were not applicable to the content (e.g., image tests when no images are present).', 20, yPosition);
        yPosition += 10;
      }
      
      // Generate filename and save
      const date = new Date().toISOString().split('T')[0];
      const filename = `accessibility-report-${date}.pdf`;
      pdf.save(filename);
      
      console.log('PDF export completed successfully');
      onClose();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    await exportToPDF();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Download />
          Export Results
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Export your accessibility analysis results as a PDF report.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The PDF will include:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <Typography component="li" variant="body2">Accessibility score and summary</Typography>
          <Typography component="li" variant="body2">Detailed violation reports</Typography>
          <Typography component="li" variant="body2">Passed tests and incomplete items</Typography>
          <Typography component="li" variant="body2">Visual snapshot of results</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleExport} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Download />}
        >
          {loading ? 'Generating PDF...' : 'Export PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
