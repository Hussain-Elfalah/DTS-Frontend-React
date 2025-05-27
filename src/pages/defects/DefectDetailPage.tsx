import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FiArrowLeft, FiEdit2, FiCheck, FiClock, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { defectApi, commentApi, debounce } from '../../services';
import { useToastMessages } from '../../contexts/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/ui/Loader';
import DefectStatusBadge from '../../components/defects/DefectStatusBadge';
import DefectSeverityBadge from '../../components/defects/DefectSeverityBadge';
import CommentList from '../../components/comments/CommentList';
import DefectWorkflowActions from '../../components/defects/DefectWorkflowActions';
import { Solutions } from '../../components/Solutions';

const DefectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [returnPath, setReturnPath] = useState<string>('/defects');
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const toast = useToastMessages();
  const { user } = useAuth();

  // Set the correct return path based on the referrer
  useEffect(() => {
    // Check if we have a referrer in the state
    if (location.state && location.state.from) {
      setReturnPath(location.state.from);
    }
  }, [location]);

  // Fetch defect details with retry and better error handling
  const {
    data: defectData,
    isLoading,
    error,
    refetch: refetchDefect
  } = useQuery({
    queryKey: ['defect', id],
    queryFn: () => defectApi.getDefect(Number(id)),
    // Decreased staleTime to allow for quicker updates
    staleTime: 10000, // 10 seconds
    // Don't retry on network or 429 errors
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    }
  });

  // Fetch comments
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    refetch: refetchComments
  } = useQuery({
    queryKey: ['defectComments', id],
    queryFn: () => commentApi.getComments(Number(id)),
    // Increased staleTime to reduce requests
    staleTime: 60000, // 1 minute
    // Don't retry on network or 429 errors
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    }
  });

  // Get defect from response structure with better normalization
  const defect = React.useMemo(() => {
    if (!defectData) return null;
    
    // API might return {data: {defect: {}}} or {data: {}} or direct object
    let extractedDefect = defectData?.data?.defect || defectData?.data || defectData;
    
    // Ensure we have a valid object with all required fields
    if (extractedDefect) {
      // Apply defaults for missing fields and handle different property names
      extractedDefect = {
        id: extractedDefect.id || Number(id),
        title: extractedDefect.title || 'Untitled Defect',
        description: extractedDefect.description || '',
        status: extractedDefect.status || 'open',
        severity: extractedDefect.severity || 'medium',
        created_at: extractedDefect.created_at || new Date().toISOString(),
        updated_at: extractedDefect.updated_at || extractedDefect.created_at || new Date().toISOString(),
        
        // Handle different creator fields
        created_by: extractedDefect.created_by || extractedDefect.createdBy || { username: 'Unknown' },
        created_by_name: extractedDefect.creator_name || 
                         extractedDefect.created_by_name || 
                         extractedDefect.createdByName || 
                         (typeof extractedDefect.created_by === 'object' ? 
                          extractedDefect.created_by?.username || extractedDefect.created_by?.name : 
                          'Unknown'),
        
        // Handle different assignee fields
        assigned_to: extractedDefect.assigned_to || extractedDefect.assignedTo || null,
        assigned_to_name: extractedDefect.assignee_name || 
                         extractedDefect.assigned_to_name ||
                         extractedDefect.assignedToName || 
                         (typeof extractedDefect.assigned_to === 'object' ? 
                          extractedDefect.assigned_to?.username || extractedDefect.assigned_to?.name : 
                          'Unassigned'),
        
        // Initialize arrays if missing
        tags: extractedDefect.tags || [],
        solutions: extractedDefect.solutions || [],
        attachments: extractedDefect.attachments || [],
        
        // Pass through any other properties
        ...extractedDefect
      };
    }
    
    return extractedDefect;
  }, [defectData, id]);

  // Update return path and current status based on defect status when data loads
  useEffect(() => {
    if (defect) {
      setCurrentStatus(defect.status);
      if (defect.status === 'closed') {
        setReturnPath('/defects/closed');
      }
    }
  }, [defect]);

  // Get comments from response structure with better normalization
  const comments = React.useMemo(() => {
    if (!commentsData) return [];
    
    // API might return {data: []} or direct array or {comments: []}
    let extractedComments;
    
    if (Array.isArray(commentsData)) {
      extractedComments = commentsData;
    } else if (commentsData?.data && Array.isArray(commentsData.data)) {
      extractedComments = commentsData.data;
    } else if (commentsData?.comments && Array.isArray(commentsData.comments)) {
      extractedComments = commentsData.comments;
    } else if (commentsData?.data?.comments && Array.isArray(commentsData.data.comments)) {
      extractedComments = commentsData.data.comments;
    } else {
      extractedComments = [];
    }
    
    // Process comments to ensure proper formatting for CommentList component
    return extractedComments.map((comment: any) => {
      // Normalize user information
      const username = comment.author || 
                      comment.user_name || 
                      (comment.user?.username || comment.user?.name) ||
                      comment.created_by_name ||
                      (typeof comment.created_by === 'object' ? 
                       comment.created_by?.username || comment.created_by?.name : 
                       'Unknown');
      
      // Get user ID for permission checks
      const userId = comment.user_id || 
                    (comment.user?.id) ||
                    (typeof comment.created_by === 'object' ? comment.created_by?.id : null);
                      
      // Transform attachments to match CommentList interface
      const transformedAttachments = comment.attachments ? comment.attachments.map((attachment: any) => ({
        id: attachment.id,
        filename: attachment.filename,
        original_name: attachment.filename, // Backend uses 'filename' for original name
        file_size: attachment.size, // Backend uses 'size' instead of 'file_size'
        file_type: attachment.file_type || 'application/octet-stream',
        file_path: attachment.url || '',
        url: attachment.url,
        size: attachment.size,
        created_at: attachment.created_at,
        created_by: attachment.created_by
      })) : [];

      return {
        ...comment,
        // Ensure created_by object exists for CommentList component
        created_by: {
          id: userId,
          username: username
        },
        // Keep other fields for backward compatibility
        user: {
          username: username
        },
        author: username,
        user_name: username,
        created_by_name: username,
        // Transform attachments
        attachments: transformedAttachments
      };
    });
  }, [commentsData]);

  // Mark as closed mutation with toast notifications
  const markAsClosedMutation = useMutation({
    mutationFn: (data: { status: string; solution?: string }) => 
      defectApi.updateDefect(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect', id] });
      toast.success('Defect marked as closed');
    },
    onError: () => {
      toast.error('Failed to mark defect as closed');
    },
  });

  // Delete defect mutation (admin only)
  const deleteDefectMutation = useMutation({
    mutationFn: () => defectApi.deleteDefect(Number(id)),
    onSuccess: () => {
      toast.success('Defect deleted successfully');
      navigate('/defects');
    },
    onError: () => {
      toast.error('Failed to delete defect');
    },
  });
  
  // Reopen defect mutation with toast notifications
  const reopenDefectMutation = useMutation({
    mutationFn: () => defectApi.updateDefect(Number(id), { status: 'open' }),
    onSuccess: () => {
      // Show success toast
      toast.success('Defect reopened successfully');
      
      // Only invalidate this specific defect query
      queryClient.invalidateQueries({ queryKey: ['defect', id] });
    },
    onError: (error: any) => {
      console.error('Failed to reopen defect:', error);
      // Show error toast
      toast.error(error.message || 'Failed to reopen defect. Please try again.');
    }
  });

  // Check if user can edit this defect
  const canEditDefect = React.useMemo(() => {
    if (!user || !defect) return false;
    
    // Admin can edit any defect
    if (user.role === 'admin') return true;
    
    // Creator can edit their own defect
    if (defect.created_by?.id === user.id) return true;
    
    // Assignee can edit assigned defect
    if (defect.assigned_to === user.id) return true;
    
    return false;
  }, [user, defect]);

  // Check if user can edit this defect with toast notification
  const checkEditPermission = React.useCallback(() => {
    if (!canEditDefect) {
      toast.error('You do not have permission to edit this defect');
      return false;
    }
    return true;
  }, [canEditDefect, toast]);

  const handleMarkAsClosed = () => {
    if (!checkEditPermission()) return;
    markAsClosedMutation.mutate({ status: 'closed' });
  };

  const handleReopenDefect = () => {
    if (!checkEditPermission()) return;
    markAsClosedMutation.mutate({ status: 'open' });
  };

  const handleDeleteDefect = () => {
    if (user?.role !== 'admin') {
      toast.error('Only administrators can delete defects');
      return;
    }

    const confirmMessage = `Are you sure you want to delete this defect?\n\nTitle: ${defect?.title}\n\nThis action cannot be undone and will permanently remove the defect from the system.`;
    
    if (window.confirm(confirmMessage)) {
      deleteDefectMutation.mutate();
    }
  };

  const showVersionHistory = () => {
    navigate(`/defects/${id}/history`, { state: { from: returnPath } });
  };

  // Add permission check for the edit button
  const handleEditClick = (e: React.MouseEvent) => {
    if (!checkEditPermission()) {
      e.preventDefault(); // Prevent navigation
      return;
    }
    
    // If permission check passes, allow navigation
    navigate(`/defects/${id}/edit`);
  };

  // Handle back button click
  const handleBack = () => {
    navigate(returnPath);
  };

  // Handle status change from workflow actions
  const handleStatusChange = useCallback((newStatus: string) => {
    setCurrentStatus(newStatus);
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['defect', id] });
    queryClient.invalidateQueries({ queryKey: ['defects'] });
    
    // Show success message
    toast.success(`Defect status updated to ${newStatus.replace('_', ' ')}`);
  }, [queryClient, id, toast]);

  // Format dates with fallback
  const formatDateWithFallback = (dateString: string | undefined, formatString = 'MMM dd, yyyy, hh:mm a') => {
    if (!dateString) return 'Unknown';
    try {
      return format(new Date(dateString), formatString);
    } catch (error) {
      console.error('Invalid date format:', dateString);
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center bg-gray-50 dark:bg-gray-900 min-h-full">
        <Loader />
      </div>
    );
  }

  if (error || !defect) {
    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-4 rounded-md">
          Error loading defect details. Please try again later.
          <button 
            onClick={() => refetchDefect()}
            className="ml-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Format dates
  const createdDate = formatDateWithFallback(defect.created_at);
  const updatedDate = formatDateWithFallback(defect.updated_at);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      {/* Back button */}
      <div className="mb-6">
        <button 
          onClick={handleBack} 
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <FiArrowLeft className="mr-2" />
          <span className="text-lg font-medium">Back to Defects</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Defect title and info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{defect.title || 'Untitled Defect'}</h1>
              <DefectStatusBadge status={defect.status || 'open'} />
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Defect #{id} • Created {createdDate}
            </div>
            
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Description</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {defect.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Solutions section - only for resolved or closed defects */}
          {(defect.status === 'resolved' || defect.status === 'closed') && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <Solutions 
                  defectId={Number(id)} 
                  defectStatus={defect.status} 
                  canEdit={canEditDefect} 
                />
              </div>
            </div>
          )}

          {/* Comments section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Comments</h2>
            </div>

            <div className="p-6">
              <CommentList 
                comments={comments} 
                defectId={Number(id)} 
                isLoading={isLoadingComments} 
              />
            </div>
          </div>

        </div>

        {/* Side panel */}
        <div className="space-y-6">
          {/* Details section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Details</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned To</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {defect.assigned_to_name || 
                   (defect.assigned_to?.username ? defect.assigned_to.username : 'Unassigned')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {defect.created_by_name || 
                   (defect.created_by?.username ? defect.created_by.username : 'Unknown')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Priority</h3>
                <div className="mt-1">
                  <DefectSeverityBadge severity={defect.severity || 'medium'} />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{createdDate}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{updatedDate}</p>
              </div>
              
              {defect.tags && defect.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {defect.tags.map((tag: any, index: number) => (
                      <span 
                        key={tag.id || `tag-${index}`} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      >
                        {typeof tag === 'string' ? tag : tag.name || `Tag ${index}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments section */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Attachments</h3>
                <div className="mt-2 space-y-2">
                  {(!defect.attachments || defect.attachments.length === 0) ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500">No attachments</p>
                  ) : (
                    defect.attachments.map((attachment: any, index: number) => (
                      <div
                        key={attachment.id || `attachment-${index}`}
                        className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {attachment.filename || attachment.name || 'Unknown file'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {attachment.size ? (
                                attachment.size < 1024 * 1024
                                  ? `${(attachment.size / 1024).toFixed(1)} KB`
                                  : `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`
                              ) : 'Unknown size'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <a
                            href={attachment.url || attachment.path || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                          </a>
                          {canEditDefect && (
                            <button
                              type="button"
                              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this attachment?')) {
                                  // Handle delete attachment
                                  defectApi.deleteAttachment(Number(id), attachment.id)
                                    .then(() => {
                                      queryClient.invalidateQueries({ queryKey: ['defect', id] });
                                      toast.success('Attachment deleted successfully');
                                    })
                                    .catch(() => {
                                      toast.error('Failed to delete attachment');
                                    });
                                }
                              }}
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* Upload new attachment button */}
                  {canEditDefect && (
                    <div className="mt-3">
                      <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none w-full justify-center">
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        Upload Attachment
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const formData = new FormData();
                              Array.from(e.target.files).forEach((file) => {
                                formData.append('attachments', file);
                              });
                              
                              defectApi.uploadAttachment(Number(id), formData)
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ['defect', id] });
                                  toast.success('Attachments uploaded successfully');
                                  // Reset the input
                                  e.target.value = '';
                                })
                                .catch(() => {
                                  toast.error('Failed to upload attachments');
                                });
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>

          {/* Actions section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Actions</h2>
            </div>
            
            <div className="p-6 space-y-3">
              <Link
                to={`/defects/edit/${id}`}
                state={{ from: location.pathname }}
                onClick={handleEditClick}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiEdit2 className="mr-2" />
                Edit Defect
              </Link>
              
              {/* Delete button - Admin only */}
              {user?.role === 'admin' && (
                <button
                  onClick={handleDeleteDefect}
                  disabled={deleteDefectMutation.isPending}
                  className="w-full flex justify-center items-center px-4 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiTrash2 className="mr-2" />
                  {deleteDefectMutation.isPending ? 'Deleting...' : 'Delete Defect'}
                </button>
              )}
              
              {/* Workflow Actions */}
              <DefectWorkflowActions
                defectId={Number(id)}
                currentStatus={currentStatus}
                onStatusChange={handleStatusChange}
                className="mt-4"
              />
            </div>
          </div>
          
          {/* History section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">History</h2>
            </div>
            
            <div className="p-6">
              <button
                onClick={showVersionHistory}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiClock className="mr-2" />
                View Version History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefectDetailPage; 