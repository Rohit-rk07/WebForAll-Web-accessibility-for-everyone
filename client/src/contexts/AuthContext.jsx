import React, { createContext, useContext, useState, useEffect } from 'react';

// API base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create context
const AuthContext = createContext(null);

// Hook to access auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children, value }) => {
  // If value is provided from outside, use it
  if (value) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  // Otherwise, create our own state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in (from token in localStorage)
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token is invalid or expired
          localStorage.removeItem('accessToken');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
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
      formData.append('username', email); // OAuth2 uses 'username' field
      formData.append('password', password);


      
      const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Login failed:', data);
        throw new Error(data.detail || 'Login failed');
      }
      
      // Store token
      localStorage.setItem('accessToken', data.access_token);
      
      // Get user info
      const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });
      
      if (!userResponse.ok) {
        const userError = await userResponse.json();
        throw new Error(userError.detail || 'Failed to get user info');
      }
      
      const userData = await userResponse.json();
      setUser(userData);
      
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Register function
  const register = async ({ email, fullName, password }) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          full_name: fullName,
          password
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Registration failed:', responseData);
        // Check for validation errors
        if (response.status === 422 && responseData.detail) {
          throw new Error(responseData.detail);
        } else if (responseData.detail) {
          throw new Error(responseData.detail);
        } else {
          throw new Error('Registration failed. Please try again.');
        }
      }
      
      // Auto login after registration
      try {
        await login({ email, password });
      } catch (loginErr) {
        console.error('Auto-login after registration failed:', loginErr);
        // Don't throw here, registration was successful even if auto-login failed
      }
      
      return responseData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to process request');
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Reset password function
  const resetPassword = async (token, newPassword) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          new_password: newPassword
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  // Demo login function: authenticate using seeded test account
  const demoLogin = async () => {
    // Seeded in backend services/db.py: test@example.com / password123
    setError(null);
    try {
      await login({ email: 'test@example.com', password: 'password123' });
    } catch (err) {
      setError(err.message || 'Demo login failed');
      throw err;
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
    error
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}; 