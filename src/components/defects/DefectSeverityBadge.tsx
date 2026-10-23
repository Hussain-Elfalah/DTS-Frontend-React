import React from 'react';

type SeverityType = 'low' | 'medium' | 'high' | 'critical';

interface DefectSeverityBadgeProps {
  severity: SeverityType;
}

const DefectSeverityBadge: React.FC<DefectSeverityBadgeProps> = ({ severity }) => {
  const getSeverityStyles = () => {
    switch (severity) {
      case 'low':
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20';
      case 'medium':
        return 'bg-amber-500/15 text-amber-700 border-amber-500/20';
      case 'high':
        return 'bg-amber-500/20 text-amber-800 border-amber-500/30';
      case 'critical':
        return 'bg-destructive/15 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getSeverityLabel = () => {
    switch (severity) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      case 'critical':
        return 'Critical';
      default:
        return String(severity).charAt(0).toUpperCase() + String(severity).slice(1);
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${getSeverityStyles()}`}
    >
      {getSeverityLabel()}
    </span>
  );
};

export default DefectSeverityBadge;
