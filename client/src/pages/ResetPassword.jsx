import React, { useMemo, useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  Avatar,
  Link as MuiLink,
  useTheme,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AccessibilityNew,
  ArrowBack,
} from "@mui/icons-material";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { passwordInvalidReason } from "../utils/passwordPolicy";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();
  const theme = useTheme();

  const token = useMemo(
    () => new URLSearchParams(location.search).get("token") || "",
    [location.search],
  );

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!token) {
      setError(
        "Invalid or missing reset token. Please use the link from your email.",
      );
      return;
    }
    const passwordHint2 = passwordInvalidReason(pw1);
    if (passwordHint2) {
      setError(passwordHint2);
      return;
    }
    if (pw1 !== pw2) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      const res = await resetPassword(token, pw1);
      setMessage(
        res?.message || "Password reset successfully. Redirecting to login...",
      );
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Failed to reset password");
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
            Set a new password
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Enter a new password for your account.
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
              type={showPw1 ? "text" : "password"}
              label="New Password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              fullWidth
              required
              autoComplete="new-password"
              margin="normal"
              helperText="At least 8 characters with upper, lower, number, and special character"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPw1 ? "Hide password" : "Show password"}
                      onClick={() => setShowPw1((s) => !s)}
                      edge="end"
                    >
                      {showPw1 ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              type={showPw2 ? "text" : "password"}
              label="Confirm New Password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              fullWidth
              required
              autoComplete="new-password"
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPw2 ? "Hide password" : "Show password"}
                      onClick={() => setShowPw2((s) => !s)}
                      edge="end"
                    >
                      {showPw2 ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
              sx={{ mt: 2, py: 1.5 }}
            >
              {loading ? "Updating…" : "Update Password"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}