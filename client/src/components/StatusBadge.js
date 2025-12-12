import React from 'react';
import '../styles/StatusBadge.css';

const StatusBadge = ({ status }) => {
  const getStatusClass = (status) => {
    const statusMap = {
      Pending: 'pending',
      'In Review': 'in-review',
      Approved: 'approved',
      Rejected: 'rejected',
      Completed: 'completed',
      Cancelled: 'cancelled',
      'On Hold': 'on-hold',
    };
    return statusMap[status] || 'default';
  };

  return (
    <span className={`status-badge ${getStatusClass(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;

