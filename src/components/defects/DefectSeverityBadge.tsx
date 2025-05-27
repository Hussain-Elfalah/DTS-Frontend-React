import React from 'react';

type SeverityType = 'low' | 'medium' | 'high' | 'critical';

interface DefectSeverityBadgeProps {
  severity: SeverityType;
}

const DefectSeverityBadge: React.FC<DefectSeverityBadgeProps> = ({ severity }) => {
  // Define badge styles based on severity
  const getSeverityStyles = () => {
    switch (severity) {
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  
  // Get capitalized label for display
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
    <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full border ${getSeverityStyles()}`}>
      {getSeverityLabel()}
    </span>
  );
};

export default DefectSeverityBadge; 