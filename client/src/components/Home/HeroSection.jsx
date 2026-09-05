import React from "react";
import { Box, Container, Stack, Typography, Button } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import SampleResults from "./SampleResults";

const HeroSection = ({ onDemoClick, demoLoading }) => {
  const navigate = useNavigate();

  return (
    <Box
      component="section"
      aria-labelledby="hero-heading"
      sx={{
        pt: { xs: 7, md: 9 },
        pb: { xs: 8, md: 10 },
        px: 2,
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ maxWidth: 720, mx: "auto", textAlign: "center" }}>
          <Typography
            variant="overline"
            component="p"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Accessibility compliance scanning
          </Typography>
          <Typography
            id="hero-heading"
            variant="h1"
            component="h1"
            color="text.primary"
            sx={{ mb: 2.5 }}
          >
            Find accessibility issues on real websites.
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: "1.0625rem", maxWidth: 560, mx: "auto", mb: 4 }}
          >
            Scan any URL, HTML file, or pasted code. Get a clear WCAG report
            with the exact fixes for every issue — no accessibility expertise
            required.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate("/login")}
              sx={{ minWidth: 220, py: 1.4 }}
            >
              Analyze a website
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="#how-it-works"
              sx={{ minWidth: 200, py: 1.4 }}
            >
              See how it works
            </Button>
          </Stack>

          <Box sx={{ mt: 2.5 }}>
            <Button
              onClick={onDemoClick}
              disabled={demoLoading}
              size="small"
              color="inherit"
              sx={{ textTransform: "none", color: "text.secondary" }}
            >
              {demoLoading ? "Starting demo…" : "or continue with a demo account"}
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: { xs: 7, md: 9 }, maxWidth: 860, mx: "auto" }}>
          <SampleResults />
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;