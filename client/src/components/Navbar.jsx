import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar, 
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Security, 
  Person, 
  Logout,
  Home as HomeIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  MenuBook as GuidelinesIcon,
  Close as CloseIcon,
  AccountCircle
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Color scheme to match dashboard
const COLORS = {
  background: '#ffffff',
  border: '#e0e0e0',
  text: '#333333',
  lightText: '#666666',
  primary: '#4361ee',
  secondary: '#3a0ca3',
  hover: 'rgba(67, 97, 238, 0.04)'
};

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
        { text: 'Guidelines', icon: <GuidelinesIcon />, path: '#' },
        { text: 'About', icon: <InfoIcon />, path: '#' },
      ]
    : [
    { text: 'Guidelines', icon: <GuidelinesIcon />, path: '#' },
    { text: 'About', icon: <InfoIcon />, path: '#' },
  ];

  // Mobile drawer content
  const drawer = (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS.text }}>
          Accessibility Analyzer
        </Typography>
        <IconButton 
          edge="end" 
          aria-label="close drawer" 
          onClick={handleDrawerToggle}
          sx={{ color: COLORS.text }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ borderColor: COLORS.border }} />
      <List>
        {!isLoggedIn ? (
          <>
        {navItems.map((item) => (
          <ListItem 
            button 
            key={item.text}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{ 
                  color: COLORS.text,
                  '&:hover': {
                    bgcolor: COLORS.hover
                  }
                }}
              >
                <ListItemIcon sx={{ color: COLORS.primary }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
            <Divider sx={{ my: 1, borderColor: COLORS.border }} />
            <ListItem 
              button 
              onClick={() => {
                navigate('/login');
                setMobileOpen(false);
              }}
              sx={{ 
                color: COLORS.text,
                '&:hover': {
                  bgcolor: COLORS.hover
                }
              }}
            >
              <ListItemIcon sx={{ color: COLORS.primary }}><Person /></ListItemIcon>
              <ListItemText primary="Login" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem 
              button 
              onClick={() => {
                navigate('/dashboard/home');
                setMobileOpen(false);
              }}
              sx={{ 
                color: COLORS.text,
                '&:hover': {
                  bgcolor: COLORS.hover
                }
              }}
            >
              <ListItemIcon sx={{ color: COLORS.primary }}><HomeIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem 
              button 
              onClick={() => {
                navigate('/dashboard/history');
                setMobileOpen(false);
              }}
              sx={{ 
                color: COLORS.text,
                '&:hover': {
                  bgcolor: COLORS.hover
                }
              }}
            >
              <ListItemIcon sx={{ color: COLORS.primary }}><HistoryIcon /></ListItemIcon>
              <ListItemText primary="Reports" />
            </ListItem>
            <ListItem 
              button 
              onClick={() => {
                navigate('/dashboard/settings');
                setMobileOpen(false);
              }}
              sx={{ 
                color: COLORS.text,
                '&:hover': {
                  bgcolor: COLORS.hover
                }
              }}
            >
              <ListItemIcon sx={{ color: COLORS.primary }}><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            <Divider sx={{ my: 1, borderColor: COLORS.border }} />
            {navItems.map((item) => (
              <ListItem 
                button 
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{ 
                  color: COLORS.text,
                  '&:hover': {
                    bgcolor: COLORS.hover
                  }
                }}
              >
                <ListItemIcon sx={{ color: COLORS.primary }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            <Divider sx={{ my: 1, borderColor: COLORS.border }} />
            <ListItem 
              button 
              onClick={() => {
              logout();
              navigate('/');
                setMobileOpen(false);
              }}
              sx={{ 
                color: COLORS.text,
                '&:hover': {
                  bgcolor: COLORS.hover
                }
              }}
            >
              <ListItemIcon sx={{ color: COLORS.primary }}><Logout /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="static" 
        elevation={1} 
        sx={{ 
          bgcolor: COLORS.background,
          color: COLORS.text,
          zIndex: theme.zIndex.drawer + 2,
          borderBottom: `1px solid ${COLORS.border}`
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              {navItems.map((item) => (
                <Button 
                  key={item.text}
                  sx={{ 
                    color: COLORS.text,
                    '&:hover': {
                      bgcolor: COLORS.hover
                    }
                  }}
                  onClick={() => navigate(item.path)}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
          
          {/* Authentication Buttons */}
          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
            {!isLoggedIn ? (
              <Button 
                variant="outlined" 
                sx={{ 
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                  '&:hover': {
                    borderColor: COLORS.secondary,
                    bgcolor: COLORS.hover
                  }
                }}
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
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
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            minWidth: 180,
            bgcolor: COLORS.background
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            handleUserMenuClose();
            navigate('/dashboard/settings');
          }}
          sx={{ 
            color: COLORS.text,
            '&:hover': {
              bgcolor: COLORS.hover
            }
          }}
        >
          <ListItemIcon sx={{ color: COLORS.primary }}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Settings</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5, borderColor: COLORS.border }} />
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            color: COLORS.text,
            '&:hover': {
              bgcolor: COLORS.hover
            }
          }}
        >
          <ListItemIcon sx={{ color: COLORS.primary }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>
      
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
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;