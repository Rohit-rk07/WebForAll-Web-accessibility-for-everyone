import { getUserFacingError, isOffline } from "../utils/userFacingError";
import { API_BASE_URL } from "./apiConfig";

const getToken = () => localStorage.getItem("accessToken");

const buildUrl = (path) => `${API_BASE_URL}${path}`;
const REQUEST_TIMEOUT_MS = 30000;

const PUBLIC_AUTH_PATHS = [
  "/token",
  "/demo-login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/csrf-token",
];

const authHeaders = async (extraHeaders = {}) => {
  const token = getToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

let csrfToken = null;

const getCsrfToken = async () => {
  if (csrfToken) return csrfToken;

  try {
    const response = await fetch(buildUrl("/csrf-token"));
    const data = await response.json();
    csrfToken = data.csrf_token;
    return csrfToken;
  } catch (error) {
    console.error("Failed to get CSRF token:", error);
    return null;
  }
};

const csrfHeaders = async (extraHeaders = {}) => {
  const token = await getCsrfToken();
  return {
    ...extraHeaders,
    ...(token ? { "X-CSRF-Token": token } : {}),
  };
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const shouldRedirectOnUnauthorized = (path) =>
  !PUBLIC_AUTH_PATHS.some((publicPath) => path.startsWith(publicPath));

const redirectExpiredSession = (path, status) => {
  if (status !== 401 || !shouldRedirectOnUnauthorized(path)) {
    return;
  }
  localStorage.removeItem("accessToken");
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/dashboard")
  ) {
    window.location.assign("/login");
  }
};

const createRequestError = (message, status, data) => {
  const error = new Error(message);
  error.status = status;
  error.response = { status, data };
  return error;
};

const parseBody = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const handleFailedResponse = (path, response, data) => {
  redirectExpiredSession(path, response.status);
  const message = getUserFacingError(
    createRequestError(
      data?.detail || data?.message || `Request failed (${response.status})`,
      response.status,
      data,
    ),
  );
  throw createRequestError(message, response.status, data);
};

const handleNetworkFailure = (error) => {
  if (error?.status) {
    throw error;
  }
  throw createRequestError(getUserFacingError(error), error?.status);
};

export const apiJson = async (path, options = {}) => {
  if (isOffline()) {
    throw createRequestError(getUserFacingError(new Error("offline")));
  }

  const isStateChanging = ["POST", "PUT", "DELETE", "PATCH"].includes(
    (options.method || "POST").toUpperCase(),
  );
  const csrfHeader = isStateChanging ? await csrfHeaders() : {};
  const authHeaderValue = await authHeaders();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(buildUrl(path), {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        ...csrfHeader,
        ...authHeaderValue,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });

    const data = await parseBody(response);
    if (!response.ok) {
      handleFailedResponse(path, response, data);
    }
    return data;
  } catch (error) {
    handleNetworkFailure(error);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const apiForm = async (path, formData, options = {}) => {
  if (isOffline()) {
    throw createRequestError(getUserFacingError(new Error("offline")));
  }

  const csrfHeader = await csrfHeaders();
  const authHeaderValue = await authHeaders();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(buildUrl(path), {
      ...options,
      signal: options.signal || controller.signal,
      method: options.method || "POST",
      headers: {
        ...csrfHeader,
        ...authHeaderValue,
        ...(options.headers || {}),
      },
      body: formData,
    });

    const data = await parseBody(response);
    if (!response.ok) {
      handleFailedResponse(path, response, data);
    }
    return data;
  } catch (error) {
    handleNetworkFailure(error);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const apiDelete = async (path, options = {}) => {
  return apiJson(path, { ...options, method: "DELETE" });
};

export const apiJsonDebounced = debounce(apiJson, 300);
export const apiFormDebounced = debounce(apiForm, 300);

export default {
  apiJson,
  apiForm,
  apiDelete,
  apiJsonDebounced,
  apiFormDebounced,
};
