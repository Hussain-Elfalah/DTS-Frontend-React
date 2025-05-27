import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../services';
import Loader from '../../components/ui/Loader';
import { 
  FiUserPlus, 
  FiEdit2, 
  FiTrash2, 
  FiCheck, 
  FiX, 
  FiMail, 
  FiSearch,
  FiFilter,
  FiDownload,
  FiUpload,
  FiMoreVertical,
  FiEye,
  FiShield,
  FiClock,
  FiActivity,
  FiUsers,
  FiBarChart,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  first_name?: string;
  last_name?: string;
  department?: string;
  job_title?: string;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
  last_activity_at?: string;
  is_online?: boolean;
  two_factor_enabled?: boolean;
  status?: 'active' | 'inactive';
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
}

const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Fetch users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getUsers,
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => userApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUsers([]);
    },
  });
  
  // Change user role mutation
  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'user' | 'admin' }) =>
      userApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
  
  // Change user status mutation
  const changeStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: 'active' | 'inactive' }) =>
      userApi.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      console.error('Error updating user status:', error);
      // Handle the case where status column doesn't exist
      if (error.message?.includes('Database schema does not support status column')) {
        alert('Status management is not available. The database needs to be updated to support user status.');
      }
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAddUserModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      alert(error.message || 'Failed to create user');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: number; userData: any }) =>
      userApi.updateUser(userId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditUserModalOpen(false);
      setCurrentUser(null);
    },
    onError: (error: any) => {
      console.error('Error updating user:', error);
      alert(error.message || 'Failed to update user');
    },
  });
  
  // Bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ operation, userIds }: { operation: string; userIds: number[] }) => {
      const promises = userIds.map(userId => {
        switch (operation) {
          case 'activate':
            return userApi.updateUserStatus(userId, 'active');
          case 'deactivate':
            return userApi.updateUserStatus(userId, 'inactive');
          case 'delete':
            return userApi.deleteUser(userId);
          default:
            return Promise.resolve();
        }
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUsers([]);
    },
    onError: (error: any) => {
      console.error('Error in bulk operation:', error);
      alert(error.message || 'Failed to perform bulk operation');
    },
  });
  
  // Handle user deletion
  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      bulkOperationMutation.mutate({ operation: 'delete', userIds: selectedUsers });
    }
  };

  // Handle bulk status change
  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    const operation = status === 'active' ? 'activate' : 'deactivate';
    bulkOperationMutation.mutate({ operation, userIds: selectedUsers });
  };
  
  // Handle role change
  const handleRoleChange = (userId: number, newRole: 'user' | 'admin') => {
    changeRoleMutation.mutate({ userId, role: newRole });
  };
  
  // Handle status change
  const handleStatusChange = (userId: number, newStatus: 'active' | 'inactive') => {
    changeStatusMutation.mutate({ userId, status: newStatus });
  };
  
  // Handle edit user
  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsEditUserModalOpen(true);
  };
  
  // Handle view user
  const handleViewUser = (user: User) => {
    setCurrentUser(user);
    setIsViewUserModalOpen(true);
  };
  
  // Handle add new user
  const handleAddUser = () => {
    setIsAddUserModalOpen(true);
  };

  // Handle user selection
  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers?.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers?.map((user: User) => user.id) || []);
    }
  };
  
  // Filter users based on search term and filters
  const filteredUsers = React.useMemo(() => {
    // Handle different API response formats
    let users = [];
    
    if (usersData?.data?.users && Array.isArray(usersData.data.users)) {
      // API returns {status: "success", data: {users: [...]}}
      users = usersData.data.users;
    } else if (usersData?.data && Array.isArray(usersData.data)) {
      // API returns {data: [...]}
      users = usersData.data;
    } else if (usersData?.users && Array.isArray(usersData.users)) {
      // API returns {users: [...]}
      users = usersData.users;
    } else if (Array.isArray(usersData)) {
      // API returns direct array
      users = usersData;
    } else {
      console.warn('Unexpected users data format:', usersData);
      return [];
    }

    return users.filter((user: User) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
        (user.department && user.department.toLowerCase().includes(searchLower))
      );

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const userStatus = user.status || 'active'; // Default to active if status is undefined
      const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;
      const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
    });
  }, [usersData, searchTerm, roleFilter, statusFilter, departmentFilter]);

  // Calculate user statistics
  const userStats: UserStats = React.useMemo(() => {
    // Handle different API response formats
    let users = [];
    
    if (usersData?.data?.users && Array.isArray(usersData.data.users)) {
      users = usersData.data.users;
    } else if (usersData?.data && Array.isArray(usersData.data)) {
      users = usersData.data;
    } else if (usersData?.users && Array.isArray(usersData.users)) {
      users = usersData.users;
    } else if (Array.isArray(usersData)) {
      users = usersData;
    }

    return {
      totalUsers: users.length,
      activeUsers: users.filter((user: User) => (user.status || 'active') === 'active').length,
      adminUsers: users.filter((user: User) => user.role === 'admin').length,
      newUsersThisMonth: users.filter((user: User) => {
        const userDate = new Date(user.created_at);
        const now = new Date();
        return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
      }).length,
    };
  }, [usersData]);

  // Get unique departments for filter
  const departments: string[] = React.useMemo(() => {
    // Handle different API response formats
    let users = [];
    
    if (usersData?.data?.users && Array.isArray(usersData.data.users)) {
      users = usersData.data.users;
    } else if (usersData?.data && Array.isArray(usersData.data)) {
      users = usersData.data;
    } else if (usersData?.users && Array.isArray(usersData.users)) {
      users = usersData.users;
    } else if (Array.isArray(usersData)) {
      users = usersData;
    }

    return Array.from(new Set(
      users
        .map((user: User) => user.department)
        .filter((dept: string | undefined): dept is string => Boolean(dept))
    ));
  }, [usersData]);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          Error loading users. Please try again later.
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon, color, trend }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    trend?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <FiTrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm font-medium text-green-600">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const UserCard = ({ user }: { user: User }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedUsers.includes(user.id)}
            onChange={() => handleUserSelect(user.id)}
            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
              {user.username.substring(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {user.is_online && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              Online
            </span>
          )}
          {user.two_factor_enabled && (
            <FiShield className="h-4 w-4 text-green-500" title="2FA Enabled" />
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : user.username}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
        {user.job_title && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.job_title}</p>
        )}
        {user.department && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.department}</p>
        )}
        
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.role === 'admin' 
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' 
                : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
            }`}>
              {user.role}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              (user.status || 'active') === 'active'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {user.status || 'active'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewUser(user)}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              title="View User"
            >
              <FiEye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEditUser(user)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              title="Edit User"
            >
              <FiEdit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteUser(user.id)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              title="Delete User"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              User Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage users and their permissions
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {viewMode === 'table' ? 'Card View' : 'Table View'}
            </button>
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FiUserPlus className="mr-2 h-4 w-4" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Users"
          value={userStats.totalUsers}
          icon={<FiUsers className="h-5 w-5 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Users"
          value={userStats.activeUsers}
          icon={<FiCheckCircle className="h-5 w-5 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Admin Users"
          value={userStats.adminUsers}
          icon={<FiShield className="h-5 w-5 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="New This Month"
          value={userStats.newUsersThisMonth}
          icon={<FiTrendingUp className="h-5 w-5 text-white" />}
          color="bg-indigo-500"
          trend="+12%"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search users by name, email, role, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  showFilters 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <FiFilter className="mr-2 h-4 w-4" />
                Filters
              </button>
              
              {selectedUsers.length > 0 && (
                <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md border border-blue-200 dark:border-blue-700">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {selectedUsers.length} selected
                  </span>
                  <button
                    onClick={() => handleBulkStatusChange('active')}
                    className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded hover:bg-green-200 dark:hover:bg-green-800"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('inactive')}
                    className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded hover:bg-yellow-200 dark:hover:bg-yellow-800"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-medium rounded hover:bg-red-200 dark:hover:bg-red-800"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    className="w-full px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <select
                    className="w-full px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Users Display */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers?.length && filteredUsers?.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers?.map((user: User) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelect(user.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                            {user.username.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}` 
                                : user.username}
                            </div>
                            {user.is_online && (
                              <div className="ml-2 h-2 w-2 bg-green-400 rounded-full"></div>
                            )}
                            {user.two_factor_enabled && (
                              <FiShield className="ml-2 h-4 w-4 text-green-500" title="2FA Enabled" />
                            )}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <FiMail className="mr-1 h-3 w-3" />
                            {user.email}
                          </div>
                          {user.department && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.department}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                        disabled={changeRoleMutation.isPending}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                            (user.status || 'active') === 'active'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}
                        >
                          {user.status || 'active'}
                        </span>
                        <button
                          type="button"
                          className={`ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 ${
                            (user.status || 'active') === 'active'
                              ? 'text-red-500 hover:text-red-700 dark:hover:text-red-400'
                              : 'text-green-500 hover:text-green-700 dark:hover:text-green-400'
                          }`}
                          onClick={() => handleStatusChange(
                            user.id,
                            (user.status || 'active') === 'active' ? 'inactive' : 'active'
                          )}
                          disabled={changeStatusMutation.isPending}
                        >
                          {(user.status || 'active') === 'active' ? (
                            <FiX className="h-4 w-4" />
                          ) : (
                            <FiCheck className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.last_login_at ? (
                        <div className="flex items-center">
                          <FiClock className="mr-1 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          {new Date(user.last_login_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          onClick={() => handleViewUser(user)}
                          title="View User"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteUserMutation.isPending}
                          title="Delete User"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers?.length === 0 && (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center">
                <FiUsers className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No users found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers?.map((user: User) => (
            <UserCard key={user.id} user={user} />
          ))}
          {filteredUsers?.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <div className="flex flex-col items-center">
                <FiUsers className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No users found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New User
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                role: formData.get('role'),
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                department: formData.get('department'),
                job_title: formData.get('job_title'),
              };
              
              createUserMutation.mutate(userData);
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    minLength={8}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select name="role" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={createUserMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit User: {currentUser.username}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                role: formData.get('role'),
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                department: formData.get('department'),
                job_title: formData.get('job_title'),
                status: formData.get('status'),
              };
              
              updateUserMutation.mutate({ userId: currentUser.id, userData });
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue={currentUser.first_name || ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue={currentUser.last_name || ''}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={currentUser.username}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={currentUser.email}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select name="role" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue={currentUser.role}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select name="status" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue={currentUser.status || 'active'}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={currentUser.department || ''}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={currentUser.job_title || ''}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditUserModalOpen(false);
                    setCurrentUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={updateUserMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {isViewUserModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                User Details: {currentUser.username}
              </h3>
              <button
                onClick={() => {
                  setIsViewUserModalOpen(false);
                  setCurrentUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* User Avatar and Basic Info */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 font-medium text-xl">
                    {currentUser.username.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {currentUser.first_name && currentUser.last_name 
                      ? `${currentUser.first_name} ${currentUser.last_name}` 
                      : currentUser.username}
                  </h4>
                  <p className="text-sm text-gray-600">{currentUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentUser.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {currentUser.role}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (currentUser.status || 'active') === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentUser.status || 'active'}
                    </span>

                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-3">Personal Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Username</label>
                    <p className="mt-1 text-sm text-gray-900">{currentUser.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{currentUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">First Name</label>
                    <p className="mt-1 text-sm text-gray-900">{currentUser.first_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Name</label>
                    <p className="mt-1 text-sm text-gray-900">{currentUser.last_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Department</label>
                    <p className="mt-1 text-sm text-gray-900">{currentUser.department || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Job Title</label>
                    <p className="mt-1 text-sm text-gray-900">{currentUser.job_title || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-3">Account Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Role</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{currentUser.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{currentUser.status || 'active'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(currentUser.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentUser.updated_at 
                        ? new Date(currentUser.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Never'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Login</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentUser.last_login_at 
                        ? new Date(currentUser.last_login_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Never'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Activity</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentUser.last_activity_at 
                        ? new Date(currentUser.last_activity_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>


            </div>
            
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsViewUserModalOpen(false);
                  setCurrentUser(null);
                  handleEditUser(currentUser);
                }}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FiEdit2 className="mr-2 h-4 w-4" />
                Edit User
              </button>
              <button
                onClick={() => {
                  setIsViewUserModalOpen(false);
                  setCurrentUser(null);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage; 