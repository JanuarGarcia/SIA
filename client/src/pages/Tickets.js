import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ticketController } from '../controllers/ticketController';
import TicketCard from '../components/TicketCard';
import StatusBadge from '../components/StatusBadge';
import '../styles/Tickets.css';

const Tickets = () => {
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
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchTickets();
    fetchStatistics();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketController.getTickets(filters);
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

  const fetchStatistics = async () => {
    try {
      const response = await ticketController.getStatistics();
      setStatistics(response.data.statistics);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filter changes
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

  const statuses = [
    'Pending',
    'In Review',
    'Approved',
    'Rejected',
    'Completed',
    'Cancelled',
    'On Hold',
  ];

  const priorities = ['Low', 'Normal', 'High', 'Urgent'];

  if (loading && tickets.length === 0) {
    return (
      <div className="tickets-container">
        <Header />
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p>Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tickets-container">
      <Header />
      
      <div className="tickets-content">
        <div className="tickets-page-header">
          <div>
            <h2>Ticket System</h2>
            <p>Manage your support requests</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/tickets/create')}
          >
            + Create New Ticket
          </button>
        </div>
        {statistics && (
          <div className="statistics-grid">
            <div className="stat-card">
              <div className="stat-value">{statistics.total}</div>
              <div className="stat-label">Total Tickets</div>
            </div>
            <div className="stat-card pending">
              <div className="stat-value">{statistics.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card in-review">
              <div className="stat-value">{statistics.inReview}</div>
              <div className="stat-label">In Review</div>
            </div>
            <div className="stat-card completed">
              <div className="stat-value">{statistics.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        )}

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
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎫</div>
            <h2>No tickets found</h2>
            <p>
              {filters.status || filters.category || filters.priority
                ? 'Try adjusting your filters or create a new ticket.'
                : "You haven't created any tickets yet. Create your first ticket to get started!"}
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/tickets/create')}
            >
              Create Your First Ticket
            </button>
          </div>
        )}

        {tickets.length > 0 && (
          <>
            <div className="tickets-grid">
              {tickets.map((ticket) => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.pages} ({pagination.total}{' '}
                  tickets)
                </span>
                <button
                  className="pagination-btn"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
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

export default Tickets;

