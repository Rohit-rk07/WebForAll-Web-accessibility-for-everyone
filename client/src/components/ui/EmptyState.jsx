import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * EmptyState - teaches the empty state instead of showing "no data".
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.icon] - Single muted icon, optional
 * @param {string} props.title - Short heading ("No scans yet")
 * @param {React.ReactNode} [props.body] - One or two sentences explaining next step
 * @param {React.ReactNode} [props.action] - Primary action for the empty state
 */
const EmptyState = ({ icon, title, body, action }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      py: { xs: 5, md: 7 },
      px: 2,
    }}
  >
    {icon && (
      <Box
        aria-hidden="true"
        sx={{
          color: "text.disabled",
          mb: 2,
          display: "flex",
        }}
      >
        {icon}
      </Box>
    )}
    <Typography variant="h4" component="h3" sx={{ mb: 1 }}>
      {title}
    </Typography>
    {body && (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 420, mb: 2 }}
      >
        {body}
      </Typography>
    )}
    {action && <Box sx={{ mt: 1 }}>{action}</Box>}
  </Box>
);

export default EmptyState;