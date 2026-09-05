import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * FeatureCard - single concrete product benefit.
 * Minimal by design: muted icon, confident title, one useful sentence.
 * No tiles, gradients, or hover effects.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.icon] - Muted leading icon
 * @param {string} props.title - Benefit title
 * @param {string} props.body - What this helps the user accomplish
 */
const FeatureCard = ({ icon, title, body }) => (
  <Box sx={{ py: 1 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
      {icon && (
        <Box aria-hidden="true" sx={{ color: "text.secondary", display: "flex" }}>
          {icon}
        </Box>
      )}
      <Typography variant="h3" component="h3">
        {title}
      </Typography>
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340 }}>
      {body}
    </Typography>
  </Box>
);

export default FeatureCard;