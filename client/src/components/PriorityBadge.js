import React from 'react';
import '../styles/PriorityBadge.css';

const PriorityBadge = ({ priority }) => {
  const getPriorityClass = (priority) => {
    const priorityMap = {
      Low: 'low',
      Normal: 'normal',
      High: 'high',
      Urgent: 'urgent',
    };
    return priorityMap[priority] || 'normal';
  };

  return (
    <span className={`priority-badge ${getPriorityClass(priority)}`}>
      {priority}
    </span>
  );
};

export default PriorityBadge;

