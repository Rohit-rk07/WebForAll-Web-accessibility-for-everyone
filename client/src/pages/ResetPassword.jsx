import React, { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Lock,
  Security
} from '@mui/icons-material';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Reset Password component
 * Handles password reset using a token from the URL
 */
const ResetPassword = () => {
  // Get token from URL
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // State management
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Hooks
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  /**
   * Handles form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    
    // Validate form
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again or request a new reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Toggles password visibility
   */
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Navigate to login page
   */
  const handleGoToLogin = () => {
    navigate('/login');
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
            background: 'rgba(255, 255, 255, 0.9)',
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
            Reset Password
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Enter your new password below
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Your password has been reset successfully!
            </Alert>
          )}

          {success ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Button 
                variant="contained" 
                size="large" 
                fullWidth
                onClick={handleGoToLogin}
                sx={{ 
                  py: 1.5, 
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(85, 98, 255, 0.4)',
                  mt: 2
                }}
              >
                Go to Login
              </Button>
            </Box>
          ) : (
            /* Reset Password Form */
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}
            >
              {/* New Password Field */}
              <TextField 
                label="New Password" 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                fullWidth 
                variant="outlined"
                disabled={isSubmitting || !token}
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
                        disabled={isSubmitting || !token}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              {/* Confirm Password Field */}
              <TextField 
                label="Confirm Password" 
                type={showPassword ? 'text' : 'password'} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                fullWidth 
                variant="outlined"
                disabled={isSubmitting || !token}
                error={password !== confirmPassword && confirmPassword !== ''}
                helperText={
                  password !== confirmPassword && confirmPassword !== '' 
                    ? "Passwords don't match" 
                    : ''
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  )
                }}
              />
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="contained" 
                size="large" 
                fullWidth
                disabled={isSubmitting || !token}
                sx={{ 
                  py: 1.5, 
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(85, 98, 255, 0.4)',
                  mt: 2
                }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
              </Button>
              
              {/* Back to Login Link */}
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2">
                  Remember your password?{' '}
                  <MuiLink component={Link} to="/login" fontWeight="medium" underline="hover">
                    Back to login
                  </MuiLink>
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPassword; 