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
      <div className="bg-white shadow rounded-lg p-6">
        {showTitle && (
          <h2 className="text-lg font-medium text-gray-900 mb-4">Open Bugs</h2>
        )}
        <div className="text-center py-6">
          <p className="text-gray-500">No open bugs found</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {showTitle && (
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Open Bugs</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              title="Filter"
            >
              <FiFilter className="h-5 w-5" />
            </button>
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              title="Refresh"
            >
              <FiRefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="title-filter" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="bug-number-filter" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="created-by-filter" className="block text-sm font-medium text-gray-700 mb-1">
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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No.
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.data.map((defect: any) => (
              <tr key={defect.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {`DFT-${new Date().getFullYear()}-${String(defect.id).padStart(4, '0')}`}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{defect.title}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{defect.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {defect.created_by?.username || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {defect.created_at ? format(new Date(defect.created_at), 'MMM d, yyyy') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <FiUser className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="ml-2 text-sm text-gray-700">
                      {defect.assigned_to?.username || 'Unassigned'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {defect.status === 'open' ? 'open' : 'in progress'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Link to={`/defects/${defect.id}`} className="text-primary hover:text-blue-700">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{displayData.data.length}</span> of{' '}
          <span className="font-medium">{displayData.data.length}</span> bugs
        </div>
      </div>
    </div>
  );
};

export default OpenBugsList; 