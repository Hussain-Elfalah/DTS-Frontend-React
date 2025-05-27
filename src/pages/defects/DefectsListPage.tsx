import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FiPlus, FiRefreshCw, FiSearch, FiChevronRight } from 'react-icons/fi';
import { defectApi } from '../../services/api';
import Loader from '../../components/ui/Loader';
import DefectStatusBadge from '../../components/defects/DefectStatusBadge';

interface DefectsListPageProps {
  showClosed?: boolean;
}

const DefectsListPage: React.FC<DefectsListPageProps> = ({ showClosed = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Build query params for open defects
  const openParams = {
    status: 'open',
    title: searchTerm || undefined,
  };
  
  // Build query params for in-progress defects
  const inProgressParams = {
    status: 'in_progress',
    title: searchTerm || undefined,
  };
  
  // Build query params for resolved defects
  const resolvedParams = {
    status: 'resolved',
    title: searchTerm || undefined,
  };
  
  // Build query params for closed defects
  const closedParams = {
    status: 'closed',
    title: searchTerm || undefined,
  };
  
  // Fetch appropriate defects based on showClosed flag
  const {
    data: openData,
    isLoading: isLoadingOpen,
    refetch: refetchOpen
  } = useQuery({
    queryKey: ['defects', 'open', openParams],
    queryFn: () => defectApi.getDefects(openParams),
    enabled: !showClosed,
  });
  
  const {
    data: inProgressData,
    isLoading: isLoadingInProgress,
    refetch: refetchInProgress
  } = useQuery({
    queryKey: ['defects', 'in_progress', inProgressParams],
    queryFn: () => defectApi.getDefects(inProgressParams),
    enabled: !showClosed,
  });
  
  const {
    data: resolvedData,
    isLoading: isLoadingResolved,
    refetch: refetchResolved
  } = useQuery({
    queryKey: ['defects', 'resolved', resolvedParams],
    queryFn: () => defectApi.getDefects(resolvedParams),
    enabled: showClosed,
  });
  
  const {
    data: closedData,
    isLoading: isLoadingClosed,
    refetch: refetchClosed
  } = useQuery({
    queryKey: ['defects', 'closed', closedParams],
    queryFn: () => defectApi.getDefects(closedParams),
    enabled: showClosed,
  });
  
  // Combine resolved and closed defects for the "Resolved/Closed" tab
  const resolvedClosedDefects = React.useMemo(() => {
    const resolvedItems = Array.isArray(resolvedData?.data) ? resolvedData.data : 
                         Array.isArray(resolvedData) ? resolvedData : [];
    const closedItems = Array.isArray(closedData?.data) ? closedData.data : 
                       Array.isArray(closedData) ? closedData : [];
    
    const combinedItems = [...resolvedItems, ...closedItems];
    
    // Sort by updated_at descending (most recent first)
    return combinedItems.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [resolvedData, closedData]);
  
  // Combine open and in-progress defects for the "Open/In Progress" tab
  const openInProgressDefects = React.useMemo(() => {
    const openItems = Array.isArray(openData?.data) ? openData.data : 
                     Array.isArray(openData) ? openData : [];
    const inProgressItems = Array.isArray(inProgressData?.data) ? inProgressData.data : 
                           Array.isArray(inProgressData) ? inProgressData : [];
    
    const combinedItems = [...openItems, ...inProgressItems];
    
    // Sort by created_at descending (most recent first)
    return combinedItems.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [openData, inProgressData]);
  
  // Refresh all queries
  const refreshData = () => {
    if (showClosed) {
      refetchResolved();
      refetchClosed();
    } else {
      refetchOpen();
      refetchInProgress();
    }
  };
  
  const isLoading = showClosed 
    ? isLoadingResolved || isLoadingClosed 
    : isLoadingOpen || isLoadingInProgress;
  
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {showClosed ? 'Closed Defects' : 'All Defects'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {showClosed 
              ? 'View and manage resolved and closed defects' 
              : 'View and manage open and in-progress defects'
            }
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              className="block w-64 pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search defects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={refreshData}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
            title="Refresh"
          >
            <FiRefreshCw className="h-4 w-4" />
          </button>
          
          {!showClosed && (
            <Link
              to="/defects/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" />
              New Defect
            </Link>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader />
          </div>
        ) : !resolvedClosedDefects.length && !openInProgressDefects.length ? (
          <div className="p-10 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-base">
              {showClosed ? 'No closed defects found' : 'No defects found'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      No.
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Issue Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Created By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Created At
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Assigned To
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {showClosed ? (
                    resolvedClosedDefects.map((defect: any, index: number) => (
                      <tr 
                        key={defect.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index !== resolvedClosedDefects.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          DFT-{new Date().getFullYear()}-{String(defect.id || '0000').padStart(4, '0')}
                        </td>
                        <td className="px-6 py-4">
                          <Link to={`/defects/${defect.id}`} className="hover:underline">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{defect.title || 'Untitled Defect'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{defect.description || 'No description provided'}</div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                              {defect.created_by?.username 
                                ? defect.created_by.username.charAt(0).toUpperCase() 
                                : defect.creator_name 
                                  ? defect.creator_name.charAt(0).toUpperCase() 
                                  : 'U'}
                            </div>
                            <span className="ml-2 text-sm text-gray-900 dark:text-white">
                              {defect.created_by?.username || defect.creator_name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {defect.created_at ? format(new Date(defect.created_at), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-sm">
                              {defect.assigned_to?.username 
                                ? defect.assigned_to.username.charAt(0).toUpperCase() 
                                : defect.assignee_name 
                                  ? defect.assignee_name.charAt(0).toUpperCase() 
                                  : 'U'}
                            </div>
                            <span className="ml-2 text-sm text-gray-900 dark:text-white">
                              {defect.assigned_to?.username || defect.assignee_name || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <DefectStatusBadge status={defect.status || 'open'} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            to={`/defects/${defect.id}`} 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            <div className="flex items-center justify-end">
                              <span className="sr-only">View Details</span>
                              <FiChevronRight className="h-5 w-5" />
                            </div>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    openInProgressDefects.map((defect: any, index: number) => (
                      <tr 
                        key={defect.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index !== openInProgressDefects.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          DFT-{new Date().getFullYear()}-{String(defect.id || '0000').padStart(4, '0')}
                        </td>
                        <td className="px-6 py-4">
                          <Link to={`/defects/${defect.id}`} className="hover:underline">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{defect.title || 'Untitled Defect'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{defect.description || 'No description provided'}</div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                              {defect.created_by?.username 
                                ? defect.created_by.username.charAt(0).toUpperCase() 
                                : defect.creator_name 
                                  ? defect.creator_name.charAt(0).toUpperCase() 
                                  : 'U'}
                            </div>
                            <span className="ml-2 text-sm text-gray-900 dark:text-white">
                              {defect.created_by?.username || defect.creator_name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {defect.created_at ? format(new Date(defect.created_at), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-sm">
                              {defect.assigned_to?.username 
                                ? defect.assigned_to.username.charAt(0).toUpperCase() 
                                : defect.assignee_name 
                                  ? defect.assignee_name.charAt(0).toUpperCase() 
                                  : 'U'}
                            </div>
                            <span className="ml-2 text-sm text-gray-900 dark:text-white">
                              {defect.assigned_to?.username || defect.assignee_name || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <DefectStatusBadge status={defect.status || 'open'} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            to={`/defects/${defect.id}`} 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            <div className="flex items-center justify-end">
                              <span className="sr-only">View Details</span>
                              <FiChevronRight className="h-5 w-5" />
                            </div>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium text-gray-700 dark:text-gray-300">1</span> to{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{showClosed ? resolvedClosedDefects.length : openInProgressDefects.length}</span> of{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{showClosed ? resolvedClosedDefects.length : openInProgressDefects.length}</span> results
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {showClosed ? 'closed' : 'open'} defects
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DefectsListPage; 