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

export const chatbotController = {
  // Send message to chatbot
  sendMessage: async (message, userId, conversationContext = null) => {
    const response = await api.post(
      '/chatbot/message',
      { message, userId, conversationContext },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },
};

