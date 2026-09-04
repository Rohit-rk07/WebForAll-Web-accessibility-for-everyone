/**
 * API base URL resolution.
 *
 * Resolution order:
 *   1. Runtime config injected by the deployment (window.__APP_CONFIG__.API_URL)
 *   2. VITE_API_URL baked in at build time
 *   3. localhost fallback for development builds only
 *
 * In production, an unconfigured API URL fails loudly so the deployment is
 * never silently pointed at localhost.
 */
const getApiBaseUrl = () => {
  const runtime =
    typeof window !== "undefined" ? window?.__APP_CONFIG__?.API_URL : null;
  if (runtime) return runtime;

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;

  if (import.meta.env.PROD) {
    throw new Error(
      "API URL is not configured. Set VITE_API_URL at build time or " +
        "inject window.__APP_CONFIG__.API_URL at runtime.",
    );
  }

  return "http://localhost:8000";
};

export const API_BASE_URL = getApiBaseUrl();

export default { getApiBaseUrl };