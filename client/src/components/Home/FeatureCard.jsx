import React from "react";
import { Paper, Typography, Box } from "@mui/material";

const FeatureCard = ({ icon, title, description, theme }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        height: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 1.5, gap: 1.5 }}>
        <Typography variant="h5" component="span" aria-hidden="true">
          {icon}
        </Typography>
        <Typography variant="h3" sx={{ fontSize: "1.15rem", fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ whiteSpace: "pre-line", lineHeight: 1.6 }}
      >
        {description}
      </Typography>
    </Paper>
  );
};

export default FeatureCard;
