import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';

/**
 * DemoButton Component
 * Displays the demo login button with loading state
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onClick - Click handler
 * @param {Object} props.theme - MUI theme object
 * @returns {JSX.Element} The demo button component
 */
const DemoButton = ({ loading, onClick, theme }) => {
  return (
    <Box sx={{ 
      textAlign: 'center',
      mb: 4
    }}>
      <Button 
        variant="contained" 
        size="large"
        disabled={loading}
        onClick={onClick}
        aria-label="Continue as demo user"
        sx={{ 
          bgcolor: theme.palette.primary.main,
          color: 'white',
          px: 6, 
          py: 2,
          fontSize: '1.2rem',
          fontWeight: 'bold',
          textTransform: 'none',
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)',
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
            boxShadow: '0 6px 16px rgba(67, 97, 238, 0.4)'
          }
        }}
      >
        {loading ? <CircularProgress size={22} color="inherit" /> : 'Continue as Demo User'}
      </Button>
    </Box>
  );
};

export default DemoButton;