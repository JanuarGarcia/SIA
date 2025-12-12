import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to create headers with token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const profileController = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/profile', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/profile/password', passwordData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Delete user account
  deleteAccount: async (password) => {
    const response = await api.delete('/profile', {
      headers: getAuthHeaders(),
      data: { password },
    });
    return response.data;
  },
};

