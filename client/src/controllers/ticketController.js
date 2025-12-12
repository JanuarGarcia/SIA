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

export const ticketController = {
  // Create a new ticket
  createTicket: async (ticketData) => {
    const response = await api.post('/tickets', ticketData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get all tickets with optional filters
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

    const response = await api.get(`/tickets?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get ticket statistics
  getStatistics: async () => {
    const response = await api.get('/tickets/stats', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get a single ticket by ID
  getTicket: async (ticketId) => {
    const response = await api.get(`/tickets/${ticketId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update a ticket
  updateTicket: async (ticketId, ticketData) => {
    const response = await api.put(`/tickets/${ticketId}`, ticketData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update ticket status
  updateTicketStatus: async (ticketId, statusData) => {
    const response = await api.put(`/tickets/${ticketId}/status`, statusData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Assign ticket to staff
  assignTicket: async (ticketId, assignedTo) => {
    const response = await api.put(
      `/tickets/${ticketId}/assign`,
      { assignedTo },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  // Delete a ticket
  deleteTicket: async (ticketId) => {
    const response = await api.delete(`/tickets/${ticketId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Comments
  // Get all comments for a ticket
  getComments: async (ticketId) => {
    const response = await api.get(`/tickets/${ticketId}/comments`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Add a comment
  addComment: async (ticketId, commentData) => {
    const response = await api.post(`/tickets/${ticketId}/comments`, commentData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update a comment
  updateComment: async (ticketId, commentId, commentData) => {
    const response = await api.put(
      `/tickets/${ticketId}/comments/${commentId}`,
      commentData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  // Delete a comment
  deleteComment: async (ticketId, commentId) => {
    const response = await api.delete(`/tickets/${ticketId}/comments/${commentId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

