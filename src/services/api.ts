import axios from 'axios';

// Define interfaces for type safety
export interface WorkflowAction {
  status: string;
  label: string;
  description: string;
  variant: string;
  canPerform: boolean;
  reason?: string;
}

// Get the API URL from environment variables or use fallback
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Define standard API paths to avoid double requests
const API_PREFIX = '/api';

// Create axios instance
export const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is needed for cookies to be sent with requests
});

// Add a function to handle showing toast notifications for API errors
// This is a helper to be used in the API service
let showToastFunction: ((message: string, type: string) => void) | null = null;

// Function to set the toast handler
export const setToastHandler = (handler: (message: string, type: string) => void) => {
  showToastFunction = handler;
};

// Add request interceptor to include authentication token
api.interceptors.request.use(
  (config) => {
    // Since we're using HTTP-only cookies for authentication,
    // we don't need to manually add Authorization headers
    // The cookies will be sent automatically with withCredentials: true
    
    // Ensure all URLs have the proper API prefix
    if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http')) {
      config.url = `${API_PREFIX}${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Track rate limiting and add exponential backoff
let isRateLimited = false;
let rateLimitResetTime: number | null = null;

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // Handle different error statuses
    if (response) {
      switch (response.status) {
        case 429: // Rate limited
          const retryAfter = response.headers['retry-after'] || '60';
          const retrySeconds = parseInt(retryAfter, 10) || 60;
          rateLimitResetTime = Date.now() + (retrySeconds * 1000);
          isRateLimited = true;
          
          console.warn(`Rate limited. Retry after ${retrySeconds} seconds`);
          
          if (showToastFunction) {
            showToastFunction(`Rate limit exceeded. Please try again in ${retrySeconds} seconds.`, 'warning');
          }
          break;
          
        case 401: // Unauthorized
          // Don't automatically redirect for profile checks - let AuthContext handle it
          const isProfileCheck = error.config?.url?.includes('/users/profile');
          const isAuthCheck = error.config?.url?.includes('/auth/');
          
          if (!isProfileCheck && !isAuthCheck && window.location.pathname !== '/login') {
            if (showToastFunction) {
              showToastFunction('Session expired. Please log in again.', 'error');
            }
            window.location.href = '/login';
          }
          break;
        case 403: // Forbidden
          console.error('Access forbidden');
          // Show toast for forbidden action
          if (showToastFunction) {
            const errorMsg = response.data?.message || 'You do not have permission to perform this action';
            showToastFunction(errorMsg, 'error');
          }
          break;
        case 500: // Server error
          console.error('Server error');
          // Show toast for server error
          if (showToastFunction) {
            showToastFunction('A server error occurred. Please try again later.', 'error');
          }
          break;
        default:
          // Show generic error toast for other error codes
          if (showToastFunction && response.status >= 400) {
            const errorMsg = response.data?.message || 'An error occurred. Please try again.';
            showToastFunction(errorMsg, 'error');
          }
          break;
      }
    } else {
      // Network error or server down
      console.error('Network error or server not responding');
      if (showToastFunction) {
        showToastFunction('Network error. Please check your connection.', 'error');
      }
    }
    
    return Promise.reject(error);
  }
);

// Add request throttling and debounce helper
const pendingRequests = new Map();

export const debounce = (func: Function, wait: number) => {
  let timeout: number | null = null;
  
  return function(...args: any[]) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(later, wait);
  };
};

// Format query parameters to handle arrays properly
const formatQueryParams = (params: Record<string, any>): Record<string, any> => {
  const formattedParams: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    
    // Pass comma-separated values as is - backend expects this format
    formattedParams[key] = value;
  }
  
  return formattedParams;
};

// API functions for defects
export const defectApi = {
  // Get all defects with filters
  getDefects: async (filters: Record<string, any> = {}) => {
    try {
      // Check if we're rate limited
      if (isRateLimited && rateLimitResetTime && Date.now() < rateLimitResetTime) {
        const waitTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
        console.warn(`Still rate limited. Wait ${waitTime} more seconds.`);
        return { data: [], pagination: { total: 0, pages: 0, current: 1, perPage: 10 } };
      }
      
      console.log('Fetching defects with params:', filters);
      const formattedParams = formatQueryParams(filters);
      console.log('Formatted params:', formattedParams);
      const response = await api.get('/defects', { params: formattedParams });
      console.log('Defects response:', response.data);
      
      // Reset rate limiting if successful
      isRateLimited = false;
      rateLimitResetTime = null;
      
      // Process the data to ensure consistent structure for user information
      let defectData;
      
      if (response.data && !response.data.hasOwnProperty('data')) {
        // If API returns direct array, wrap it in expected format
        defectData = Array.isArray(response.data) ? response.data : [];
      } else {
        defectData = Array.isArray(response.data.data) ? response.data.data : [];
      }
      
      // Transform the data for consistent user fields
      const processedData = defectData.map((defect: any) => {
        // Return the defect with normalized user info
        // If creator_name/assignee_name exist, ensure created_by/assigned_to objects also exist
        return {
          ...defect,
          created_by: defect.created_by || (defect.creator_name ? { username: defect.creator_name } : null),
          assigned_to: defect.assigned_to || (defect.assignee_name ? { username: defect.assignee_name } : null)
        };
      });
      
      console.log('Processed defect data:', processedData);
      
      // Ensure we have a consistent return format
      if (response.data && !response.data.hasOwnProperty('data')) {
        return { 
          data: processedData, 
          pagination: { total: response.data.length || 0, pages: 1, current: 1, perPage: 10 } 
        };
      }
      
      return {
        ...response.data,
        data: processedData
      };
    } catch (error: any) {
      console.error('Error fetching defects:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        console.error('Response errors details:', error.response.data?.errors);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      // Return empty data instead of throwing to prevent UI from breaking
      return { data: [], pagination: { total: 0, pages: 0, current: 1, perPage: 10 } };
    }
  },
  
  // Get a single defect by ID
  getDefect: async (id: number) => {
    try {
      // Check if we're rate limited
      if (isRateLimited && rateLimitResetTime && Date.now() < rateLimitResetTime) {
        const waitTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
        console.warn(`Still rate limited. Wait ${waitTime} more seconds.`);
        return { data: null };
      }
      
      const response = await api.get(`/defects/${id}`);
      
      // Reset rate limiting if successful
      isRateLimited = false;
      rateLimitResetTime = null;
      
      // Log the response for debugging
      console.log(`Defect ${id} response:`, response.data);
      
      // Handle different response formats and ensure user data is consistent
      let defectData = null;
      
      if (response.data && response.data.hasOwnProperty('data')) {
        if (response.data.data.defect) {
          defectData = response.data.data.defect;
        } else {
          defectData = response.data.data;
        }
      } else {
        defectData = response.data;
      }
      
      // Process user data to ensure consistency
      if (defectData) {
        // Normalize user information
        const normalizedDefect = {
          ...defectData,
          created_by: defectData.created_by || (defectData.creator_name ? { username: defectData.creator_name } : null),
          assigned_to: defectData.assigned_to || (defectData.assignee_name ? { username: defectData.assignee_name } : null)
        };
        
        console.log('Normalized defect data:', normalizedDefect);
        
        return {
          data: normalizedDefect
        };
      }
      
      return { data: null };
    } catch (error: any) {
      console.error(`Error fetching defect ${id}:`, error);
      // Return null instead of throwing
      return { data: null };
    }
  },
  
  // Create a new defect
  createDefect: async (defectData: any) => {
    const response = await api.post('/defects', defectData);
    return response.data;
  },
  
  // Update an existing defect
  updateDefect: async (id: number, defectData: any) => {
    try {
      console.log(`Updating defect ${id} with data:`, defectData);
      
      // Check if we're rate limited
      if (isRateLimited && rateLimitResetTime && Date.now() < rateLimitResetTime) {
        const waitTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
        console.warn(`Still rate limited. Wait ${waitTime} more seconds.`);
        throw new Error(`Rate limit exceeded. Please try again in ${waitTime} seconds.`);
      }
      
      const response = await api.put(`/defects/${id}`, defectData);
      console.log(`Defect ${id} update response:`, response.data);
      
      // Reset rate limiting if successful
      isRateLimited = false;
      rateLimitResetTime = null;
      
      // Process and normalize the response data
      let defect;
      
      if (response.data && response.data.data?.defect) {
        defect = response.data.data.defect;
      } else if (response.data && response.data.data) {
        defect = response.data.data;
      } else if (response.data && response.data.defect) {
        defect = response.data.defect;
      } else {
        defect = response.data;
      }
      
      // Normalize user information in the same way as getDefect
      const normalizedDefect = {
        ...defect,
        created_by: defect.created_by || (defect.creator_name ? { username: defect.creator_name } : null),
        assigned_to: defect.assigned_to || (defect.assignee_name ? { username: defect.assignee_name } : null)
      };
      
      // Return standardized response format
      return { 
        status: 'success',
        data: normalizedDefect
      };
    } catch (error: any) {
      console.error(`Error updating defect ${id}:`, error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        
        // Handle rate limiting specifically
        if (error.response.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || '60';
          const retrySeconds = parseInt(retryAfter, 10) || 60;
          rateLimitResetTime = Date.now() + (retrySeconds * 1000);
          isRateLimited = true;
          
          throw new Error(`Rate limit exceeded. Please try again in ${retrySeconds} seconds.`);
        }
        
        // If there's a server error message, use it
        if (error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
      }
      
      // Generic error
      throw error;
    }
  },
  
  // Delete a defect
  deleteDefect: async (id: number) => {
    const response = await api.delete(`/defects/${id}`);
    return response.data;
  },

  // Upload attachments to a defect
  uploadAttachment: async (defectId: number, formData: FormData) => {
    try {
      console.log(`Uploading attachment to defect ${defectId}`);
      
      // Log the files being uploaded for debugging
      const files = formData.getAll('attachments');
      console.log(`Uploading ${files.length} files:`, files.map((file: any) => ({
        name: file.name,
        size: file.size,
        type: file.type
      })));
      
      const response = await api.post(
        `/defects/${defectId}/attachments`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('Attachment upload response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error uploading attachment to defect ${defectId}:`, error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        
        // Provide more specific error messages
        if (error.response.status === 413) {
          throw new Error('File too large. Please choose a smaller file.');
        } else if (error.response.status === 415) {
          throw new Error('File type not supported. Please choose a different file.');
        } else if (error.response.data?.message) {
          throw new Error(error.response.data.message);
        }
      }
      
      throw new Error('Failed to upload attachment. Please try again.');
    }
  },

  // Delete an attachment
  deleteAttachment: async (defectId: number, attachmentId: number) => {
    const response = await api.delete(
      `/defects/attachments/${attachmentId}`
    );
    return response.data;
  },

  // Get defect version history
  getDefectVersions: async (defectId: number) => {
    try {
      console.log(`Fetching version history for defect ${defectId}`);
      
      // Check if we're rate limited
      if (isRateLimited && rateLimitResetTime && Date.now() < rateLimitResetTime) {
        const waitTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
        console.warn(`Still rate limited. Wait ${waitTime} more seconds.`);
        return { versions: [] };
      }
      
      const response = await api.get(`/defects/${defectId}/versions`);
      console.log(`Version history response:`, response.data);
      
      // Reset rate limiting if successful
      isRateLimited = false;
      rateLimitResetTime = null;
      
      // Handle different response formats
      if (response.data && response.data.data && response.data.data.versions) {
        // API returns {status: "success", data: {versions: [...]}}
        return response.data.data;
      } else if (response.data && response.data.hasOwnProperty('versions')) {
        // API returns {versions: [...]}
        return response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // API returns {data: [...]}
        return { versions: response.data.data };
      } else if (Array.isArray(response.data)) {
        // If API returns array directly, wrap it
        return {
          versions: response.data.map((version, index) => ({
            ...version,
            id: version.id || (response.data.length - index),
            version: version.version || `v${response.data.length - index}`,
            timestamp: version.created_at || version.timestamp || new Date(),
            user: version.user || { id: 1, username: version.username || 'Unknown' },
            changes: version.changes || []
          }))
        };
      }
      
      // Return empty versions array as fallback
      return { versions: [] };
    } catch (error) {
      console.error(`Error fetching version history for defect ${defectId}:`, error);
      return { versions: [] };
    }
  },

  // Get workflow actions for a defect
  getWorkflowActions: async (defectId: number) => {
    try {
      console.log(`Fetching workflow actions for defect ${defectId}`);
      
      // Check if we're rate limited
      if (isRateLimited && rateLimitResetTime && Date.now() < rateLimitResetTime) {
        const waitTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
        console.warn(`Still rate limited. Wait ${waitTime} more seconds.`);
        return { actions: [] };
      }
      
      const response = await api.get(`/defects/${defectId}/workflow-actions`);
      console.log(`Workflow actions response:`, response.data);
      
      // Reset rate limiting if successful
      isRateLimited = false;
      rateLimitResetTime = null;
      
      // Handle different response formats
      if (response.data && response.data.data && response.data.data.actions) {
        return response.data.data.actions;
      } else if (response.data && response.data.actions) {
        return response.data.actions;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Return empty actions array as fallback
      return [];
    } catch (error) {
      console.error(`Error fetching workflow actions for defect ${defectId}:`, error);
      return [];
    }
  },
};

// API functions for comments
export const commentApi = {
  // Get comments for a defect
  getComments: async (defectId: number) => {
    try {
      console.log(`Fetching comments for defect ${defectId}`);
      
      // Check if we're rate limited
      if (isRateLimited && rateLimitResetTime && Date.now() < rateLimitResetTime) {
        const waitTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
        console.warn(`Still rate limited. Wait ${waitTime} more seconds.`);
        return { data: [] };
      }
      
      // Use standardized endpoint (interceptor will add prefix)
      const response = await api.get(`/defects/${defectId}/comments`);
      
      // Reset rate limiting if successful
      isRateLimited = false;
      rateLimitResetTime = null;
      
      console.log(`Comments response:`, response.data);
      
      // Handle different response formats
      if (response.data && response.data.hasOwnProperty('data')) {
        // API returns {data: [...]}
        return response.data;
      } else if (Array.isArray(response.data)) {
        // API returns direct array
        return {
          data: response.data
        };
      }
      
      // Return empty array as fallback
      return { data: [] };
    } catch (error) {
      console.error(`Error fetching comments for defect ${defectId}:`, error);
      return { data: [] };
    }
  },
  
  // Add a comment to a defect
  addComment: async (defectId: number, content: string, userId?: number) => {
    try {
      // Log the payload for debugging
      console.log(`Adding comment to defect ${defectId} with content:`, content);
      
      // Validate defectId is a proper number
      const parsedDefectId = Number(defectId);
      if (isNaN(parsedDefectId)) {
        console.error('Invalid defect ID:', defectId);
        throw new Error('Invalid defect ID. Please reload the page and try again.');
      }
      
      // Making sure the request payload matches what the backend expects
      const payload = { 
        content,
        defect_id: parsedDefectId,
        user_id: userId
      };
      
      console.log('Comment payload:', JSON.stringify(payload));
      
      // Use standardized endpoint (interceptor will add prefix)
      const response = await api.post(`/defects/${parsedDefectId}/comments`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Comment added successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error adding comment to defect ${defectId}:`, error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        
        // If there's a server validation error, return the message
        if (error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
      }
      
      // Generic error if no specific message available
      throw new Error('Failed to add comment. Please try again.');
    }
  },
  
  // Update a comment
  updateComment: async (defectId: number, commentId: number, content: string) => {
    try {
      const response = await api.put(`/defects/${defectId}/comments/${commentId}`, { content });
      return response.data;
    } catch (error) {
      console.error(`Error updating comment ${commentId} for defect ${defectId}:`, error);
      return null;
    }
  },
  
  // Delete a comment
  deleteComment: async (defectId: number, commentId: number) => {
    try {
      const response = await api.delete(`/defects/${defectId}/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting comment ${commentId} for defect ${defectId}:`, error);
      return null;
    }
  },

  // Upload attachments for a comment
  uploadAttachments: async (commentId: number, files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await api.post(`/comments/${commentId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error uploading attachments for comment ${commentId}:`, error);
      throw error;
    }
  },

  // Delete an attachment from a comment
  deleteAttachment: async (commentId: number, attachmentId: number) => {
    try {
      const response = await api.delete(`/comments/${commentId}/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting attachment ${attachmentId} from comment ${commentId}:`, error);
      throw error;
    }
  },
};

// API functions for users
export const userApi = {
  // Get all users
  getUsers: async () => {
    try {
      console.log('Fetching users list');
      
      // Check if we're rate limited
      if (isRateLimited && rateLimitResetTime && Date.now() < rateLimitResetTime) {
        const waitTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
        console.warn(`Still rate limited. Wait ${waitTime} more seconds.`);
        return { data: [] };
      }
      
      const response = await api.get('/users');
      console.log('Users response:', response.data);
      
      // Reset rate limiting if successful
      isRateLimited = false;
      rateLimitResetTime = null;
      
      // Handle different response formats
      if (response.data && response.data.data && response.data.data.users) {
        // API returns {status: "success", data: {users: [...]}}
        return {
          data: response.data.data.users
        };
      } else if (response.data && response.data.hasOwnProperty('data') && Array.isArray(response.data.data)) {
        // API returns {data: [...]}
        return response.data;
      } else if (response.data && response.data.hasOwnProperty('users')) {
        // API returns {users: [...]}
        return {
          data: response.data.users
        };
      } else if (Array.isArray(response.data)) {
        // API returns direct array
        return {
          data: response.data
        };
      }
      
      // If we can't determine the structure, return the raw response
      console.warn('Unexpected users response format:', response.data);
      return { data: [] };
    } catch (error: any) {
      console.error('Error fetching users:', error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      // Return empty data instead of throwing to prevent UI from breaking
      return { data: [] };
    }
  },
  
  // Get a single user by ID
  getUser: async (id: number) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return { data: null };
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  // Update user profile
  updateProfile: async (userData: any) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Two-Factor Authentication
  enableTwoFactor: async () => {
    const response = await api.post('/users/two-factor/enable');
    return response.data;
  },

  verifyTwoFactor: async (token: string) => {
    const response = await api.post('/users/two-factor/verify', { token });
    return response.data;
  },

  disableTwoFactor: async (password: string, token: string) => {
    const response = await api.post('/users/two-factor/disable', { password, token });
    return response.data;
  },

  // Activity Logs
  getActivityLogs: async (page = 1, limit = 20) => {
    const response = await api.get('/users/activity-logs', {
      params: { page, limit }
    });
    return response.data;
  },

  // Session Management
  getSessions: async () => {
    const response = await api.get('/users/sessions');
    return response.data;
  },

  revokeSession: async (sessionId: number) => {
    const response = await api.post(`/users/sessions/${sessionId}/revoke`);
    return response.data;
  },

  // User Preferences
  updatePreferences: async (preferences: any) => {
    const response = await api.put('/users/preferences', preferences);
    return response.data;
  },

  // Teams
  getUserTeams: async () => {
    const response = await api.get('/users/teams');
    return response.data;
  },

  // Change user password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { 
      currentPassword, 
      newPassword 
    });
    return response.data;
  },

  // Create a new user (Admin only)
  createUser: async (userData: any) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Update a user (Admin only)
  updateUser: async (id: number, userData: any) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating user:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Delete a user (Admin only)
  deleteUser: async (id: number) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Update user role (Admin only)
  updateUserRole: async (userId: number, role: 'user' | 'admin') => {
    try {
      const response = await api.put(`/users/${userId}/role`, { role });
      return response.data;
    } catch (error: any) {
      console.error('Error updating user role:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Update user status (Admin only)
  updateUserStatus: async (userId: number, status: 'active' | 'inactive') => {
    try {
      const response = await api.put(`/users/${userId}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Error updating user status:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
};

// API functions for settings
export const settingsApi = {
  // System Settings
  getSystemSettings: async () => {
    try {
      const response = await api.get('/settings/system');
      return response.data;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  },

  updateSystemSetting: async (settingData: any) => {
    try {
      const response = await api.put('/settings/system', settingData);
      return response.data;
    } catch (error) {
      console.error('Error updating system setting:', error);
      throw error;
    }
  },

  getSettingsByCategory: async (category: string) => {
    try {
      const response = await api.get(`/settings/category/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching settings for category ${category}:`, error);
      throw error;
    }
  },

  // Application Configuration
  getAppConfig: async () => {
    try {
      const response = await api.get('/settings/app-config');
      return response.data;
    } catch (error) {
      console.error('Error fetching app config:', error);
      throw error;
    }
  },

  updateAppConfig: async (config: any) => {
    try {
      const response = await api.put('/settings/app-config', config);
      return response.data;
    } catch (error) {
      console.error('Error updating app config:', error);
      throw error;
    }
  },

  // Security Settings
  getSecuritySettings: async () => {
    try {
      const response = await api.get('/settings/security');
      return response.data;
    } catch (error) {
      console.error('Error fetching security settings:', error);
      throw error;
    }
  },

  updateSecuritySettings: async (settings: any) => {
    try {
      const response = await api.put('/settings/security', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  },

  // User Preferences
  getUserPreferences: async () => {
    try {
      const response = await api.get('/users/settings/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  },

  updateUserPreferences: async (preferences: any) => {
    try {
      const response = await api.put('/users/settings/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  },

  // Notification Settings
  getNotificationSettings: async () => {
    try {
      const response = await api.get('/users/settings/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  },

  updateNotificationSettings: async (settings: any) => {
    try {
      const response = await api.put('/users/settings/notifications', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  // Settings Management
  resetToDefaults: async (category?: string) => {
    try {
      const response = await api.post('/settings/reset', { category });
      return response.data;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  },

  exportSettings: async () => {
    try {
      const response = await api.get('/settings/export');
      return response.data;
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  },

  importSettings: async (settingsData: any) => {
    try {
      const response = await api.post('/settings/import', settingsData);
      return response.data;
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  },
};

// API functions for admin operations
export const adminApi = {
  // Get deleted defects (Admin only)
  getDeletedDefects: async () => {
    try {
      const response = await api.get('/admin/deleted-defects');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching deleted defects:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Restore a deleted defect (Admin only)
  restoreDefect: async (defectId: number) => {
    try {
      const response = await api.post(`/admin/restore-defect/${defectId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error restoring defect:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Permanently delete a defect (Admin only)
  permanentlyDeleteDefect: async (defectId: number) => {
    try {
      const response = await api.delete(`/admin/permanently-delete-defect/${defectId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error permanently deleting defect:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
}; 