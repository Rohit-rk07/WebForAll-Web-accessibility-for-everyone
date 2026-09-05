import React from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import {
  ErrorOutline,
  WarningAmber,
  InfoOutlined,
  CheckCircleOutline,
} from "@mui/icons-material";

const SEVERITIES = [
  { key: "critical", label: "Critical", count: 3, icon: <ErrorOutline />, color: "#d32f2f" },
  { key: "serious", label: "Serious", count: 7, icon: <WarningAmber />, color: "#ed6c02" },
  { key: "moderate", label: "Moderate", count: 12, icon: <InfoOutlined />, color: "#0288d1" },
  { key: "minor", label: "Minor", count: 26, icon: <CheckCircleOutline />, color: "#2e7d32" },
];

const ISSUE_SNIPPETS = [
  { label: "aria-label missing on button", severity: "Critical", code: "<button aria-label=\"…\">" },
  { label: "Image without alt text", severity: "Serious", code: '<img src="hero.jpg" alt="…">' },
];

/**
 * SampleResults - a static, clearly-labelled mock of the results screen.
 * Used on the landing page so the product itself is the hero.
 * aria-hidden: decorative preview only; the caption labels it as a sample.
 */
const SampleResults = () => {
  const theme = useTheme();

  return (
    <Box role="presentation" aria-hidden="true">
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          boxShadow: "0 12px 40px rgba(16, 24, 40, 0.1)",
          overflow: "hidden",
          mx: "auto",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            px: { xs: 2.5, sm: 3 },
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              Sample results
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-all" }}>
              exampleshop.com
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h3" sx={{ lineHeight: 1 }}>
              82
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                / 100
              </Typography>
            </Typography>
          </Box>
        </Box>

        {/* Severity summary */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {SEVERITIES.map((s) => (
            <Box
              key={s.key}
              sx={{
                px: 2.5,
                py: 2,
                borderRight: `1px solid ${theme.palette.divider}`,
                "&:nth-of-type(2n)": { borderRight: { xs: "none", sm: `1px solid ${theme.palette.divider}` } },
                "&:last-of-type": { borderRight: "none" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Box component="span" sx={{ color: s.color, display: "flex" }}>
                  {s.icon}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {s.label}
                </Typography>
              </Box>
              <Typography variant="h4">{s.count}</Typography>
            </Box>
          ))}
        </Box>

        {/* Issue rows */}
        {ISSUE_SNIPPETS.map((issue) => (
          <Box
            key={issue.label}
            sx={{ px: { xs: 2.5, sm: 3 }, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ErrorOutline sx={{ color: "#d32f2f", fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {issue.label}
              </Typography>
            </Box>
            <Box
              sx={{
                mt: 1,
                fontFamily: "'Consolas','Monaco',monospace",
                fontSize: "0.75rem",
                color: "text.secondary",
                bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(16,24,40,0.03)",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                px: 1.5,
                py: 0.75,
                width: "fit-content",
              }}
            >
              {issue.code}
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default SampleResults;