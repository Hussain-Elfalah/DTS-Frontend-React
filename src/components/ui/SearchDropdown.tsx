import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiSearch, FiX, FiChevronRight } from 'react-icons/fi';
import { defectApi } from '../../services';
import DefectStatusBadge from '../defects/DefectStatusBadge';

interface SearchDropdownProps {
  placeholder?: string;
  className?: string;
}

interface Defect {
  id: number;
  title: string;
  description: string;
  status: string;
  created_by?: { username: string };
  creator_name?: string;
}

type StatusType = 'open' | 'in_progress' | 'resolved' | 'closed';

const SearchDropdown: React.FC<SearchDropdownProps> = ({ 
  placeholder = "Search defects...", 
  className = "" 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['defects-search', debouncedSearchTerm],
    queryFn: () => defectApi.getDefects({ 
      search: debouncedSearchTerm,
      limit: 10 // Limit results for dropdown
    }),
    enabled: debouncedSearchTerm.length >= 1, // Only search when at least 1 character
    staleTime: 30000, // Cache for 30 seconds
  });

  // Get defects from search results
  const defects: Defect[] = searchResults?.data || [];

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(value.length >= 1); // Show dropdown when at least 1 character
  };

  // Handle defect selection
  const handleDefectSelect = (defectId: number) => {
    setSearchTerm('');
    setIsOpen(false);
    navigate(`/defects/${defectId}`);
  };

  // Handle clear search
  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Validate status type
  const getValidStatus = (status: string): StatusType => {
    const validStatuses: StatusType[] = ['open', 'in_progress', 'resolved', 'closed'];
    return validStatuses.includes(status as StatusType) ? (status as StatusType) : 'open';
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchTerm.length >= 1) {
              setIsOpen(true);
            }
          }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            title="Clear search"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : defects.length > 0 ? (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                Found {defects.length} defect{defects.length !== 1 ? 's' : ''}
              </div>
              {defects.map((defect) => (
                <button
                  key={defect.id}
                  onClick={() => handleDefectSelect(defect.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <DefectStatusBadge status={getValidStatus(defect.status)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            DFT-{new Date().getFullYear()}-{String(defect.id).padStart(4, '0')}
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white font-medium truncate">
                            {defect.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {defect.description}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            by {defect.created_by?.username || defect.creator_name || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <FiChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : debouncedSearchTerm.length >= 1 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No defects found for "{debouncedSearchTerm}"
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Start typing to search defects
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown; 