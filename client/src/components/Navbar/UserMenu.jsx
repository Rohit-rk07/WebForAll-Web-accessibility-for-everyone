import React from 'react';
import { Menu, MenuItem, Typography, ListItemIcon, Divider, Switch, Box, useTheme } from '@mui/material';
import { DarkMode, LightMode, Logout } from '@mui/icons-material';
import { useThemeMode } from '../../contexts/ThemeContext';

/**
 * UserMenu component for user dropdown menu
 * 
 * @param {Object} props - Component props
 * @param {HTMLElement} props.anchorEl - Anchor element
 * @param {boolean} props.open - Whether menu is open
 * @param {Function} props.onClose - Function to close menu
 * @param {Function} props.onLogout - Logout function
 * @param {Function} props.navigate - Navigation function
 * @param {Object} props.colors - Color scheme
 * @returns {JSX.Element} The user menu component
 */
const UserMenu = ({ anchorEl, open, onClose, onLogout, navigate }) => {
  const { darkMode, toggleDarkMode } = useThemeMode();
  const theme = useTheme();
  const COLORS = {
    background: theme.palette.background.paper,
    border: theme.palette.divider,
    text: theme.palette.text.primary,
    primary: theme.palette.primary.main,
    hover: theme.palette.action.hover
  };
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
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
      <MenuItem disableRipple sx={{ cursor: 'default', '&:hover': { bgcolor: 'transparent' } }}>
        <ListItemIcon sx={{ color: COLORS.primary }}>
          {darkMode ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
        </ListItemIcon>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {darkMode ? 'Dark Mode' : 'Light Mode'}
          </Typography>
          <Switch checked={darkMode} onChange={toggleDarkMode} color="primary" size="small" />
        </Box>
      </MenuItem>
      <Divider sx={{ my: 0.5, borderColor: COLORS.border }} />
      <MenuItem 
        onClick={onLogout}
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
  );
};

export default UserMenu; 