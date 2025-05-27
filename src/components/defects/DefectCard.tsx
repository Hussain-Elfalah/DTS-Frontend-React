import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import DefectStatusBadge from './DefectStatusBadge';
import DefectSeverityBadge from './DefectSeverityBadge';
import { FiUser } from 'react-icons/fi';

export interface DefectCardProps {
  defect: {
    id: number;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    severity: 'low' | 'medium' | 'high' | 'critical';
    created_at: string;
    created_by: {
      id: number;
      username: string;
    };
    assigned_to?: {
      id: number;
      username: string;
    } | null;
  };
}

const DefectCard: React.FC<DefectCardProps> = ({ defect }) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <Link 
              to={`/defects/${defect.id}`}
              className="text-lg font-medium text-primary hover:text-blue-700 truncate"
            >
              {defect.title}
            </Link>
            <p className="text-sm text-gray-500">#{defect.id}</p>
          </div>
          <div className="ml-2 flex-shrink-0 flex">
            <DefectSeverityBadge severity={defect.severity} />
            <div className="ml-2">
              <DefectStatusBadge status={defect.status} />
            </div>
          </div>
        </div>
        
        <div className="mt-2 sm:flex sm:justify-between">
          <div className="sm:flex">
            <p className="flex items-center text-sm text-gray-500">
              <FiUser className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              {defect.assigned_to 
                ? `Assigned to ${defect.assigned_to.username}` 
                : 'Unassigned'}
            </p>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
            <p>
              Created {formatDistanceToNow(new Date(defect.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-gray-700 line-clamp-2">
            {defect.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DefectCard; 