import React, { useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import { Box, Container, Divider, Button, Typography, useTheme } from "@mui/material";
import {
  FactCheck,
  LightbulbOutline,
  LockOutlined,
  TrackChanges,
} from "@mui/icons-material";
import { useAuth } from "../contexts/useAuth";
import { useNavigate } from "react-router-dom";
import HeroSection from "../components/Home/HeroSection";
import FeatureCard from "../components/Home/FeatureCard";
import { getUserFacingError } from "../utils/userFacingError";

const HOW_IT_WORKS = [
  {
    title: "Scan",
    body: "Paste a URL, drop an HTML file, or paste a snippet. Pick the WCAG version and level you're targeting.",
  },
  {
    title: "Review",
    body: "See a single accessibility score, violations grouped by severity, and exactly where each problem is in your markup.",
  },
  {
    title: "Fix",
    body: "Follow plain-language explanations and copy corrected code — or ask for AI guidance on tricky issues.",
  },
];

const Home = () => {
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState("");
  const theme = useTheme();
  const navigate = useNavigate();
  const { demoLogin } = useAuth();

  const handleDemoLogin = useCallback(async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    setDemoError("");
    try {
      await demoLogin();
      navigate("/dashboard/home");
    } catch (e) {
      setDemoError(
        getUserFacingError(
          e,
          "Demo login failed. Sign in with your account or try again.",
        ),
      );
    } finally {
      setDemoLoading(false);
    }
  }, [demoLogin, navigate, demoLoading]);

  const features = [
    {
      icon: <FactCheck />,
      title: "WCAG coverage from day one",
      body: "Runs the same engine used for professional WCAG 2.0, 2.1, and 2.2 audits — 100+ rules out of the box.",
    },
    {
      icon: <LightbulbOutline />,
      title: "Fixes you can understand",
      body: "Every violation explains why it matters and comes with corrected code you can copy directly into your site.",
    },
    {
      icon: <LockOutlined />,
      title: "Reports stay private",
      body: "Scans and results are stored to your account only. Nothing is shared or indexed.",
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Navbar />

      <HeroSection
        theme={theme}
        onDemoClick={handleDemoLogin}
        demoLoading={demoLoading}
      />

      {demoError && (
        <Container maxWidth="md">
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="error" sx={{ textAlign: "center" }}>
              {demoError}
            </Typography>
          </Box>
        </Container>
      )}

      {/* How it works */}
      <Box
        component="section"
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        sx={{ bgcolor: "background.paper", borderTop: (t) => `1px solid ${t.palette.divider}`, borderBottom: (t) => `1px solid ${t.palette.divider}` }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
          <Box sx={{ maxWidth: 560, mb: 5 }}>
            <Typography variant="overline" component="p" color="text.secondary" sx={{ mb: 1 }}>
              How it works
            </Typography>
            <Typography id="how-it-works-heading" variant="h2" component="h2">
              From scan to fix in three steps
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: { xs: 4, md: 2 },
            }}
          >
            {HOW_IT_WORKS.map((step, i) => (
              <Box key={step.title} sx={{ display: "flex", gap: 2.5 }}>
                <Typography
                  variant="h3"
                  color="text.disabled"
                  sx={{ fontVariantNumeric: "tabular-nums", minWidth: 34 }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </Typography>
                <Box>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.body}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Box component="section" aria-labelledby="features-heading">
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
          <Box sx={{ maxWidth: 560, mb: 5 }}>
            <Typography variant="overline" component="p" color="text.secondary" sx={{ mb: 1 }}>
              Why Accessibility Analyzer
            </Typography>
            <Typography id="features-heading" variant="h2" component="h2">
              Built for teams that ship accessible products
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: { xs: 3.5, md: 4, lg: 6 },
            }}
          >
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                body={feature.body}
              />
            ))}
          </Box>

          {/* Trust line */}
          <Box
            sx={{
              mt: { xs: 5, md: 7 },
              pt: 3,
              borderTop: (t) => `1px solid ${t.palette.divider}`,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              color: "text.secondary",
            }}
          >
            <TrackChanges aria-hidden="true" sx={{ fontSize: 18 }} />
            <Typography variant="body2" color="text.secondary">
              Powered by axe-core, the accessibility engine trusted for
              conformance testing.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Final CTA */}
      <Box
        component="section"
        sx={{ bgcolor: "background.paper", borderTop: (t) => `1px solid ${t.palette.divider}` }}
      >
        <Container maxWidth="md" sx={{ py: { xs: 7, md: 10 }, textAlign: "center" }}>
          <Typography variant="h2" component="h2" sx={{ mb: 1.5 }}>
            Ready to find your accessibility issues?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3.5 }}>
            Run your first scan in about a minute.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/login")}
            sx={{ minWidth: 220, py: 1.4 }}
          >
            Analyze a website
          </Button>
        </Container>
      </Box>

      <Divider />

      {/* Footer */}
      <Box component="footer">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Accessibility Analyzer
            </Typography>
            <Typography variant="body2" color="text.disabled">
              WCAG compliance scanning, built for developers who care.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;