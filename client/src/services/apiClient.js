const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getToken = () => localStorage.getItem('accessToken');

const buildUrl = (path) => `${API_BASE_URL}${path}`;
const REQUEST_TIMEOUT_MS = 30000;

const authHeaders = async (extraHeaders = {}) => {
  const token = getToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// CSRF token management
let csrfToken = null;

const getCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  
  try {
    const response = await fetch(buildUrl('/csrf-token'));
    const data = await response.json();
    csrfToken = data.csrf_token;
    return csrfToken;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
};

const csrfHeaders = async (extraHeaders = {}) => {
  const token = await getCsrfToken();
  return {
    ...extraHeaders,
    ...(token ? { 'X-CSRF-Token': token } : {})
  };
};

// Debounce utility function
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

export const apiJson = async (path, options = {}) => {
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes((options.method || 'POST').toUpperCase());
  const csrfHeader = isStateChanging ? await csrfHeaders() : {};
  const authHeaderValue = await authHeaders();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(buildUrl(path), {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        ...csrfHeader,
        ...authHeaderValue,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timeoutId);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.detail || data?.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
};

export const apiForm = async (path, formData, options = {}) => {
  const csrfHeader = await csrfHeaders();
  const authHeaderValue = await authHeaders();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(buildUrl(path), {
      ...options,
      signal: options.signal || controller.signal,
      method: options.method || 'POST',
      headers: {
        ...csrfHeader,
        ...authHeaderValue,
        ...(options.headers || {})
      },
      body: formData
    });
  } finally {
    clearTimeout(timeoutId);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.detail || data?.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
};

export const apiDelete = async (path, options = {}) => {
  return apiJson(path, { ...options, method: 'DELETE' });
};

// Debounced versions for frequently called endpoints
export const apiJsonDebounced = debounce(apiJson, 300);
export const apiFormDebounced = debounce(apiForm, 300);

export default {
  apiJson,
  apiForm,
  apiDelete,
  apiJsonDebounced,
  apiFormDebounced
};
