import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiFilter, FiRefreshCw, FiTag, FiUser, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { defectApi } from '../../services/api';
import DefectStatusBadge from './DefectStatusBadge';
import DefectSeverityBadge from './DefectSeverityBadge';
import Loader from '../ui/Loader';

interface ClosedBugsListProps {
  showTitle?: boolean;
  limit?: number;
  userId?: number;
}

type SortField = 'title' | 'created_at' | 'severity' | 'closed_at';
type SortDirection = 'asc' | 'desc';

const ClosedBugsList: React.FC<ClosedBugsListProps> = ({ 
  showTitle = true,
  limit,
  userId 
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('closed_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Build query params for resolved defects
  const resolvedParams = {
    status: 'resolved', // Use single status instead of comma-separated
    severity: severityFilter || undefined,
    assignedTo: userId || undefined,
    sort: sortField === 'closed_at' ? 'updated_at' : sortField,
    direction: sortDirection,
    limit: limit || undefined,
  };
  
  // Build query params for closed defects
  const closedParams = {
    status: 'closed', // Use single status
    severity: severityFilter || undefined,
    assignedTo: userId || undefined,
    sort: sortField === 'closed_at' ? 'updated_at' : sortField,
    direction: sortDirection,
    limit: limit || undefined,
  };
  
  // Fetch resolved defects
  const { 
    data: resolvedData, 
    isLoading: isLoadingResolved, 
    error: resolvedError,
    refetch: refetchResolved 
  } = useQuery({
    queryKey: ['defects', 'resolved', resolvedParams],
    queryFn: () => defectApi.getDefects(resolvedParams),
  });
  
  // Fetch closed defects
  const { 
    data: closedData, 
    isLoading: isLoadingClosed, 
    error: closedError,
    refetch: refetchClosed 
  } = useQuery({
    queryKey: ['defects', 'closed', closedParams],
    queryFn: () => defectApi.getDefects(closedParams),
  });
  
  // Combine the results
  const combinedData = React.useMemo(() => {
    if ((!resolvedData && !closedData) || isLoadingResolved || isLoadingClosed) return null;
    
    return {
      data: [
        ...(resolvedData?.data || []), 
        ...(closedData?.data || [])
      ],
      total: (resolvedData?.total || 0) + (closedData?.total || 0),
      page: 1,
      limit: limit || 10
    };
  }, [resolvedData, closedData, isLoadingResolved, isLoadingClosed, limit]);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <FiChevronUp className="ml-1 h-4 w-4" />
      : <FiChevronDown className="ml-1 h-4 w-4" />;
  };
  
  // Refetch both queries
  const refetchAll = () => {
    refetchResolved();
    refetchClosed();
  };
  
  if (isLoadingResolved || isLoadingClosed) {
    return <Loader />;
  }
  
  if (resolvedError || closedError) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">Error loading defects</p>
      </div>
    );
  }
  
  if (!combinedData?.data?.length) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        {showTitle && (
          <h2 className="text-lg font-medium text-gray-900 mb-4">Closed Bugs</h2>
        )}
        <div className="text-center py-6">
          <p className="text-gray-500">No closed bugs found</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        {showTitle && (
          <h2 className="text-lg font-medium text-gray-900">Closed Bugs</h2>
        )}
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
            title="Filter"
          >
            <FiFilter className="h-5 w-5" />
          </button>
          <button
            onClick={refetchAll}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
            title="Refresh"
          >
            <FiRefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="severity-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                id="severity-filter"
                className="form-input w-full"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Issue {renderSortIcon('title')}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('severity')}
              >
                <div className="flex items-center">
                  Severity {renderSortIcon('severity')}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resolved By
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('closed_at')}
              >
                <div className="flex items-center">
                  Closed {renderSortIcon('closed_at')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {combinedData.data.map((defect: any) => (
              <tr key={defect.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <Link
                      to={`/defects/${defect.id}`}
                      className="text-primary hover:text-blue-700 font-medium"
                    >
                      {defect.title}
                    </Link>
                    <div className="mt-1 flex items-center">
                      <span className="text-sm text-gray-500 mr-2">#{defect.id}</span>
                      {defect.tags?.length > 0 && (
                        <div className="flex items-center text-xs text-gray-500">
                          <FiTag className="h-3 w-3 mr-1" />
                          {defect.tags.slice(0, 3).join(', ')}
                          {defect.tags.length > 3 && ` +${defect.tags.length - 3} more`}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <DefectStatusBadge status={defect.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <DefectSeverityBadge severity={defect.severity} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                      <FiUser className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="text-sm text-gray-700">
                      {defect.closed_by?.username || defect.assigned_to?.username || 'System'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {defect.closed_at 
                    ? formatDistanceToNow(new Date(defect.closed_at), { addSuffix: true })
                    : formatDistanceToNow(new Date(defect.updated_at), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClosedBugsList; 