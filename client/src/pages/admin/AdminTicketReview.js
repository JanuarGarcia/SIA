import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { adminController } from '../../controllers/adminController';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { getDisplayCategory } from '../../utils/ticketHelpers';
import '../../styles/Admin.css';

const AdminTicketReview = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);
  const commentsEndRef = useRef(null);
  const commentsListRef = useRef(null);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Auto-scroll to bottom when comments change
  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
    }
  }, [ticket]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminController.getTicket(id);
      setTicket(response.data.ticket);
      setComments(response.data.comments || []);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load ticket. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!status) return;

    setUpdating(true);
    try {
      const statusData = {
        status: status,
        remarks: remarks.trim() || undefined,
      };
      await adminController.updateTicketStatus(id, statusData);
      await fetchTicket(); // Refresh ticket data
      setRemarks(''); // Clear remarks field
      alert('Ticket status updated successfully!');
    } catch (err) {
      console.error('Error updating status:', err);
      alert(
        err.response?.data?.message ||
          'Failed to update status. Please try again.'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!remarkText.trim()) return;

    setSubmittingRemark(true);
    try {
      await adminController.addRemark(id, {
        content: remarkText.trim(),
        isInternal: false, // Admin remarks are visible to users
      });
      setRemarkText(''); // Clear remark field
      // Reset textarea height
      const textarea = document.getElementById('remark');
      if (textarea) {
        textarea.style.height = 'auto';
      }
      await fetchTicket(); // Refresh ticket data
    } catch (err) {
      console.error('Error adding remark:', err);
      alert(
        err.response?.data?.message ||
          'Failed to add remark. Please try again.'
      );
    } finally {
      setSubmittingRemark(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="admin-container">
        <Header />
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p>Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="admin-container">
        <Header />
        <div className="error-state">
          <div className="error-icon-large">⚠️</div>
          <h2>Ticket Not Found</h2>
          <p>{error || 'The ticket you are looking for does not exist.'}</p>
          <button className="btn-primary" onClick={() => navigate('/admin/tickets')}>
            Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <Header />
      
      <div className="admin-content">
        <div className="admin-ticket-header">
          <div className="ticket-title-section">
            <h2>{ticket.title}</h2>
            <div className="ticket-header-meta">
              <span className="ticket-number-detail">
                #{ticket.ticketNumber}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
          <button
            className="btn-secondary"
            onClick={() => navigate('/admin/tickets')}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="admin-ticket-main">
          <div className="admin-ticket-info">
            <div className="ticket-info-card">
              <h3>Ticket Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Created By:</span>
                  <span className="info-value">
                    {ticket.createdBy?.firstName || ticket.createdBy?.username || 'N/A'}
                    {ticket.createdBy?.lastName && ` ${ticket.createdBy.lastName}`}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{ticket.createdBy?.email || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Category:</span>
                  <span className="info-value">{getDisplayCategory(ticket)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="info-item">
                  <span className="info-label">Priority:</span>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <div className="info-item">
                  <span className="info-label">Created:</span>
                  <span className="info-value">{formatDate(ticket.createdAt)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated:</span>
                  <span className="info-value">{formatDate(ticket.updatedAt)}</span>
                </div>
                {ticket.assignedTo && (
                  <div className="info-item">
                    <span className="info-label">Assigned To:</span>
                    <span className="info-value">
                      {ticket.assignedTo.firstName || ticket.assignedTo.username}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="ticket-description-card">
              <h3>Description</h3>
              <p>{ticket.description}</p>
            </div>

            {ticket.requestDetails && Object.keys(ticket.requestDetails).length > 0 && (
              <div className="ticket-details-card">
                <h3>Request Details</h3>
                <div className="details-grid">
                  {Object.entries(ticket.requestDetails).map(([key, value]) => {
                    if (!value) return null;
                    const label = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase());
                    return (
                      <div key={key} className="detail-item">
                        <span className="detail-label">{label}:</span>
                        <span className="detail-value">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="admin-actions-panel">
            <div className="admin-status-card">
              <h3>Update Status</h3>
              <form onSubmit={handleStatusUpdate}>
                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Review">In Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="remarks">Remarks (Optional)</label>
                  <textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add remarks about this status update..."
                    rows="4"
                    maxLength="2000"
                  />
                  <small>{remarks.length}/2000 characters</small>
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updating || !status}
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </form>
            </div>

          </div>
        </div>

        <div className="comments-section messaging-style">
          <h3>Comments & Remarks ({comments.filter(c => !c.isInternal && !c.isSystemNote).length})</h3>

          <div className="comments-list" ref={commentsListRef}>
            {comments.filter((c) => !c.isInternal && !c.isSystemNote).length === 0 ? (
              <div className="no-comments">No comments yet. Start the conversation!</div>
            ) : (
              comments
                .filter((comment) => !comment.isInternal && !comment.isSystemNote)
                .map((comment) => (
                  <div key={comment._id} className="comment-card">
                    <div className="comment-header">
                      <div className="comment-author">
                        <strong>
                          {comment.author?.firstName || comment.author?.username || 'Unknown'}
                          {comment.author?.lastName && ` ${comment.author.lastName}`}
                        </strong>
                        {comment.author?.role === 'admin' && (
                          <span className="admin-badge">Admin</span>
                        )}
                      </div>
                      <span className="comment-date">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <div className="comment-content">{comment.content}</div>
                  </div>
                ))
            )}
            <div ref={commentsEndRef} />
          </div>

          <form onSubmit={handleAddRemark} className="comment-input-form">
            <div className="comment-input-wrapper">
              <textarea
                id="remark"
                value={remarkText}
                onChange={(e) => {
                  setRemarkText(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                placeholder="Type a message..."
                rows="1"
                required
                maxLength="2000"
                className="comment-textarea"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (remarkText.trim() && !submittingRemark) {
                      handleAddRemark(e);
                    }
                  }
                }}
              />
              <div className="comment-input-footer">
                <span className="character-count">{remarkText.length}/2000</span>
                <button
                  type="submit"
                  className="btn-send-comment"
                  disabled={submittingRemark || !remarkText.trim()}
                >
                  {submittingRemark ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminTicketReview;

