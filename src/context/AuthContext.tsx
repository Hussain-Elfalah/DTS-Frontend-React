import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// Define user type
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

// Define context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/users/profile');
        
        if (response.data?.data?.user) {
          const userFromResponse = response.data.data.user;
          const userData: User = {
            id: userFromResponse.id,
            username: userFromResponse.username,
            email: userFromResponse.email,
            role: userFromResponse.role as 'user' | 'admin',
          };
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error: any) {
        setIsAuthenticated(false);
        
        // Use mock authentication for development
        if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
          const mockUser: User = {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin' as const,
          };
          setUser(mockUser);
          setIsAuthenticated(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      if (response.data?.user) {
        const userFromResponse = response.data.user;
        const userData: User = {
          id: userFromResponse.id,
          username: userFromResponse.username,
          email: userFromResponse.email,
          role: userFromResponse.role as 'user' | 'admin',
        };
        setUser(userData);
        setIsAuthenticated(true);
        
        navigate('/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      // Use mock login for development when API is not available
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        const mockUser: User = {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin' as const,
        };
        setUser(mockUser);
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        throw new Error(error.response?.data?.message || 'Login failed');
      }
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 