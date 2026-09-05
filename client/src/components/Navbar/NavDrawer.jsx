import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import {
  Close as CloseIcon,
  Logout,
  Home as HomeIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  MenuBook as GuidelinesIcon,
  AccessibilityNew,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Icon mapping
const iconMap = {
  HomeIcon: <HomeIcon />,
  HistoryIcon: <HistoryIcon />,
  SettingsIcon: <InfoIcon />,
  InfoIcon: <InfoIcon />,
  GuidelinesIcon: <GuidelinesIcon />,
};

/**
 * DrawerItem - single nav row with an obvious-but-subtle active state.
 */
const DrawerItem = ({ label, path, icon, onClose, navigate, muted, onAction }) => {
  const { pathname } = useLocation();
  const isActive = !muted && pathname === path;

  return (
    <ListItem
      component="button"
      type="button"
      onClick={() => {
        onClose();
        if (onAction) onAction();
        else if (path) navigate(path);
      }}
      aria-current={isActive ? 'page' : undefined}
      sx={{
        color: isActive ? 'primary.main' : 'text.primary',
        bgcolor: isActive ? 'action.selected' : 'transparent',
        borderRadius: 1,
        mb: 0.5,
        cursor: 'pointer',
        '&:hover': {
          bgcolor: isActive ? 'action.selected' : 'action.hover',
        },
      }}
    >
      <ListItemIcon
        sx={{
          color: isActive ? 'primary.main' : 'text.secondary',
          minWidth: 36,
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText primary={label} />
    </ListItem>
  );
};

/**
 * NavDrawer component for mobile navigation
 */
const NavDrawer = ({ navItems, isLoggedIn, navigate, onClose, onLogout }) => {
  const theme = useTheme();

  return (
    <Box role="dialog" aria-label="Navigation">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: 'primary.main' }}>
            <AccessibilityNew sx={{ fontSize: 18 }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Accessibility Analyzer
          </Typography>
        </Box>
        <IconButton
          edge="end"
          aria-label="close drawer"
          onClick={onClose}
          sx={{ color: 'text.primary' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: theme.palette.divider }} />

      <List sx={{ p: 1.5 }}>
        {isLoggedIn ? (
          <>
            <DrawerItem
              label="Dashboard"
              path="/dashboard/home"
              icon={<HomeIcon />}
              onClose={onClose}
              navigate={navigate}
            />
            <DrawerItem
              label="Reports"
              path="/dashboard/history"
              icon={<HistoryIcon />}
              onClose={onClose}
              navigate={navigate}
            />
            {navItems
              .filter((item) => !["Dashboard", "History"].includes(item.text))
              .map((item) => (
                <DrawerItem
                  key={item.text}
                  label={item.text}
                  path={item.path}
                  icon={iconMap[item.icon]}
                  onClose={onClose}
                  navigate={navigate}
                />
              ))}
            <Divider sx={{ my: 1.5, borderColor: theme.palette.divider }} />
            <DrawerItem
              label="Logout"
              path={null}
              icon={<Logout />}
              onClose={onClose}
              navigate={navigate}
              muted
              onAction={() => {
                onLogout();
                navigate('/');
              }}
            />
          </>
        ) : (
          <DrawerItem
            label="Log in"
            path="/login"
            icon={<LoginIcon />}
            onClose={onClose}
            navigate={navigate}
          />
        )}
      </List>
    </Box>
  );
};

export default NavDrawer;