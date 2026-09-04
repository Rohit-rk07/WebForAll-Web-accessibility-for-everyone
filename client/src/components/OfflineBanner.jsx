import { Alert } from "@mui/material";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const OfflineBanner = () => {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <Alert
      severity="warning"
      role="status"
      sx={{ borderRadius: 0, wordBreak: "break-word" }}
    >
      You are offline. Some actions will fail until your connection is restored.
    </Alert>
  );
};

export default OfflineBanner;
