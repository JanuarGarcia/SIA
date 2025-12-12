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

export const adminController = {
  // Get all tickets for admin review
  getTickets: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/admin/tickets?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get a single ticket by ID for admin review
  getTicket: async (ticketId) => {
    const response = await api.get(`/admin/tickets/${ticketId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update ticket status and add remarks
  updateTicketStatus: async (ticketId, statusData) => {
    const response = await api.put(`/admin/tickets/${ticketId}/status`, statusData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Add a remark/comment to a ticket
  addRemark: async (ticketId, remarkData) => {
    const response = await api.post(`/admin/tickets/${ticketId}/comments`, remarkData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get admin statistics
  getStatistics: async () => {
    const response = await api.get('/admin/statistics', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

