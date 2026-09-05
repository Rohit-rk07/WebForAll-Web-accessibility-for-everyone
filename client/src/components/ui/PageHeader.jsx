import React from "react";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

/**
 * PageHeader - consistent page title region across the app.
 * Typography-led: optional overline label, confident title, subtitle, and a
 * single aligned action. No decoration.
 *
 * @param {Object} props
 * @param {string} [props.label] - Overline micro-label ("Dashboard", "Reports"...)
 * @param {string} props.title - Page title (h1)
 * @param {React.ReactNode} [props.subtitle] - One-line supporting copy
 * @param {React.ReactNode} [props.action] - Single primary action, right-aligned
 * @param {Function} [props.onBack] - If set, renders a back button before the title
 */
const PageHeader = ({ label, title, subtitle, action, onBack }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: { xs: 2.5, md: 4 } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {onBack && (
            <IconButton
              onClick={onBack}
              aria-label="Back"
              color="primary"
              sx={{ m: 0, mr: { xs: 0, sm: 1 }, mb: 0.5, p: 0.5, mt: -0.25 }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
          )}
          {label && (
            <Typography
              variant="overline"
              component="p"
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              {label}
            </Typography>
          )}
          <Typography
            variant="h2"
            component="h1"
            color="text.primary"
            sx={{ mb: subtitle ? 1 : 0 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 640, color: theme.palette.text.secondary }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Box>
    </Box>
  );
};

export default PageHeader;