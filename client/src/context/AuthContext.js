import React, { createContext, useState, useEffect, useContext } from 'react';
import { authController } from '../controllers/authController';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await authController.getCurrentUser(storedToken);
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authController.login(credentials);
      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        // Server responded with error
        return {
          success: false,
          message: error.response.data?.message || `Server error: ${error.response.status}`,
        };
      } else if (error.request) {
        // Request made but no response
        return {
          success: false,
          message: 'Cannot connect to server. Please make sure the backend is running on port 5000.',
        };
      } else {
        // Error setting up request
        return {
          success: false,
          message: error.message || 'Login failed. Please try again.',
        };
      }
    }
  };

  const register = async (userData) => {
    try {
      const response = await authController.register(userData);
      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response) {
        // Server responded with error
        const responseData = error.response.data || {};
        return {
          success: false,
          message: responseData.message || `Server error: ${error.response.status}`,
          errors: responseData.errors || [],
        };
      } else if (error.request) {
        // Request made but no response
        return {
          success: false,
          message: 'Cannot connect to server. Please make sure the backend is running on port 5000.',
          errors: [],
        };
      } else {
        // Error setting up request
        return {
          success: false,
          message: error.message || 'Registration failed. Please try again.',
          errors: [],
        };
      }
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authController.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
  };

  const setAuthData = (userData, tokenValue) => {
    setUser(userData);
    setToken(tokenValue);
    if (tokenValue) {
      localStorage.setItem('token', tokenValue);
    }
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const userData = await authController.getCurrentUser(storedToken);
        setUser(userData);
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!token && !!user,
    updateUser,
    setAuthData,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

