// Mock data for DTS Demo
export interface MockUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'developer' | 'tester' | 'manager';
  is_active: boolean;
  status?: 'active' | 'inactive';
  avatar?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
  department?: string;
  job_title?: string;
}

export interface MockDefect {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'bug' | 'feature' | 'improvement' | 'task';
  project_id: number;
  created_by: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  tags: string[];
  attachments: any[];
  solutions: any[];
  creator_name?: string;
  assignee_name?: string;
  created_by_obj?: MockUser;
  assigned_to_obj?: MockUser;
}

export interface MockComment {
  id: number;
  defect_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: MockUser;
  attachments?: any[];
}

export interface MockSolution {
  id: number;
  content: string;
  defect_id: number;
  user_id: number;
  user?: MockUser;
  attachments?: any[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockProject {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface MockVersionHistory {
  id: number;
  defect_id: number;
  version: string;
  changes: string[];
  changed_by: number;
  changed_by_name: string;
  timestamp: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
}

export interface MockActivityLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: 'defect' | 'comment' | 'user' | 'system';
  entity_id?: number;
  details: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  user: MockUser;
}

export interface MockDashboardStats {
  total_defects: number;
  open_defects: number;
  in_progress_defects: number;
  resolved_defects: number;
  closed_defects: number;
  critical_defects: number;
  high_priority_defects: number;
  my_assigned_defects: number;
  overdue_defects: number;
  defects_this_week: number;
  defects_this_month: number;
  resolution_rate: number;
  avg_resolution_time: number;
  top_reporters: Array<{ user: string; count: number }>;
  defects_by_severity: Array<{ severity: string; count: number }>;
  defects_by_status: Array<{ status: string; count: number }>;
  defects_by_type: Array<{ type: string; count: number }>;
  recent_activity: Array<{ action: string; user: string; time: string; defect?: string }>;
}

export interface MockReport {
  id: number;
  name: string;
  type: 'defects_by_status' | 'defects_by_severity' | 'user_activity' | 'resolution_time' | 'custom';
  description: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  parameters: Record<string, any>;
  data: any[];
}

// Sample Users
export const mockUsers: MockUser[] = [
  {
    id: 1,
    username: 'john_doe',
    email: 'john.doe@company.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'admin',
    is_active: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-05-20T14:30:00Z',
    last_login: '2024-05-27T10:15:00Z',
    department: 'IT Administration',
    job_title: 'System Administrator',
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en'
    }
  },
  {
    id: 2,
    username: 'sarah_wilson',
    email: 'sarah.wilson@company.com',
    first_name: 'Sarah',
    last_name: 'Wilson',
    role: 'developer',
    is_active: true,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    created_at: '2024-01-20T09:00:00Z',
    updated_at: '2024-05-25T16:45:00Z',
    last_login: '2024-05-27T09:30:00Z',
    department: 'Engineering',
    job_title: 'Senior Frontend Developer',
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en'
    }
  },
  {
    id: 3,
    username: 'mike_chen',
    email: 'mike.chen@company.com',
    first_name: 'Mike',
    last_name: 'Chen',
    role: 'tester',
    is_active: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-05-26T11:20:00Z',
    last_login: '2024-05-27T08:45:00Z',
    department: 'Quality Assurance',
    job_title: 'QA Engineer',
    preferences: {
      theme: 'light',
      notifications: false,
      language: 'en'
    }
  },
  {
    id: 4,
    username: 'lisa_garcia',
    email: 'lisa.garcia@company.com',
    first_name: 'Lisa',
    last_name: 'Garcia',
    role: 'manager',
    is_active: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    created_at: '2024-01-10T07:30:00Z',
    updated_at: '2024-05-24T13:15:00Z',
    last_login: '2024-05-26T17:20:00Z',
    department: 'Product Management',
    job_title: 'Product Manager',
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en'
    }
  },
  {
    id: 5,
    username: 'alex_kumar',
    email: 'alex.kumar@company.com',
    first_name: 'Alex',
    last_name: 'Kumar',
    role: 'developer',
    is_active: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    created_at: '2024-02-15T11:00:00Z',
    updated_at: '2024-05-27T09:00:00Z',
    last_login: '2024-05-27T11:30:00Z',
    department: 'Engineering',
    job_title: 'Backend Developer',
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en'
    }
  }
];

// Sample Projects
export const mockProjects: MockProject[] = [
  {
    id: 1,
    name: 'E-Commerce Platform',
    description: 'Main e-commerce application',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-05-27T12:00:00Z'
  },
  {
    id: 2,
    name: 'Mobile App',
    description: 'iOS and Android mobile application',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-05-26T15:30:00Z'
  },
  {
    id: 3,
    name: 'Admin Dashboard',
    description: 'Internal admin management system',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-05-25T10:45:00Z'
  }
];

// Sample Defects
export const mockDefects: MockDefect[] = [
  {
    id: 1,
    title: 'Login page not responsive on mobile devices',
    description: 'The login form elements are not properly aligned on mobile screens smaller than 768px. The submit button is cut off and the input fields overlap.',
    status: 'open',
    severity: 'high',
    priority: 'high',
    type: 'bug',
    project_id: 1,
    created_by: 3,
    assigned_to: 2,
    created_at: '2024-05-25T09:15:00Z',
    updated_at: '2024-05-25T09:15:00Z',
    tags: ['mobile', 'responsive', 'ui'],
    attachments: [],
    solutions: [],
    creator_name: 'mike_chen',
    assignee_name: 'sarah_wilson'
  },
  {
    id: 2,
    title: 'Shopping cart total calculation incorrect',
    description: 'When applying discount codes, the total calculation shows wrong values. Tax is not being calculated correctly after discount application.',
    status: 'in_progress',
    severity: 'critical',
    priority: 'urgent',
    type: 'bug',
    project_id: 1,
    created_by: 4,
    assigned_to: 5,
    created_at: '2024-05-24T14:30:00Z',
    updated_at: '2024-05-26T16:45:00Z',
    tags: ['payment', 'calculation', 'critical'],
    attachments: [],
    solutions: [],
    creator_name: 'lisa_garcia',
    assignee_name: 'alex_kumar'
  },
  {
    id: 3,
    title: 'Add dark mode support',
    description: 'Implement dark mode theme across the entire application. Should include user preference storage and system theme detection.',
    status: 'open',
    severity: 'medium',
    priority: 'medium',
    type: 'feature',
    project_id: 1,
    created_by: 1,
    assigned_to: 2,
    created_at: '2024-05-23T11:00:00Z',
    updated_at: '2024-05-23T11:00:00Z',
    tags: ['feature', 'ui', 'theme'],
    attachments: [],
    solutions: [],
    creator_name: 'john_doe',
    assignee_name: 'sarah_wilson'
  },
  {
    id: 4,
    title: 'Database connection timeout on heavy load',
    description: 'During peak hours, the application experiences database connection timeouts causing 500 errors for users.',
    status: 'resolved',
    severity: 'critical',
    priority: 'urgent',
    type: 'bug',
    project_id: 1,
    created_by: 2,
    assigned_to: 5,
    created_at: '2024-05-20T08:00:00Z',
    updated_at: '2024-05-22T17:30:00Z',
    closed_at: '2024-05-22T17:30:00Z',
    tags: ['database', 'performance', 'backend'],
    attachments: [],
    solutions: [],
    creator_name: 'sarah_wilson',
    assignee_name: 'alex_kumar'
  },
  {
    id: 5,
    title: 'Push notifications not working on iOS',
    description: 'Users report that push notifications are not being received on iOS devices. Android notifications work fine.',
    status: 'open',
    severity: 'high',
    priority: 'high',
    type: 'bug',
    project_id: 2,
    created_by: 3,
    assigned_to: 2,
    created_at: '2024-05-26T13:20:00Z',
    updated_at: '2024-05-26T13:20:00Z',
    tags: ['mobile', 'ios', 'notifications'],
    attachments: [],
    solutions: [],
    creator_name: 'mike_chen',
    assignee_name: 'sarah_wilson'
  },
  {
    id: 6,
    title: 'Improve search performance',
    description: 'Product search is taking too long to return results. Need to optimize search algorithm and add caching.',
    status: 'in_progress',
    severity: 'medium',
    priority: 'medium',
    type: 'improvement',
    project_id: 1,
    created_by: 4,
    assigned_to: 5,
    created_at: '2024-05-21T10:45:00Z',
    updated_at: '2024-05-25T14:20:00Z',
    tags: ['performance', 'search', 'optimization'],
    attachments: [],
    solutions: [],
    creator_name: 'lisa_garcia',
    assignee_name: 'alex_kumar'
  },
  {
    id: 7,
    title: 'User profile image upload fails',
    description: 'Users cannot upload profile images. The upload process fails with a 413 error (payload too large).',
    status: 'closed',
    severity: 'medium',
    priority: 'medium',
    type: 'bug',
    project_id: 3,
    created_by: 1,
    assigned_to: 2,
    created_at: '2024-05-18T16:00:00Z',
    updated_at: '2024-05-19T12:30:00Z',
    closed_at: '2024-05-19T12:30:00Z',
    tags: ['upload', 'profile', 'images'],
    attachments: [],
    solutions: [],
    creator_name: 'john_doe',
    assignee_name: 'sarah_wilson'
  },
  {
    id: 8,
    title: 'Add export functionality to reports',
    description: 'Users need the ability to export reports in PDF and Excel formats for external sharing and analysis.',
    status: 'open',
    severity: 'low',
    priority: 'low',
    type: 'feature',
    project_id: 3,
    created_by: 4,
    assigned_to: undefined,
    created_at: '2024-05-27T09:00:00Z',
    updated_at: '2024-05-27T09:00:00Z',
    tags: ['reports', 'export', 'feature'],
    attachments: [],
    solutions: [],
    creator_name: 'lisa_garcia',
    assignee_name: undefined
  }
];

// Sample Comments
export const mockComments: MockComment[] = [
  {
    id: 1,
    defect_id: 1,
    user_id: 2,
    content: 'I can reproduce this issue on iPhone 12. The submit button is completely hidden below the fold.',
    created_at: '2024-05-25T10:30:00Z',
    updated_at: '2024-05-25T10:30:00Z',
    user: mockUsers[1],
    attachments: [
      {
        id: 1,
        comment_id: 1,
        filename: 'mobile_login_issue.png',
        original_name: 'mobile_login_issue.png',
        file_size: 245760,
        file_type: 'image/png',
        file_path: 'https://example.com/uploads/mobile_login_issue.png',
        url: 'https://example.com/uploads/mobile_login_issue.png',
        size: 245760,
        created_at: '2024-05-25T10:32:00Z',
        created_by: 2
      }
    ]
  },
  {
    id: 2,
    defect_id: 1,
    user_id: 3,
    content: 'Also confirmed on Samsung Galaxy S21. Seems to affect all devices with screen width < 768px. I\'ve attached a video showing the issue.',
    created_at: '2024-05-25T11:15:00Z',
    updated_at: '2024-05-25T11:15:00Z',
    user: mockUsers[2],
    attachments: [
      {
        id: 2,
        comment_id: 2,
        filename: 'mobile_issue_demo.mp4',
        original_name: 'mobile_issue_demo.mp4',
        file_size: 1024000,
        file_type: 'video/mp4',
        file_path: 'https://example.com/uploads/mobile_issue_demo.mp4',
        url: 'https://example.com/uploads/mobile_issue_demo.mp4',
        size: 1024000,
        created_at: '2024-05-25T11:17:00Z',
        created_by: 3
      }
    ]
  },
  {
    id: 3,
    defect_id: 2,
    user_id: 5,
    content: 'Working on this now. The issue is in the discount calculation logic. Should have a fix ready by tomorrow.',
    created_at: '2024-05-26T09:00:00Z',
    updated_at: '2024-05-26T09:00:00Z',
    user: mockUsers[4],
    attachments: []
  },
  {
    id: 4,
    defect_id: 2,
    user_id: 4,
    content: 'This is affecting our sales. Please prioritize this fix. I\'ve attached the error logs from production.',
    created_at: '2024-05-26T16:45:00Z',
    updated_at: '2024-05-26T16:45:00Z',
    user: mockUsers[3],
    attachments: [
      {
        id: 3,
        comment_id: 4,
        filename: 'production_error_logs.txt',
        original_name: 'production_error_logs.txt',
        file_size: 15360,
        file_type: 'text/plain',
        file_path: 'https://example.com/uploads/production_error_logs.txt',
        url: 'https://example.com/uploads/production_error_logs.txt',
        size: 15360,
        created_at: '2024-05-26T16:47:00Z',
        created_by: 4
      }
    ]
  },
  {
    id: 5,
    defect_id: 4,
    user_id: 5,
    content: 'Fixed by implementing connection pooling and optimizing database queries. Deployed to production.',
    created_at: '2024-05-22T17:30:00Z',
    updated_at: '2024-05-22T17:30:00Z',
    user: mockUsers[4],
    attachments: []
  },
  {
    id: 6,
    defect_id: 3,
    user_id: 2,
    content: 'I\'ve started working on the dark mode implementation. Here\'s the initial design mockup for review.',
    created_at: '2024-05-24T14:20:00Z',
    updated_at: '2024-05-24T14:20:00Z',
    user: mockUsers[1],
    attachments: [
      {
        id: 4,
        comment_id: 6,
        filename: 'dark_mode_mockup.figma',
        original_name: 'dark_mode_mockup.figma',
        file_size: 512000,
        file_type: 'application/octet-stream',
        file_path: 'https://example.com/uploads/dark_mode_mockup.figma',
        url: 'https://example.com/uploads/dark_mode_mockup.figma',
        size: 512000,
        created_at: '2024-05-24T14:22:00Z',
        created_by: 2
      }
    ]
  },
  {
    id: 7,
    defect_id: 5,
    user_id: 2,
    content: 'I\'ve investigated this issue. It seems to be related to the iOS push notification certificates. Need to update them.',
    created_at: '2024-05-26T15:30:00Z',
    updated_at: '2024-05-26T15:30:00Z',
    user: mockUsers[1],
    attachments: []
  },
  {
    id: 8,
    defect_id: 6,
    user_id: 5,
    content: 'Performance analysis shows the search is taking 3-5 seconds on large datasets. I\'ve identified the bottleneck in the query.',
    created_at: '2024-05-25T16:00:00Z',
    updated_at: '2024-05-25T16:00:00Z',
    user: mockUsers[4],
    attachments: [
      {
        id: 5,
        comment_id: 8,
        filename: 'performance_analysis.pdf',
        original_name: 'performance_analysis.pdf',
        file_size: 789000,
        file_type: 'application/pdf',
        file_path: 'https://example.com/uploads/performance_analysis.pdf',
        url: 'https://example.com/uploads/performance_analysis.pdf',
        size: 789000,
        created_at: '2024-05-25T16:02:00Z',
        created_by: 5
      }
    ]
  }
];

// Sample Solutions
export const mockSolutions: MockSolution[] = [
  {
    id: 1,
    content: 'Implemented responsive CSS using flexbox and media queries. Updated the login form to stack vertically on mobile devices and adjusted button positioning.',
    defect_id: 1,
    user_id: 2,
    user: mockUsers[1],
    attachments: [],
    is_deleted: false,
    created_at: '2024-05-25T15:30:00Z',
    updated_at: '2024-05-25T15:30:00Z'
  },
  {
    id: 2,
    content: 'Added connection pooling with max 20 connections and implemented query optimization. Also added Redis caching for frequently accessed data.',
    defect_id: 4,
    user_id: 5,
    user: mockUsers[4],
    attachments: [],
    is_deleted: false,
    created_at: '2024-05-22T16:45:00Z',
    updated_at: '2024-05-22T16:45:00Z'
  },
  {
    id: 3,
    content: 'Increased the maximum file upload size to 10MB and added proper error handling with user-friendly messages.',
    defect_id: 7,
    user_id: 2,
    user: mockUsers[1],
    attachments: [],
    is_deleted: false,
    created_at: '2024-05-19T11:00:00Z',
    updated_at: '2024-05-19T11:00:00Z'
  }
];

// Current user (for demo purposes)
export const currentUser: MockUser = mockUsers[0]; // John Doe as admin

// Helper function to get user by ID
export const getUserById = (id: number): MockUser | undefined => {
  return mockUsers.find(user => user.id === id);
};

// Helper function to get defects with user objects
export const getDefectsWithUsers = (): MockDefect[] => {
  return mockDefects.map(defect => ({
    ...defect,
    created_by_obj: getUserById(defect.created_by),
    assigned_to_obj: defect.assigned_to ? getUserById(defect.assigned_to) : undefined
  }));
};

// Helper function to filter defects
export const filterDefects = (filters: any = {}): MockDefect[] => {
  let filtered = [...mockDefects];

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    filtered = filtered.filter(defect => statuses.includes(defect.status));
  }

  if (filters.severity) {
    const severities = Array.isArray(filters.severity) ? filters.severity : [filters.severity];
    filtered = filtered.filter(defect => severities.includes(defect.severity));
  }

  if (filters.priority) {
    const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
    filtered = filtered.filter(defect => priorities.includes(defect.priority));
  }

  if (filters.assignedTo) {
    filtered = filtered.filter(defect => defect.assigned_to === parseInt(filters.assignedTo));
  }

  if (filters.createdBy) {
    filtered = filtered.filter(defect => defect.created_by === parseInt(filters.createdBy));
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(defect => 
      defect.title.toLowerCase().includes(searchTerm) ||
      defect.description.toLowerCase().includes(searchTerm) ||
      defect.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Sort
  if (filters.sort) {
    const sortField = filters.sort;
    const direction = filters.direction === 'asc' ? 1 : -1;
    
    filtered.sort((a, b) => {
      let aVal = a[sortField as keyof MockDefect];
      let bVal = b[sortField as keyof MockDefect];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * direction;
      }
      
      if (aVal !== undefined && bVal !== undefined) {
        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
      }
      return 0;
    });
  }

  // Pagination
  if (filters.limit) {
    filtered = filtered.slice(0, parseInt(filters.limit));
  }

  return filtered;
};

// Sample Version History
export const mockVersionHistory: MockVersionHistory[] = [
  {
    id: 1,
    defect_id: 1,
    version: 'v3',
    changes: ['Updated status from open to in_progress', 'Added tag: urgent', 'Assigned to sarah_wilson'],
    changed_by: 1,
    changed_by_name: 'john_doe',
    timestamp: '2024-05-27T10:00:00Z',
    old_values: { status: 'open', assigned_to: null, tags: ['mobile', 'responsive', 'ui'] },
    new_values: { status: 'in_progress', assigned_to: 2, tags: ['mobile', 'responsive', 'ui', 'urgent'] }
  },
  {
    id: 2,
    defect_id: 1,
    version: 'v2',
    changes: ['Changed priority from medium to high', 'Updated description'],
    changed_by: 3,
    changed_by_name: 'mike_chen',
    timestamp: '2024-05-26T15:30:00Z',
    old_values: { priority: 'medium', description: 'Login form not responsive' },
    new_values: { priority: 'high', description: 'The login form elements are not properly aligned on mobile screens smaller than 768px. The submit button is cut off and the input fields overlap.' }
  },
  {
    id: 3,
    defect_id: 1,
    version: 'v1',
    changes: ['Initial creation'],
    changed_by: 3,
    changed_by_name: 'mike_chen',
    timestamp: '2024-05-25T09:15:00Z',
    old_values: {},
    new_values: { title: 'Login page not responsive on mobile devices', status: 'open', severity: 'high', priority: 'medium' }
  },
  {
    id: 4,
    defect_id: 2,
    version: 'v2',
    changes: ['Status changed to in_progress', 'Assigned to alex_kumar'],
    changed_by: 4,
    changed_by_name: 'lisa_garcia',
    timestamp: '2024-05-26T16:45:00Z',
    old_values: { status: 'open', assigned_to: null },
    new_values: { status: 'in_progress', assigned_to: 5 }
  }
];

// Sample Activity Logs
export const mockActivityLogs: MockActivityLog[] = [
  {
    id: 1,
    user_id: 1,
    action: 'LOGIN',
    entity_type: 'system',
    details: 'User logged in successfully',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-05-27T10:15:00Z',
    user: mockUsers[0]
  },
  {
    id: 2,
    user_id: 2,
    action: 'UPDATE_DEFECT',
    entity_type: 'defect',
    entity_id: 1,
    details: 'Updated defect status to in_progress',
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    timestamp: '2024-05-27T09:30:00Z',
    user: mockUsers[1]
  },
  {
    id: 3,
    user_id: 3,
    action: 'CREATE_DEFECT',
    entity_type: 'defect',
    entity_id: 8,
    details: 'Created new defect: Add export functionality to reports',
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-05-27T09:00:00Z',
    user: mockUsers[2]
  },
  {
    id: 4,
    user_id: 5,
    action: 'ADD_COMMENT',
    entity_type: 'comment',
    entity_id: 3,
    details: 'Added comment to defect #2',
    ip_address: '192.168.1.103',
    user_agent: 'Mozilla/5.0 (Ubuntu; Linux x86_64) AppleWebKit/537.36',
    timestamp: '2024-05-26T16:45:00Z',
    user: mockUsers[4]
  },
  {
    id: 5,
    user_id: 4,
    action: 'RESOLVE_DEFECT',
    entity_type: 'defect',
    entity_id: 4,
    details: 'Marked defect as resolved',
    ip_address: '192.168.1.104',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
    timestamp: '2024-05-22T17:30:00Z',
    user: mockUsers[3]
  }
];

// Dashboard Statistics
export const mockDashboardStats: MockDashboardStats = {
  total_defects: 8,
  open_defects: 3,
  in_progress_defects: 2,
  resolved_defects: 1,
  closed_defects: 2,
  critical_defects: 2,
  high_priority_defects: 3,
  my_assigned_defects: 4,
  overdue_defects: 1,
  defects_this_week: 2,
  defects_this_month: 8,
  resolution_rate: 75,
  avg_resolution_time: 3.5,
  top_reporters: [
    { user: 'mike_chen', count: 3 },
    { user: 'lisa_garcia', count: 2 },
    { user: 'john_doe', count: 2 },
    { user: 'sarah_wilson', count: 1 }
  ],
  defects_by_severity: [
    { severity: 'critical', count: 2 },
    { severity: 'high', count: 3 },
    { severity: 'medium', count: 2 },
    { severity: 'low', count: 1 }
  ],
  defects_by_status: [
    { status: 'open', count: 3 },
    { status: 'in_progress', count: 2 },
    { status: 'resolved', count: 1 },
    { status: 'closed', count: 2 }
  ],
  defects_by_type: [
    { type: 'bug', count: 5 },
    { type: 'feature', count: 2 },
    { type: 'improvement', count: 1 },
    { type: 'task', count: 0 }
  ],
  recent_activity: [
    { action: 'Created defect', user: 'lisa_garcia', time: '2 hours ago', defect: 'Add export functionality to reports' },
    { action: 'Updated defect', user: 'alex_kumar', time: '4 hours ago', defect: 'Shopping cart total calculation incorrect' },
    { action: 'Added comment', user: 'sarah_wilson', time: '6 hours ago', defect: 'Login page not responsive on mobile devices' },
    { action: 'Resolved defect', user: 'alex_kumar', time: '2 days ago', defect: 'Database connection timeout on heavy load' },
    { action: 'Created defect', user: 'mike_chen', time: '3 days ago', defect: 'Push notifications not working on iOS' }
  ]
};

// Sample Reports
export const mockReports: MockReport[] = [
  {
    id: 1,
    name: 'Defects by Status Report',
    type: 'defects_by_status',
    description: 'Overview of all defects grouped by their current status',
    created_by: 1,
    created_at: '2024-05-20T10:00:00Z',
    updated_at: '2024-05-27T10:00:00Z',
    parameters: { date_range: '30_days' },
    data: [
      { status: 'Open', count: 3, percentage: 37.5 },
      { status: 'In Progress', count: 2, percentage: 25 },
      { status: 'Resolved', count: 1, percentage: 12.5 },
      { status: 'Closed', count: 2, percentage: 25 }
    ]
  },
  {
    id: 2,
    name: 'Defects by Severity Report',
    type: 'defects_by_severity',
    description: 'Analysis of defect distribution by severity level',
    created_by: 4,
    created_at: '2024-05-18T14:30:00Z',
    updated_at: '2024-05-27T10:00:00Z',
    parameters: { include_closed: true },
    data: [
      { severity: 'Critical', count: 2, percentage: 25 },
      { severity: 'High', count: 3, percentage: 37.5 },
      { severity: 'Medium', count: 2, percentage: 25 },
      { severity: 'Low', count: 1, percentage: 12.5 }
    ]
  },
  {
    id: 3,
    name: 'User Activity Report',
    type: 'user_activity',
    description: 'Summary of user activities and contributions',
    created_by: 1,
    created_at: '2024-05-15T09:00:00Z',
    updated_at: '2024-05-27T10:00:00Z',
    parameters: { period: 'last_month' },
    data: [
      { user: 'mike_chen', defects_created: 3, comments_added: 5, defects_resolved: 0 },
      { user: 'sarah_wilson', defects_created: 1, comments_added: 8, defects_resolved: 3 },
      { user: 'alex_kumar', defects_created: 0, comments_added: 3, defects_resolved: 2 },
      { user: 'lisa_garcia', defects_created: 2, comments_added: 4, defects_resolved: 0 },
      { user: 'john_doe', defects_created: 2, comments_added: 2, defects_resolved: 1 }
    ]
  },
  {
    id: 4,
    name: 'Resolution Time Analysis',
    type: 'resolution_time',
    description: 'Average time taken to resolve defects by severity and type',
    created_by: 4,
    created_at: '2024-05-10T11:00:00Z',
    updated_at: '2024-05-27T10:00:00Z',
    parameters: { unit: 'days' },
    data: [
      { category: 'Critical Bug', avg_resolution_time: 1.5, count: 2 },
      { category: 'High Bug', avg_resolution_time: 3.2, count: 2 },
      { category: 'Medium Bug', avg_resolution_time: 5.8, count: 1 },
      { category: 'Feature Request', avg_resolution_time: 12.5, count: 2 },
      { category: 'Improvement', avg_resolution_time: 8.0, count: 1 }
    ]
  }
]; 