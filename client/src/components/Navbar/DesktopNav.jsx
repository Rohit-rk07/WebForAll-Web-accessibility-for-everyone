import React from 'react';
import { Box, Button } from '@mui/material';

/**
 * DesktopNav component for desktop navigation links
 * 
 * @param {Object} props - Component props
 * @param {Array} props.navItems - Navigation items
 * @param {boolean} props.isLoggedIn - Whether user is logged in
 * @param {Function} props.navigate - Navigation function
 * @param {Object} props.colors - Color scheme
 * @returns {JSX.Element} The desktop navigation component
 */
const DesktopNav = ({ navItems, isLoggedIn, navigate, colors }) => {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {navItems.map((item) => (
        <Button 
          key={item.text}
          variant="contained"
          sx={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            color: 'white',
            fontWeight: 'bold',
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': {
              background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            },
            transition: 'all 0.2s ease'
          }}
          onClick={() => navigate(item.path)}
        >
          {item.text}
        </Button>
      ))}
    </Box>
  );
};

/**
 * LoginButton component for desktop navigation
 * 
 * @param {Object} props - Component props
 * @param {Function} props.navigate - Navigation function
 * @param {Object} props.colors - Color scheme
 * @returns {JSX.Element} The login button component
 */
const LoginButton = ({ navigate, colors }) => {
  return (
    <Button 
      variant="outlined" 
      sx={{ 
        borderColor: colors.primary,
        color: colors.primary,
        '&:hover': {
          borderColor: colors.secondary,
          bgcolor: colors.hover
        }
      }}
      onClick={() => navigate('/login')}
    >
      Login
    </Button>
  );
};

// Attach LoginButton as a static property
DesktopNav.LoginButton = LoginButton;

export default DesktopNav; 