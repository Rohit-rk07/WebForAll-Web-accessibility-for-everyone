const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getToken = () => localStorage.getItem('accessToken');

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const authHeaders = (extraHeaders = {}) => {
  const token = getToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const apiJson = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: authHeaders({
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    })
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.detail || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
};

export const apiForm = async (path, formData, options = {}) => {
  const response = await fetch(buildUrl(path), {
    ...options,
    method: options.method || 'POST',
    headers: authHeaders(options.headers || {}),
    body: formData
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.detail || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
};

export const apiDelete = async (path, options = {}) => {
  return apiJson(path, { ...options, method: 'DELETE' });
};

export default {
  apiJson,
  apiForm,
  apiDelete
};
