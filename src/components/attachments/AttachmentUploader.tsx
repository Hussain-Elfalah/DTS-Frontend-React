import React, { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { defectApi } from '../../services';
import { FiUpload, FiX } from 'react-icons/fi';

interface AttachmentUploaderProps {
  defectId: number;
}

const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({ defectId }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  // Upload attachment mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: (formData: FormData) => defectApi.uploadAttachment(defectId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect', defectId.toString()] });
      setFiles([]);
      setIsUploading(false);
    },
    onError: () => {
      setIsUploading(false);
    },
  });
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles([...files, ...newFiles]);
    }
  };
  
  const handleUpload = () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('attachments', file);
    });
    
    uploadAttachmentMutation.mutate(formData);
  };
  
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-md p-6 ${
          dragActive ? 'border-primary bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-center">
          <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-900">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-xs text-gray-500">
              Upload multiple files of any type
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Files to upload ({files.length})
          </h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex items-center">
                  <span className="text-sm truncate max-w-xs">{file.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`})
                  </span>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <FiX className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
          
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader; 