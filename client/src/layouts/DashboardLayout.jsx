import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Box, useTheme } from "@mui/material";
import { useAuth } from "../contexts/useAuth";
import Navbar from "../components/Navbar";

/**
 * DashboardLayout component
 * Provides a simple layout for dashboard pages with:
 * - Top navbar for navigation
 * - Content area for child routes
 */
const DashboardLayout = () => {
  // Hooks
  const theme = useTheme();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  // Check if user is logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  // If not logged in, don't render the dashboard
  if (!isLoggedIn) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <Box
        id="main-content"
        component="main"
        sx={{
          p: { xs: 2, md: 3 },
          marginTop: "64px",
          background: theme.palette.background.default,
          minHeight: "calc(100vh - 64px)",
          overflow: "auto",
        }}
        tabIndex={-1} // Allow focus but don't show outline
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1120,
            mx: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
