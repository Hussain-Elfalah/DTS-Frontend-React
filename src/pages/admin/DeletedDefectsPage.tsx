import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FiTrash2, FiRefreshCw, FiEye, FiSearch } from 'react-icons/fi';
import { adminApi } from '../../services/api';
import { useToastMessages } from '../../contexts/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/ui/Loader';
import DefectStatusBadge from '../../components/defects/DefectStatusBadge';
import DefectSeverityBadge from '../../components/defects/DefectSeverityBadge';

interface DeletedDefect {
  id: number;
  title: string;
  description: string;
  status: string;
  severity: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  created_by_name: string;
  assigned_to_name?: string;
  deleted_by_name?: string;
}

const DeletedDefectsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToastMessages();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect if not admin
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      window.location.href = '/defects';
    }
  }, [user, toast]);

  // Fetch deleted defects
  const {
    data: deletedDefects,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['deletedDefects'],
    queryFn: () => adminApi.getDeletedDefects(),
    enabled: user?.role === 'admin',
  });

  // Restore defect mutation
  const restoreDefectMutation = useMutation({
    mutationFn: (defectId: number) => adminApi.restoreDefect(defectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletedDefects'] });
      toast.success('Defect restored successfully');
    },
    onError: () => {
      toast.error('Failed to restore defect');
    },
  });

  // Permanently delete defect mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: (defectId: number) => adminApi.permanentlyDeleteDefect(defectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletedDefects'] });
      toast.success('Defect permanently deleted');
    },
    onError: () => {
      toast.error('Failed to permanently delete defect');
    },
  });

  const handleRestore = (defect: DeletedDefect) => {
    const confirmMessage = `Are you sure you want to restore this defect?\n\nTitle: ${defect.title}\n\nThis will make the defect visible and accessible again.`;
    
    if (window.confirm(confirmMessage)) {
      restoreDefectMutation.mutate(defect.id);
    }
  };

  const handlePermanentDelete = (defect: DeletedDefect) => {
    const confirmMessage = `⚠️ PERMANENT DELETION WARNING ⚠️\n\nAre you sure you want to PERMANENTLY delete this defect?\n\nTitle: ${defect.title}\n\nThis action CANNOT be undone and will remove all associated data including:\n- Comments\n- Attachments\n- Solutions\n- Version history\n\nType "DELETE" to confirm this irreversible action.`;
    
    const userInput = window.prompt(confirmMessage);
    if (userInput === 'DELETE') {
      permanentDeleteMutation.mutate(defect.id);
    } else if (userInput !== null) {
      toast.error('Deletion cancelled. You must type "DELETE" exactly to confirm.');
    }
  };

  // Filter defects based on search term
  const filteredDefects = React.useMemo(() => {
    if (!deletedDefects?.data) return [];
    
    const defects = Array.isArray(deletedDefects.data) ? deletedDefects.data : [];
    
    if (!searchTerm) return defects;
    
    return defects.filter((defect: DeletedDefect) =>
      defect.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      defect.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      defect.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      defect.assigned_to_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [deletedDefects, searchTerm]);

  if (!user || user.role !== 'admin') {
    return <Loader />;
  }

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Deleted Defects</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Failed to load deleted defects. Please try again.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiRefreshCw className="mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Deleted Defects</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage soft-deleted defects. You can restore or permanently delete them.
          </p>
        </div>

        {/* Search and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search deleted defects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
        </div>

        {/* Defects List */}
        {filteredDefects.length === 0 ? (
          <div className="text-center py-12">
            <FiTrash2 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No deleted defects</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No deleted defects match your search.' : 'There are no deleted defects to display.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDefects.map((defect: DeletedDefect) => (
                <li key={defect.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                            Deleted
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {defect.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {defect.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <DefectSeverityBadge severity={defect.severity as 'low' | 'medium' | 'high' | 'critical'} />
                          <DefectStatusBadge status={defect.status as 'open' | 'in_progress' | 'resolved' | 'closed'} />
                        </div>
                        <span>Created by {defect.created_by_name}</span>
                        {defect.assigned_to_name && (
                          <span>Assigned to {defect.assigned_to_name}</span>
                        )}
                        <span>Deleted {format(new Date(defect.deleted_at), 'MMM dd, yyyy')}</span>
                        {defect.deleted_by_name && (
                          <span>by {defect.deleted_by_name}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRestore(defect)}
                        disabled={restoreDefectMutation.isPending}
                        className="inline-flex items-center px-3 py-1.5 border border-green-300 dark:border-green-600 shadow-sm text-sm font-medium rounded-md text-green-700 dark:text-green-400 bg-white dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiRefreshCw className="mr-1 h-4 w-4" />
                        Restore
                      </button>
                      
                      <button
                        onClick={() => handlePermanentDelete(defect)}
                        disabled={permanentDeleteMutation.isPending}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-600 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiTrash2 className="mr-1 h-4 w-4" />
                        Delete Forever
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeletedDefectsPage; 