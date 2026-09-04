const NETWORK_HINT =
  "Unable to reach the server. Check your connection and try again.";
const TIMEOUT_HINT = "The request took too long. Please try again.";
const OFFLINE_HINT = "You appear to be offline. Reconnect and try again.";

export const isOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

export const getUserFacingError = (error, fallback = "Something went wrong. Please try again.") => {
  if (isOffline()) {
    return OFFLINE_HINT;
  }

  if (!error) {
    return fallback;
  }

  if (error.name === "AbortError") {
    return TIMEOUT_HINT;
  }

  const status = error.status || error.response?.status;
  const detail = error.response?.data?.detail;

  if (status === 401) {
    return "Your session expired. Please sign in again.";
  }
  if (status === 403) {
    return "You do not have permission to do that.";
  }
  if (status === 404) {
    return "We could not find that resource. Refresh and try again.";
  }
  if (status === 429) {
    return "Too many requests. Wait a moment and try again.";
  }
  if (status >= 500) {
    return "The server had a problem. Please try again in a few minutes.";
  }

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  const message = error.message || "";
  if (
    /failed to fetch|networkerror|load failed|err_connection/i.test(message)
  ) {
    return NETWORK_HINT;
  }

  if (message && !/request failed \(\d+\)/i.test(message)) {
    return message;
  }

  return fallback;
};
