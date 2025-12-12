import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import { adminController } from '../../controllers/adminController';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import '../../styles/AdminAnalytics.css';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = {
    status: {
      'Pending': '#F39C12',
      'In Review': '#3498DB',
      'Approved': '#2ECC71',
      'Completed': '#27AE60',
      'Rejected': '#E74C3C',
      'Cancelled': '#95A5A6',
      'On Hold': '#9B59B6',
    },
    priority: {
      'Low': '#95A5A6',
      'Normal': '#3498DB',
      'High': '#F39C12',
      'Urgent': '#E74C3C',
    },
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminController.getStatistics();
      
      if (!response || !response.data || !response.data.statistics) {
        throw new Error('Invalid response format from server');
      }

      const stats = response.data.statistics;
      
      // Validate and ensure data arrays are properly formatted
      const transformedStats = {
        total: Number(stats.total || 0),
        pending: Number(stats.pending || 0),
        inReview: Number(stats.inReview || 0),
        completed: Number(stats.completed || 0),
        approved: Number(stats.approved || 0),
        rejected: Number(stats.rejected || 0),
        cancelled: Number(stats.cancelled || 0),
        onHold: Number(stats.onHold || 0),
        byStatus: Array.isArray(stats.byStatus) 
          ? stats.byStatus.filter(item => item && item.name && item.value !== undefined)
          : [],
        byCategory: Array.isArray(stats.byCategory)
          ? stats.byCategory.filter(item => item && item.name && item.value !== undefined)
          : [],
        byPriority: Array.isArray(stats.byPriority)
          ? stats.byPriority.filter(item => item && item.name && item.value !== undefined)
          : [],
        ticketsByDate: Array.isArray(stats.ticketsByDate)
          ? stats.ticketsByDate.filter(item => item && item.date && item.count !== undefined)
          : [],
        ticketsByMonth: Array.isArray(stats.ticketsByMonth)
          ? stats.ticketsByMonth.filter(item => item && item.month && item.count !== undefined)
          : [],
      };
      
      console.log('Transformed statistics:', transformedStats);
      setStatistics(transformedStats);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return COLORS.status[status] || '#95A5A6';
  };

  const getPriorityColor = (priority) => {
    return COLORS.priority[priority] || '#95A5A6';
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="admin-analytics-container">
        <Header />
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-analytics-container">
        <Header />
        <div className="error-state">
          <div className="error-icon-large">⚠️</div>
          <h2>Error Loading Analytics</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchStatistics}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="admin-analytics-container">
        <Header />
        <div className="error-state">
          <div className="error-icon-large">📊</div>
          <h2>No Data Available</h2>
          <p>There is no ticket data to display yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-analytics-container">
      <Header />

      <div className="admin-analytics-content">
        <div className="analytics-header">
          <h1>Ticket Analytics & Reports</h1>
          <p>Comprehensive overview of ticket statistics and trends</p>
        </div>

        {/* Summary Cards */}
        <div className="analytics-summary-grid">
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-info">
              <div className="summary-value">{statistics.total}</div>
              <div className="summary-label">Total Tickets</div>
            </div>
          </div>
          <div className="summary-card pending">
            <div className="summary-icon">⏳</div>
            <div className="summary-info">
              <div className="summary-value">{statistics.pending}</div>
              <div className="summary-label">Pending</div>
            </div>
          </div>
          <div className="summary-card completed">
            <div className="summary-icon">✅</div>
            <div className="summary-info">
              <div className="summary-value">{statistics.completed}</div>
              <div className="summary-label">Completed</div>
            </div>
          </div>
          <div className="summary-card in-review">
            <div className="summary-icon">👀</div>
            <div className="summary-info">
              <div className="summary-value">{statistics.inReview}</div>
              <div className="summary-label">In Review</div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="analytics-charts-grid">
          {/* Tickets by Status - Pie Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Tickets by Status</h3>
            {statistics.byStatus && statistics.byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statistics.byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statistics.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <p>No status data available</p>
              </div>
            )}
          </div>

          {/* Tickets by Category - Bar Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Tickets by Category</h3>
            {statistics.byCategory && statistics.byCategory.length > 0 && statistics.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [value, 'Tickets']}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#4169E1" name="Tickets" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <p>{statistics.total === 0 ? 'No tickets created yet' : 'No category data available'}</p>
              </div>
            )}
          </div>

          {/* Tickets by Priority - Bar Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Tickets by Priority</h3>
            {statistics.byPriority && statistics.byPriority.length > 0 && statistics.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.byPriority}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [value, 'Tickets']}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Tickets" fill="#4169E1">
                    {statistics.byPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getPriorityColor(entry.name)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <p>{statistics.total === 0 ? 'No tickets created yet' : 'No priority data available'}</p>
              </div>
            )}
          </div>

          {/* Tickets Over Time (Last 30 Days) - Line Chart */}
          <div className="chart-card chart-card-wide">
            <h3 className="chart-title">Tickets Created (Last 30 Days)</h3>
            {statistics.ticketsByDate && statistics.ticketsByDate.length > 0 && statistics.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={statistics.ticketsByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value) => [value, 'Tickets']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#4169E1"
                    strokeWidth={2}
                    name="Tickets Created"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <p>{statistics.total === 0 ? 'No tickets created yet' : 'No ticket creation data for the last 30 days'}</p>
              </div>
            )}
          </div>

          {/* Tickets by Month (Last 6 Months) - Bar Chart */}
          <div className="chart-card chart-card-wide">
            <h3 className="chart-title">Tickets Created by Month (Last 6 Months)</h3>
            {statistics.ticketsByMonth && statistics.ticketsByMonth.length > 0 && statistics.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.ticketsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(value) => formatMonth(value)}
                    formatter={(value) => [value, 'Tickets']}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#4169E1" name="Tickets Created" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <p>{statistics.total === 0 ? 'No tickets created yet' : 'No ticket creation data for the last 6 months'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown Table */}
        <div className="analytics-table-card">
          <h3 className="chart-title">Detailed Status Breakdown</h3>
          <div className="status-breakdown-table">
            <div className="table-row table-header">
              <div className="table-cell">Status</div>
              <div className="table-cell">Count</div>
              <div className="table-cell">Percentage</div>
            </div>
            {statistics.byStatus && statistics.byStatus.length > 0 ? (
              statistics.byStatus.map((status) => {
                const percentage = statistics.total > 0
                  ? ((status.value / statistics.total) * 100).toFixed(1)
                  : 0;
                return (
                  <div key={status.name} className="table-row">
                    <div className="table-cell">
                      <span
                        className="status-indicator"
                        style={{ backgroundColor: getStatusColor(status.name) }}
                      ></span>
                      {status.name}
                    </div>
                    <div className="table-cell">{status.value}</div>
                    <div className="table-cell">{percentage}%</div>
                  </div>
                );
              })
            ) : (
              <div className="table-row">
                <div className="table-cell" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                  No status data available
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

