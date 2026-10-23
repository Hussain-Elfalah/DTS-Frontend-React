import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { FiFilter, FiRefreshCw, FiTag, FiUser, FiEye } from 'react-icons/fi';
import { defectApi } from '../../services/api';
import DefectStatusBadge from './DefectStatusBadge';
import DefectSeverityBadge from './DefectSeverityBadge';
import Loader from '../ui/Loader';

interface OpenBugsListProps {
  showTitle?: boolean;
  limit?: number;
  userId?: number;
}

const OpenBugsList: React.FC<OpenBugsListProps> = ({ 
  showTitle = true,
  limit,
  userId 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [titleFilter, setTitleFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [bugNumberFilter, setBugNumberFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');
  
  // Build query params - only use one status instead of comma-separated values
  const queryParams = {
    status: 'open', // Changed from 'open,in_progress' to just 'open'
    title: titleFilter || undefined,
    severity: priorityFilter || undefined,
    id: bugNumberFilter || undefined,
    createdBy: createdByFilter || undefined,
    assignedTo: userId || undefined,
    limit: limit || undefined,
  };
  
  // Fetch open defects
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['defects', 'open', queryParams],
    queryFn: () => defectApi.getDefects(queryParams),
  });
  
  // Use a second query for in_progress defects and merge results
  const { data: inProgressData, isLoading: isLoadingInProgress } = useQuery({
    queryKey: ['defects', 'in_progress', { ...queryParams, status: 'in_progress' }],
    queryFn: () => defectApi.getDefects({ ...queryParams, status: 'in_progress' }),
  });
  
  // Combine the results when both queries complete
  const combinedData = React.useMemo(() => {
    if (!data || isLoading || !inProgressData || isLoadingInProgress) return null;
    
    return {
      data: [...(data.data || []), ...(inProgressData.data || [])],
      total: (data.total || 0) + (inProgressData.total || 0),
      page: 1,
      limit: limit || 10
    };
  }, [data, inProgressData, isLoading, isLoadingInProgress, limit]);
  
  if (isLoading || isLoadingInProgress) {
    return <Loader />;
  }
  
  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">Error loading defects</p>
      </div>
    );
  }
  
  // Use the combined data for rendering
  const displayData = combinedData || { data: [] };
  
  if (!displayData.data.length) {
    return (
      <div className="bg-card shadow rounded-lg p-6">
        {showTitle && (
          <h2 className="text-lg font-medium text-foreground mb-4">Open Bugs</h2>
        )}
        <div className="text-center py-6">
          <p className="text-muted-foreground">No open bugs found</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card shadow rounded-lg overflow-hidden">
      {showTitle && (
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-medium text-foreground">Open Bugs</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
              title="Filter"
            >
              <FiFilter className="h-5 w-5" />
            </button>
            <button
              onClick={() => refetch()}
              className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
              title="Refresh"
            >
              <FiRefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      
      {showFilters && (
        <div className="p-4 bg-muted border-b border-border">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="title-filter" className="block text-sm font-medium text-foreground mb-1">
                Issue Title
              </label>
              <input
                id="title-filter"
                type="text"
                className="form-input w-full"
                placeholder="Search by title..."
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="priority-filter" className="block text-sm font-medium text-foreground mb-1">
                Priority
              </label>
              <select
                id="priority-filter"
                className="form-input w-full"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label htmlFor="bug-number-filter" className="block text-sm font-medium text-foreground mb-1">
                Bug Number
              </label>
              <input
                id="bug-number-filter"
                type="text"
                className="form-input w-full"
                placeholder="Search by bug number..."
                value={bugNumberFilter}
                onChange={(e) => setBugNumberFilter(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="created-by-filter" className="block text-sm font-medium text-foreground mb-1">
                Created By
              </label>
              <input
                id="created-by-filter"
                type="text"
                className="form-input w-full"
                placeholder="Search by username..."
                value={createdByFilter}
                onChange={(e) => setCreatedByFilter(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                No.
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Issue Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created By
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created At
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Assigned To
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {displayData.data.map((defect: any) => (
              <tr key={defect.id} className="hover:bg-muted">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  {`DFT-${new Date().getFullYear()}-${String(defect.id).padStart(4, '0')}`}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{defect.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{defect.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {defect.created_by?.username || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {defect.created_at ? format(new Date(defect.created_at), 'MMM d, yyyy') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <FiUser className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="ml-2 text-sm text-foreground">
                      {defect.assigned_to?.username || 'Unassigned'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {defect.status === 'open' ? 'open' : 'in progress'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  <Link to={`/defects/${defect.id}`} className="text-primary hover:text-foreground">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
        <div className="text-sm text-foreground">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{displayData.data.length}</span> of{' '}
          <span className="font-medium">{displayData.data.length}</span> bugs
        </div>
      </div>
    </div>
  );
};

export default OpenBugsList; 