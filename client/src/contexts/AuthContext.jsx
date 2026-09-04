import React, { useState, useEffect } from "react";
import { apiForm, apiJson } from "../services/apiClient";
import { AuthContext } from "./AuthContextDefinition";

// Create context

const AuthProviderInner = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in (from token in localStorage)
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await apiJson("/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (userData) {
          setUser(userData);
        } else {
          // Token is invalid or expired
          localStorage.removeItem("accessToken");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async ({ email, password }) => {
    setError(null);
    try {
      // Convert to FormData as the backend expects OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append("username", email); // OAuth2 uses 'username' field
      formData.append("password", password);

      const data = await apiForm("/token", formData);

      // Store token
      localStorage.setItem("accessToken", data.access_token);

      // Prefer the user payload returned by /token to avoid an extra round trip.
      if (data.user) {
        setUser(data.user);
        return data.user;
      }

      // Fallback for older responses or nonstandard auth proxies.
      const userData = await apiJson("/users/me", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });
      setUser(userData);

      return userData;
    } catch (err) {
      // Provide more specific error messages based on error type
      let errorMessage = "An unexpected error occurred during login";

      if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          errorMessage = "Invalid email or password";
        } else if (status === 429) {
          errorMessage = "Too many login attempts. Please try again later.";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async ({ email, fullName, password }) => {
    setError(null);
    try {
      const responseData = await apiJson("/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          full_name: fullName,
          password,
        }),
      });

      // Auto login after registration
      try {
        await login({ email, password });
      } catch (loginErr) {
        console.error("Auto-login after registration failed:", loginErr);
        // Don't throw here, registration was successful even if auto-login failed
      }

      return responseData;
    } catch (err) {
      // Provide more specific error messages for registration
      let errorMessage = "An unexpected error occurred during registration";

      if (err.response) {
        const status = err.response.status;
        if (status === 400) {
          errorMessage =
            err.response.data?.detail || "Invalid registration data";
        } else if (status === 409) {
          errorMessage = "Email already registered";
        } else if (status === 429) {
          errorMessage =
            "Too many registration attempts. Please try again later.";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    setError(null);
    try {
      return await apiJson("/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      let errorMessage = "An unexpected error occurred";

      if (err.response) {
        const status = err.response.status;
        if (status === 429) {
          errorMessage = "Too many requests. Please try again later.";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Reset password function
  const resetPassword = async (token, newPassword) => {
    setError(null);
    try {
      return await apiJson("/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });
    } catch (err) {
      let errorMessage = "An unexpected error occurred";

      if (err.response) {
        const status = err.response.status;
        if (status === 400) {
          errorMessage = "Invalid or expired reset token";
        } else if (status === 429) {
          errorMessage = "Too many attempts. Please try again later.";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  // Demo login function: authenticate using server-side demo endpoint
  const demoLogin = async () => {
    setError(null);
    try {
      const data = await apiJson("/demo-login", {
        method: "POST",
      });

      // Store token from server response
      localStorage.setItem("accessToken", data.access_token);

      // Set user from response
      if (data.user) {
        setUser(data.user);
        return data.user;
      }

      // Fallback: fetch user data
      const userData = await apiJson("/users/me", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });
      setUser(userData);
      return userData;
    } catch (err) {
      let errorMessage = "Demo login failed. Please try again later.";

      if (err.response) {
        const status = err.response.status;
        if (status === 500) {
          errorMessage =
            "Demo service temporarily unavailable. Please try again later.";
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const contextValue = {
    user,
    isLoggedIn: !!user,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    demoLogin,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Provider component
export const AuthProvider = ({ children, value }) => {
  if (value) {
    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  }

  return <AuthProviderInner>{children}</AuthProviderInner>;
};
