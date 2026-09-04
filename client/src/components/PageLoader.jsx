import { Box, CircularProgress, Typography } from "@mui/material";

const PageLoader = ({ label = "Loading..." }) => (
  <Box
    role="status"
    aria-live="polite"
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "40vh",
      gap: 2,
      p: 4,
    }}
  >
    <CircularProgress aria-hidden="true" />
    <Typography variant="body1" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

export default PageLoader;
