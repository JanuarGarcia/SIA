import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { adminController } from '../../controllers/adminController';
import TicketCard from '../../components/TicketCard';
import '../../styles/Admin.css';

const AdminTicketsList = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    // Get initial filters from URL query params
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status') || '';
    const priority = params.get('priority') || '';
    if (status || priority) {
      setFilters(prev => ({
        ...prev,
        status,
        priority,
      }));
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminController.getTickets(filters);
      setTickets(response.data.tickets);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load tickets. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = [
    'OTR Request',
    'Subject Enrollment',
    'Grade Inquiry',
    'Document Request',
    'Enrollment',
    'Scholarship',
    'Financial Aid',
    'Tuition Payment',
    'Academic Complaint',
    'Course Evaluation',
    'Library',
    'General Inquiry',
    'Technical Support',
    'Other',
  ];

  const statuses = ['Pending', 'In Review', 'Completed'];
  const priorities = ['Low', 'Normal', 'High', 'Urgent'];

  if (loading && tickets.length === 0) {
    return (
      <div className="admin-container">
        <Header />
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p>Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <Header />
      
      <div className="admin-content">
        <div className="admin-page-header">
          <div>
            <button
              className="btn-back-to-dashboard"
              onClick={() => navigate('/admin/tickets')}
            >
              ← Back to Dashboard
            </button>
            <h2>All Tickets</h2>
            <p>Review and manage all user tickets</p>
          </div>
        </div>

        <div className="filters-section">
          <div className="filter-group search-group">
            <label>Search</label>
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search tickets, descriptions, ticket numbers..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
              {filters.search && (
                <button
                  className="search-clear"
                  onClick={() => handleFilterChange('search', '')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priorities</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="createdAt">Date Created</option>
              <option value="updatedAt">Last Updated</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>

          <button
            className="btn-clear-filters"
            onClick={() => {
              setFilters({
                status: '',
                category: '',
                priority: '',
                search: '',
                page: 1,
                limit: 10,
                sortBy: 'createdAt',
                sortOrder: 'desc',
              });
            }}
          >
            Clear All
          </button>
        </div>

        {error && (
          <div className="error-message-card">
            <div className="error-icon">⚠️</div>
            <div>{error}</div>
          </div>
        )}

        {!loading && tickets.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>No Tickets Found</h2>
            <p>There are no tickets matching your filters.</p>
          </div>
        )}

        {tickets.length > 0 && (
          <>
            <div className="tickets-grid">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket._id}
                  ticket={ticket}
                  onClick={() => navigate(`/admin/tickets/${ticket._id}`)}
                />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {loading && tickets.length > 0 && (
          <div className="loading-more">
            <div className="spinner-small"></div>
            <p>Loading more tickets...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTicketsList;

