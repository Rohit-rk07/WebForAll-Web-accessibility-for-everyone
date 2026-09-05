import React from "react";
import { Alert, Button, Typography } from "@mui/material";

/**
 * ErrorPanel - page-level error state.
 * Tells the user what happened and offers a recovery action.
 *
 * @param {Object} props
 * @param {string} [props.title] - Short heading ("Couldn't load your reports")
 * @param {React.ReactNode} [props.body] - What happened / what to do next
 * @param {React.ReactNode} [props.detail] - Optional technical detail
 * @param {Function} [props.onRetry] - Retry handler; renders a retry button
 * @param {string} [props.retryLabel] - Defaults to "Try again"
 */
const ErrorPanel = ({ title = "Something went wrong", body, detail, onRetry, retryLabel = "Try again" }) => (
  <Alert
    severity="error"
    sx={{ my: 2 }}
    action={
      onRetry ? (
        <Button color="inherit" size="small" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : undefined
    }
  >
    <Typography variant="body2" component="div" sx={{ fontWeight: 600 }}>
      {title}
    </Typography>
    {body && (
      <Typography variant="body2" component="div" color="text.secondary" sx={{ mt: 0.5 }}>
        {body}
      </Typography>
    )}
    {detail && (
      <Typography
        variant="caption"
        component="div"
        color="text.disabled"
        sx={{ mt: 0.5, wordBreak: "break-word" }}
      >
        {detail}
      </Typography>
    )}
  </Alert>
);

export default ErrorPanel;