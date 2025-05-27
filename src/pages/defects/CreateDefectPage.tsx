import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defectApi, userApi } from '../../services';
import { FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToastMessages } from '../../contexts/ToastContext';

// Define the form schema using zod
const defectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  assignedTo: z.number().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

type DefectFormValues = z.infer<typeof defectSchema>;

// List of available tags for the system
const availableTags = [
  'Frontend', 'Backend', 'UI/UX', 'Database', 'API', 
  'Security', 'Performance', 'Documentation', 'Testing', 'Deployment',
  'Integration', 'Configuration'
];

const CreateDefectPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToastMessages();
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form setup with react-hook-form and zod
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<DefectFormValues>({
    resolver: zodResolver(defectSchema),
    defaultValues: {
      severity: 'medium',
      status: 'open',
      tags: [],
    },
  });
  
  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getUsers(),
    staleTime: 300000, // Cache users list for 5 minutes
  });
  
  // Extract users array from response with proper fallbacks
  const users = React.useMemo(() => {
    if (!usersData) return [];
    
    // Handle different response structures
    if (Array.isArray(usersData)) {
      return usersData;
    } else if (usersData.data && Array.isArray(usersData.data)) {
      return usersData.data;
    } else if (usersData.users && Array.isArray(usersData.users)) {
      return usersData.users;
    } else if (usersData.data?.users && Array.isArray(usersData.data.users)) {
      return usersData.data.users;
    }
    
    return [];
  }, [usersData]);
  
  // Create defect mutation with toast notifications
  const createDefectMutation = useMutation({
    mutationFn: async (data: DefectFormValues) => {
      // First create the defect
      const defectResponse = await defectApi.createDefect(data);
      
      // Try different ways to extract the defect ID
      const defectId = defectResponse?.data?.id || 
                      defectResponse?.data?.defect?.id || 
                      defectResponse?.id ||
                      defectResponse?.defect?.id;
      
      // If we have a file and a valid defect ID, upload the attachment immediately
      if (file && defectId) {
        const formData = new FormData();
        formData.append('attachments', file);
        
        try {
          // Upload the attachment synchronously
          const uploadResponse = await defectApi.uploadAttachment(defectId, formData);
        } catch (attachmentError) {
          // Don't throw here - we still want to show success for defect creation
          // but we'll show a warning about the attachment
          throw new Error('ATTACHMENT_UPLOAD_FAILED');
        }
      }
      
      return defectResponse;
    },
    onSuccess: (response, variables) => {
      const defectId = response?.data?.id;
      
      // Invalidate queries to refresh defect lists
      queryClient.invalidateQueries({ 
        queryKey: ['defects'], 
        predicate: (query) => {
          return query.queryKey.length > 1 && query.queryKey[0] === 'defects';
        }
      });
      
      // Force a refetch of the defect to ensure attachments are loaded
      if (defectId) {
        queryClient.invalidateQueries({ queryKey: ['defect', defectId.toString()] });
        
        // Prefetch the defect data for when user views the detail page
        queryClient.prefetchQuery({
          queryKey: ['defect', defectId.toString()],
          queryFn: () => defectApi.getDefect(defectId)
        });
      }
      
      if (file) {
        toast.success('Defect and attachment created successfully');
      } else {
        toast.success('Defect created successfully');
      }
      
      // Navigate to the defect detail page or back to list
      if (defectId) {
        navigate(`/defects/${defectId}`);
      } else {
        navigate('/defects');
      }
    },
    onError: (error: any) => {
      console.error('Failed to create defect:', error);
      
      if (error.message === 'ATTACHMENT_UPLOAD_FAILED') {
        toast.warning('Defect created but failed to upload attachment');
        // Still navigate to the defect page
        navigate('/defects');
      } else {
        toast.error(error.message || 'Failed to create defect. Please try again.');
      }
    }
  });
  
  // Handle form submission
  const onSubmit = (data: DefectFormValues) => {
    // Update tags from the selected tags state
    data.tags = selectedTags;
    
    // Check if status is being set to closed
    if (data.status === 'closed') {
      return;
    }
    
    // If not closed, proceed normally
    createDefectMutation.mutate(data);
  };
  
  // Handle going back
  const handleBack = () => {
    navigate('/defects');
  };
  
  // Handle tag selection/deselection
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // File upload handlers
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleFileDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <button
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            onClick={handleBack}
          >
            <FiArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white ml-4">Create New Defect</h1>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit as any)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Defect Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    className={`block w-full px-3 py-2 border ${errors.title ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="Enter a descriptive title"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assigned To
                  </label>
                  <Controller
                    name="assignedTo"
                    control={control}
                    render={({ field }) => (
                      <select
                        id="assignedTo"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Unassigned</option>
                        {users.map((user: any) => (
                          <option key={user.id} value={user.id}>
                            {user.username}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows={8}
                    className={`block w-full px-3 py-2 border ${errors.description ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="Provide detailed steps to reproduce the bug"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                  )}
                </div>
              </div>
              
              {/* Right Column */}
              <div>
                <div className="mb-4">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    className={`block w-full px-3 py-2 border ${errors.status ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    {...register('status')}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="severity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="severity"
                    className={`block w-full px-3 py-2 border ${errors.severity ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    {...register('severity')}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  {errors.severity && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.severity.message}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`px-3 py-1 text-sm rounded-md ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Attachments
                  </label>
                  <div 
                    className={`border-2 border-dashed rounded-md p-6 text-center ${
                      isDragging ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    onDrop={handleFileDrop}
                    onDragOver={handleFileDragOver}
                    onDragLeave={handleFileDragLeave}
                  >
                    <div className="flex flex-col items-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M24 30.0c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M24 16v-8m0 32v-8m16-16h-8m-16 0H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <label htmlFor="file-upload" className="cursor-pointer text-blue-600 dark:text-blue-400 font-medium hover:text-blue-500 dark:hover:text-blue-300">
                          Click to upload
                        </label>
                        <span className="text-gray-500 dark:text-gray-400"> or drag and drop</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        PDF, DOC, DOCX, XLS/XLSX, PNG, JPG up to 10MB
                      </p>
                    </div>
                    
                    {file && (
                      <div className="mt-4 flex items-center justify-center text-sm">
                        <span className="text-blue-600 dark:text-blue-400">{file.name}</span>
                        <button
                          type="button"
                          className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          onClick={() => setFile(null)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                onClick={handleBack}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-700 dark:bg-gray-600 rounded-md shadow-sm hover:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none"
                disabled={formIsSubmitting || createDefectMutation.isPending}
              >
                {createDefectMutation.isPending ? 'Submitting...' : 'Submit Defect'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDefectPage; 