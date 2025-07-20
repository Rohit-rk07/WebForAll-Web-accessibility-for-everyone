import React from 'react';
import { 
  Box, 
  Typography, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { 
  Close as CloseIcon,
  Person,
  Logout,
  Home as HomeIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  MenuBook as GuidelinesIcon
} from '@mui/icons-material';

// Icon mapping
const iconMap = {
  'HomeIcon': <HomeIcon />,
  'HistoryIcon': <HistoryIcon />,
  'SettingsIcon': <InfoIcon />,
  'InfoIcon': <InfoIcon />,
  'GuidelinesIcon': <GuidelinesIcon />,
  'Person': <Person />,
  'Logout': <Logout />
};

/**
 * NavDrawer component for mobile navigation
 * 
 * @param {Object} props - Component props
 * @param {Array} props.navItems - Navigation items
 * @param {boolean} props.isLoggedIn - Whether user is logged in
 * @param {Function} props.navigate - Navigation function
 * @param {Function} props.onClose - Function to close drawer
 * @param {Function} props.onLogout - Logout function
 * @param {Object} props.colors - Color scheme
 * @returns {JSX.Element} The drawer component
 */
const NavDrawer = ({ navItems, isLoggedIn, navigate, onClose, onLogout, colors }) => {
  // Get icon component from string name
  const getIcon = (iconName) => {
    return iconMap[iconName] || <InfoIcon />;
  };
  
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.text }}>
          Accessibility Analyzer
        </Typography>
        <IconButton 
          edge="end" 
          aria-label="close drawer" 
          onClick={onClose}
          sx={{ color: colors.text }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ borderColor: colors.border }} />
      <List>
        {!isLoggedIn ? (
          <>
            {navItems.map((item) => (
              <ListItem 
                component="div"
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                sx={{ 
                  color: colors.text,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: colors.hover
                  }
                }}
                key={item.text}
              >
                <ListItemIcon sx={{ color: colors.primary }}>{getIcon(item.icon)}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            <Divider sx={{ my: 1, borderColor: colors.border }} />
            <ListItem 
              component="div"
              onClick={() => {
                navigate('/login');
                onClose();
              }}
              sx={{ 
                color: colors.text,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: colors.hover
                }
              }}
            >
              <ListItemIcon sx={{ color: colors.primary }}><Person /></ListItemIcon>
              <ListItemText primary="Login" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem 
              component="div"
              onClick={() => {
                navigate('/dashboard/home');
                onClose();
              }}
              sx={{ 
                color: colors.text,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: colors.hover
                }
              }}
            >
              <ListItemIcon sx={{ color: colors.primary }}><HomeIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem 
              component="div"
              onClick={() => {
                navigate('/dashboard/history');
                onClose();
              }}
              sx={{ 
                color: colors.text,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: colors.hover
                }
              }}
            >
              <ListItemIcon sx={{ color: colors.primary }}><HistoryIcon /></ListItemIcon>
              <ListItemText primary="Reports" />
            </ListItem>
            <Divider sx={{ my: 1, borderColor: colors.border }} />
            {navItems.map((item) => (
              <ListItem 
                component="div"
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                sx={{ 
                  color: colors.text,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: colors.hover
                  }
                }}
              >
                <ListItemIcon sx={{ color: colors.primary }}>{getIcon(item.icon)}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            <Divider sx={{ my: 1, borderColor: colors.border }} />
            <ListItem 
              component="div"
              onClick={() => {
                onLogout();
                navigate('/');
                onClose();
              }}
              sx={{ 
                color: colors.text,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: colors.hover
                }
              }}
            >
              <ListItemIcon sx={{ color: colors.primary }}><Logout /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );
};

export default NavDrawer; 