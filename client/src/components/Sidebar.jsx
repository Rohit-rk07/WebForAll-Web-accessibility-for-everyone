import React from 'react';
import { 
  Box, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Divider,
  Avatar,
  Tooltip,
  Paper,
  useTheme
} from '@mui/material';
import { 
  Home as HomeIcon, 
  History as HistoryIcon, 
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 280;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard/home' },
  { label: 'History', icon: <HistoryIcon />, path: '/dashboard/history' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  // Theme-based colors
  const COLORS = {
    background: theme.palette.background.paper,
    border: theme.palette.divider,
    text: theme.palette.text.primary,
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    hover: theme.palette.action.hover
  };

  return (
    <Paper
      component="nav"
      elevation={4}
      sx={{ 
        width: drawerWidth, 
        flexShrink: 0, 
        bgcolor: COLORS.background, 
        backdropFilter: 'blur(10px)',
        borderRight: `1px solid ${COLORS.border}`,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}
    >
      {/* Logo and Brand */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        mb: 2
      }}>
        <Avatar sx={{ bgcolor: COLORS.primary, width: 40, height: 40 }}>
          {/* SecurityIcon was removed, so this will cause an error */}
          {/* <SecurityIcon /> */}
        </Avatar>
        <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
          Accessibility
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* User Profile */}
      {user && (
        <Box sx={{ px: 3, mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: COLORS.primary + '50'
          }}>
            <Avatar sx={{ bgcolor: COLORS.primary }}>
              {user.email.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Welcome back
              </Typography>
              <Typography variant="subtitle2" fontWeight="medium" noWrap>
                {user.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Navigation */}
      <Box sx={{ px: 2 }}>
        <Typography 
          variant="overline" 
          sx={{ 
            px: 1, 
            color: 'text.secondary',
            fontWeight: 'bold',
            letterSpacing: 1
          }}
        >
          Main Menu
        </Typography>
        
        <List sx={{ mt: 1 }}>
          {navItems.map(({ label, icon, path }) => (
            <Tooltip title={label} placement="right" key={path} arrow>
              <ListItemButton
                selected={location.pathname === path}
                onClick={() => navigate(path)}
                sx={{ 
                  borderRadius: 2,
                  mb: 1,
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: COLORS.primary,
                    color: 'white',
                    '&:hover': {
                      bgcolor: COLORS.primary + 'er',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
                <ListItemText 
                  primary={label} 
                  primaryTypographyProps={{ 
                    fontWeight: location.pathname === path ? 'medium' : 'normal' 
                  }} 
                />
              </ListItemButton>
            </Tooltip>
          ))}
        </List>
      </Box>
      
      <Box sx={{ flexGrow: 1 }} />
      
      {/* Footer */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Accessibility Analyzer v1.0
        </Typography>
      </Box>
    </Paper>
  );
};

export default Sidebar; 