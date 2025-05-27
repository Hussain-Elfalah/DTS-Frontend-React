import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiDownload, FiFilter, FiCalendar, FiUser, FiSearch } from 'react-icons/fi';
import Loader from '../../components/ui/Loader';

interface AuditLog {
  id: number;
  type: string;
  user_id: number;
  user_name?: string;
  entity_type: string;
  entity_id: number;
  created_at: string;
  changes?: any;
}

interface FilterOptions {
  startDate: string;
  endDate: string;
  username: string;
}

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    startDate: '',
    endDate: '',
    username: '',
  });

  // Fetch users for username filter
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data?.data || [];
    },
  });

  // Fetch audit logs
  const fetchAuditLogs = async (filters: Partial<FilterOptions> = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Use the real backend endpoint now that it's implemented
      const response = await api.get('/admin/audit-logs', { params: filters });
      const logs = response.data?.data || [];
      setAuditLogs(logs);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      setError(error.response?.data?.message || 'Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Apply filters
  const applyFilters = () => {
    const filters: Partial<FilterOptions> = {};
    
    if (filterOptions.startDate) {
      filters.startDate = filterOptions.startDate;
    }
    
    if (filterOptions.endDate) {
      filters.endDate = filterOptions.endDate;
    }
    
    if (filterOptions.username && filterOptions.username.trim() !== '') {
      filters.username = filterOptions.username.trim();
    }
    
    fetchAuditLogs(filters);
  };

  // Reset filters
  const resetFilters = () => {
    setFilterOptions({
      startDate: '',
      endDate: '',
      username: '',
    });
    fetchAuditLogs();
  };

  // Export audit logs
  const exportAuditLogs = async (format: 'csv' | 'pdf') => {
    try {
      setLoading(true);
      const filters: Record<string, any> = {
        format,
      };
      
      if (filterOptions.startDate) {
        filters.startDate = filterOptions.startDate;
      }
      
      if (filterOptions.endDate) {
        filters.endDate = filterOptions.endDate;
      }
      
      if (filterOptions.username && filterOptions.username.trim() !== '') {
        filters.username = filterOptions.username.trim();
      }
      
      // Create URL with params
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, value);
      });
      
      // Use the API URL directly for file download
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');
      
      // Create a temporary link for downloading
      const link = document.createElement('a');
      // Fix the endpoint path to match the backend
      link.href = `${apiUrl}/api/admin/export/audit-logs?${params.toString()}`;
      link.setAttribute('download', `audit_logs_${new Date().toISOString()}.${format}`);
      
      // Add authorization header if needed
      if (token) {
        // For security reasons, we'll need to handle this server-side
        // This approach is a workaround, ideally the backend should handle auth via cookies
        link.setAttribute('data-token', token);
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Error exporting audit logs:', error);
      setError(error.response?.data?.message || 'Error exporting audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Determine if the current user can access this page
  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center bg-gray-50 dark:bg-gray-900 min-h-full">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">You don't have permission to view audit reports.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Audit Logs Report</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          View and export system audit logs
        </p>
      </div>

      {/* Filter & Export Controls */}
      <div className="mb-6 bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiFilter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={() => exportAuditLogs('csv')}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <FiDownload className="mr-2 h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => exportAuditLogs('pdf')}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiDownload className="mr-2 h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md space-y-4 relative z-10 shadow-md border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range Filter */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FiCalendar className="inline mr-1" /> Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={filterOptions.startDate}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, startDate: e.target.value }))}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FiCalendar className="inline mr-1" /> End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={filterOptions.endDate}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, endDate: e.target.value }))}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              {/* Username Filter */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FiUser className="inline mr-1" /> Username
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="username"
                    placeholder="Enter username to filter"
                    value={filterOptions.username}
                    onChange={(e) => setFilterOptions(prev => ({ ...prev, username: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyFilters();
                      }
                    }}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 dark:border-gray-600 rounded-l-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 border-l-0 shadow-sm text-sm font-medium rounded-r-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiSearch className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 dark:text-red-400">
            <p>{error}</p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>No audit logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Entity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {log.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.user_name || `User #${log.user_id}` || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.entity_type ? `${log.entity_type} #${log.entity_id}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {log.changes ? (
                        <pre className="text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded overflow-auto border border-gray-200 dark:border-gray-600">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      ) : (
                        'No details available'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage; 