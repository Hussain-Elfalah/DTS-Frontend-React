import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FiArrowLeft, FiX } from 'react-icons/fi';
import { defectApi } from '../../services/api';
import Loader from '../../components/ui/Loader';

// Define types for history data
interface HistoryChange {
  field: string;
  old_value: string | null;
  new_value: string | null;
}

interface HistoryItem {
  id: number;
  version: string;
  timestamp: Date;
  user: {
    id: number;
    username: string;
  };
  changes: HistoryChange[];
  data?: Record<string, any>;
  title?: string;
  description?: string;
}

interface CompareResult {
  fromVersion: string;
  toVersion: string;
  fromData: Record<string, any>;
  toData: Record<string, any>;
}

const DefectHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for version comparison
  const [fromVersion, setFromVersion] = useState<string>('');
  const [toVersion, setToVersion] = useState<string>('');
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [isViewVersionModalOpen, setIsViewVersionModalOpen] = useState(false);
  const [selectedVersionForView, setSelectedVersionForView] = useState<HistoryItem | null>(null);

  // Handle back button navigation
  const handleBackToDefect = () => {
    // Get the original return path from location state, or default to defect details
    const returnPath = location.state?.from || '/defects';
    
    // Navigate to the defect detail page, passing the original return path
    navigate(`/defects/${id}`, { state: { from: returnPath } });
  };

  // Fetch defect history using the existing getDefectVersions method
  const { data, isLoading, error } = useQuery({
    queryKey: ['defectHistory', id],
    queryFn: () => defectApi.getDefectVersions(Number(id)),
  });

  // Extract version history from API response
  const versionHistory = React.useMemo(() => {
    if (!data) return [];
    
    // Try to extract the actual data from the response
    let apiData = data?.data || data;
    
    // If it's still wrapped, try to unwrap further
    if (apiData?.data) {
      apiData = apiData.data;
    }
    
    // Check if we have an array of history items
    if (Array.isArray(apiData)) {
      // Map the API data to our expected format
      const mappedVersions = apiData.map((version: any): HistoryItem => ({
        id: version.id,
        version: `v${version.version || 1}`,
        timestamp: new Date(version.created_at || version.updated_at || new Date()),
        user: {
          id: version.changed_by_id || 1,
          username: version.changed_by || 'System'
        },
        changes: version.changes || [],
        data: {
          title: version.title || 'Untitled',
          description: version.description || '',
          status: version.status || 'open',
          severity: version.severity || 'medium',
          assigned_to: version.assigned_to || null,
          assigned_to_name: version.assigned_to_name || 'Unassigned',
          tags: version.tags || []
        }
      }));
      
      return mappedVersions;
    }
    
    // If we don't have the expected format, return empty array
    return [];
  }, [data]);

  // Set initial versions when history items are loaded
  useEffect(() => {
    if (versionHistory.length >= 2) {
      // Find the two most recent versions by id
      const sortedItems = [...versionHistory].sort((a, b) => {
        const aId = typeof a.id === 'number' ? a.id : parseInt(a.id as any);
        const bId = typeof b.id === 'number' ? b.id : parseInt(b.id as any);
        return bId - aId;
      });
      
      if (sortedItems.length >= 2) {
        // Set default from version to second most recent version
        setFromVersion(sortedItems[1]?.id?.toString() || '');
        // Set default to version to most recent version
        setToVersion(sortedItems[0]?.id?.toString() || '');
      }
    }
  }, [versionHistory]);

  // Handle compare button click
  const handleCompare = () => {
    if (!fromVersion || !toVersion) {
      return;
    }

    // Find items by ID
    const fromItem = versionHistory.find((item: any) => item.id?.toString() === fromVersion);
    const toItem = versionHistory.find((item: any) => item.id?.toString() === toVersion);

    if (!fromItem || !toItem) {
      return;
    }

    // Create comparison result with full data objects
    const result: CompareResult = {
      fromVersion: fromItem.version || `v${fromItem.id}`,
      toVersion: toItem.version || `v${toItem.id}`,
      fromData: fromItem.data || {},
      toData: toItem.data || {}
    };

    setCompareResult(result);
    setShowComparison(true);
  };

  // Handle view version button click
  const handleViewVersion = (version: HistoryItem) => {
    setSelectedVersionForView(version);
    setIsViewVersionModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center bg-gray-50 dark:bg-gray-900 min-h-full">
        <Loader />
      </div>
    );
  }

  if (error) {
    console.error('Error loading history data:', error);
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
        <div className="mb-6">
          <button 
            onClick={handleBackToDefect} 
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <FiArrowLeft className="mr-2" />
            <span className="text-lg font-medium">Back to Defect Details</span>
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-red-500 dark:text-red-400">Error loading version history. Please try again later.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      {/* Back button */}
      <div className="mb-6">
        <button 
          onClick={handleBackToDefect} 
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <FiArrowLeft className="mr-2" />
          <span className="text-lg font-medium">Back to Defect Details</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Version History</h1>
        
        {/* Compare versions controls */}
        <div className="mb-8 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Compare Versions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From:</label>
              <select 
                className="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={fromVersion}
                onChange={(e) => setFromVersion(e.target.value)}
              >
                <option value="">Select a version</option>
                {versionHistory.map((item: HistoryItem) => (
                  <option key={`from-${item.id}`} value={item.id?.toString()}>
                    {item.version || `v${item.id}`} ({item.timestamp 
                      ? format(new Date(item.timestamp), "MMM d") 
                      : 'Unknown'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To:</label>
              <select 
                className="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={toVersion}
                onChange={(e) => setToVersion(e.target.value)}
              >
                <option value="">Select a version</option>
                {versionHistory.map((item: HistoryItem) => (
                  <option key={`to-${item.id}`} value={item.id?.toString()}>
                    {item.version || `v${item.id}`} ({item.timestamp 
                      ? format(new Date(item.timestamp), "MMM d") 
                      : 'Unknown'})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!fromVersion || !toVersion || fromVersion === toVersion}
            onClick={handleCompare}
          >
            Compare
          </button>
        </div>

        {/* Version comparison results */}
        {showComparison && compareResult && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Comparing Versions <span className="text-gray-500 dark:text-gray-400">{compareResult.fromVersion} → {compareResult.toVersion}</span>
              </h3>
            </div>
            
            {/* Title comparison */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">From: {compareResult.fromVersion}</div>
                  <div className="text-gray-900 dark:text-white">{compareResult.fromData.title || 'No title'}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">To: {compareResult.toVersion}</div>
                  <div className="text-gray-900 dark:text-white">{compareResult.toData.title || 'No title'}</div>
                </div>
              </div>
            </div>
            
            {/* Description comparison */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">From: {compareResult.fromVersion}</div>
                  <div className="text-gray-900 dark:text-white">{compareResult.fromData.description || 'No description'}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">To: {compareResult.toVersion}</div>
                  <div className="text-gray-900 dark:text-white">{compareResult.toData.description || 'No description'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Version history table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Version</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Modified By</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {versionHistory.map((item: HistoryItem, index: number) => (
                <tr key={item.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 dark:text-white">{item.version || `v${index + 1}`}</span>
                      {index === 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Current</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{item.user?.username || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.timestamp 
                        ? format(new Date(item.timestamp), "MMM d, yyyy, h:mm a") 
                        : 'Unknown date'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <button 
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      onClick={() => handleViewVersion(item)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Changelog timeline - show if not empty */}
        {versionHistory.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Log</h2>
            <div className="border-l-2 border-gray-200 dark:border-gray-600 ml-4">
              {versionHistory.map((item: HistoryItem, index: number) => {
                // Calculate changes by comparing with previous version
                const calculateChanges = () => {
                  if (index === versionHistory.length - 1) {
                    // This is the first version (initial creation)
                    return [{
                      field: 'defect',
                      old_value: null,
                      new_value: 'created',
                      description: 'Defect was created'
                    }];
                  }
                  
                  const currentData = item.data || {};
                  const previousData = versionHistory[index + 1]?.data || {};
                  const changes = [];
                  
                  // Compare all relevant fields
                  const fieldsToCompare = ['title', 'description', 'status', 'severity', 'assigned_to'];
                  
                  fieldsToCompare.forEach(field => {
                    const currentValue = currentData[field];
                    const previousValue = previousData[field];
                    
                    if (currentValue !== previousValue) {
                      changes.push({
                        field,
                        old_value: previousValue,
                        new_value: currentValue,
                        description: `Changed ${field.replace('_', ' ')} from "${previousValue || 'empty'}" to "${currentValue || 'empty'}"`
                      });
                    }
                  });
                  
                  // If no changes detected, show a generic update message
                  if (changes.length === 0) {
                    changes.push({
                      field: 'defect',
                      old_value: null,
                      new_value: 'updated',
                      description: 'Defect was updated'
                    });
                  }
                  
                  return changes;
                };
                
                const calculatedChanges = item.changes && item.changes.length > 0 ? item.changes : calculateChanges();
                
                return (
                  <div key={`log-${item.id || index}`} className="relative mb-8 ml-6">
                    <div className="absolute -left-9 mt-1.5 h-5 w-5 rounded-full bg-blue-500"></div>
                    
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.user?.username || 'Unknown user'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        {item.timestamp 
                          ? format(new Date(item.timestamp), "MMMM d, yyyy 'at' h:mm a") 
                          : 'Unknown date'}
                      </span>
                      {index === 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          Latest
                        </span>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                      {calculatedChanges.map((change: any, idx: number) => {
                        if (change.description) {
                          // If we have a description, use it
                          return (
                            <div key={idx} className="mb-2 last:mb-0">
                              <p className="text-sm text-gray-700 dark:text-gray-300">{change.description}</p>
                            </div>
                          );
                        } else {
                          // Otherwise, format the change traditionally
                          return (
                            <div key={idx} className="mb-2 last:mb-0">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                Changed <span className="font-medium">{change.field.replace('_', ' ')}</span>
                                {change.old_value && (
                                  <>
                                    {' '}from{' '}
                                    <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-1 py-0.5 rounded text-xs">
                                      {change.old_value}
                                    </span>
                                  </>
                                )}
                                {change.new_value && (
                                  <>
                                    {' '}to{' '}
                                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1 py-0.5 rounded text-xs">
                                      {change.new_value}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          );
                        }
                      })}
                      
                      {/* Show version details */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Version Details:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span> 
                            <span className={`ml-1 px-1 py-0.5 rounded ${
                              item.data?.status === 'open' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                              item.data?.status === 'in_progress' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                              item.data?.status === 'resolved' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                              item.data?.status === 'closed' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}>
                              {item.data?.status || 'Unknown'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Severity:</span> 
                            <span className={`ml-1 px-1 py-0.5 rounded ${
                              item.data?.severity === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                              item.data?.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                              item.data?.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                              item.data?.severity === 'low' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}>
                              {item.data?.severity || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {versionHistory.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">No version history available</p>
          </div>
        )}
      </div>

      {/* View Version Modal */}
      {isViewVersionModalOpen && selectedVersionForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Version Details: {selectedVersionForView.version || `v${selectedVersionForView.id}`}
              </h3>
              <button
                onClick={() => {
                  setIsViewVersionModalOpen(false);
                  setSelectedVersionForView(null);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Version Header */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Version</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedVersionForView.version || `v${selectedVersionForView.id}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Modified By</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedVersionForView.user?.username || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Date Modified</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedVersionForView.timestamp 
                        ? format(new Date(selectedVersionForView.timestamp), "MMMM d, yyyy 'at' h:mm a") 
                        : 'Unknown date'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Defect Content at this Version */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Defect Content</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedVersionForView.data?.title || selectedVersionForView.title || 'No title available'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {selectedVersionForView.data?.description || selectedVersionForView.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        selectedVersionForView.data?.status === 'open' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                        selectedVersionForView.data?.status === 'in_progress' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                        selectedVersionForView.data?.status === 'resolved' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                        selectedVersionForView.data?.status === 'closed' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {selectedVersionForView.data?.status || 'Unknown'}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Severity</label>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        selectedVersionForView.data?.severity === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                        selectedVersionForView.data?.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                        selectedVersionForView.data?.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                        selectedVersionForView.data?.severity === 'low' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {selectedVersionForView.data?.severity || 'Unknown'}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned To</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedVersionForView.data?.assigned_to_name || 
                         (selectedVersionForView.data?.assigned_to ? `User ID ${selectedVersionForView.data.assigned_to}` : 'Unassigned')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Changes Made in this Version */}
              {selectedVersionForView.changes && selectedVersionForView.changes.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Changes Made</h4>
                  <div className="space-y-3">
                    {selectedVersionForView.changes.map((change: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                        {change.description ? (
                          <p className="text-sm text-gray-700 dark:text-gray-300">{change.description}</p>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {change.field.replace('_', ' ')}:
                            </span>
                            {change.old_value && (
                              <>
                                <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs">
                                  {change.old_value}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">→</span>
                              </>
                            )}
                            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">
                              {change.new_value}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => {
                  setIsViewVersionModalOpen(false);
                  setSelectedVersionForView(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectHistoryPage; 