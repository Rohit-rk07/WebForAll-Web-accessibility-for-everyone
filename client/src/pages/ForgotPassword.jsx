import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldownLeft, setCooldownLeft] = useState(0); // seconds

  // Decrement cooldown every second
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setInterval(() => setCooldownLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldownLeft]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await forgotPassword(email);
      setMessage(res?.message || 'If the email exists, a reset link has been sent.');
      // Start local cooldown (align with backend: 2 minutes by default)
      setCooldownLeft((prev) => (prev > 0 ? prev : 120));
    } catch (err) {
      setError(err.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Forgot Password
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Enter your account email. If it exists, we will send a password reset link.
        </Typography>
        <Box component="form" onSubmit={onSubmit} sx={{ mt: 2 }}>
          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}
          <TextField
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <Button type="submit" variant="contained" disabled={loading || cooldownLeft > 0} fullWidth sx={{ mt: 1 }}>
            {loading
              ? 'Sending…'
              : cooldownLeft > 0
                ? `Send Again in ${String(Math.floor(cooldownLeft / 60)).padStart(1, '0')}:${String(cooldownLeft % 60).padStart(2, '0')}`
                : 'Send Reset Link'}
          </Button>
          {cooldownLeft > 0 && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, textAlign: 'center' }}>
              You can request another reset email after the cooldown.
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
