import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Avatar, 
  Menu, 
  MenuItem, 
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Home as HomeIcon, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  Logout as LogoutIcon,
  AccountCircle,
  ChevronLeft
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

// Sidebar menu items configuration
const menuItems = [
  { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard/home' },
  { text: 'History', icon: <HistoryIcon />, path: '/dashboard/history' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings' },
];

// Drawer width for desktop view
const DRAWER_WIDTH = 240;

// Color scheme
const COLORS = {
  background: '#f5f7fa',
  sidebar: '#ffffff',
  activeItem: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
  text: '#333333',
  activeText: '#ffffff',
  divider: '#e0e0e0'
};

/**
 * DashboardLayout component
 * Provides a consistent layout for all dashboard pages with:
 * - Responsive sidebar navigation
 * - Top app bar with user menu
 * - Content area for child routes
 */
const DashboardLayout = () => {
  // State management
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();

  // Check if user is logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // Menu handlers
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  /**
   * Renders the sidebar content
   * @returns {JSX.Element} Sidebar content
   */
  const drawerContent = (
    <>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        p: 2
      }}>
        {isMobile && (
          <Box onClick={handleDrawerToggle} sx={{ ml: 'auto' }}>
            <ChevronLeft />
          </Box>
        )}
      </Box>
      <Divider sx={{ bgcolor: COLORS.divider }} />
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ 
                  borderRadius: '0 24px 24px 0',
                  mr: 1,
                  ml: 0.5,
                  mb: 0.5,
                  background: isActive ? COLORS.activeItem : 'transparent',
                  color: isActive ? COLORS.activeText : COLORS.text,
                  '&:hover': {
                    background: isActive ? COLORS.activeItem : 'rgba(0, 0, 0, 0.04)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon sx={{ color: isActive ? COLORS.activeText : COLORS.text }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive ? 'medium' : 'regular',
                    color: 'inherit'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );

  // If not logged in, don't render the dashboard
  if (!isLoggedIn) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Navbar */}
      <Navbar />
      
      {/* Dashboard Content */}
      <Box sx={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Sidebar - Mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              bgcolor: COLORS.sidebar,
              color: COLORS.text,
            },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Sidebar - Desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              bgcolor: COLORS.sidebar,
              color: COLORS.text,
              borderRight: '1px solid',
              borderColor: COLORS.divider,
              position: 'relative'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
        
        {/* Main Content */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3,
            width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
            background: COLORS.background,
            overflow: 'auto',
          }}
        > 
            <Outlet />
          </Box>
        </Box>
      </Box>
  );
};

export default DashboardLayout; 