// Mock Solution API Service for DTS Demo
import { mockSolutions, mockUsers, currentUser, getUserById } from '../data/mockData';
import type { MockSolution } from '../data/mockData';

// Simulate API delay for realistic experience
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate new IDs
let nextSolutionId = Math.max(...mockSolutions.map(s => s.id)) + 1;

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
    await delay();
    
    console.log(`Mock: Fetching solutions for defect ${defectId}`);
    
    const solutions = mockSolutions
      .filter(s => s.defect_id === defectId && !s.is_deleted)
      .map(s => ({
        ...s,
        user: getUserById(s.user_id) || { id: s.user_id, username: 'Unknown', email: 'unknown@example.com' }
      }));
    
    return solutions;
  },

  // Get a specific solution by ID
  getSolutionById: async (solutionId: number): Promise<Solution> => {
    await delay();
    
    console.log(`Mock: Fetching solution ${solutionId}`);
    
    const solution = mockSolutions.find(s => s.id === solutionId && !s.is_deleted);
    
    if (!solution) {
      throw new Error('Solution not found');
    }

    return {
      ...solution,
      user: getUserById(solution.user_id) || { id: solution.user_id, username: 'Unknown', email: 'unknown@example.com' }
    };
  },

  // Create a new solution for a defect
  createSolution: async (defectId: number, data: CreateSolutionData): Promise<Solution> => {
    await delay();
    
    console.log(`Mock: Creating solution for defect ${defectId}:`, data);
    
    const newSolution: MockSolution = {
      id: nextSolutionId++,
      content: data.content,
      defect_id: defectId,
      user_id: currentUser.id,
      user: currentUser,
      attachments: [],
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockSolutions.push(newSolution);

    return {
      ...newSolution,
      user: currentUser
    };
  },

  // Create multiple solutions for a defect
  createMultipleSolutions: async (defectId: number, solutions: CreateSolutionData[]): Promise<Solution[]> => {
    await delay();
    
    console.log(`Mock: Creating multiple solutions for defect ${defectId}:`, solutions);
    
    const newSolutions: Solution[] = [];
    
    for (const solutionData of solutions) {
      const newSolution: MockSolution = {
        id: nextSolutionId++,
        content: solutionData.content,
        defect_id: defectId,
        user_id: currentUser.id,
        user: currentUser,
        attachments: [],
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSolutions.push(newSolution);
      newSolutions.push({
        ...newSolution,
        user: currentUser
      });
    }

    return newSolutions;
  },

  // Update a solution
  updateSolution: async (solutionId: number, data: UpdateSolutionData): Promise<Solution> => {
    await delay();
    
    console.log(`Mock: Updating solution ${solutionId}:`, data);
    
    const solutionIndex = mockSolutions.findIndex(s => s.id === solutionId && !s.is_deleted);
    
    if (solutionIndex === -1) {
      throw new Error('Solution not found');
    }

    mockSolutions[solutionIndex] = {
      ...mockSolutions[solutionIndex],
      content: data.content,
      updated_at: new Date().toISOString()
    };

    return {
      ...mockSolutions[solutionIndex],
      user: getUserById(mockSolutions[solutionIndex].user_id) || { id: mockSolutions[solutionIndex].user_id, username: 'Unknown', email: 'unknown@example.com' }
    };
  },

  // Delete a solution (soft delete)
  deleteSolution: async (solutionId: number): Promise<void> => {
    await delay();
    
    console.log(`Mock: Deleting solution ${solutionId}`);
    
    const solutionIndex = mockSolutions.findIndex(s => s.id === solutionId);
    
    if (solutionIndex === -1) {
      throw new Error('Solution not found');
    }

    mockSolutions[solutionIndex].is_deleted = true;
    mockSolutions[solutionIndex].updated_at = new Date().toISOString();
  },

  // Upload attachments to a solution
  uploadAttachments: async (solutionId: number, files: File[]): Promise<SolutionAttachment[]> => {
    await delay(1000); // Longer delay for file upload simulation
    
    console.log(`Mock: Uploading ${files.length} attachments to solution ${solutionId}`);
    
    // Simulate file upload
    const attachments: SolutionAttachment[] = files.map((file, index) => ({
      id: Date.now() + index,
      solution_id: solutionId,
      url: `https://example.com/uploads/${file.name}`,
      filename: file.name,
      size: file.size,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Add attachments to the solution
    const solutionIndex = mockSolutions.findIndex(s => s.id === solutionId);
    if (solutionIndex !== -1) {
      if (!mockSolutions[solutionIndex].attachments) {
        mockSolutions[solutionIndex].attachments = [];
      }
      mockSolutions[solutionIndex].attachments!.push(...attachments);
    }

    return attachments;
  },

  // Delete a solution attachment
  deleteAttachment: async (solutionId: number, attachmentId: number): Promise<void> => {
    await delay();
    
    console.log(`Mock: Deleting attachment ${attachmentId} from solution ${solutionId}`);
    
    const solutionIndex = mockSolutions.findIndex(s => s.id === solutionId);
    
    if (solutionIndex !== -1 && mockSolutions[solutionIndex].attachments) {
      mockSolutions[solutionIndex].attachments = mockSolutions[solutionIndex].attachments!.filter(
        a => a.id !== attachmentId
      );
    }
  },

  // Admin functions
  getDeletedSolutions: async (): Promise<Solution[]> => {
    await delay();
    
    console.log('Mock: Fetching deleted solutions');
    
    const deletedSolutions = mockSolutions
      .filter(s => s.is_deleted)
      .map(s => ({
        ...s,
        user: getUserById(s.user_id) || { id: s.user_id, username: 'Unknown', email: 'unknown@example.com' }
      }));
    
    return deletedSolutions;
  },

  restoreSolution: async (solutionId: number): Promise<Solution> => {
    await delay();
    
    console.log(`Mock: Restoring solution ${solutionId}`);
    
    const solutionIndex = mockSolutions.findIndex(s => s.id === solutionId);
    
    if (solutionIndex === -1) {
      throw new Error('Solution not found');
    }

    mockSolutions[solutionIndex].is_deleted = false;
    mockSolutions[solutionIndex].updated_at = new Date().toISOString();

    return {
      ...mockSolutions[solutionIndex],
      user: getUserById(mockSolutions[solutionIndex].user_id) || { id: mockSolutions[solutionIndex].user_id, username: 'Unknown', email: 'unknown@example.com' }
    };
  },
}; 