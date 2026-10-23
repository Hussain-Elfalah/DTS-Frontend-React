import React from 'react';

type StatusType = 'open' | 'in_progress' | 'resolved' | 'closed';

interface DefectStatusBadgeProps {
  status: StatusType;
}

const DefectStatusBadge: React.FC<DefectStatusBadgeProps> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'open':
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20';
      case 'in_progress':
        return 'bg-amber-500/15 text-amber-700 border-amber-500/20';
      case 'resolved':
        return 'bg-primary/15 text-primary border-primary/20';
      case 'closed':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

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
        return String(status).replace(/_/g, ' ');
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${getStatusStyles()}`}
    >
      {getStatusLabel()}
    </span>
  );
};

export default DefectStatusBadge;
