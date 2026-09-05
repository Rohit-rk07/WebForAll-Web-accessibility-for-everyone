import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * LoadingState - intentional loading surface.
 *
 * @param {Object} props
 * @param {string} [props.label] - Short status ("Loading history…")
 * @param {string} [props.sub] - Optional supporting line
 */
const LoadingState = ({ label = "Loading…", sub }) => (
  <Box
    role="status"
    aria-live="polite"
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      py: { xs: 6, md: 8 },
      gap: 1.5,
    }}
  >
    <CircularProgress size={28} thickness={4} />
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    {sub && (
      <Typography variant="caption" color="text.disabled">
        {sub}
      </Typography>
    )}
  </Box>
);

export default LoadingState;