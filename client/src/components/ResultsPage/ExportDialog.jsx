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
import { extractAxeResults, calculateAccessibilityScore } from '../../utils/resultsUtils';

// Constants
const PDF_CONFIG = {
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
};

const COLORS = {
  primary: [67, 97, 238],
  success: [40, 167, 69],
  warning: [255, 193, 7],
  danger: [220, 53, 69],
  secondary: [108, 117, 125],
  light: [248, 249, 250],
  border: [200, 200, 200],
  text: [0, 0, 0],
  textSecondary: [100, 100, 100],
  white: [255, 255, 255]
};

const SEVERITY_CONFIG = [
  { label: 'Critical', key: 'critical', color: COLORS.danger },
  { label: 'Serious', key: 'serious', color: [255, 107, 107] },
  { label: 'Moderate', key: 'moderate', color: COLORS.warning },
  { label: 'Minor', key: 'minor', color: COLORS.secondary }
];

const ExportDialog = ({ open, onClose, result, resultsRef }) => {
  const [loading, setLoading] = useState(false);

  const exportToPDF = async () => {
    if (!resultsRef.current) return;
    
    try {
      setLoading(true);
      
      // Debug: Log the result data structure
      console.log('PDF Export - Result data:', result);
      
      const axeResults = {
        violations: extractAxeResults(result, 'violations'),
        passes: extractAxeResults(result, 'passes'),
        incomplete: extractAxeResults(result, 'incomplete'),
        inapplicable: extractAxeResults(result, 'inapplicable')
      };
      
      const resultCounts = {
        violations: axeResults.violations?.length || 0,
        passes: axeResults.passes?.length || 0,
        incomplete: axeResults.incomplete?.length || 0,
        inapplicable: axeResults.inapplicable?.length || 0
      };
      
      // Debug: Log the extracted counts
      console.log('PDF Export - Result counts:', resultCounts);
      
      // Create PDF with proper document structure
      const pdf = new jsPDF(PDF_CONFIG);
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pdfWidth - (margin * 2);
      let yPosition = margin;
      
      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace = 20) => {
        if (yPosition + requiredSpace > pdfHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };
      
      // Helper function to add section header
      const addSectionHeader = (title, color = [0, 0, 0], fontSize = 16) => {
        checkNewPage(15);
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        pdf.text(title, margin, yPosition);
        yPosition += fontSize === 16 ? 12 : 10;
        
        // Add underline for main sections
        if (fontSize === 16) {
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, yPosition - 2, pdfWidth - margin, yPosition - 2);
          yPosition += 6;
        }
      };
      
      // Helper function to add wrapped text
      const addWrappedText = (text, fontSize = 10, color = [0, 0, 0], indent = 0) => {
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        const wrappedText = pdf.splitTextToSize(text, contentWidth - indent);
        const textHeight = wrappedText.length * (fontSize * 0.4) + 2;
        
        checkNewPage(textHeight);
        pdf.text(wrappedText, margin + indent, yPosition);
        yPosition += textHeight;
        return textHeight;
      };
      
      // Helper function to add code block
      const addCodeBlock = (code, maxLength = 200) => {
        if (!code) return;
        
        let displayCode = code.trim();
        if (displayCode.length > maxLength) {
          displayCode = displayCode.substring(0, maxLength) + '...';
        }
        
        const wrappedCode = pdf.splitTextToSize(displayCode, contentWidth - 20);
        const codeHeight = Math.min(wrappedCode.length * 4 + 8, 30);
        
        checkNewPage(codeHeight + 5);
        
        // Add code background
        pdf.setFillColor(248, 249, 250);
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(margin + 10, yPosition - 2, contentWidth - 20, codeHeight, 'FD');
        
        // Add code text
        pdf.setFontSize(8);
        pdf.setTextColor(50, 50, 50);
        const maxLines = Math.floor((codeHeight - 4) / 4);
        for (let i = 0; i < Math.min(wrappedCode.length, maxLines); i++) {
          pdf.text(wrappedCode[i], margin + 12, yPosition + 2 + (i * 4));
        }
        
        yPosition += codeHeight + 6;
      };
      
      // Document Title and Metadata
      pdf.setFontSize(24);
      pdf.setTextColor(...COLORS.primary);
      pdf.text('Web Accessibility Analysis Report', pdfWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      pdf.setFontSize(11);
      pdf.setTextColor(...COLORS.textSecondary);
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Generated on: ${reportDate}`, pdfWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;
      
      // Executive Summary Section
      addSectionHeader('Executive Summary', COLORS.primary, 18);
      
      // Calculate score properly using the same logic as the main page
      const scoreData = calculateAccessibilityScore(result);
      const score = scoreData?.score || result.score || 0;
      const actualScore = typeof score === 'object' ? score.value || 0 : score;
      
      pdf.setFontSize(14);
      pdf.setTextColor(...COLORS.text);
      pdf.text(`Overall Accessibility Score: ${actualScore}/100`, margin, yPosition);
      yPosition += 10;
      
      // Debug: Log score calculation
      console.log('PDF Export - Score calculation:', { scoreData, score, actualScore });
      
      // Score interpretation
      let scoreInterpretation = '';
      if (actualScore >= 90) scoreInterpretation = 'Excellent - Meets high accessibility standards';
      else if (actualScore >= 75) scoreInterpretation = 'Good - Minor improvements needed';
      else if (actualScore >= 60) scoreInterpretation = 'Fair - Several issues require attention';
      else scoreInterpretation = 'Needs Improvement - Significant accessibility barriers present';
      
      addWrappedText(scoreInterpretation, 11, [100, 100, 100]);
      yPosition += 5;
      
      // Results Summary Table
      const summaryData = [
        ['Test Results', 'Count', 'Status'],
        ['Violations', resultCounts.violations.toString(), resultCounts.violations > 0 ? 'Action Required' : 'None Found'],
        ['Passed Tests', resultCounts.passes.toString(), 'Compliant'],
        ['Manual Review', resultCounts.incomplete.toString(), 'Verification Needed'],
        ['Not Applicable', resultCounts.inapplicable.toString(), 'N/A']
      ];
      
      checkNewPage(40);
      const tableY = yPosition;
      const colWidths = [60, 30, 50];
      const rowHeight = 7;
      
      summaryData.forEach((row, rowIndex) => {
        let xPos = margin;
        const isHeader = rowIndex === 0;
        const fillColor = isHeader ? [67, 97, 238] : [rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 250 : 255];
        
        row.forEach((cell, colIndex) => {
          const cellY = tableY + (rowIndex * rowHeight);
          
          // Set styling based on row type
          pdf.setFillColor(...fillColor);
          pdf.setTextColor(isHeader ? 255 : 0, isHeader ? 255 : 0, isHeader ? 255 : 0);
          pdf.setFontSize(isHeader ? 10 : 9);
          
          // Draw cell background and border
          pdf.rect(xPos, cellY, colWidths[colIndex], rowHeight, 'FD');
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(xPos, cellY, colWidths[colIndex], rowHeight, 'S');
          
          // Add cell text
          pdf.text(cell, xPos + 2, cellY + 5);
          xPos += colWidths[colIndex];
        });
      });
      
      yPosition = tableY + (summaryData.length * rowHeight) + 15;
      
      // Severity Breakdown
      if (resultCounts.violations > 0) {
        const severityCounts = result.severityCounts || { critical: 0, serious: 0, moderate: 0, minor: 0 };
        addWrappedText('Severity Breakdown:', 12, COLORS.text);
        
        SEVERITY_CONFIG.forEach(severity => {
          const count = severityCounts[severity.key] || 0;
          if (count > 0) {
            pdf.setFontSize(10);
            pdf.setTextColor(...severity.color);
            pdf.text(`• ${severity.label}: ${count} issue${count > 1 ? 's' : ''}`, margin + 10, yPosition);
            yPosition += 6;
          }
        });
        
        yPosition += 10;
      }
      
      // Violations Section
      if (axeResults.violations && axeResults.violations.length > 0) {
        addSectionHeader('Accessibility Violations', COLORS.danger, 16);
        
        addWrappedText(
          `Found ${resultCounts.violations} accessibility violation${resultCounts.violations > 1 ? 's' : ''} that must be addressed to improve compliance.`,
          11, [80, 80, 80]
        );
        yPosition += 5;
        
        axeResults.violations.forEach((violation, index) => {
          checkNewPage(35);
          
          // Violation number and title
          pdf.setFontSize(13);
          pdf.setTextColor(220, 53, 69);
          pdf.text(`${index + 1}.`, margin, yPosition);
          
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          const title = violation.help || violation.id || 'Unknown Issue';
          const wrappedTitle = pdf.splitTextToSize(title, contentWidth - 15);
          pdf.text(wrappedTitle, margin + 8, yPosition);
          yPosition += wrappedTitle.length * 5 + 3;
          
          // Impact and WCAG info in a styled box
          const impactColor = {
            'critical': [220, 53, 69],
            'serious': [255, 107, 107], 
            'moderate': [255, 193, 7],
            'minor': [108, 117, 125]
          }[violation.impact] || [108, 117, 125];
          
          pdf.setFillColor(250, 250, 250);
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(margin + 10, yPosition - 2, contentWidth - 20, 12, 'FD');
          
          pdf.setFontSize(10);
          pdf.setTextColor(...impactColor);
          pdf.text(`Impact: ${(violation.impact || 'unknown').toUpperCase()}`, margin + 12, yPosition + 3);
          
          // WCAG Guidelines
          if (violation.tags && violation.tags.length > 0) {
            const wcagTags = violation.tags.filter(tag => tag.startsWith('wcag'));
            if (wcagTags.length > 0) {
              pdf.setTextColor(100, 100, 100);
              pdf.text(`WCAG: ${wcagTags.join(', ').toUpperCase()}`, margin + 80, yPosition + 3);
            }
          }
          
          yPosition += 15;
          
          // Description
          if (violation.description) {
            addWrappedText('Issue Description:', 11, [0, 0, 0], 10);
            const cleanDescription = violation.description.replace(/<[^>]*>/g, '').trim();
            addWrappedText(cleanDescription, 10, [60, 60, 60], 15);
            yPosition += 3;
          }
          
          // How to fix
          if (violation.helpUrl) {
            addWrappedText('Learn More:', 11, [0, 0, 0], 10);
            addWrappedText(violation.helpUrl, 9, [67, 97, 238], 15);
            yPosition += 3;
          }
          
          // Affected elements
          if (violation.nodes && violation.nodes.length > 0) {
            addWrappedText(`Affected Element${violation.nodes.length > 1 ? 's' : ''}:`, 11, [0, 0, 0], 10);
            
            violation.nodes.slice(0, 3).forEach((node, nodeIndex) => {
              if (node.html) {
                addCodeBlock(node.html, 180);
              }
              
              // Add target info if available
              if (node.target && node.target.length > 0) {
                addWrappedText(`Selector: ${node.target.join(', ')}`, 9, [100, 100, 100], 15);
              }
            });
            
            if (violation.nodes.length > 3) {
              addWrappedText(`... and ${violation.nodes.length - 3} more affected elements`, 9, [120, 120, 120], 15);
            }
          }
          
          yPosition += 8; // Space between violations
        });
        
        yPosition += 10;
      }
      
      // Passes Section
      if (axeResults.passes && axeResults.passes.length > 0) {
        addSectionHeader('Passed Accessibility Tests', [40, 167, 69], 16);
        
        addWrappedText(
          `Excellent! Your website successfully passes ${resultCounts.passes} accessibility test${resultCounts.passes > 1 ? 's' : ''}. These indicate areas where your site meets accessibility standards.`,
          11, [60, 60, 60]
        );
        yPosition += 8;
        
        // Group passes by category if possible
        const passesToShow = Math.min(axeResults.passes.length, 20);
        const displayPasses = axeResults.passes.slice(0, passesToShow);
        
        // Create a simple list with better formatting
        displayPasses.forEach((pass, index) => {
          checkNewPage(8);
          
          pdf.setFontSize(10);
          pdf.setTextColor(40, 167, 69);
          pdf.text('✓', margin + 5, yPosition);
          
          pdf.setTextColor(0, 0, 0);
          const title = pass.help || pass.id || 'Unknown Rule';
          const wrappedTitle = pdf.splitTextToSize(title, contentWidth - 20);
          pdf.text(wrappedTitle, margin + 12, yPosition);
          yPosition += Math.max(wrappedTitle.length * 4, 6);
        });
        
        if (axeResults.passes.length > passesToShow) {
          yPosition += 3;
          addWrappedText(
            `... and ${axeResults.passes.length - passesToShow} additional passing tests`,
            10, [120, 120, 120], 10
          );
        }
        
        yPosition += 10;
      }
      
      // Needs Review Section (Incomplete)
      if (axeResults.incomplete && axeResults.incomplete.length > 0) {
        addSectionHeader('Manual Review Required', [255, 193, 7], 16);
        
        addWrappedText(
          `${resultCounts.incomplete} accessibility rule${resultCounts.incomplete > 1 ? 's' : ''} require manual testing to ensure full compliance. These items couldn't be automatically verified and need human review.`,
          11, [80, 80, 80]
        );
        yPosition += 8;
        
        axeResults.incomplete.forEach((item, index) => {
          checkNewPage(20);
          
          // Item number and title
          pdf.setFontSize(11);
          pdf.setTextColor(255, 193, 7);
          pdf.text(`${index + 1}.`, margin, yPosition);
          
          pdf.setTextColor(0, 0, 0);
          const title = item.help || item.id || 'Unknown Rule';
          const wrappedTitle = pdf.splitTextToSize(title, contentWidth - 15);
          pdf.text(wrappedTitle, margin + 8, yPosition);
          yPosition += wrappedTitle.length * 4 + 5;
          
          // Description with better formatting
          if (item.description) {
            const cleanDescription = item.description.replace(/<[^>]*>/g, '').trim();
            if (cleanDescription) {
              addWrappedText('What to check:', 10, [100, 100, 100], 10);
              addWrappedText(cleanDescription, 9, [60, 60, 60], 15);
              yPosition += 3;
            }
          }
          
          // Manual testing guidance
          if (item.helpUrl) {
            addWrappedText('Testing guidance:', 10, [100, 100, 100], 10);
            addWrappedText(item.helpUrl, 9, [67, 97, 238], 15);
          }
          
          yPosition += 6;
        });
        
        yPosition += 10;
      }
      
      // Not Applicable Section
      if (axeResults.inapplicable && axeResults.inapplicable.length > 0) {
        addSectionHeader('Not Applicable Rules', [108, 117, 125], 14);
        
        addWrappedText(
          `${resultCounts.inapplicable} accessibility rules were not applicable to this page content. This is normal and indicates that certain tests (like image alt-text checks) weren't relevant because the corresponding elements weren't present.`,
          10, [100, 100, 100]
        );
        
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
