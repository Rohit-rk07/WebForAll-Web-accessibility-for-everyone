import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * HeroSection Component
 * Displays the main hero section with tagline
 * 
 * @param {Object} props - Component props
 * @param {Object} props.theme - MUI theme object
 * @returns {JSX.Element} The hero section component
 */
const HeroSection = ({ theme }) => {
  return (
    <Box sx={{ 
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      py: 8
    }}>
      <Box sx={{ 
        width: '100%', 
        textAlign: 'center',
        py: 3,
        px: 4,
        bgcolor: 'rgba(0,0,0,0.0)',
        borderRadius: 3,
        border: '1px solid rgba(0,0,0,0)'
      }}>
        <Typography 
          variant="h3" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontWeight: 500,
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: { xs: '1.6rem', md: '2.0rem' },
            lineHeight: 1,
            maxWidth: '1000px',
            mx: 'auto'
          }}
        >
          Analyze website accessibility with AI-powered insights{' '}
          <br />
          and recommendations for free
        </Typography>
      </Box>
    </Box>
  );
};

export default HeroSection;