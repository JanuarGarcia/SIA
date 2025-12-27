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

  // Category management
  getCategories: async () => {
    const response = await api.get('/admin/categories', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  addCategory: async (categoryName) => {
    const response = await api.post(
      '/admin/categories',
      { name: categoryName },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  updateCategory: async (oldName, newName) => {
    const response = await api.put(
      `/admin/categories/${encodeURIComponent(oldName)}`,
      { name: newName },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  deleteCategory: async (categoryName) => {
    const response = await api.delete(`/admin/categories/${encodeURIComponent(categoryName)}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Course management
  getCourses: async () => {
    const response = await api.get('/admin/courses', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  addCourse: async (courseName) => {
    const response = await api.post(
      '/admin/courses',
      { name: courseName },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  updateCourse: async (oldName, newName) => {
    const response = await api.put(
      `/admin/courses/${encodeURIComponent(oldName)}`,
      { name: newName },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  deleteCourse: async (courseName) => {
    const response = await api.delete(`/admin/courses/${encodeURIComponent(courseName)}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Office location management
  getOffices: async () => {
    const response = await api.get('/admin/offices', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  addOffice: async (officeData) => {
    const response = await api.post(
      '/admin/offices',
      officeData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  updateOffice: async (officeId, officeData) => {
    const response = await api.put(
      `/admin/offices/${officeId}`,
      officeData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  deleteOffice: async (officeId) => {
    const response = await api.delete(`/admin/offices/${officeId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

