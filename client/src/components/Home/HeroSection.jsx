import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const HeroSection = ({ theme, onDemoClick, demoLoading }) => {
  const navigate = useNavigate();

  return (
    <Box
      component="section"
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        py: { xs: 5, md: 8 },
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 800, textAlign: "center" }}>
        <Typography
          variant="h1"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 700,
            fontSize: { xs: "2rem", md: "2.75rem" },
            lineHeight: 1.2,
            mb: 2,
          }}
        >
          Find and fix website accessibility issues
        </Typography>
        <Typography
          variant="h2"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 400,
            fontSize: { xs: "1.05rem", md: "1.25rem" },
            lineHeight: 1.5,
            mb: 4,
          }}
        >
          Scan a URL, HTML file, or pasted code. Get a WCAG report, then use AI
          explanations to understand how to fix each issue.
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/login")}
            sx={{ minWidth: 220, py: 1.5 }}
          >
            Sign in to start a scan
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={onDemoClick}
            disabled={demoLoading}
            sx={{ minWidth: 220, py: 1.5 }}
          >
            {demoLoading ? "Starting demo..." : "Try the demo"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default HeroSection;
