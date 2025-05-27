import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiFile, FiUploadCloud, FiX, FiCheck } from 'react-icons/fi';
import { defectApi } from '../../services';

interface SubmitBugFormProps {
  onSuccess?: () => void;
}

const SubmitBugForm: React.FC<SubmitBugFormProps> = ({ onSuccess }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps_to_reproduce: '',
    expected_result: '',
    actual_result: '',
    severity: 'medium',
    category: 'frontend',
    environment: 'development',
    browser: '',
    operating_system: '',
    device: '',
    tags: [] as string[],
  });
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');
  
  // Mutation for submitting a new defect
  const submitMutation = useMutation({
    mutationFn: (data: FormData) => defectApi.createDefect(data),
    onSuccess: (data) => {
      // Invalidate defects query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      
      // Navigate to the detail page of the new defect
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/defects/${data.id}`);
      }
    },
    onError: (error: any) => {
      // Handle validation errors from the API
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };
  
  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };
  
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };
  
  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Create FormData to handle file uploads
    const submitData = new FormData();
    
    // Add form fields to FormData
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'tags') {
        if (value.length > 0) {
          submitData.append(key, JSON.stringify(value));
        }
      } else {
        submitData.append(key, value as string);
      }
    });
    
    // Add attachments
    attachments.forEach((file) => {
      submitData.append('attachments', file);
    });
    
    // Submit the form
    submitMutation.mutate(submitData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="form-label">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`form-input w-full ${errors.title ? 'border-red-500' : ''}`}
            placeholder="A clear, concise summary of the issue"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>
        
        {/* Description */}
        <div>
          <label htmlFor="description" className="form-label">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            className={`form-input w-full ${errors.description ? 'border-red-500' : ''}`}
            placeholder="Detailed description of the issue"
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>
        
        {/* Steps to reproduce */}
        <div>
          <label htmlFor="steps_to_reproduce" className="form-label">
            Steps to Reproduce
          </label>
          <textarea
            id="steps_to_reproduce"
            name="steps_to_reproduce"
            value={formData.steps_to_reproduce}
            onChange={handleChange}
            rows={3}
            className="form-input w-full"
            placeholder="1. Navigate to...\n2. Click on...\n3. Observe that..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expected result */}
          <div>
            <label htmlFor="expected_result" className="form-label">
              Expected Result
            </label>
            <textarea
              id="expected_result"
              name="expected_result"
              value={formData.expected_result}
              onChange={handleChange}
              rows={3}
              className="form-input w-full"
              placeholder="What should happen?"
            />
          </div>
          
          {/* Actual result */}
          <div>
            <label htmlFor="actual_result" className="form-label">
              Actual Result
            </label>
            <textarea
              id="actual_result"
              name="actual_result"
              value={formData.actual_result}
              onChange={handleChange}
              rows={3}
              className="form-input w-full"
              placeholder="What actually happened?"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Severity */}
          <div>
            <label htmlFor="severity" className="form-label">
              Severity
            </label>
            <select
              id="severity"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="form-input w-full"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          {/* Category */}
          <div>
            <label htmlFor="category" className="form-label">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-input w-full"
            >
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="database">Database</option>
              <option value="network">Network</option>
              <option value="ui">UI/UX</option>
              <option value="performance">Performance</option>
              <option value="security">Security</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Environment */}
          <div>
            <label htmlFor="environment" className="form-label">
              Environment
            </label>
            <select
              id="environment"
              name="environment"
              value={formData.environment}
              onChange={handleChange}
              className="form-input w-full"
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
              <option value="testing">Testing</option>
            </select>
          </div>
          
          {/* Browser */}
          <div>
            <label htmlFor="browser" className="form-label">
              Browser
            </label>
            <input
              type="text"
              id="browser"
              name="browser"
              value={formData.browser}
              onChange={handleChange}
              className="form-input w-full"
              placeholder="Chrome, Firefox, etc."
            />
          </div>
          
          {/* Operating System */}
          <div>
            <label htmlFor="operating_system" className="form-label">
              Operating System
            </label>
            <input
              type="text"
              id="operating_system"
              name="operating_system"
              value={formData.operating_system}
              onChange={handleChange}
              className="form-input w-full"
              placeholder="Windows, macOS, Linux, etc."
            />
          </div>
        </div>
        
        {/* Device */}
        <div>
          <label htmlFor="device" className="form-label">
            Device
          </label>
          <input
            type="text"
            id="device"
            name="device"
            value={formData.device}
            onChange={handleChange}
            className="form-input w-full"
            placeholder="Desktop, iPhone, etc."
          />
        </div>
        
        {/* Tags */}
        <div>
          <label htmlFor="tags" className="form-label">
            Tags
          </label>
          <div className="flex items-center">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="form-input w-full"
              placeholder="Add tags to categorize the defect"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <button
              type="button"
              onClick={addTag}
              className="ml-2 p-2 bg-primary text-white rounded-md"
            >
              <FiCheck className="h-5 w-5" />
            </button>
          </div>
          
          {formData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 text-blue-800 hover:bg-blue-300"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Attachments */}
        <div>
          <label htmlFor="attachments" className="form-label">
            Attachments
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-700 focus-within:outline-none"
                >
                  <span>Upload files</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF, PDF up to 10MB each
              </p>
            </div>
          </div>
          
          {attachments.length > 0 && (
            <ul className="mt-3 divide-y divide-gray-200 border border-gray-200 rounded-md">
              {attachments.map((file, index) => (
                <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <FiFile className="flex-shrink-0 h-5 w-5 text-gray-400" />
                    <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="font-medium text-red-600 hover:text-red-800"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Submit button */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Bug'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SubmitBugForm; 