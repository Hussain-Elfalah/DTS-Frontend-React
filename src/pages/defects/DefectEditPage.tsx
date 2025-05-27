import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defectApi, userApi } from '../../services';
import { FiArrowLeft, FiSave, FiEdit2 } from 'react-icons/fi';
import Loader from '../../components/ui/Loader';
import { useAuth } from '../../context/AuthContext';
import { useToastMessages } from '../../contexts/ToastContext';

// Define the form schema using zod
const defectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
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

const DefectEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToastMessages();
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dataProcessed, setDataProcessed] = useState(false);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [solutionText, setSolutionText] = useState('');
  const [pendingFormData, setPendingFormData] = useState<DefectFormValues | null>(null);
  
  // Form setup with react-hook-form and zod
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DefectFormValues>({
    resolver: zodResolver(defectSchema),
    defaultValues: {
      severity: 'medium',
      status: 'open',
      tags: [],
    },
  });
  
  // Watch the tags field
  const tags = watch('tags') || [];
  
  // Watch for changes to assignedTo field
  const assignedTo = watch('assignedTo');
  
  // Fetch defect data
  const { data: defectData, isLoading: isLoadingDefect, error: defectError } = useQuery({
    queryKey: ['defect', id],
    queryFn: () => defectApi.getDefect(Number(id)),
    enabled: !!id,
  });
  
  // Extract defect from response structure
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
  
  // Populate form when defect data is loaded
  useEffect(() => {
    if (defect) {
      // Determine the correct assignedTo value
      let assignedToId = null;
      
      // Check if assigned_to is a number (user ID)
      if (typeof defect.assigned_to === 'number') {
        assignedToId = defect.assigned_to;
      }
      // Check if assigned_to is an object with id property
      else if (defect.assigned_to && typeof defect.assigned_to === 'object' && defect.assigned_to.id) {
        assignedToId = defect.assigned_to.id;
      }
      
      // Reset form with defect data
      reset({
        title: defect.title || '',
        description: defect.description || '',
        status: defect.status || 'open',
        severity: defect.severity || 'medium',
        assignedTo: assignedToId,
        tags: defect.tags || [],
      });
      
      // Update selected tags state
      setSelectedTags(defect.tags || []);
    }
  }, [defect, reset]);
  
  // Permission check
  useEffect(() => {
    if (!user || !defect) return;
    
    // Check if user has permission to edit this defect
    const canEdit = 
      user.role === 'admin' || 
      defect.created_by?.id === user.id || 
      defect.assigned_to === user.id;
    
    if (!canEdit) {
      toast.error('You do not have permission to edit this defect');
      navigate(`/defects/${id}`);
      return;
    }
  }, [user, defect, id, navigate, toast]);
  
  // Handle form submission
  const onSubmit = (data: DefectFormValues) => {
    // Update tags from the selected tags state
    data.tags = selectedTags;
    
    // Check if status is being changed to closed
    if (data.status === 'closed') {
      // Get the current defect to check if it was already closed
      const currentDefect = defectData?.data?.defect || defectData?.data;
      const wasAlreadyClosed = currentDefect?.status === 'closed';
      
      // If it wasn't already closed, require a solution
      if (!wasAlreadyClosed) {
        setPendingFormData(data);
        setShowSolutionModal(true);
        return;
      }
    }
    
    // If not changing to closed or already closed, proceed normally
    updateDefectMutation.mutate(data);
  };
  
  // Handle solution submission
  const handleSolutionSubmit = () => {
    if (!solutionText.trim()) {
      toast.error('Solution is required when closing a defect');
      return;
    }
    
    if (!pendingFormData) return;
    
    // Add solution to the form data
    const dataWithSolution = {
      ...pendingFormData,
      solutions: [{ content: solutionText.trim() }]
    };
    
    // Close modal and submit
    setShowSolutionModal(false);
    setSolutionText('');
    setPendingFormData(null);
    updateDefectMutation.mutate(dataWithSolution);
  };
  
  // Handle going back
  const handleBack = () => {
    navigate(`/defects/${id}`);
  };
  
  // Loading state
  if (isLoadingDefect) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }
  
  // Error state
  if (defectError) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Error Loading Defect</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {defectError instanceof Error ? defectError.message : 'Failed to load defect data'}
          </p>
          <button
            onClick={() => navigate('/defects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Defects
          </button>
        </div>
      </div>
    );
  }
  
  // No defect found
  if (!defect) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Defect Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The defect you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => navigate('/defects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Defects
          </button>
        </div>
      </div>
    );
  }
  
  // Update defect mutation with toast notifications and cache invalidation
  const updateDefectMutation = useMutation({
    mutationFn: (data: DefectFormValues) => defectApi.updateDefect(Number(id), data),
    onSuccess: () => {
      // Invalidate and refetch defect data
      queryClient.invalidateQueries({ queryKey: ['defect', id] });
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      
      toast.success('Defect updated successfully');
      navigate(`/defects/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update defect. Please try again.');
    }
  });
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800 bg-opacity-70 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <FiEdit2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Edit Defect</h1>
              <p className="mt-1 text-sm text-gray-500">
                Please fill in the form to update the defect details.
              </p>
            </div>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                className={`block w-full px-3 py-2 border ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                {...register('title')}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            
            {/* Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                className={`block w-full px-3 py-2 border ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            
            {/* Severity */}
            <div className="mb-4">
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                id="severity"
                className={`block w-full px-3 py-2 border ${
                  errors.severity ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                {...register('severity')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              {errors.severity && (
                <p className="mt-1 text-sm text-red-600">{errors.severity.message}</p>
              )}
            </div>
            
            {/* Status */}
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                className={`block w-full px-3 py-2 border ${
                  errors.status ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                {...register('status')}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
            
            {/* Assigned To */}
            <div className="mb-4">
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => {
                  // Check if the current value is a valid user ID
                  const isValidUserId = field.value && users.some((user: any) => user.id === field.value);
                  
                  return (
                    <select
                      id="assignedTo"
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={isValidUserId ? String(field.value) : ''}
                      onChange={(e) => {
                        const newValue = e.target.value ? Number(e.target.value) : null;
                        field.onChange(newValue);
                      }}
                    >
                      <option value="">Unassigned</option>
                      {users.map((user: any) => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                  );
                }}
              />
            </div>
            
            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`px-3 py-1 text-sm rounded-md ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Attachments */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Attachment
              </label>
              <div 
                className={`border-2 border-dashed rounded-md p-6 text-center ${
                  isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                }`}
                onDrop={handleFileDrop}
                onDragOver={handleFileDragOver}
                onDragLeave={handleFileDragLeave}
              >
                <div className="flex flex-col items-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M24 30.0c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M24 16v-8m0 32v-8m16-16h-8m-16 0H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <label htmlFor="file-upload" className="cursor-pointer text-blue-600 font-medium hover:text-blue-500">
                      Click to upload
                    </label>
                    <span className="text-gray-500"> or drag and drop</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, DOC, DOCX, XLS/XLSX, PNG, JPG up to 10MB
                  </p>
                </div>
                
                {file && (
                  <div className="mt-4 flex items-center justify-center text-sm">
                    <span className="text-blue-600">{file.name}</span>
                    <button
                      type="button"
                      className="ml-2 text-red-600 hover:text-red-800"
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
                onClick={handleBack}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md shadow-sm hover:bg-gray-800 focus:outline-none"
                disabled={isSubmitting || updateDefectMutation.isPending}
              >
                {updateDefectMutation.isPending ? 'Updating...' : 'Update Defect'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Solution Requirement Modal */}
      {showSolutionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Solution Required
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              A solution is required when closing a defect. Please provide details about how this defect was resolved.
            </p>
            <div className="mb-4">
              <label htmlFor="solution" className="block text-sm font-medium text-gray-700 mb-2">
                Solution <span className="text-red-500">*</span>
              </label>
              <textarea
                id="solution"
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe how this defect was resolved..."
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
                onClick={() => {
                  setShowSolutionModal(false);
                  setSolutionText('');
                  setPendingFormData(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
                onClick={handleSolutionSubmit}
                disabled={!solutionText.trim()}
              >
                Close Defect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectEditPage; 