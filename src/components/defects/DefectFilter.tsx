import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../services/api';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';

interface DefectFilterProps {
  onFilterChange: (filters: Record<string, any>) => void;
  filters: Record<string, any>;
}

const DefectFilter: React.FC<DefectFilterProps> = ({ onFilterChange, filters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getUsers(),
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters };
    if (value === '' || value === null) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const filtersCount = Object.keys(filters).length;

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        {/* Search field */}
        <div className="w-full sm:w-72 mb-4 sm:mb-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search defects..."
              className="form-input pl-10"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Filter button */}
        <div className="flex items-center">
          {filtersCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="mr-3 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none"
            >
              Clear filters
              <FiX className="ml-1 h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <FiFilter className="mr-2 h-5 w-5 text-gray-400" />
            Filters
            {filtersCount > 0 && (
              <span className="ml-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {filtersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {isOpen && (
        <div className="mt-4 bg-white p-4 shadow rounded-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status filter */}
            <div>
              <label htmlFor="status-filter" className="form-label">
                Status
              </label>
              <select
                id="status-filter"
                className="form-input"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            {/* Severity filter */}
            <div>
              <label htmlFor="severity-filter" className="form-label">
                Severity
              </label>
              <select
                id="severity-filter"
                className="form-input"
                value={filters.severity || ''}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
              >
                <option value="">All severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            {/* Assigned to filter */}
            <div>
              <label htmlFor="assigned-to-filter" className="form-label">
                Assigned to
              </label>
              <select
                id="assigned-to-filter"
                className="form-input"
                value={filters.assignedTo || ''}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              >
                <option value="">Anyone</option>
                <option value="unassigned">Unassigned</option>
                {users?.data?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Created by filter (if needed) */}
            <div>
              <label htmlFor="created-by-filter" className="form-label">
                Created by
              </label>
              <select
                id="created-by-filter"
                className="form-input"
                value={filters.createdBy || ''}
                onChange={(e) => handleFilterChange('createdBy', e.target.value)}
              >
                <option value="">Anyone</option>
                {users?.data?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectFilter; 