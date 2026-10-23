import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { FiClock, FiRefreshCw, FiEye, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { defectApi } from '../../services/api';
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
        <p className="text-red-500">Error loading version history</p>
      </div>
    );
  }
  
  if (!data?.data?.length) {
    return (
      <div className="bg-card shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Version History</h2>
        <div className="text-center py-6">
          <p className="text-muted-foreground">No version history available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-medium text-foreground">Version History</h2>
        <div className="flex space-x-2">
          {canCompare && (
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="flex items-center px-3 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none"
            >
              <FiEye className="mr-2 h-4 w-4" />
              {showDiff ? 'Hide Diff' : 'Compare Selected'}
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
            title="Refresh"
          >
            <FiRefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {showDiff && canCompare && (
        <div className="p-4 border-b border-border">
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
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center ring-8 ring-white ${
                        selectedVersions.includes(version.id) ? 'bg-muted ring-border' : ''
                      }`}>
                        <FiClock className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <span className="font-medium text-foreground">
                            Version {version.version_number}
                          </span>
                          <span className="ml-2 text-sm text-muted-foreground">
                            by {version.created_by?.username || 'System'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                          {' · '}
                          {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="mt-2 space-y-4">
                        <div className="flex">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-foreground rounded mr-2 bg-card border-border"
                            checked={selectedVersions.includes(version.id)}
                            onChange={() => toggleVersion(version.id)}
                            id={`version-${version.id}`}
                          />
                          <label 
                            htmlFor={`version-${version.id}`}
                            className="text-sm font-medium text-foreground cursor-pointer"
                          >
                            Select for comparison
                          </label>
                          
                          <button
                            onClick={() => toggleExpand(version.id)}
                            className="ml-4 text-sm text-foreground hover:text-foreground flex items-center"
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
                          <div className="bg-muted p-4 rounded-md text-sm">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                              {version.changes && version.changes.length > 0 ? (
                                <div className="col-span-2">
                                  <dt className="font-medium text-foreground">Changes</dt>
                                  <dd className="mt-1">
                                    <ul className="list-disc pl-5 space-y-1">
                                      {version.changes.map((change: string, idx: number) => (
                                        <li key={idx} className="text-foreground">{change}</li>
                                      ))}
                                    </ul>
                                  </dd>
                                </div>
                              ) : null}
                              
                              {Object.entries(version.content || {}).map(([key, value]) => (
                                <div key={key} className="sm:col-span-1">
                                  <dt className="font-medium text-foreground capitalize">{key.replace('_', ' ')}</dt>
                                  <dd className="mt-1 text-foreground whitespace-pre-wrap">
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