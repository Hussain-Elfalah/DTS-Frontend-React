import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { FiClock, FiRefreshCw, FiEye, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { defectApi } from '../../services';
import Loader from '../ui/Loader';
import DiffViewer from 'react-diff-viewer-continued';

interface DefectVersionHistoryProps {
  defectId: number;
}

const DefectVersionHistory: React.FC<DefectVersionHistoryProps> = ({ defectId }) => {
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [expandedVersions, setExpandedVersions] = useState<number[]>([]);
  
  // Fetch version history
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['defect-versions', defectId],
    queryFn: () => defectApi.getDefectVersions(defectId),
  });
  
  const toggleVersion = (versionId: number) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId));
    } else {
      // Only allow 2 versions to be selected for comparison
      if (selectedVersions.length < 2) {
        setSelectedVersions([...selectedVersions, versionId]);
      } else {
        // Replace the oldest selected version
        setSelectedVersions([selectedVersions[1], versionId]);
      }
    }
  };
  
  const toggleExpand = (versionId: number) => {
    if (expandedVersions.includes(versionId)) {
      setExpandedVersions(expandedVersions.filter(id => id !== versionId));
    } else {
      setExpandedVersions([...expandedVersions, versionId]);
    }
  };
  
  const canCompare = selectedVersions.length === 2;
  
  // Get selected versions data
  const getVersionData = (versionId: number) => {
    return data?.data?.find((version: any) => version.id === versionId);
  };
  
  // Compare versions
  const compareVersions = () => {
    if (!canCompare) return;
    
    const [oldVersionId, newVersionId] = selectedVersions.sort((a, b) => a - b);
    const oldVersion = getVersionData(oldVersionId);
    const newVersion = getVersionData(newVersionId);
    
    if (!oldVersion || !newVersion) return null;
    
    const oldContent = JSON.stringify(oldVersion.content, null, 2);
    const newContent = JSON.stringify(newVersion.content, null, 2);
    
    return (
      <DiffViewer
        oldValue={oldContent}
        newValue={newContent}
        splitView={true}
        disableWordDiff={false}
        leftTitle={`Version ${oldVersion.version_number}`}
        rightTitle={`Version ${newVersion.version_number}`}
      />
    );
  };
  
  if (isLoading) {
    return <Loader />;
  }
  
  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 dark:text-red-400">Error loading version history</p>
      </div>
    );
  }
  
  if (!data?.data?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Version History</h2>
        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-gray-400">No version history available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Version History</h2>
        <div className="flex space-x-2">
          {canCompare && (
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
            >
              <FiEye className="mr-2 h-4 w-4" />
              {showDiff ? 'Hide Diff' : 'Compare Selected'}
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Refresh"
          >
            <FiRefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {showDiff && canCompare && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {compareVersions()}
        </div>
      )}
      
      <div className="overflow-hidden">
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {data.data.map((version: any, versionIdx: number) => (
              <li key={version.id}>
                <div className="relative pb-8">
                  {versionIdx !== data.data.length - 1 ? (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className={`h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
                        selectedVersions.includes(version.id) ? 'bg-blue-100 dark:bg-blue-900 ring-blue-50 dark:ring-blue-900' : ''
                      }`}>
                        <FiClock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-white">
                            Version {version.version_number}
                          </span>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            by {version.created_by?.username || 'System'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                          {' · '}
                          {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="mt-2 space-y-4">
                        <div className="flex">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 rounded mr-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                            checked={selectedVersions.includes(version.id)}
                            onChange={() => toggleVersion(version.id)}
                            id={`version-${version.id}`}
                          />
                          <label 
                            htmlFor={`version-${version.id}`}
                            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                          >
                            Select for comparison
                          </label>
                          
                          <button
                            onClick={() => toggleExpand(version.id)}
                            className="ml-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                          >
                            {expandedVersions.includes(version.id) ? (
                              <>
                                <FiChevronUp className="mr-1 h-4 w-4" />
                                Hide details
                              </>
                            ) : (
                              <>
                                <FiChevronDown className="mr-1 h-4 w-4" />
                                Show details
                              </>
                            )}
                          </button>
                        </div>
                        
                        {expandedVersions.includes(version.id) && (
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-sm">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                              {version.changes && version.changes.length > 0 ? (
                                <div className="col-span-2">
                                  <dt className="font-medium text-gray-700 dark:text-gray-300">Changes</dt>
                                  <dd className="mt-1">
                                    <ul className="list-disc pl-5 space-y-1">
                                      {version.changes.map((change: string, idx: number) => (
                                        <li key={idx} className="text-gray-900 dark:text-white">{change}</li>
                                      ))}
                                    </ul>
                                  </dd>
                                </div>
                              ) : null}
                              
                              {Object.entries(version.content || {}).map(([key, value]) => (
                                <div key={key} className="sm:col-span-1">
                                  <dt className="font-medium text-gray-700 dark:text-gray-300 capitalize">{key.replace('_', ' ')}</dt>
                                  <dd className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                                    {typeof value === 'object' 
                                      ? JSON.stringify(value, null, 2)
                                      : String(value)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DefectVersionHistory; 