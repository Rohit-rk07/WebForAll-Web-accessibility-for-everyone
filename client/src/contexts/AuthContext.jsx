import React, { createContext, useContext, useState } from 'react';

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

  // Fake login (stub – integrate with backend later)
  const login = ({ email }) => {
    setUser({ email });
  };

  const logout = () => {
    setUser(null);
  };

  const contextValue = {
    user,
    isLoggedIn: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}; 