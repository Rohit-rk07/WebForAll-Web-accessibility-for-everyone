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
  Stepper,
  Step,
  StepLabel,
  Container
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
 * Handles new user registration with a multi-step form
 */
const Signup = () => {
  // State management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Hooks
  const navigate = useNavigate();
  const { login } = useAuth();

  /**
   * Handles form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return; // rudimentary check
    login({ email });
    navigate('/dashboard/home');
  };

  /**
   * Toggles password visibility
   */
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Advances to the next step in the form
   */
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  /**
   * Goes back to the previous step in the form
   */
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Form steps
  const steps = ['Account Details', 'Personal Information'];

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
            Create an account
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Join us to analyze and improve web accessibility
          </Typography>

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
            {/* Form Steps Indicator */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step 1: Account Details */}
            {activeStep === 0 && (
              <>
                <TextField 
                  label="Email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  fullWidth 
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField 
                  label="Password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  fullWidth 
                  variant="outlined"
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
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                
                <TextField 
                  label="Confirm Password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  fullWidth 
                  variant="outlined"
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
                
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth
                  onClick={handleNext}
                  disabled={!email || !password || !confirmPassword || password !== confirmPassword}
                  sx={{ 
                    py: 1.5, 
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(85, 98, 255, 0.4)',
                    mt: 2
                  }}
                >
                  Next
                </Button>
              </>
            )}

            {/* Step 2: Personal Information */}
            {activeStep === 1 && (
              <>
                <TextField 
                  label="Full Name" 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  fullWidth 
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    onClick={handleBack}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2,
                      flex: 1
                    }}
                  >
                    Back
                  </Button>
                  
                  <Button 
                    type="submit" 
                    variant="contained" 
                    size="large" 
                    disabled={!name}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2,
                      boxShadow: '0 4px 14px rgba(85, 98, 255, 0.4)',
                      flex: 1
                    }}
                  >
                    Create Account
                  </Button>
                </Box>
              </>
            )}
            
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