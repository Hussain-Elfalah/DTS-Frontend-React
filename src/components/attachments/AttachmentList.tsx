import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { defectApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AttachmentUploader from './AttachmentUploader';
import { FiFile, FiImage, FiDownload, FiTrash2, FiPaperclip } from 'react-icons/fi';

interface Attachment {
  id: number;
  filename: string;
  url: string;
  size: number;
  created_at: string;
  created_by: number | {
    id: number;
    username: string;
  };
  // Optional fields for backward compatibility
  path?: string;
  mimetype?: string;
}

interface AttachmentListProps {
  defectId: number;
  attachments: Attachment[];
}

const AttachmentList: React.FC<AttachmentListProps> = ({ defectId, attachments }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) => 
      defectApi.deleteAttachment(defectId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect', defectId.toString()] });
    },
  });
  
  const handleDeleteAttachment = (attachmentId: number) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      deleteAttachmentMutation.mutate(attachmentId);
    }
  };
  
  // Get creator ID from attachment
  const getCreatorId = (attachment: Attachment) => {
    if (typeof attachment.created_by === 'number') {
      return attachment.created_by;
    }
    return attachment.created_by?.id;
  };

  // Get creator username from attachment
  const getCreatorUsername = (attachment: Attachment) => {
    if (typeof attachment.created_by === 'object' && attachment.created_by?.username) {
      return attachment.created_by.username;
    }
    return 'Unknown';
  };

  // Check if user can delete an attachment
  const canDeleteAttachment = (attachment: Attachment) => {
    const creatorId = getCreatorId(attachment);
    return (creatorId && user?.id === creatorId) || user?.role === 'admin';
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Get icon for file type
  const getFileIcon = (attachment: Attachment) => {
    const mimetype = attachment.mimetype;
    if (mimetype && mimetype.startsWith('image/')) {
      return <FiImage className="h-6 w-6" />;
    } else {
      return <FiFile className="h-6 w-6" />;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Attachment uploader */}
      <AttachmentUploader defectId={defectId} />
      
      {/* Attachments list */}
      {attachments.length === 0 ? (
        <div className="text-center py-6">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <FiPaperclip className="h-full w-full" />
          </div>
          <p className="mt-2 text-gray-500">No attachments</p>
          <p className="mt-1 text-sm text-gray-400">Upload an attachment to share it with the team</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 text-gray-500">
                  {getFileIcon(attachment)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {attachment.filename}
                  </p>
                  <div className="flex text-xs text-gray-500 space-x-2">
                    <span>{formatFileSize(attachment.size)}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })}
                    </span>
                    <span>•</span>
                    <span>Uploaded by {getCreatorUsername(attachment)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <a
                  href={attachment.url || attachment.path || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                  title="Download"
                >
                  <FiDownload className="h-5 w-5" />
                </a>
                
                {canDeleteAttachment(attachment) && (
                  <button
                    type="button"
                    className="text-gray-400 hover:text-red-500"
                    title="Delete"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttachmentList; 