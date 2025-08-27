import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Link as MuiLink,
  InputAdornment,
  IconButton,
  Paper,
  Avatar,
  Container,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';

import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock,
  Security
} from '@mui/icons-material';

import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';



/**
 * Login page component
 * Handles user authentication
 */
const Login = () => {
  // State management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  
  // Hooks
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();
  const theme = useTheme();

  /**
   * Handles form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Pass the email to the login function
      await login({ email, password });
    navigate('/dashboard/home');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles demo login
   */
  const handleDemoLogin = () => {
    demoLogin();
    navigate('/dashboard/home');
  };

  /**
   * Toggles password visibility
   */
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        py: { xs: 4, md: 8 }
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={4}
          sx={{ 
            p: { xs: 3, md: 5 }, 
            borderRadius: 4,
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Logo and Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              <Security />
            </Avatar>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              Accessibility Analyzer
            </Typography>
          </Box>

          {/* Page Title */}
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            Welcome back
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Please sign in to your account to continue
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            {/* Email Field */}
            <TextField 
              label="Email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              fullWidth 
              variant="outlined"
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Password Field */}
            <TextField 
              label="Password" 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              fullWidth 
              variant="outlined"
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={toggleShowPassword}
                      edge="end"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {/* Forgot Password Link */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <MuiLink 
                component={Link}
                to="/forgot-password"
                variant="body2"
                underline="hover"
              >
                Forgot password?
              </MuiLink>
            </Box>
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              variant="contained" 
              size="large" 
              fullWidth
              disabled={isSubmitting}
              sx={{ 
                py: 1.5, 
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(85, 98, 255, 0.4)',
                mt: 2
              }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
            </Button>

            {/* Demo Login */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 1 }}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="body2" color="text.secondary">or</Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>
            
            <Button 
              onClick={handleDemoLogin} 
              variant="outlined" 
              size="large" 
              fullWidth
              disabled={isSubmitting}
              sx={{ 
                py: 1.5, 
                borderRadius: 2,
                mt: 1
              }}
            >
              Continue as Demo User
            </Button>
            
            {/* Sign Up Link */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <MuiLink component={Link} to="/signup" fontWeight="medium" underline="hover">
                  Sign up
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>

      
    </Box>
  );
};

export default Login; 