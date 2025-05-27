import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '../../services/api';
import { FiSend, FiX, FiPaperclip, FiFile } from 'react-icons/fi';

// Comment form schema
const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface CommentFormProps {
  defectId: number;
  commentId?: number;
  initialContent?: string;
  onCancel?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ 
  defectId, 
  commentId, 
  initialContent = '', 
  onCancel 
}) => {
  const isEditing = !!commentId;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: initialContent,
    },
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (data: CommentFormValues) => {
      // Validate defectId
      if (isNaN(defectId) || defectId <= 0) {
        throw new Error('Invalid defect ID');
      }
      return commentApi.addComment(defectId, data.content);
    },
    onSuccess: async (response) => {
      // If there are files to upload, upload them after comment creation
      if (selectedFiles.length > 0 && response.data?.comment?.id) {
        try {
          setIsUploadingAttachments(true);
          await commentApi.uploadAttachments(response.data.comment.id, selectedFiles);
        } catch (error) {
          console.error('Error uploading attachments:', error);
          // Don't fail the whole operation if attachment upload fails
        } finally {
          setIsUploadingAttachments(false);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['defectComments', defectId.toString()] });
      reset({ content: '' });
      setSelectedFiles([]);
      setIsSubmitting(false);
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });
  
  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: (data: CommentFormValues) => {
      // Validate defectId and commentId
      if (isNaN(defectId) || defectId <= 0) {
        throw new Error('Invalid defect ID');
      }
      if (!commentId || isNaN(commentId) || commentId <= 0) {
        throw new Error('Invalid comment ID');
      }
      return commentApi.updateComment(defectId, commentId, data.content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defectComments', defectId.toString()] });
      setIsSubmitting(false);
      if (onCancel) onCancel();
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });
  
  const onSubmit = (data: CommentFormValues) => {
    setIsSubmitting(true);
    
    if (isEditing) {
      updateCommentMutation.mutate(data);
    } else {
      addCommentMutation.mutate(data);
    }
  };
  
  const handleCancel = () => {
    setSelectedFiles([]);
    if (onCancel) onCancel();
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <div>
        <textarea
          rows={isEditing ? 3 : 2}
          className={`form-input resize-none ${errors.content ? 'border-red-500' : ''}`}
          placeholder="Add a comment..."
          {...register('content')}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
        )}
      </div>

      {/* File Upload Section - Only show for new comments */}
      {!isEditing && (
        <div className="space-y-2">
          {/* File Input */}
          <div className="flex items-center space-x-2">
            <label className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
              <FiPaperclip className="mr-1 -ml-0.5 h-4 w-4" />
              Attach Files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="*/*"
              />
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Max 5 files
            </span>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-1">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FiFile className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                    onClick={() => removeFile(index)}
                    title="Remove file"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        {isEditing && (
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <FiX className="mr-1 -ml-0.5 h-4 w-4" />
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none"
          disabled={isSubmitting || isUploadingAttachments}
        >
          <FiSend className="mr-1 -ml-0.5 h-4 w-4" />
          {isUploadingAttachments ? 'Uploading...' : isEditing ? 'Save' : 'Comment'}
        </button>
      </div>
    </form>
  );
};

export default CommentForm; 