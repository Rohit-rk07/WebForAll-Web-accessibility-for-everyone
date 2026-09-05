import React, { useEffect, useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Avatar,
  Link as MuiLink,
  useTheme,
} from "@mui/material";
import { AccessibilityNew, ArrowBack } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0); // seconds
  const theme = useTheme();

  // Decrement cooldown every second
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setInterval(
      () => setCooldownLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [cooldownLeft]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await forgotPassword(email);
      setMessage(
        res?.message || "If the email exists, a reset link has been sent.",
      );
      // Start local cooldown (align with backend: 2 minutes by default)
      setCooldownLeft((prev) => (prev > 0 ? prev : 120));
    } catch (err) {
      setError(err.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="sm">
        <MuiLink
          component={Link}
          to="/"
          underline="hover"
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, mb: 3, color: "text.secondary" }}
        >
          <ArrowBack fontSize="small" aria-hidden="true" />
          Back to home
        </MuiLink>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              <AccessibilityNew fontSize="small" />
            </Avatar>
            <Typography variant="h5" component="span" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
              Accessibility Analyzer
            </Typography>
          </Box>

          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1, letterSpacing: "-0.02em" }}>
            Reset your password
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Enter your account email. If it exists, we will send a password
            reset link.
          </Typography>

          <Box component="form" onSubmit={onSubmit} sx={{ mt: 2 }}>
            {message && (
              <Alert severity="success" sx={{ mb: 2, wordBreak: "break-word" }}>
                {message}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2, wordBreak: "break-word" }}>
                {error}
              </Alert>
            )}
            <TextField
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              autoComplete="email"
              margin="normal"
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading || cooldownLeft > 0}
              fullWidth
              sx={{ mt: 2, py: 1.5 }}
            >
              {loading
                ? "Sending…"
                : cooldownLeft > 0
                  ? `Send Again in ${String(Math.floor(cooldownLeft / 60)).padStart(1, "0")}:${String(cooldownLeft % 60).padStart(2, "0")}`
                  : "Send Reset Link"}
            </Button>
            {cooldownLeft > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 1, textAlign: "center" }}
              >
                You can request another reset email after the cooldown.
              </Typography>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}