import React from 'react';
import { Box, Button } from '@mui/material';
import { useLocation } from 'react-router-dom';

/**
 * DesktopNav component for desktop navigation links
 *
 * @param {Object} props - Component props
 * @param {Array} props.navItems - Navigation items { text, path }
 * @param {boolean} props.isLoggedIn - Whether user is logged in
 * @param {Function} props.navigate - Navigation function
 * @param {Object} props.colors - Color scheme
 * @returns {JSX.Element} The desktop navigation component
 */
const DesktopNav = ({ navItems, navigate, colors }) => {
  const { pathname } = useLocation();

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Button
            key={item.text}
            color="inherit"
            aria-current={isActive ? 'page' : undefined}
            sx={{
              color: isActive ? 'primary.main' : colors.text,
              fontWeight: 600,
              px: 2,
              py: 1,
              borderRadius: 1,
              textTransform: 'none',
              fontSize: '0.9rem',
              bgcolor: isActive ? 'action.selected' : 'transparent',
              '&:hover': {
                bgcolor: isActive ? 'action.selected' : 'action.hover',
              },
            }}
            onClick={() => navigate(item.path)}
          >
            {item.text}
          </Button>
        );
      })}
    </Box>
  );
};

/**
 * LoginButton component for desktop navigation
 *
 * @param {Object} props - Component props
 * @param {Function} props.navigate - Navigation function
 * @returns {JSX.Element} The login button component
 */
const LoginButton = ({ navigate }) => {
  return (
    <Button
      variant="contained"
      sx={{ px: 3, py: 1, borderRadius: 1, textTransform: 'none' }}
      onClick={() => navigate('/login')}
    >
      Log in
    </Button>
  );
};

// Attach LoginButton as a static property
DesktopNav.LoginButton = LoginButton;

export default DesktopNav;