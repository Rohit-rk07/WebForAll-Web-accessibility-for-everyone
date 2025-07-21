import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, useTheme } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

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
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // Theme-based colors
  const COLORS = {
    background: theme.palette.background.default,
  };

  // If not logged in, don't render the dashboard
  if (!isLoggedIn) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          p: 3,
          marginTop: '64px',
          background: COLORS.background,
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto',
        }}
      > 
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;