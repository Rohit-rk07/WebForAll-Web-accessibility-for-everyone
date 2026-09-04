import React, { useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import { Alert, Box, Container, useTheme } from "@mui/material";
import { useAuth } from "../contexts/useAuth";
import { useNavigate } from "react-router-dom";
import HeroSection from "../components/Home/HeroSection";
import FeatureCard from "../components/Home/FeatureCard";
import { getUserFacingError } from "../utils/userFacingError";

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
      icon: "🔍",
      title: "Comprehensive Analysis",
      description:
        "• Dynamic analysis using axe-core (100+ rules)\n• WCAG 2.0, 2.1, 2.2 compliance checking\n• URL, HTML file, or pasted code",
    },
    {
      icon: "🤖",
      title: "AI-Powered Insights",
      description:
        "• Plain-language explanations\n• Step-by-step fix instructions\n• Interactive chatbot assistance",
    },
    {
      icon: "📊",
      title: "Detailed Reporting",
      description:
        "• Scores grouped by severity\n• PDF export for sharing\n• History of previous scans",
    },
    {
      icon: "💾",
      title: "History & Tracking",
      description:
        "• Save analysis results\n• Search, sort, and reopen reports\n• Delete scans you no longer need",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: theme.palette.background.default,
      }}
    >
      <Navbar />
      <Box
        id="main-content"
        component="main"
        sx={{ pt: "64px", flexGrow: 1 }}
        tabIndex={-1}
      >
        <HeroSection
          theme={theme}
          onDemoClick={handleDemoLogin}
          demoLoading={demoLoading}
        />

        <Container maxWidth="lg" sx={{ pb: 6 }}>
          {demoError && (
            <Alert severity="error" sx={{ mb: 3, wordBreak: "break-word" }}>
              {demoError}
            </Alert>
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                theme={theme}
              />
            ))}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
