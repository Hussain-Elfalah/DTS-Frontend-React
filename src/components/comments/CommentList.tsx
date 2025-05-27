import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { commentApi } from '../../services';
import { useAuth } from '../../context/AuthContext';
import Loader from '../ui/Loader';
import CommentForm from './CommentForm';
import { FiEdit2, FiTrash2, FiMoreVertical, FiDownload, FiFile, FiX } from 'react-icons/fi';

interface Attachment {
  id: number;
  filename: string;
  original_name?: string;
  file_size?: number;
  file_type?: string;
  file_path?: string;
  // Backend fields
  url?: string;
  size?: number;
  created_at: string;
  created_by?: number;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  created_by?: {
    id: number;
    username: string;
  };
  user?: {
    username: string;
  };
  author?: string;
  user_name?: string;
  created_by_name?: string;
  attachments?: Attachment[];
}

interface CommentListProps {
  comments: Comment[];
  defectId: number;
  isLoading: boolean;
}

const CommentList: React.FC<CommentListProps> = ({ comments, defectId, isLoading }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [menuOpenForComment, setMenuOpenForComment] = useState<number | null>(null);
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: ({ commentId }: { commentId: number }) => 
      commentApi.deleteComment(defectId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defectComments', defectId.toString()] });
    },
  });

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ commentId, attachmentId }: { commentId: number; attachmentId: number }) => 
      commentApi.deleteAttachment(commentId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defectComments', defectId.toString()] });
    },
  });
  
  const handleDeleteComment = (commentId: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate({ commentId });
      setMenuOpenForComment(null);
    }
  };
  
  const handleEditComment = (commentId: number) => {
    setEditingCommentId(commentId);
    setMenuOpenForComment(null);
  };
  
  const handleCancelEdit = () => {
    setEditingCommentId(null);
  };
  
  const toggleCommentMenu = (commentId: number) => {
    setMenuOpenForComment(menuOpenForComment === commentId ? null : commentId);
  };
  
  // Get username from comment with fallbacks for different data formats
  const getCommentUsername = (comment: Comment) => {
    return comment.created_by?.username || 
           comment.user?.username || 
           comment.author || 
           comment.user_name || 
           comment.created_by_name || 
           'Unknown';
  };

  // Get user ID from comment with fallbacks
  const getCommentUserId = (comment: Comment) => {
    return comment.created_by?.id;
  };

  // Check if user can edit or delete a comment
  const canModifyComment = (comment: Comment) => {
    const commentUserId = getCommentUserId(comment);
    return (commentUserId && user?.id === commentUserId) || user?.role === 'admin';
  };

  // Get attachment filename for display
  const getAttachmentDisplayName = (attachment: Attachment) => {
    return attachment.original_name || attachment.filename || 'Unknown file';
  };

  // Get attachment file size
  const getAttachmentSize = (attachment: Attachment) => {
    return attachment.file_size || attachment.size || 0;
  };

  // Handle attachment download
  const handleDownloadAttachment = (attachment: Attachment) => {
    // Create a download link
    const link = document.createElement('a');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    // Use URL if available, otherwise construct from filename
    if (attachment.url) {
      link.href = attachment.url;
    } else {
      link.href = `${apiUrl}/uploads/${attachment.filename}`;
    }
    
    link.download = getAttachmentDisplayName(attachment);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle attachment deletion
  const handleDeleteAttachment = (commentId: number, attachmentId: number, attachmentName: string) => {
    if (window.confirm(`Are you sure you want to delete "${attachmentName}"?`)) {
      deleteAttachmentMutation.mutate({ commentId, attachmentId });
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  if (isLoading && comments.length === 0) {
    return <Loader />;
  }
  
  return (
    <div className="space-y-6">
      {/* Comment form */}
      <CommentForm defectId={defectId} />
      
      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-gray-400">No comments yet</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Be the first to add a comment</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-300 font-medium">
                        {getCommentUsername(comment).substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getCommentUsername(comment)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                {/* Actions menu */}
                {canModifyComment(comment) && (
                  <div className="relative">
                    <button
                      type="button"
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => toggleCommentMenu(comment.id)}
                    >
                      <FiMoreVertical className="h-5 w-5" />
                    </button>
                    
                    {menuOpenForComment === comment.id && (
                      <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 dark:ring-gray-600 z-10">
                        <button
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => handleEditComment(comment.id)}
                        >
                          <div className="flex items-center">
                            <FiEdit2 className="mr-2 h-4 w-4" />
                            Edit
                          </div>
                        </button>
                        <button
                          className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <div className="flex items-center">
                            <FiTrash2 className="mr-2 h-4 w-4" />
                            Delete
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-2">
                {editingCommentId === comment.id ? (
                  <CommentForm 
                    defectId={defectId} 
                    commentId={comment.id} 
                    initialContent={comment.content} 
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{comment.content}</p>
                    
                    {/* Attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Attachments ({comment.attachments.length})
                        </h4>
                        <div className="space-y-1">
                          {comment.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                            >
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <FiFile className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {getAttachmentDisplayName(attachment)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatFileSize(getAttachmentSize(attachment))}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                                  onClick={() => handleDownloadAttachment(attachment)}
                                  title="Download"
                                >
                                  <FiDownload className="h-4 w-4" />
                                </button>
                                {canModifyComment(comment) && (
                                  <button
                                    type="button"
                                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                                    onClick={() => handleDeleteAttachment(comment.id, attachment.id, getAttachmentDisplayName(attachment))}
                                    title="Delete"
                                  >
                                    <FiX className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommentList; 