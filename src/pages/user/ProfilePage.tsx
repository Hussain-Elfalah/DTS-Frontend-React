import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, userApi, defectApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiSave, FiUser, FiLock, FiBriefcase, FiCalendar, FiClipboard, FiCheck } from 'react-icons/fi';
import { format } from 'date-fns';
import Loader from '../../components/ui/Loader';

// Profile form schema
const profileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine(data => !data.password || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity'>('profile');
  
  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      password: '',
      confirmPassword: '',
    },
  });
  
  // Fetch user statistics
  const { data: statsData } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      const response = await api.get('/users/statistics');
      return response.data?.data || {
        createdDefects: 0,
        assignedDefects: 0,
        createdByStatus: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
        assignedByStatus: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
        recentActivity: []
      };
    },
    enabled: !!user?.id,
  });
  
  // Update user form when user context changes
  useEffect(() => {
    if (user) {
      reset({
        username: user.username || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user, reset]);
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => {
      // Remove confirm password before sending to API
      const { confirmPassword, ...profileData } = data;
      // Only include password if it's provided
      if (!profileData.password) {
        delete profileData.password;
      }
      return userApi.updateProfile(profileData);
    },
    onSuccess: () => {
      setSuccessMessage('Profile updated successfully');
      setErrorMessage(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    },
    onError: (error: any) => {
      setErrorMessage(
        error.response?.data?.message || 'Error updating profile'
      );
      setSuccessMessage(null);
    },
  });
  
  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string, newPassword: string }) => {
      return userApi.changePassword(data.currentPassword, data.newPassword);
    },
    onSuccess: () => {
      setSuccessMessage('Password changed successfully');
      setErrorMessage(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      // Clear password fields
      reset({
        ...getValues(),
        password: '',
        confirmPassword: '',
      });
    },
    onError: (error: any) => {
      setErrorMessage(
        error.response?.data?.message || 'Error changing password'
      );
      setSuccessMessage(null);
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ProfileFormValues) => {
    // If password is provided, handle it separately
    if (data.password) {
      // We need the current password for changing password
      // For now, we'll use a prompt, but in a real application
      // you would have a proper UI for this
      const currentPassword = prompt('Please enter your current password to confirm');
      
      if (currentPassword) {
        changePasswordMutation.mutate({
          currentPassword,
          newPassword: data.password
        });
      } else {
        setErrorMessage('Current password is required to change password');
        return;
      }
    }
    
    // Handle profile update
    const { password, confirmPassword, ...profileData } = data;
    updateProfileMutation.mutate(profileData);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  if (!user) {
    return <div className="p-6">Loading user data...</div>;
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Profile</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your account information and see your activity
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden mb-6">
        {/* User summary section */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-start md:items-center flex-col md:flex-row">
            <div className="flex-shrink-0 mb-4 md:mb-0">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-semibold">
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div className="md:ml-6 flex-grow">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.username}</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mr-2">
                  {user.role === 'admin' ? 'Administrator' : 'User'}
                </span>
                {/* <span className="text-gray-500 text-sm">
                  Member since {(user as any).created_at ? formatDate((user as any).created_at) : 'Unknown'}
                </span> */}
              </p>
            </div>
            
            {/* Stats summary */}
            <div className="mt-4 md:mt-0 w-full md:w-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {statsData?.createdDefects || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Defects Created</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {statsData?.assignedDefects || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Defects Assigned</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className="border-b border-gray-200 dark:border-gray-600">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <FiUser className="inline-block mr-2" />
              Profile Settings
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'activity'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <FiClipboard className="inline-block mr-2" />
              Activity & Statistics
            </button>
          </nav>
        </div>
        
        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'profile' ? (
            <>
              {successMessage && (
                <div className="mb-6 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiCheck className="h-5 w-5 text-green-400 dark:text-green-300" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        {successMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {errorMessage && (
                <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">
                {/* Username */}
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                  <label htmlFor="username" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      className={`block w-full pl-12 py-3 text-base rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        errors.username 
                          ? 'border-red-300 dark:border-red-500 text-red-900 dark:text-red-200 placeholder-red-300 dark:placeholder-red-400 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      {...register('username')}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
                  )}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Leave blank if you don't want to change your password
                  </p>
                  
                  {/* Password */}
                  <div className="mb-6">
                    <label htmlFor="password" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type="password"
                        className={`block w-full pl-12 py-3 text-base rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                          errors.password 
                            ? 'border-red-300 dark:border-red-500 text-red-900 dark:text-red-200 placeholder-red-300 dark:placeholder-red-400 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        {...register('password')}
                      />
                    </div>
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                    )}
                  </div>
                  
                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        type="password"
                        className={`block w-full pl-12 py-3 text-base rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                          errors.confirmPassword 
                            ? 'border-red-300 dark:border-red-500 text-red-900 dark:text-red-200 placeholder-red-300 dark:placeholder-red-400 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        {...register('confirmPassword')}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                    disabled={isSubmitting || updateProfileMutation.isPending}
                  >
                    <FiSave className="inline-block mr-2 h-5 w-5" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Activity tab */
            <div>
              {statsData ? (
                <>
                  {/* Stats cards */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Defect Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                        <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Created Defects by Status</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 flex items-center">
                            <div className="w-2 h-8 bg-blue-400 rounded-full mr-3"></div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">Open</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{statsData.createdByStatus.open || 0}</div>
                            </div>
                          </div>
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 flex items-center">
                            <div className="w-2 h-8 bg-yellow-400 rounded-full mr-3"></div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">In Progress</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{statsData.createdByStatus.in_progress || 0}</div>
                            </div>
                          </div>
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 flex items-center">
                            <div className="w-2 h-8 bg-green-400 rounded-full mr-3"></div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">Resolved</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{statsData.createdByStatus.resolved || 0}</div>
                            </div>
                          </div>
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 flex items-center">
                            <div className="w-2 h-8 bg-gray-400 rounded-full mr-3"></div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">Closed</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{statsData.createdByStatus.closed || 0}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                        <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Assigned Defects by Status</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 flex items-center">
                            <div className="w-2 h-8 bg-blue-400 rounded-full mr-3"></div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">Open</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{statsData.assignedByStatus.open || 0}</div>
                            </div>
                          </div>
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 flex items-center">
                            <div className="w-2 h-8 bg-yellow-400 rounded-full mr-3"></div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">In Progress</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{statsData.assignedByStatus.in_progress || 0}</div>
                            </div>
                          </div>
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 flex items-center">
                            <div className="w-2 h-8 bg-green-400 rounded-full mr-3"></div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">Resolved</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{statsData.assignedByStatus.resolved || 0}</div>
                            </div>
                          </div>
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 flex items-center">
                            <div className="w-2 h-8 bg-gray-400 rounded-full mr-3"></div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">Closed</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{statsData.assignedByStatus.closed || 0}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent activity */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                    {statsData.recentActivity && statsData.recentActivity.length > 0 ? (
                      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                          {statsData.recentActivity.map((activity: any) => (
                            <li key={activity.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <a href={`/defects/${activity.id}`} className="block">
                                <div className="flex items-center space-x-4">
                                  <div className="flex-shrink-0">
                                    {activity.assigned_to?.id === user.id ? (
                                      <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                                        <FiBriefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                      </div>
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                        <FiClipboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {activity.title}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                      {activity.assigned_to?.id === user.id ? 'Assigned to you' : 'Created by you'}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0 text-right">
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                      ${activity.status === 'open' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 
                                        activity.status === 'in_progress' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                        activity.status === 'resolved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                      {activity.status.replace('_', ' ')}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                      <FiCalendar className="inline mr-1" />
                                      {formatDate(activity.updated_at || activity.created_at)}
                                    </p>
                                  </div>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-gray-400 dark:text-gray-500 mb-2">
                          <FiClipboard className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white">No recent activity</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          You haven't created or been assigned any defects yet.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Loader />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 