import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

/**
 * FeatureCard Component
 * Displays individual feature cards on the home page with hover effects
 * 
 * @param {Object} props - Component props
 * @param {string} props.icon - Emoji icon for the feature
 * @param {string} props.title - Feature title
 * @param {string} props.description - Feature description
 * @param {Object} props.theme - MUI theme object
 * @returns {JSX.Element} The feature card component
 */
const FeatureCard = ({ icon, title, description, theme }) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        borderRadius: 4, 
        bgcolor: theme.palette.background.paper,
        background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.05) 0%, rgba(67, 97, 238, 0.02) 100%)',
        border: '1px solid rgba(67, 97, 238, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 40px rgba(67, 97, 238, 0.15)',
          background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.08) 0%, rgba(67, 97, 238, 0.04) 100%)',
          border: '1px solid rgba(67, 97, 238, 0.2)',
          '& .feature-icon': {
            transform: 'scale(1.1) rotate(5deg)',
          },
          '& .feature-title': {
            color: theme.palette.primary.main,
          }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover::before': {
          opacity: 1,
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography 
          className="feature-icon"
          variant="h3" 
          sx={{ 
            mr: 2, 
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: 'drop-shadow(0 2px 4px rgba(67, 97, 238, 0.2))'
          }}
        >
          {icon}
        </Typography>
        <Typography 
          className="feature-title"
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            color: theme.palette.text.primary,
            transition: 'color 0.3s ease',
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
          }}
        >
          {title}
        </Typography>
      </Box>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
          whiteSpace: 'pre-line',
          lineHeight: 1.6,
          fontSize: '1rem',
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
        }}
      >
        {description}
      </Typography>
    </Paper>
  );
};

export default FeatureCard;