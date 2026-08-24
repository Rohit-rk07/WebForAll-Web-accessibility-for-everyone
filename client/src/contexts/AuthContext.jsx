import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiForm, apiJson } from '../services/apiClient';

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
        const userData = await apiJson('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (userData) {
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


      
      const data = await apiForm('/token', formData);
      
      // Store token
      localStorage.setItem('accessToken', data.access_token);

      // Prefer the user payload returned by /token to avoid an extra round trip.
      if (data.user) {
        setUser(data.user);
        return data.user;
      }

      // Fallback for older responses or nonstandard auth proxies.
      const userData = await apiJson('/users/me', {
        headers: {
          Authorization: `Bearer ${data.access_token}`
        }
      });
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
      const responseData = await apiJson('/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          full_name: fullName,
          password
        })
      });
      
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
      return await apiJson('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Reset password function
  const resetPassword = async (token, newPassword) => {
    setError(null);
    try {
      return await apiJson('/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          new_password: newPassword
        })
      });
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
