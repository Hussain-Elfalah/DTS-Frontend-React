import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { defectApi, solutionApi, type WorkflowAction } from '../../services';
import { useToastMessages } from '../../contexts/ToastContext';
import { FiCheck, FiClock, FiRefreshCw, FiX } from 'react-icons/fi';

interface DefectWorkflowActionsProps {
  defectId: number;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  className?: string;
}

const DefectWorkflowActions: React.FC<DefectWorkflowActionsProps> = ({
  defectId,
  currentStatus,
  onStatusChange,
  className = ''
}) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [solutionFiles, setSolutionFiles] = useState<File[]>([]);

  const queryClient = useQueryClient();

  // Check if solutions exist for this defect
  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions', defectId],
    queryFn: () => solutionApi.getSolutionsByDefectId(defectId),
    enabled: !!defectId,
  });

  // Fetch available workflow actions using React Query
  const { data: workflowActions = [], isLoading: loading, error } = useQuery<WorkflowAction[]>({
    queryKey: ['workflow-actions', defectId, currentStatus],
    queryFn: () => defectApi.getWorkflowActions(defectId),
    enabled: !!defectId,
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error: any) => {
      // Don't retry on network errors to avoid spamming
      if (error?.code === 'ERR_NETWORK') return false;
      return failureCount < 2;
    }
  });

  // Create solution mutation
  const createSolutionMutation = useMutation({
    mutationFn: async (data: { content: string; files: File[] }) => {
      const solution = await solutionApi.createSolution(defectId, { content: data.content });
      
      // Upload attachments if any
      if (data.files.length > 0) {
        await solutionApi.uploadAttachments(solution.id, data.files);
      }
      
      return solution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions', defectId] });
      toast.success('Solution added successfully');
      
      // Now proceed with status change
      if (pendingStatus) {
        handleStatusChangeInternal(pendingStatus);
      }
      
      resetSolutionModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add solution');
    }
  });

  const resetSolutionModal = () => {
    setShowSolutionModal(false);
    setPendingStatus(null);
    setSolutionText('');
    setSolutionFiles([]);
  };

  // Handle status change with solution requirement check
  const handleStatusChange = async (newStatus: string) => {
    // Check if this status requires a solution
    const requiresSolution = newStatus === 'resolved' || newStatus === 'closed';
    
    if (requiresSolution && solutions.length === 0) {
      // Show solution modal
      setPendingStatus(newStatus);
      setShowSolutionModal(true);
      return;
    }
    
    // Proceed with status change
    await handleStatusChangeInternal(newStatus);
  };

  // Internal status change handler
  const handleStatusChangeInternal = async (newStatus: string) => {
    try {
      setUpdating(newStatus);
      
      // Update the defect status
      await defectApi.updateDefect(defectId, { status: newStatus });
      
      // Notify parent component
      onStatusChange(newStatus);
      
      // React Query will automatically refetch workflow actions when currentStatus changes
      
      toast.success(`Defect status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating defect status:', error);
      
      // Show error message if available
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update status';
      toast.error(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  // Handle solution submission
  const handleSolutionSubmit = () => {
    if (!solutionText.trim()) {
      toast.error('Solution description is required');
      return;
    }

    createSolutionMutation.mutate({
      content: solutionText.trim(),
      files: solutionFiles
    });
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSolutionFiles(prev => [...prev, ...files]);
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSolutionFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get button variant classes based on action variant
  const getButtonClasses = (action: WorkflowAction) => {
    const baseClasses = 'px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    
    if (!action.canPerform) {
      return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }

    switch (action.variant) {
      case 'success':
        return `${baseClasses} bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2`;
      case 'warning':
        return `${baseClasses} bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2`;
      case 'info':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`;
      case 'secondary':
        return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`;
      default:
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-500">Loading actions...</span>
      </div>
    );
  }

  if (workflowActions.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Actions:</h4>
        <div className="flex flex-wrap gap-2">
          {workflowActions.map((action) => (
            <div key={action.status} className="relative">
              <button
                onClick={() => handleStatusChange(action.status)}
                disabled={!action.canPerform || updating === action.status}
                className={getButtonClasses(action)}
                title={action.description}
              >
                {updating === action.status ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  action.label
                )}
              </button>
              
              {/* Show reason tooltip for disabled actions */}
              {!action.canPerform && action.reason && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  {action.reason}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Show descriptions for available actions */}
        <div className="text-xs text-gray-500 space-y-1">
          {workflowActions.filter(action => action.canPerform).map((action) => (
            <div key={action.status} className="flex items-start space-x-2">
              <span className="font-medium">{action.label}:</span>
              <span>{action.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Solution Requirement Modal */}
      {showSolutionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Solution Required
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                A solution is required when marking a defect as "{pendingStatus}". Please provide details about how this defect was resolved.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="solution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Solution Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="solution"
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Describe how this defect was resolved..."
                    value={solutionText}
                    onChange={(e) => setSolutionText(e.target.value)}
                    required
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attachments (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
                  />
                  
                  {/* Selected Files */}
                  {solutionFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {solutionFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          <span className="text-gray-900 dark:text-white">{file.name} ({formatFileSize(file.size)})</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetSolutionModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSolutionSubmit}
                  disabled={!solutionText.trim() || createSolutionMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createSolutionMutation.isPending ? 'Adding Solution...' : 'Add Solution & Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DefectWorkflowActions; 