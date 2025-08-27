import React, { useMemo, useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert, Paper, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();

  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);

  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!token) {
      setError('Invalid or missing reset token. Please use the link from your email.');
      return;
    }
    if (pw1.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (pw1 !== pw2) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      const res = await resetPassword(token, pw1);
      setMessage(res?.message || 'Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Reset Password
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Enter a new password for your account.
        </Typography>
        <Box component="form" onSubmit={onSubmit} sx={{ mt: 2 }}>
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            type={showPw1 ? 'text' : 'password'}
            label="New Password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            fullWidth
            required
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPw1 ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPw1((s) => !s)}
                    edge="end"
                  >
                    {showPw1 ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            type={showPw2 ? 'text' : 'password'}
            label="Confirm New Password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            fullWidth
            required
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPw2 ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPw2((s) => !s)}
                    edge="end"
                  >
                    {showPw2 ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button type="submit" variant="contained" disabled={loading} fullWidth sx={{ mt: 1 }}>
            {loading ? 'Updating…' : 'Update Password'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
