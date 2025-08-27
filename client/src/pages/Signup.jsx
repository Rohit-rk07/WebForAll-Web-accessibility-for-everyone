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
  Security,
  Person
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Signup page component
 * Handles new user registration
 */
const Signup = () => {
  // State management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Hooks
  const navigate = useNavigate();
  const { register } = useAuth();
  const theme = useTheme();

  /**
   * Handles form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    
    // Validate form
    if (!fullName) {
      setError("Full name is required");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await register({ 
        email, 
        fullName,
        password
      });
      

    navigate('/dashboard/home');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
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
            Create an account
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Join us to analyze and improve web accessibility
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Signup Form */}
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
                
            {/* Full Name Field */}
            <TextField 
              label="Full Name" 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              required
              fullWidth 
              variant="outlined"
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
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
                
            {/* Confirm Password Field */}
                <TextField 
                  label="Confirm Password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  fullWidth 
                  variant="outlined"
              disabled={isSubmitting}
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
              disabled={isSubmitting}
                  sx={{ 
                    py: 1.5, 
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(85, 98, 255, 0.4)',
                    mt: 2
                  }}
                >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                  </Button>
            
            {/* Sign In Link */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <MuiLink component={Link} to="/login" fontWeight="medium" underline="hover">
                  Sign in
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup; 