import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Avatar, 
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Security,
  AccountCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Import components
import NavDrawer from './NavDrawer';
import DesktopNav from './DesktopNav';
import UserMenu from './UserMenu';

/**
 * Navbar component
 * Provides navigation for the public-facing pages
 */
const Navbar = () => {
  // State management
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  
  // Hooks
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isLoggedIn, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/');
  };

  // Navigation items - different based on login status
  const navItems = isLoggedIn 
    ? [
        { text: 'Dashboard', icon: 'DashboardIcon', path: '/dashboard/home' },
        { text: 'History', icon: 'HistoryIcon', path: '/dashboard/history' },
      ]
    : [];

  // Theme-based colors
  const COLORS = {
    background: theme.palette.background.default,
    border: theme.palette.divider,
    text: theme.palette.text.primary,
    lightText: theme.palette.text.secondary,
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    hover: theme.palette.action.hover
  };

  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={0} 
        sx={{ 
          bgcolor: COLORS.background,
          color: COLORS.text,
          zIndex: theme.zIndex.drawer + 2
        }}
      >
        <Toolbar>
          {/* Logo and Brand - different destination based on login status */}
          <Box 
            onClick={() => navigate(isLoggedIn ? '/dashboard/home' : '/')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              textDecoration: 'none',
              color: COLORS.text,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.9
              }
            }}
          >
            <Avatar sx={{ 
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
              width: 40, 
              height: 40 
            }}>
              <Security />
            </Avatar>
            <Typography variant="h6" component="span" fontWeight="bold" color={COLORS.text}>
              Accessibility Analyzer
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          
          {/* Navigation Links - Desktop */}
          {!isMobile && (
            <DesktopNav 
              navItems={navItems} 
              isLoggedIn={isLoggedIn} 
              navigate={navigate} 
              colors={COLORS} 
            />
          )}
          
          {/* Authentication Buttons */}
          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
            {!isLoggedIn ? (
              <DesktopNav.LoginButton navigate={navigate} colors={COLORS} />
            ) : (
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{ color: COLORS.text }}
              >
                <AccountCircle />
              </IconButton>
            )}
          
            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton 
                color="inherit" 
                aria-label="open drawer"
                edge="end" 
                onClick={handleDrawerToggle}
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <UserMenu 
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        onLogout={handleLogout}
        navigate={navigate}
        colors={COLORS}
      />
      
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 280,
            bgcolor: COLORS.background
          },
        }}
      >
        <NavDrawer 
          navItems={navItems}
          isLoggedIn={isLoggedIn}
          navigate={navigate}
          onClose={handleDrawerToggle}
          onLogout={logout}
          colors={COLORS}
        />
      </Drawer>
    </>
  );
};

export default Navbar; 