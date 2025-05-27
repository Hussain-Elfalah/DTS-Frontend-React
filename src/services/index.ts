// Service Selector - Automatically chooses between real and mock APIs
import { isDemoMode } from '../config/demo';

// Import real APIs
import * as realApi from './api';
import * as realSolutionApi from './solutionApi';

// Import mock APIs
import * as mockApi from './mockApi';
import * as mockSolutionApi from './mockSolutionApi';

// Export the appropriate APIs based on demo mode
export const api = isDemoMode() ? mockApi.api : realApi.api;
export const defectApi = isDemoMode() ? mockApi.defectApi : realApi.defectApi;
export const commentApi = isDemoMode() ? mockApi.commentApi : realApi.commentApi;
export const userApi = isDemoMode() ? mockApi.enhancedUserApi : realApi.userApi;
export const settingsApi = isDemoMode() ? mockApi.settingsApi : realApi.settingsApi;
export const adminApi = isDemoMode() ? mockApi.adminApi : realApi.adminApi;
export const solutionApi = isDemoMode() ? mockSolutionApi.solutionApi : realSolutionApi.solutionApi;

// Export new mock APIs (fallback to empty objects for real mode)
export const dashboardApi = isDemoMode() ? mockApi.dashboardApi : {
  getStats: async () => ({ data: {} }),
  getRecentActivity: async () => ({ data: [] }),
  getDefectsChartData: async () => ({ data: [] })
};

export const reportsApi = isDemoMode() ? mockApi.reportsApi : {
  getReports: async () => ({ data: [] }),
  getReport: async () => ({ data: {} }),
  generateReport: async () => ({ data: {} }),
  exportReport: async () => ({ data: {} })
};

export const activityApi = isDemoMode() ? mockApi.activityApi : {
  getActivityLogs: async () => ({ data: [], pagination: {} }),
  logActivity: async () => ({ data: {} })
};

// Export toast handler setter
export const setToastHandler = isDemoMode() ? mockApi.setToastHandler : realApi.setToastHandler;

// Export utility functions
export const debounce = isDemoMode() ? (() => {}) : realApi.debounce;

// Export types and interfaces
export type { WorkflowAction } from './api';
export type { Solution, SolutionAttachment, CreateSolutionData, UpdateSolutionData } from './solutionApi';

// Log which mode we're using
console.log(`🔧 API Mode: ${isDemoMode() ? 'DEMO (Mock Data)' : 'PRODUCTION (Real API)'}`);

// Export demo mode status for components that need it
export { isDemoMode }; 