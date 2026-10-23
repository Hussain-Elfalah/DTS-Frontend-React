import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { solutionApi, type Solution, type SolutionAttachment } from '../services/solutionApi';
import { PlusIcon, PencilIcon, TrashIcon, PaperClipIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface SolutionsProps {
  defectId: number;
  defectStatus: string;
  canEdit: boolean;
}

interface SolutionFormData {
  content: string;
  attachments: File[];
}

export const Solutions: React.FC<SolutionsProps> = ({ defectId, defectStatus, canEdit }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSolution, setEditingSolution] = useState<Solution | null>(null);
  const [formData, setFormData] = useState<SolutionFormData>({
    content: '',
    attachments: []
  });

  // Fetch solutions for this defect
  const { data: solutions = [], isLoading, error } = useQuery({
    queryKey: ['solutions', defectId],
    queryFn: () => solutionApi.getSolutionsByDefectId(defectId),
    enabled: !!defectId,
  });

  // Create solution mutation
  const createSolutionMutation = useMutation({
    mutationFn: async (data: { content: string; attachments: File[] }) => {
      const solution = await solutionApi.createSolution(defectId, { content: data.content });
      
      // Upload attachments if any
      if (data.attachments.length > 0) {
        await solutionApi.uploadAttachments(solution.id, data.attachments);
      }
      
      return solution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions', defectId] });
      queryClient.invalidateQueries({ queryKey: ['defect', defectId] });
      toast.success('Solution added successfully');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add solution');
    }
  });

  // Update solution mutation
  const updateSolutionMutation = useMutation({
    mutationFn: async (data: { solutionId: number; content: string; attachments: File[] }) => {
      const solution = await solutionApi.updateSolution(data.solutionId, { content: data.content });
      
      // Upload new attachments if any
      if (data.attachments.length > 0) {
        await solutionApi.uploadAttachments(data.solutionId, data.attachments);
      }
      
      return solution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions', defectId] });
      queryClient.invalidateQueries({ queryKey: ['defect', defectId] });
      toast.success('Solution updated successfully');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update solution');
    }
  });

  // Delete solution mutation
  const deleteSolutionMutation = useMutation({
    mutationFn: solutionApi.deleteSolution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions', defectId] });
      queryClient.invalidateQueries({ queryKey: ['defect', defectId] });
      toast.success('Solution deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete solution');
    }
  });

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ solutionId, attachmentId }: { solutionId: number; attachmentId: number }) =>
      solutionApi.deleteAttachment(solutionId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions', defectId] });
      toast.success('Attachment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete attachment');
    }
  });

  const resetForm = () => {
    setFormData({ content: '', attachments: [] });
    setShowAddForm(false);
    setEditingSolution(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast.error('Solution content is required');
      return;
    }

    if (editingSolution) {
      updateSolutionMutation.mutate({
        solutionId: editingSolution.id,
        content: formData.content,
        attachments: formData.attachments
      });
    } else {
      createSolutionMutation.mutate(formData);
    }
  };

  const handleEdit = (solution: Solution) => {
    setEditingSolution(solution);
    setFormData({
      content: solution.content,
      attachments: []
    });
    setShowAddForm(true);
  };

  const handleDelete = (solutionId: number) => {
    if (window.confirm('Are you sure you want to delete this solution?')) {
      deleteSolutionMutation.mutate(solutionId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteAttachment = (solutionId: number, attachmentId: number) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      deleteAttachmentMutation.mutate({ solutionId, attachmentId });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canAddSolution = canEdit && (defectStatus === 'resolved' || defectStatus === 'closed');
  const canManageSolutions = canEdit;

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600">
        Failed to load solutions. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">
          Solutions ({solutions.length})
        </h2>
        {canAddSolution && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Solution
          </button>
        )}
      </div>

      {/* Add/Edit Solution Form */}
      {showAddForm && (
        <div className="bg-muted rounded-lg p-4 border border-border">
          <h3 className="text-md font-medium text-foreground mb-4">
            {editingSolution ? 'Edit Solution' : 'Add New Solution'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
                Solution Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                rows={4}
                className="block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring bg-card text-foreground"
                placeholder="Describe how this defect was resolved..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Attachments (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <PaperClipIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="flex text-sm text-muted-foreground">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-card rounded-md font-medium text-foreground hover:text-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring">
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, TXT, PNG, JPG up to 10MB each
                  </p>
                </div>
              </div>

              {/* Selected Files */}
              {formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Selected Files:</h4>
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-card p-2 rounded border border-border">
                      <div className="flex items-center">
                        <DocumentIcon className="h-5 w-5 text-muted-foreground mr-2" />
                        <span className="text-sm text-foreground">{file.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSolutionMutation.isPending || updateSolutionMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createSolutionMutation.isPending || updateSolutionMutation.isPending
                  ? 'Saving...'
                  : editingSolution
                  ? 'Update Solution'
                  : 'Add Solution'
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Solutions List */}
      {solutions.length === 0 ? (
        <div className="text-center py-8">
          <DocumentIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No solutions yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {canAddSolution 
              ? 'Add the first solution to document how this defect was resolved.'
              : 'Solutions will appear here once they are added.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {solutions.map((solution, index) => (
            <div key={solution.id} className="bg-card rounded-lg border border-border p-4">
              {/* Solution Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground">
                    Solution {index + 1}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    By {solution.user?.username || 'Unknown'} on{' '}
                    {new Date(solution.created_at).toLocaleDateString()} at{' '}
                    {new Date(solution.created_at).toLocaleTimeString()}
                  </p>
                </div>
                
                {canManageSolutions && (user?.id === solution.user_id || user?.role === 'admin') && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(solution)}
                      className="text-foreground hover:text-foreground"
                      title="Edit solution"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(solution.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete solution"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Solution Content */}
              <div className="prose prose-sm max-w-none mb-4">
                <p className="text-foreground whitespace-pre-wrap">
                  {solution.content}
                </p>
              </div>

              {/* Attachments */}
              {solution.attachments && solution.attachments.length > 0 && (
                <div className="border-t border-border pt-3">
                  <h5 className="text-sm font-medium text-foreground mb-2">
                    Attachments ({solution.attachments.length})
                  </h5>
                  <div className="space-y-2">
                    {solution.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between bg-muted p-2 rounded">
                        <div className="flex items-center">
                          <DocumentIcon className="h-5 w-5 text-muted-foreground mr-2" />
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-foreground hover:text-foreground"
                          >
                            {attachment.filename}
                          </a>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({formatFileSize(attachment.size)})
                          </span>
                        </div>
                        
                        {canManageSolutions && (user?.id === solution.user_id || user?.role === 'admin') && (
                          <button
                            onClick={() => handleDeleteAttachment(solution.id, attachment.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete attachment"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 