import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * Section - consistent section heading: overline label + title + optional
 * right-aligned action. Content renders below via children.
 *
 * @param {Object} props
 * @param {string} [props.label] - Overline micro-label
 * @param {string} props.title - Section title (h3)
 * @param {React.ReactNode} [props.action] - Right-aligned action
 * @param {React.ReactNode} props.children - Section content
 * @param {object} [props.sx] - Extra styling for the section wrapper
 */
const Section = ({ label, title, action, children, sx }) => (
  <Box component="section" sx={{ mb: 4, ...sx }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1,
        mb: 2,
      }}
    >
      <Box>
        {label && (
          <Typography variant="overline" component="p" color="text.secondary">
            {label}
          </Typography>
        )}
        <Typography variant="h3" component="h2">
          {title}
        </Typography>
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
    {children}
  </Box>
);

export default Section;