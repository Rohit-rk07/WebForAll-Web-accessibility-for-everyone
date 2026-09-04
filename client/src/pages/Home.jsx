import React, { useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import { Box, Container, useTheme } from "@mui/material";
import { useAuth } from "../contexts/useAuth";
import { useNavigate } from "react-router-dom";
import HeroSection from "../components/Home/HeroSection";
import FeatureCard from "../components/Home/FeatureCard";
import DemoButton from "../components/Home/DemoButton";

/**
 * Home page component
 * Serves as the landing page with feature cards and demo login
 */
const Home = () => {
  const [demoLoading, setDemoLoading] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const { demoLogin } = useAuth();

  const handleDemoLogin = useCallback(async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      await demoLogin();
      navigate("/dashboard/home");
    } catch (e) {
      console.error("Demo login failed", e);
    } finally {
      setDemoLoading(false);
    }
  }, [demoLogin, navigate, demoLoading]);

  const features = [
    {
      icon: "🔍",
      title: "Comprehensive Analysis",
      description:
        "• Dynamic analysis using axe-core (100+ rules)\n• WCAG 2.0, 2.1, 2.2 compliance checking\n• Multiple input methods (URL, HTML file, paste)\n• Real-time JavaScript-rendered content analysis",
    },
    {
      icon: "🤖",
      title: "AI-Powered Insights",
      description:
        "• Google Gemini AI explanations\n• Step-by-step fix instructions\n• Code examples and best practices\n• Interactive chatbot assistance",
    },
    {
      icon: "📊",
      title: "Detailed Reporting",
      description:
        "• Accessibility scores and breakdowns\n• Severity-based issue categorization\n• PDF export with professional formatting\n• Executive summaries and recommendations",
    },
    {
      icon: "💾",
      title: "History & Tracking",
      description:
        "• Save and organize analysis results\n• Track improvements over time\n• Compare different versions\n• Quick access to previous reports",
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

      <HeroSection theme={theme} />

      <Container maxWidth="xl" sx={{ py: 0 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
            mb: 4,
          }}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              theme={theme}
            />
          ))}
        </Box>

        <DemoButton
          loading={demoLoading}
          onClick={handleDemoLogin}
          theme={theme}
        />
      </Container>
    </Box>
  );
};

export default Home;
