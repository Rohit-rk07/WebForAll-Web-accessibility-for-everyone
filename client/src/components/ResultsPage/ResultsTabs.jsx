import React from 'react';
import {
  Tabs,
  Tab,
  Box,
  Typography
} from '@mui/material';
import {
  ErrorOutline,
  CheckCircleOutline,
  HelpOutline,
  Block
} from '@mui/icons-material';

/**
 * Results Tabs Component
 * Handles navigation between different result categories
 */
const ResultsTabs = ({ 
  activeTab, 
  onTabChange, 
  resultCounts 
}) => {
  const tabs = [
    {
      label: 'Violations',
      icon: <ErrorOutline />,
      count: resultCounts.violations,
      color: 'error'
    },
    {
      label: 'Passes',
      icon: <CheckCircleOutline />,
      count: resultCounts.passes,
      color: 'success'
    },
    {
      label: 'Incomplete',
      icon: <HelpOutline />,
      count: resultCounts.incomplete,
      color: 'warning'
    },
    {
      label: 'Inapplicable',
      icon: <Block />,
      count: resultCounts.inapplicable,
      color: 'default'
    }
  ];

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={activeTab} 
        onChange={onTabChange}
        variant="fullWidth"
        sx={{
          '& .MuiTab-root': {
            minHeight: 64,
            textTransform: 'none',
            fontSize: '1rem'
          }
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            icon={tab.icon}
            label={
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {tab.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tab.count} {tab.count === 1 ? 'item' : 'items'}
                </Typography>
              </Box>
            }
            sx={{
              '&.Mui-selected': {
                color: `${tab.color}.main`
              }
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default ResultsTabs;
