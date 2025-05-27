// Mock API Service for DTS Demo
import { 
  mockUsers, 
  mockDefects, 
  mockComments, 
  mockSolutions, 
  mockProjects,
  mockVersionHistory,
  mockActivityLogs,
  mockDashboardStats,
  mockReports,
  currentUser,
  getUserById,
  filterDefects
} from '../data/mockData';
import type {
  MockUser,
  MockDefect,
  MockComment,
  MockSolution,
  MockVersionHistory,
  MockActivityLog,
  MockDashboardStats,
  MockReport
} from '../data/mockData';

// Simulate API delay for realistic experience
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Mock toast handler (will be set by the app)
let showToastFunction: ((message: string, type: string) => void) | null = null;

export const setToastHandler = (handler: (message: string, type: string) => void) => {
  showToastFunction = handler;
};

// Helper to generate new IDs
let nextDefectId = Math.max(...mockDefects.map(d => d.id)) + 1;
let nextCommentId = Math.max(...mockComments.map(c => c.id)) + 1;
let nextSolutionId = Math.max(...mockSolutions.map(s => s.id)) + 1;

// Mock authentication API
export const authApi = {
  // Login endpoint
  login: async (username: string, password: string) => {
    await delay();
    
    console.log(`Mock: Login attempt for username: ${username}`);
    
    // In demo mode, accept any credentials and return the current user
    return {
      data: {
        user: {
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          role: currentUser.role,
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
          is_active: currentUser.is_active,
          avatar: currentUser.avatar,
          created_at: currentUser.created_at,
          updated_at: currentUser.updated_at,
          last_login: new Date().toISOString(),
          preferences: currentUser.preferences
        },
        token: 'mock-jwt-token-' + Date.now(),
        message: 'Login successful'
      }
    };
  },

  // Logout endpoint
  logout: async () => {
    await delay();
    
    console.log('Mock: User logout');
    
    return {
      data: {
        message: 'Logout successful'
      }
    };
  },

  // Check authentication status
  checkAuth: async () => {
    await delay();
    
    console.log('Mock: Checking authentication status');
    
    return {
      data: {
        user: currentUser,
        authenticated: true
      }
    };
  }
};

// Mock defect API
export const defectApi = {
  // Get all defects with filters
  getDefects: async (filters: Record<string, any> = {}) => {
    await delay();
    
    console.log('Mock: Fetching defects with params:', filters);
    
    const filtered = filterDefects(filters);
    
    // Add user objects to defects
    const processedData = filtered.map((defect: MockDefect) => ({
      ...defect,
      created_by: getUserById(defect.created_by) || { username: defect.creator_name || 'Unknown' },
      assigned_to: defect.assigned_to ? getUserById(defect.assigned_to) || { username: defect.assignee_name || 'Unassigned' } : null
    }));

    const total = filtered.length;
    const perPage = parseInt(filters.limit) || 10;
    const pages = Math.ceil(total / perPage);
    const current = parseInt(filters.page) || 1;

    return {
      data: processedData,
      pagination: {
        total,
        pages,
        current,
        perPage
      }
    };
  },

  // Get a single defect by ID
  getDefect: async (id: number) => {
    await delay();
    
    console.log(`Mock: Fetching defect ${id}`);
    
    const defect = mockDefects.find(d => d.id === id);
    
    if (!defect) {
      return { data: null };
    }

    // Add user objects
    const normalizedDefect = {
      ...defect,
      created_by: getUserById(defect.created_by) || { username: defect.creator_name || 'Unknown' },
      assigned_to: defect.assigned_to ? getUserById(defect.assigned_to) || { username: defect.assignee_name || 'Unassigned' } : null
    };

    return { data: normalizedDefect };
  },

  // Create a new defect
  createDefect: async (defectData: any) => {
    await delay();
    
    console.log('Mock: Creating defect:', defectData);
    
    const newDefect: MockDefect = {
      id: nextDefectId++,
      title: defectData.title,
      description: defectData.description,
      status: defectData.status || 'open',
      severity: defectData.severity || 'medium',
      priority: defectData.priority || 'medium',
      type: defectData.type || 'bug',
      project_id: defectData.project_id || 1,
      created_by: currentUser.id,
      assigned_to: defectData.assignedTo || defectData.assigned_to,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: defectData.tags || [],
      attachments: [],
      solutions: [],
      creator_name: currentUser.username,
      assignee_name: defectData.assignedTo ? getUserById(defectData.assignedTo)?.username : undefined
    };
    
    mockDefects.push(newDefect);

    // Create initial version history entry
    const initialVersion: MockVersionHistory = {
      id: Math.max(...mockVersionHistory.map(v => v.id), 0) + 1,
      defect_id: newDefect.id,
      version: 'v1',
      timestamp: new Date().toISOString(),
      changed_by: currentUser.id,
      changed_by_name: currentUser.username,
      changes: ['Defect created'],
      old_values: {},
      new_values: {
        title: newDefect.title,
        description: newDefect.description,
        status: newDefect.status,
        severity: newDefect.severity,
        assigned_to: newDefect.assigned_to,
        assignee_name: newDefect.assignee_name,
        tags: newDefect.tags || []
      }
    };

    mockVersionHistory.push(initialVersion);
    
    if (showToastFunction) {
      showToastFunction('Defect created successfully!', 'success');
    }
    
    return { 
      status: 'success',
      data: newDefect 
    };
  },

  // Update a defect
  updateDefect: async (id: number, defectData: any) => {
    await delay();
    
    console.log(`Mock: Updating defect ${id}:`, defectData);
    
    const defectIndex = mockDefects.findIndex(d => d.id === id);
    
    if (defectIndex === -1) {
      throw new Error('Defect not found');
    }

    const oldDefect = { ...mockDefects[defectIndex] };
    
    // Update the defect
    mockDefects[defectIndex] = {
      ...mockDefects[defectIndex],
      ...defectData,
      updated_at: new Date().toISOString()
    };

    // Track changes for version history
    const changes = [];
    const fieldsToTrack: (keyof MockDefect)[] = ['title', 'description', 'status', 'severity', 'assigned_to'];
    
    for (const field of fieldsToTrack) {
      if (defectData[field] !== undefined && oldDefect[field] !== defectData[field]) {
        changes.push(`Changed ${field} from "${oldDefect[field] || 'empty'}" to "${defectData[field] || 'empty'}"`);
      }
    }

    // Create version history entry if there are changes
    if (changes.length > 0) {
      const existingVersions = mockVersionHistory.filter(v => v.defect_id === id);
      const nextVersionNumber = existingVersions.length + 1;

      const versionEntry: MockVersionHistory = {
        id: Math.max(...mockVersionHistory.map(v => v.id), 0) + 1,
        defect_id: id,
        version: `v${nextVersionNumber}`,
        timestamp: new Date().toISOString(),
        changed_by: currentUser.id,
        changed_by_name: currentUser.username,
        changes: changes,
        old_values: {
          title: oldDefect.title,
          description: oldDefect.description,
          status: oldDefect.status,
          severity: oldDefect.severity,
          assigned_to: oldDefect.assigned_to,
          assignee_name: oldDefect.assignee_name,
          tags: oldDefect.tags || []
        },
        new_values: {
          title: mockDefects[defectIndex].title,
          description: mockDefects[defectIndex].description,
          status: mockDefects[defectIndex].status,
          severity: mockDefects[defectIndex].severity,
          assigned_to: mockDefects[defectIndex].assigned_to,
          assignee_name: mockDefects[defectIndex].assignee_name,
          tags: mockDefects[defectIndex].tags || []
        }
      };

      mockVersionHistory.push(versionEntry);
    }

    if (showToastFunction) {
      showToastFunction('Defect updated successfully!', 'success');
    }

    return { 
      status: 'success',
      data: mockDefects[defectIndex] 
    };
  },

  // Delete a defect
  deleteDefect: async (id: number) => {
    await delay();
    
    console.log(`Mock: Deleting defect ${id}`);
    
    const defectIndex = mockDefects.findIndex(d => d.id === id);
    
    if (defectIndex === -1) {
      throw new Error('Defect not found');
    }

    mockDefects.splice(defectIndex, 1);

    if (showToastFunction) {
      showToastFunction('Defect deleted successfully!', 'success');
    }

    return { status: 'success' };
  },

  // Get defect version history
  getDefectVersions: async (defectId: number) => {
    await delay();
    
    console.log(`Mock: Fetching version history for defect ${defectId}`);
    
    // Get version history for this defect
    const versions = mockVersionHistory
      .filter(v => v.defect_id === defectId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { data: versions };
  },

  // Create a new version when defect is updated
  createDefectVersion: async (defectId: number, changes: any, userId: number = currentUser.id) => {
    await delay();
    
    console.log(`Mock: Creating version for defect ${defectId}`, changes);
    
    const defect = mockDefects.find(d => d.id === defectId);
    if (!defect) {
      throw new Error('Defect not found');
    }

    const existingVersions = mockVersionHistory.filter(v => v.defect_id === defectId);
    const nextVersionNumber = existingVersions.length + 1;

    const newVersion: MockVersionHistory = {
      id: Math.max(...mockVersionHistory.map(v => v.id)) + 1,
      defect_id: defectId,
      version: `v${nextVersionNumber}`,
      timestamp: new Date().toISOString(),
      changed_by: userId,
      changed_by_name: getUserById(userId)?.username || 'Unknown',
      changes: Array.isArray(changes) ? changes : [changes],
      old_values: {},
      new_values: {
        title: defect.title,
        description: defect.description,
        status: defect.status,
        severity: defect.severity,
        assigned_to: defect.assigned_to,
        assignee_name: defect.assignee_name,
        tags: defect.tags || []
      }
    };

    mockVersionHistory.push(newVersion);
    
    return { data: newVersion };
  },

  // Compare two versions
  compareVersions: async (defectId: number, fromVersionId: number, toVersionId: number) => {
    await delay();
    
    console.log(`Mock: Comparing versions ${fromVersionId} and ${toVersionId} for defect ${defectId}`);
    
    const fromVersion = mockVersionHistory.find(v => v.id === fromVersionId);
    const toVersion = mockVersionHistory.find(v => v.id === toVersionId);
    
    if (!fromVersion || !toVersion) {
      throw new Error('Version not found');
    }

    // Calculate differences
    const differences = [];
    const fields = ['title', 'description', 'status', 'severity', 'assignee_name'];
    
    for (const field of fields) {
      const oldValue = fromVersion.new_values?.[field];
      const newValue = toVersion.new_values?.[field];
      
      if (oldValue !== newValue) {
        differences.push({
          field,
          old_value: oldValue,
          new_value: newValue
        });
      }
    }

    return {
      data: {
        from_version: fromVersion,
        to_version: toVersion,
        differences
      }
    };
  },

  // Restore defect to a specific version
  restoreToVersion: async (defectId: number, versionId: number) => {
    await delay();
    
    console.log(`Mock: Restoring defect ${defectId} to version ${versionId}`);
    
    const version = mockVersionHistory.find(v => v.id === versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    const defectIndex = mockDefects.findIndex(d => d.id === defectId);
    if (defectIndex === -1) {
      throw new Error('Defect not found');
    }

    // Create a backup of current state before restoring
    const currentDefect = mockDefects[defectIndex];
    const existingVersions = mockVersionHistory.filter(v => v.defect_id === defectId);
    const nextVersionNumber = existingVersions.length + 1;

    const backupVersion: MockVersionHistory = {
      id: Math.max(...mockVersionHistory.map(v => v.id)) + 1,
      defect_id: defectId,
      version: `v${nextVersionNumber}`,
      timestamp: new Date().toISOString(),
      changed_by: currentUser.id,
      changed_by_name: currentUser.username,
      changes: [`Restored to ${version.version}`],
      old_values: {
        title: currentDefect.title,
        description: currentDefect.description,
        status: currentDefect.status,
        severity: currentDefect.severity,
        assigned_to: currentDefect.assigned_to,
        assignee_name: currentDefect.assignee_name,
        tags: currentDefect.tags || []
      },
      new_values: version.new_values
    };

    mockVersionHistory.push(backupVersion);

    // Restore defect to the specified version
    if (version.new_values) {
      mockDefects[defectIndex] = {
        ...currentDefect,
        title: version.new_values.title || currentDefect.title,
        description: version.new_values.description || currentDefect.description,
        status: version.new_values.status || currentDefect.status,
        severity: version.new_values.severity || currentDefect.severity,
        assigned_to: version.new_values.assigned_to || currentDefect.assigned_to,
        assignee_name: version.new_values.assignee_name || currentDefect.assignee_name,
        tags: version.new_values.tags || currentDefect.tags,
        updated_at: new Date().toISOString()
      };
    }

    if (showToastFunction) {
      showToastFunction(`Defect restored to ${version.version}`, 'success');
    }

    return { data: mockDefects[defectIndex] };
  },

  // Get workflow actions for a defect
  getWorkflowActions: async (defectId: number) => {
    await delay();
    
    console.log(`Mock: Fetching workflow actions for defect ${defectId}`);
    
    const defect = mockDefects.find(d => d.id === defectId);
    
    if (!defect) {
      return [];
    }

    // Generate workflow actions based on current status
    const actions = [];
    
    switch (defect.status) {
      case 'open':
        actions.push(
          { status: 'in_progress', label: 'Start Work', description: 'Begin working on this defect', variant: 'primary', canPerform: true },
          { status: 'resolved', label: 'Mark Resolved', description: 'Mark as resolved', variant: 'success', canPerform: true },
          { status: 'closed', label: 'Close', description: 'Close this defect', variant: 'secondary', canPerform: true }
        );
        break;
      case 'in_progress':
        actions.push(
          { status: 'resolved', label: 'Mark Resolved', description: 'Mark as resolved', variant: 'success', canPerform: true },
          { status: 'open', label: 'Reopen', description: 'Move back to open', variant: 'warning', canPerform: true }
        );
        break;
      case 'resolved':
        actions.push(
          { status: 'closed', label: 'Close', description: 'Close this defect', variant: 'secondary', canPerform: true },
          { status: 'reopened', label: 'Reopen', description: 'Reopen this defect', variant: 'warning', canPerform: true }
        );
        break;
      case 'closed':
        actions.push(
          { status: 'reopened', label: 'Reopen', description: 'Reopen this defect', variant: 'warning', canPerform: true }
        );
        break;
    }

    return actions;
  },

  // Upload attachment to a defect
  uploadAttachment: async (defectId: number, formDataOrFile: FormData | File) => {
    await delay(1000); // Longer delay for file upload simulation
    
    console.log(`Mock: Uploading attachment to defect ${defectId}`);
    
    let files: File[] = [];
    
    if (formDataOrFile instanceof FormData) {
      // Extract files from FormData
      const attachments = formDataOrFile.getAll('attachments') as File[];
      files = attachments;
    } else {
      // Single file
      files = [formDataOrFile];
    }
    
    const attachments = files.map((file, index) => ({
      id: Date.now() + index,
      defect_id: defectId,
      url: `https://example.com/uploads/${file.name}`,
      filename: file.name,
      size: file.size,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Add attachments to the defect
    const defectIndex = mockDefects.findIndex(d => d.id === defectId);
    if (defectIndex !== -1) {
      if (!mockDefects[defectIndex].attachments) {
        mockDefects[defectIndex].attachments = [];
      }
      mockDefects[defectIndex].attachments.push(...attachments);
    }

    if (showToastFunction) {
      showToastFunction(`${files.length} attachment(s) uploaded successfully!`, 'success');
    }

    return {
      status: 'success',
      data: files.length === 1 ? attachments[0] : attachments
    };
  },

  // Delete attachment from a defect
  deleteAttachment: async (defectId: number, attachmentId: number) => {
    await delay();
    
    console.log(`Mock: Deleting attachment ${attachmentId} from defect ${defectId}`);
    
    const defectIndex = mockDefects.findIndex(d => d.id === defectId);
    
    if (defectIndex !== -1 && mockDefects[defectIndex].attachments) {
      mockDefects[defectIndex].attachments = mockDefects[defectIndex].attachments.filter(
        a => a.id !== attachmentId
      );
    }

    if (showToastFunction) {
      showToastFunction('Attachment deleted successfully!', 'success');
    }

    return { status: 'success' };
  },
};

// Mock comment API
export const commentApi = {
  // Get comments for a defect
  getComments: async (defectId: number) => {
    await delay();
    
    console.log(`Mock: Fetching comments for defect ${defectId}`);
    
    const comments = mockComments.filter(c => c.defect_id === defectId);
    
    return { data: comments };
  },

  // Add a comment to a defect (matching real API signature)
  addComment: async (defectId: number, content: string, userId?: number) => {
    await delay();
    
    console.log(`Mock: Adding comment to defect ${defectId}:`, content);
    
    const newComment: MockComment = {
      id: nextCommentId++,
      defect_id: defectId,
      user_id: userId || currentUser.id,
      content: content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: currentUser,
      attachments: []
    };

    mockComments.push(newComment);

    // Log activity
    activityApi.logActivity({
      action: 'ADD_COMMENT',
      entity_type: 'comment',
      entity_id: newComment.id,
      details: `Added comment to defect #${defectId}`
    });

    if (showToastFunction) {
      showToastFunction('Comment added successfully!', 'success');
    }

    return {
      status: 'success',
      data: {
        comment: newComment
      }
    };
  },

  // Update a comment (matching real API signature)
  updateComment: async (defectId: number, commentId: number, content: string) => {
    await delay();
    
    console.log(`Mock: Updating comment ${commentId}:`, content);
    
    const commentIndex = mockComments.findIndex(c => c.id === commentId);
    
    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    mockComments[commentIndex] = {
      ...mockComments[commentIndex],
      content: content,
      updated_at: new Date().toISOString()
    };

    // Log activity
    activityApi.logActivity({
      action: 'UPDATE_COMMENT',
      entity_type: 'comment',
      entity_id: commentId,
      details: `Updated comment #${commentId}`
    });

    if (showToastFunction) {
      showToastFunction('Comment updated successfully!', 'success');
    }

    return {
      status: 'success',
      data: mockComments[commentIndex]
    };
  },

  // Delete a comment (matching real API signature)
  deleteComment: async (defectId: number, commentId: number) => {
    await delay();
    
    console.log(`Mock: Deleting comment ${commentId}`);
    
    const commentIndex = mockComments.findIndex(c => c.id === commentId);
    
    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    const deletedComment = mockComments[commentIndex];
    mockComments.splice(commentIndex, 1);

    // Log activity
    activityApi.logActivity({
      action: 'DELETE_COMMENT',
      entity_type: 'comment',
      entity_id: commentId,
      details: `Deleted comment from defect #${deletedComment.defect_id}`
    });

    if (showToastFunction) {
      showToastFunction('Comment deleted successfully!', 'success');
    }

    return { status: 'success' };
  },

  // Upload attachments for a comment (matching real API signature)
  uploadAttachments: async (commentId: number, files: File[]) => {
    await delay(1000);
    
    console.log(`Mock: Uploading ${files.length} attachments to comment ${commentId}`);
    
    const attachments = files.map((file, index) => ({
      id: Date.now() + index,
      comment_id: commentId,
      filename: file.name,
      original_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_path: `https://example.com/uploads/${file.name}`,
      url: `https://example.com/uploads/${file.name}`,
      size: file.size,
      created_at: new Date().toISOString(),
      created_by: currentUser.id
    }));

    // Add attachments to comment
    const commentIndex = mockComments.findIndex(c => c.id === commentId);
    if (commentIndex !== -1) {
      if (!mockComments[commentIndex].attachments) {
        mockComments[commentIndex].attachments = [];
      }
      mockComments[commentIndex].attachments!.push(...attachments);
    }

    if (showToastFunction) {
      showToastFunction(`${files.length} attachment(s) uploaded successfully!`, 'success');
    }

    return { data: attachments };
  },

  // Upload single attachment to a comment (for compatibility)
  uploadAttachment: async (commentId: number, file: File) => {
    const result = await commentApi.uploadAttachments(commentId, [file]);
    return { data: result.data[0] };
  },

  // Delete attachment from a comment (matching real API signature)
  deleteAttachment: async (commentId: number, attachmentId: number) => {
    await delay();
    
    console.log(`Mock: Deleting attachment ${attachmentId} from comment ${commentId}`);
    
    const commentIndex = mockComments.findIndex(c => c.id === commentId);
    
    if (commentIndex !== -1 && mockComments[commentIndex].attachments) {
      mockComments[commentIndex].attachments = mockComments[commentIndex].attachments!.filter(
        a => a.id !== attachmentId
      );
    }

    if (showToastFunction) {
      showToastFunction('Attachment deleted successfully!', 'success');
    }

    return { status: 'success' };
  }
};

// Mock user API
export const userApi = {
  // Get all users
  getUsers: async () => {
    await delay();
    
    console.log('Mock: Fetching users list');
    
    return { data: mockUsers };
  },

  // Get a single user by ID
  getUser: async (id: number) => {
    await delay();
    
    const user = mockUsers.find(u => u.id === id);
    return { data: user || null };
  },

  // Get current user profile
  getProfile: async () => {
    await delay();
    
    return { data: currentUser };
  },

  // Update user profile
  updateProfile: async (userData: any) => {
    await delay();
    
    console.log('Mock: Updating user profile:', userData);
    
    // In a real app, this would update the current user
    Object.assign(currentUser, userData, { updated_at: new Date().toISOString() });

    if (showToastFunction) {
      showToastFunction('Profile updated successfully!', 'success');
    }

    return {
      status: 'success',
      data: currentUser
    };
  },

  // Upload avatar
  uploadAvatar: async (file: File) => {
    await delay(1000); // Longer delay for file upload simulation
    
    console.log('Mock: Uploading avatar:', file.name);
    
    // Simulate avatar upload
    const avatarUrl = `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&t=${Date.now()}`;
    currentUser.avatar = avatarUrl;

    if (showToastFunction) {
      showToastFunction('Avatar uploaded successfully!', 'success');
    }

    return {
      status: 'success',
      data: { avatar_url: avatarUrl }
    };
  },

  // Two-Factor Authentication
  enableTwoFactor: async () => {
    await delay();
    
    console.log('Mock: Enabling two-factor authentication');
    
    return {
      status: 'success',
      data: {
        qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        secret: 'JBSWY3DPEHPK3PXP'
      }
    };
  },

  verifyTwoFactor: async (token: string) => {
    await delay();
    
    console.log('Mock: Verifying two-factor token:', token);
    
    // Simulate verification (accept any 6-digit code)
    if (token.length === 6) {
      if (showToastFunction) {
        showToastFunction('Two-factor authentication enabled!', 'success');
      }
      return { status: 'success' };
    } else {
      throw new Error('Invalid token');
    }
  },

  disableTwoFactor: async (password: string, token: string) => {
    await delay();
    
    console.log('Mock: Disabling two-factor authentication');
    
    if (showToastFunction) {
      showToastFunction('Two-factor authentication disabled!', 'success');
    }

    return { status: 'success' };
  },

  // Activity Logs
  getActivityLogs: async (page = 1, limit = 20) => {
    await delay();
    
    console.log(`Mock: Fetching activity logs (page ${page}, limit ${limit})`);
    
    const logs = [
      { id: 1, action: 'Login', timestamp: '2024-05-27T10:15:00Z', ip: '192.168.1.100' },
      { id: 2, action: 'Updated defect #2', timestamp: '2024-05-27T09:30:00Z', ip: '192.168.1.100' },
      { id: 3, action: 'Created defect #8', timestamp: '2024-05-27T09:00:00Z', ip: '192.168.1.100' },
      { id: 4, action: 'Login', timestamp: '2024-05-26T17:45:00Z', ip: '192.168.1.100' },
    ];

    return {
      data: logs,
      pagination: { total: logs.length, pages: 1, current: page, perPage: limit }
    };
  },

  // Session Management
  getSessions: async () => {
    await delay();
    
    console.log('Mock: Fetching user sessions');
    
    const sessions = [
      { id: 1, device: 'Chrome on Windows', location: 'New York, US', last_active: '2024-05-27T10:15:00Z', current: true },
      { id: 2, device: 'Safari on iPhone', location: 'New York, US', last_active: '2024-05-26T20:30:00Z', current: false },
    ];

    return { data: sessions };
  },

  revokeSession: async (sessionId: number) => {
    await delay();
    
    console.log(`Mock: Revoking session ${sessionId}`);
    
    if (showToastFunction) {
      showToastFunction('Session revoked successfully!', 'success');
    }

    return { status: 'success' };
  },

  // User Preferences
  updatePreferences: async (preferences: any) => {
    await delay();
    
    console.log('Mock: Updating user preferences:', preferences);
    
    if (currentUser.preferences) {
      Object.assign(currentUser.preferences, preferences);
    } else {
      currentUser.preferences = preferences;
    }

    if (showToastFunction) {
      showToastFunction('Preferences updated successfully!', 'success');
    }

    return {
      status: 'success',
      data: currentUser.preferences
    };
  },

  // Teams
  getUserTeams: async () => {
    await delay();
    
    console.log('Mock: Fetching user teams');
    
    const teams = [
      { id: 1, name: 'Frontend Team', role: 'member' },
      { id: 2, name: 'QA Team', role: 'lead' },
    ];

    return { data: teams };
  },

  // Change user password
  changePassword: async (currentPassword: string, newPassword: string) => {
    await delay();
    
    console.log('Mock: Changing user password');
    
    // Simulate password validation
    if (currentPassword === 'wrongpassword') {
      throw new Error('Current password is incorrect');
    }

    if (showToastFunction) {
      showToastFunction('Password changed successfully!', 'success');
    }

    return { status: 'success' };
  },

  // Create a new user (Admin only)
  createUser: async (userData: any) => {
    await delay();
    
    console.log('Mock: Creating new user:', userData);
    
    const newUser: MockUser = {
      id: Math.max(...mockUsers.map(u => u.id)) + 1,
      username: userData.username,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role || 'developer',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockUsers.push(newUser);

    if (showToastFunction) {
      showToastFunction('User created successfully!', 'success');
    }

    return {
      status: 'success',
      data: newUser
    };
  },

  // Update a user (Admin only)
  updateUser: async (id: number, userData: any) => {
    await delay();
    
    console.log(`Mock: Updating user ${id}:`, userData);
    
    const userIndex = mockUsers.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...userData,
      updated_at: new Date().toISOString()
    };

    if (showToastFunction) {
      showToastFunction('User updated successfully!', 'success');
    }

    return {
      status: 'success',
      data: mockUsers[userIndex]
    };
  },

  // Delete a user (Admin only)
  deleteUser: async (id: number) => {
    await delay();
    
    console.log(`Mock: Deleting user ${id}`);
    
    const userIndex = mockUsers.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    mockUsers.splice(userIndex, 1);

    if (showToastFunction) {
      showToastFunction('User deleted successfully!', 'success');
    }

    return { status: 'success' };
  },
};

// Mock settings API
export const settingsApi = {
  // Get system settings
  getSettings: async () => {
    await delay();
    
    console.log('Mock: Fetching system settings');
    
    const settings = {
      site_name: 'DTS Demo',
      site_description: 'Defect Tracking System Demo',
      maintenance_mode: false,
      registration_enabled: true,
      email_notifications: true,
      max_file_size: 10485760, // 10MB
      allowed_file_types: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    };

    return { data: settings };
  },

  // Update system settings
  updateSettings: async (settingsData: any) => {
    await delay();
    
    console.log('Mock: Updating system settings:', settingsData);
    
    if (showToastFunction) {
      showToastFunction('Settings updated successfully!', 'success');
    }

    return {
      status: 'success',
      data: settingsData
    };
  },
};

// Mock admin API
export const adminApi = {
  // Get deleted defects (Admin only)
  getDeletedDefects: async () => {
    await delay();
    
    console.log('Mock: Fetching deleted defects');
    
    // Return empty array for demo
    return { data: [] };
  },

  // Restore a deleted defect (Admin only)
  restoreDefect: async (defectId: number) => {
    await delay();
    
    console.log(`Mock: Restoring defect ${defectId}`);
    
    if (showToastFunction) {
      showToastFunction('Defect restored successfully!', 'success');
    }

    return { status: 'success' };
  },

  // Permanently delete a defect (Admin only)
  permanentlyDeleteDefect: async (defectId: number) => {
    await delay();
    
    console.log(`Mock: Permanently deleting defect ${defectId}`);
    
    if (showToastFunction) {
      showToastFunction('Defect permanently deleted!', 'success');
    }

    return { status: 'success' };
  },
};

// Mock dashboard API
export const dashboardApi = {
  // Get dashboard statistics
  getStats: async () => {
    await delay();
    
    console.log('Mock: Fetching dashboard statistics');
    
    return { data: mockDashboardStats };
  },

  // Get recent activity
  getRecentActivity: async (limit = 10) => {
    await delay();
    
    console.log(`Mock: Fetching recent activity (limit: ${limit})`);
    
    const recentActivity = mockActivityLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    
    return { data: recentActivity };
  },

  // Get defects chart data
  getDefectsChartData: async (period = '30_days') => {
    await delay();
    
    console.log(`Mock: Fetching defects chart data for period: ${period}`);
    
    // Generate mock chart data
    const chartData = [];
    const now = new Date();
    const days = period === '7_days' ? 7 : period === '30_days' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      chartData.push({
        date: date.toISOString().split('T')[0],
        created: Math.floor(Math.random() * 3) + 1,
        resolved: Math.floor(Math.random() * 2) + 1,
        closed: Math.floor(Math.random() * 2)
      });
    }
    
    return { data: chartData };
  }
};

// Mock reports API
export const reportsApi = {
  // Get all reports
  getReports: async () => {
    await delay();
    
    console.log('Mock: Fetching reports list');
    
    return { data: mockReports };
  },

  // Get a specific report
  getReport: async (reportId: number) => {
    await delay();
    
    console.log(`Mock: Fetching report ${reportId}`);
    
    const report = mockReports.find(r => r.id === reportId);
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    return { data: report };
  },

  // Generate report data
  generateReport: async (reportType: string, parameters: any = {}) => {
    await delay(1000); // Longer delay for report generation
    
    console.log(`Mock: Generating report of type: ${reportType}`, parameters);
    
    let reportData = [];
    
    switch (reportType) {
      case 'defects_by_status':
        reportData = mockDashboardStats.defects_by_status;
        break;
      case 'defects_by_severity':
        reportData = mockDashboardStats.defects_by_severity;
        break;
      case 'user_activity':
        reportData = mockReports.find(r => r.type === 'user_activity')?.data || [];
        break;
      case 'resolution_time':
        reportData = mockReports.find(r => r.type === 'resolution_time')?.data || [];
        break;
      default:
        reportData = [];
    }
    
    return {
      data: {
        type: reportType,
        generated_at: new Date().toISOString(),
        parameters,
        data: reportData
      }
    };
  },

  // Export report
  exportReport: async (reportId: number, format: 'pdf' | 'excel' | 'csv') => {
    await delay(2000); // Longer delay for export
    
    console.log(`Mock: Exporting report ${reportId} as ${format}`);
    
    // Simulate file generation
    const filename = `report_${reportId}_${Date.now()}.${format}`;
    const downloadUrl = `https://example.com/exports/${filename}`;
    
    if (showToastFunction) {
      showToastFunction(`Report exported successfully as ${format.toUpperCase()}!`, 'success');
    }
    
    return {
      data: {
        filename,
        download_url: downloadUrl,
        format,
        size: Math.floor(Math.random() * 1000000) + 50000 // Random file size
      }
    };
  }
};

// Mock activity logs API
export const activityApi = {
  // Get activity logs
  getActivityLogs: async (filters: any = {}) => {
    await delay();
    
    console.log('Mock: Fetching activity logs', filters);
    
    let logs = [...mockActivityLogs];
    
    // Apply filters
    if (filters.user_id) {
      logs = logs.filter(log => log.user_id === parseInt(filters.user_id));
    }
    
    if (filters.entity_type) {
      logs = logs.filter(log => log.entity_type === filters.entity_type);
    }
    
    if (filters.action) {
      logs = logs.filter(log => log.action.toLowerCase().includes(filters.action.toLowerCase()));
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedLogs = logs.slice(startIndex, endIndex);
    
    return {
      data: paginatedLogs,
      pagination: {
        total: logs.length,
        pages: Math.ceil(logs.length / limit),
        current: page,
        perPage: limit
      }
    };
  },

  // Log an activity
  logActivity: async (activityData: any) => {
    await delay();
    
    console.log('Mock: Logging activity', activityData);
    
    const newActivity = {
      id: Math.max(...mockActivityLogs.map(a => a.id)) + 1,
      user_id: currentUser.id,
      action: activityData.action,
      entity_type: activityData.entity_type,
      entity_id: activityData.entity_id,
      details: activityData.details,
      ip_address: '192.168.1.100',
      user_agent: 'Mock User Agent',
      timestamp: new Date().toISOString(),
      user: currentUser
    };
    
    mockActivityLogs.push(newActivity);
    
    return { data: newActivity };
  }
};

// Enhanced user API with additional endpoints
export const enhancedUserApi = {
  ...userApi,

  // Get user statistics
  getUserStats: async (userId: number) => {
    await delay();
    
    console.log(`Mock: Fetching user statistics for user ${userId}`);
    
    const userDefects = mockDefects.filter(d => d.created_by === userId || d.assigned_to === userId);
    const userComments = mockComments.filter(c => c.user_id === userId);
    const userActivities = mockActivityLogs.filter(a => a.user_id === userId);
    
    return {
      data: {
        defects_created: mockDefects.filter(d => d.created_by === userId).length,
        defects_assigned: mockDefects.filter(d => d.assigned_to === userId).length,
        defects_resolved: mockDefects.filter(d => d.assigned_to === userId && d.status === 'resolved').length,
        comments_added: userComments.length,
        activities_count: userActivities.length,
        avg_resolution_time: 3.5,
        last_activity: userActivities.length > 0 ? userActivities[userActivities.length - 1].timestamp : null
      }
    };
  },

  // Get user's defects
  getUserDefects: async (userId: number, filters: any = {}) => {
    await delay();
    
    console.log(`Mock: Fetching defects for user ${userId}`, filters);
    
    let userDefects = mockDefects.filter(d => 
      d.created_by === userId || d.assigned_to === userId
    );
    
    // Apply additional filters
    if (filters.status) {
      userDefects = userDefects.filter(d => d.status === filters.status);
    }
    
    if (filters.role === 'creator') {
      userDefects = userDefects.filter(d => d.created_by === userId);
    } else if (filters.role === 'assignee') {
      userDefects = userDefects.filter(d => d.assigned_to === userId);
    }
    
    return { data: userDefects };
  },

  // Update user role (Admin only)
  updateUserRole: async (userId: number, role: string) => {
    await delay();
    
    console.log(`Mock: Updating user ${userId} role to ${role}`);
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      role: role as any,
      updated_at: new Date().toISOString()
    };

    if (showToastFunction) {
      showToastFunction('User role updated successfully!', 'success');
    }

    return {
      status: 'success',
      data: mockUsers[userIndex]
    };
  },

  // Update user status (Admin only)
  updateUserStatus: async (userId: number, status: 'active' | 'inactive') => {
    await delay();
    
    console.log(`Mock: Updating user ${userId} status to ${status}`);
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      is_active: status === 'active',
      status: status,
      updated_at: new Date().toISOString()
    };

    if (showToastFunction) {
      showToastFunction(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully!`, 'success');
    }

    return {
      status: 'success',
      data: mockUsers[userIndex]
    };
  },
};

// Export the mock API object (similar to the real api export)
export const api = {
  create: () => ({
    baseURL: 'mock://localhost:3000',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  }),
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
  get: async (url: string, config?: any) => {
    await delay();
    console.log(`Mock API GET: ${url}`, config);
    
    // Handle specific GET routes
    if (url === '/users/profile') {
      return {
        data: {
          data: {
            user: currentUser
          }
        }
      };
    }
    
    return { data: {} };
  },
  post: async (url: string, data?: any, config?: any) => {
    await delay();
    console.log(`Mock API POST: ${url}`, data, config);
    
    // Handle specific POST routes
    if (url === '/auth/login') {
      return await authApi.login(data?.username || '', data?.password || '');
    }
    
    if (url === '/auth/logout') {
      return await authApi.logout();
    }
    
    return { data: {} };
  },
  put: async (url: string, data?: any, config?: any) => {
    await delay();
    console.log(`Mock API PUT: ${url}`, data, config);
    return { data: {} };
  },
  delete: async (url: string, config?: any) => {
    await delay();
    console.log(`Mock API DELETE: ${url}`, config);
    return { data: {} };
  },
}; 