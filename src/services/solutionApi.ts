import { api } from './api';

export interface Solution {
  id: number;
  content: string;
  defect_id: number;
  user_id: number;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  attachments?: SolutionAttachment[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SolutionAttachment {
  id: number;
  solution_id: number;
  url: string;
  filename: string;
  size: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSolutionData {
  content: string;
}

export interface UpdateSolutionData {
  content: string;
}

export const solutionApi = {
  // Get all solutions for a defect
  getSolutionsByDefectId: async (defectId: number): Promise<Solution[]> => {
    const response = await api.get(`/defects/${defectId}/solutions`);
    return response.data?.data || response.data || [];
  },

  // Get a specific solution by ID
  getSolutionById: async (solutionId: number): Promise<Solution> => {
    const response = await api.get(`/solutions/${solutionId}`);
    return response.data?.data || response.data;
  },

  // Create a new solution for a defect
  createSolution: async (defectId: number, data: CreateSolutionData): Promise<Solution> => {
    const response = await api.post(`/defects/${defectId}/solutions`, data);
    // Backend returns { status: 'success', data: { solution: {...} } }
    return response.data?.data?.solution || response.data?.solution || response.data;
  },

  // Create multiple solutions for a defect
  createMultipleSolutions: async (defectId: number, solutions: CreateSolutionData[]): Promise<Solution[]> => {
    const response = await api.post(`/defects/${defectId}/solutions/multiple`, { solutions });
    // Backend returns { status: 'success', data: { solutions: [...] } }
    return response.data?.data?.solutions || response.data?.solutions || response.data;
  },

  // Update a solution
  updateSolution: async (solutionId: number, data: UpdateSolutionData): Promise<Solution> => {
    const response = await api.put(`/solutions/${solutionId}`, data);
    // Backend returns { success: true, data: {...} }
    return response.data?.data || response.data;
  },

  // Delete a solution (soft delete)
  deleteSolution: async (solutionId: number): Promise<void> => {
    await api.delete(`/solutions/${solutionId}`);
  },

  // Upload attachments to a solution
  uploadAttachments: async (solutionId: number, files: File[]): Promise<SolutionAttachment[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await api.post(`/solutions/${solutionId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Backend returns { success: true, data: [...] } or { status: 'success', data: { attachments: [...] } }
    return response.data?.data?.attachments || response.data?.data || response.data;
  },

  // Delete a solution attachment
  deleteAttachment: async (solutionId: number, attachmentId: number): Promise<void> => {
    await api.delete(`/solutions/${solutionId}/attachments/${attachmentId}`);
  },

  // Admin functions
  getDeletedSolutions: async (): Promise<Solution[]> => {
    const response = await api.get('/admin/solutions/deleted');
    return response.data?.data || response.data || [];
  },

  restoreSolution: async (solutionId: number): Promise<Solution> => {
    const response = await api.post(`/admin/solutions/${solutionId}/restore`);
    // Backend returns { success: true, data: {...} }
    return response.data?.data || response.data;
  },
}; 