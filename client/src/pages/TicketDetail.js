import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { ticketController } from '../controllers/ticketController';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ConfirmationModal from '../components/ConfirmationModal';
import '../styles/TicketDetail.css';

const TicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'approve', 'complete', 'reject'
    title: '',
    message: '',
    inputLabel: '',
    inputPlaceholder: '',
    isRequired: false,
    confirmText: 'Confirm',
  });

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketController.getTicket(id);
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

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await ticketController.addComment(id, {
        content: commentText,
        isInternal: isInternal && (user?.role === 'staff' || user?.role === 'admin'),
      });
      setComments((prev) => [...prev, response.data.comment]);
      setCommentText('');
      setIsInternal(false);
    } catch (err) {
      console.error('Error adding comment:', err);
      alert(
        err.response?.data?.message || 'Failed to add comment. Please try again.'
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusUpdate = async (newStatus, notes = '') => {
    try {
      const statusData = { status: newStatus };
      if (notes) {
        if (newStatus === 'Rejected') {
          statusData.rejectionReason = notes;
        } else {
          statusData.resolutionNotes = notes;
        }
      }
      await ticketController.updateTicketStatus(id, statusData);
      fetchTicket(); // Refresh ticket data
      setModalState({ ...modalState, isOpen: false });
    } catch (err) {
      console.error('Error updating status:', err);
      alert(
        err.response?.data?.message ||
          'Failed to update status. Please try again.'
      );
    }
  };

  const openStatusModal = (type) => {
    if (type === 'approve') {
      setModalState({
        isOpen: true,
        type: 'approve',
        title: 'Approve Ticket',
        message: 'Are you sure you want to approve this ticket?',
        inputLabel: 'Resolution Notes (optional)',
        inputPlaceholder: 'Add any notes about the approval...',
        isRequired: false,
        confirmText: 'Approve',
      });
    } else if (type === 'complete') {
      setModalState({
        isOpen: true,
        type: 'complete',
        title: 'Mark as Completed',
        message: 'Are you sure you want to mark this ticket as completed?',
        inputLabel: 'Resolution Notes (optional)',
        inputPlaceholder: 'Add any notes about the completion...',
        isRequired: false,
        confirmText: 'Complete',
      });
    } else if (type === 'reject') {
      setModalState({
        isOpen: true,
        type: 'reject',
        title: 'Reject Ticket',
        message: 'Are you sure you want to reject this ticket?',
        inputLabel: 'Rejection Reason',
        inputPlaceholder: 'Please provide a reason for rejection...',
        isRequired: true,
        confirmText: 'Reject',
      });
    } else if (type === 'inReview') {
      setModalState({
        isOpen: true,
        type: 'inReview',
        title: 'Mark as In Review',
        message: 'Are you sure you want to mark this ticket as "In Review"?',
        inputLabel: '',
        inputPlaceholder: '',
        isRequired: false,
        confirmText: 'Mark as In Review',
      });
    }
  };

  const handleModalConfirm = async (inputValue) => {
    if (modalState.type === 'approve') {
      await handleStatusUpdate('Approved', inputValue);
    } else if (modalState.type === 'complete') {
      await handleStatusUpdate('Completed', inputValue);
    } else if (modalState.type === 'reject') {
      if (inputValue) {
        await handleStatusUpdate('Rejected', inputValue);
      }
    } else if (modalState.type === 'inReview') {
      await handleStatusUpdate('In Review', '');
    } else if (modalState.type === 'cancel') {
      await handleStatusUpdate('Cancelled', '');
      setModalState({ ...modalState, isOpen: false });
    } else if (modalState.type === 'delete') {
      await confirmDeleteTicket();
      setModalState({ ...modalState, isOpen: false });
    }
  };

  const handleModalClose = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  const handleDeleteTicket = () => {
    setModalState({
      isOpen: true,
      type: 'delete',
      title: 'Delete Ticket',
      message: 'Are you sure you want to delete this ticket? This action cannot be undone.',
      inputLabel: '',
      inputPlaceholder: '',
      isRequired: false,
      confirmText: 'Delete',
    });
  };

  const confirmDeleteTicket = async () => {
    try {
      await ticketController.deleteTicket(id);
      navigate('/tickets');
    } catch (err) {
      console.error('Error deleting ticket:', err);
      alert(
        err.response?.data?.message ||
          'Failed to delete ticket. Please try again.'
      );
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

  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const isCreator = ticket?.createdBy?._id === user?.id || ticket?.createdBy === user?.id;

  if (loading) {
    return (
      <div className="ticket-detail-container">
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
      <div className="ticket-detail-container">
        <Header />
        <div className="error-state">
          <div className="error-icon-large">⚠️</div>
          <h2>Ticket Not Found</h2>
          <p>{error || 'The ticket you are looking for does not exist.'}</p>
          <button className="btn-primary" onClick={() => navigate('/tickets')}>
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-detail-container">
      <Header />
      
      <div className="ticket-detail-content">
        <div className="ticket-page-header">
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
          <div className="ticket-actions">
            {(isCreator || isStaff) && ticket.status === 'Pending' && (
              <button
                className="btn-danger"
                onClick={() => {
                  setModalState({
                    isOpen: true,
                    type: 'cancel',
                    title: 'Cancel Ticket',
                    message: 'Are you sure you want to cancel this ticket?',
                    inputLabel: '',
                    inputPlaceholder: '',
                    isRequired: false,
                    confirmText: 'Cancel Ticket',
                  });
                }}
              >
                Cancel Ticket
              </button>
            )}
            {(isCreator && ticket.status === 'Pending') || isStaff ? (
              <button
                className="btn-secondary"
                onClick={() => navigate(`/tickets/${id}/edit`)}
              >
                Edit
              </button>
            ) : null}
            {((isCreator && ticket.status === 'Pending') || isStaff) && (
              <button className="btn-danger" onClick={handleDeleteTicket}>
                Delete
              </button>
            )}
          </div>
        </div>
        <div className="ticket-detail-main">
          <div className="ticket-info-card">
            <h2>Ticket Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Category:</span>
                <span className="info-value">{ticket.category}</span>
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
              {ticket.resolution?.resolvedAt && (
                <div className="info-item">
                  <span className="info-label">Resolved:</span>
                  <span className="info-value">
                    {formatDate(ticket.resolution.resolvedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="ticket-description-card">
            <h2>Description</h2>
            <p>{ticket.description}</p>
          </div>

          {ticket.requestDetails && Object.keys(ticket.requestDetails).length > 0 && (
            <div className="ticket-details-card">
              <h2>Request Details</h2>
              <div className="details-grid">
                {ticket.requestDetails.studentId && (
                  <div className="detail-item">
                    <span className="detail-label">Student ID:</span>
                    <span className="detail-value">{ticket.requestDetails.studentId}</span>
                  </div>
                )}
                {ticket.requestDetails.course && (
                  <div className="detail-item">
                    <span className="detail-label">Course:</span>
                    <span className="detail-value">{ticket.requestDetails.course}</span>
                  </div>
                )}
                {ticket.requestDetails.yearLevel && (
                  <div className="detail-item">
                    <span className="detail-label">Year Level:</span>
                    <span className="detail-value">{ticket.requestDetails.yearLevel}</span>
                  </div>
                )}
                {ticket.requestDetails.numberOfCopies && (
                  <div className="detail-item">
                    <span className="detail-label">Number of Copies:</span>
                    <span className="detail-value">{ticket.requestDetails.numberOfCopies}</span>
                  </div>
                )}
                {ticket.requestDetails.purpose && (
                  <div className="detail-item">
                    <span className="detail-label">Purpose:</span>
                    <span className="detail-value">{ticket.requestDetails.purpose}</span>
                  </div>
                )}
                {ticket.requestDetails.subjectCode && (
                  <div className="detail-item">
                    <span className="detail-label">Subject Code:</span>
                    <span className="detail-value">{ticket.requestDetails.subjectCode}</span>
                  </div>
                )}
                {ticket.requestDetails.subjectName && (
                  <div className="detail-item">
                    <span className="detail-label">Subject Name:</span>
                    <span className="detail-value">{ticket.requestDetails.subjectName}</span>
                  </div>
                )}
                {ticket.requestDetails.semester && (
                  <div className="detail-item">
                    <span className="detail-label">Semester:</span>
                    <span className="detail-value">{ticket.requestDetails.semester}</span>
                  </div>
                )}
                {ticket.requestDetails.academicYear && (
                  <div className="detail-item">
                    <span className="detail-label">Academic Year:</span>
                    <span className="detail-value">{ticket.requestDetails.academicYear}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {ticket.resolution?.resolutionNotes && (
            <div className="ticket-resolution-card">
              <h2>Resolution Notes</h2>
              <p>{ticket.resolution.resolutionNotes}</p>
            </div>
          )}

          {ticket.resolution?.rejectionReason && (
            <div className="ticket-rejection-card">
              <h2>Rejection Reason</h2>
              <p>{ticket.resolution.rejectionReason}</p>
            </div>
          )}

          {isStaff && !['Completed', 'Rejected', 'Cancelled'].includes(ticket.status) && (
            <div className="staff-actions-card">
              <h2>Staff Actions</h2>
              <div className="staff-actions">
                {ticket.status === 'Pending' && (
                  <button
                    className="btn-action"
                    onClick={() => openStatusModal('inReview')}
                  >
                    Mark as In Review
                  </button>
                )}
                {['Pending', 'In Review'].includes(ticket.status) && (
                  <button
                    className="btn-action approved"
                    onClick={() => openStatusModal('approve')}
                  >
                    Approve
                  </button>
                )}
                {['Pending', 'In Review', 'Approved'].includes(ticket.status) && (
                  <button
                    className="btn-action completed"
                    onClick={() => openStatusModal('complete')}
                  >
                    Mark as Completed
                  </button>
                )}
                {['Pending', 'In Review'].includes(ticket.status) && (
                  <button
                    className="btn-action rejected"
                    onClick={() => openStatusModal('reject')}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="comments-section">
            <h2>Comments ({comments.length})</h2>

            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="no-comments">
                  <p>No Comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment._id}
                    className={`comment-item ${comment.isInternal ? 'internal' : ''} ${comment.isSystemNote ? 'system' : ''}`}
                  >
                    <div className="comment-header">
                      <div className="comment-author">
                        <strong>
                          {comment.author?.firstName ||
                            comment.author?.username ||
                            'System'}
                        </strong>
                        {comment.isInternal && (
                          <span className="internal-badge">Internal</span>
                        )}
                        {comment.isSystemNote && (
                          <span className="system-badge">System</span>
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
            </div>

            {!['Cancelled', 'Completed', 'Rejected'].includes(ticket.status) ||
              isStaff ? (
              <form onSubmit={handleSubmitComment} className="comment-form">
                {isStaff && (
                  <div className="comment-internal-toggle">
                    <label>
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                      />
                      Internal comment (not visible to students)
                    </label>
                  </div>
                )}
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows="4"
                  required
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingComment || !commentText.trim()}
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        title={modalState.title}
        message={modalState.message}
        inputLabel={modalState.inputLabel}
        inputPlaceholder={modalState.inputPlaceholder}
        isRequired={modalState.isRequired}
        confirmText={modalState.confirmText}
      />
    </div>
  );
};

export default TicketDetail;

