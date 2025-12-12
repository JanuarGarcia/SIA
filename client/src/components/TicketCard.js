import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import '../styles/TicketCard.css';

const TicketCard = ({ ticket }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/tickets/${ticket._id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="ticket-card" onClick={handleClick}>
      <div className="ticket-card-header">
        <div className="ticket-number">#{ticket.ticketNumber}</div>
        <div className="ticket-badges">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>
      
      <div className="ticket-card-body">
        <h3 className="ticket-title">{ticket.title}</h3>
        <p className="ticket-description">{truncateText(ticket.description)}</p>
        
        <div className="ticket-meta">
          <span className="ticket-category">
            <span className="meta-icon">📁</span>
            {ticket.category}
          </span>
          <span className="ticket-date">
            <span className="meta-icon">📅</span>
            {formatDate(ticket.createdAt)}
          </span>
        </div>
      </div>

      <div className="ticket-card-footer">
        {ticket.assignedTo && (
          <div className="ticket-assigned">
            <span className="meta-icon">👤</span>
            Assigned to {ticket.assignedTo.firstName || ticket.assignedTo.username}
          </div>
        )}
        <div className="ticket-arrow">→</div>
      </div>
    </div>
  );
};

export default TicketCard;

