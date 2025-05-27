import React from 'react';

type StatusType = 'open' | 'in_progress' | 'resolved' | 'closed';

interface DefectStatusBadgeProps {
  status: StatusType;
}

const DefectStatusBadge: React.FC<DefectStatusBadgeProps> = ({ status }) => {
  // Define badge styles based on status
  const getStatusStyles = () => {
    switch (status) {
      case 'open':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'resolved':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'closed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  
  // Get status label for display (capitalized with spaces instead of underscores)
  const getStatusLabel = () => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        // Since we've exhausted all possibilities in the StatusType,
        // this default case shouldn't be reached, but we'll handle it anyway
        return String(status).replace(/_/g, ' ');
    }
  };
  
  return (
    <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full border ${getStatusStyles()}`}>
      {getStatusLabel()}
    </span>
  );
};

export default DefectStatusBadge; 