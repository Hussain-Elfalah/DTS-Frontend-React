import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import Dashboard from './pages/dashboard/Dashboard';
import DefectsListPage from './pages/defects/DefectsListPage';
import DefectDetailPage from './pages/defects/DefectDetailPage';
import DefectEditPage from './pages/defects/DefectEditPage';
import DefectHistoryPage from './pages/defects/DefectHistoryPage';
import CreateDefectPage from './pages/defects/CreateDefectPage';
import LoginPage from './pages/auth/LoginPage';
import ProfilePage from './pages/user/ProfilePage';
import ReportsPage from './pages/reports/ReportsPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import DeletedDefectsPage from './pages/admin/DeletedDefectsPage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, useToastMessages } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { setToastHandler, isDemoMode } from './services';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import DemoBanner from './components/DemoBanner';
import { getDemoConfig } from './config/demo';

// Create a new query client with optimized configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      gcTime: 300000, // 5 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 429 (rate limit)
        if (error?.response?.status === 429) return false;
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false
    }
  }
});

// App content component that has access to contexts
const AppContent = () => {
  const toast = useToastMessages();
  const demoConfig = getDemoConfig();

  // Register the toast handler for API errors
  useEffect(() => {
    setToastHandler((message, type) => {
      if (type === 'error') toast.error(message);
      else if (type === 'warning') toast.warning(message);
      else if (type === 'info') toast.info(message);
      else if (type === 'success') toast.success(message);
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      {isDemoMode() && demoConfig.showBanner && <DemoBanner />}
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/defects" element={<DefectsListPage />} />
            <Route path="/defects/closed" element={<DefectsListPage showClosed={true} />} />
            <Route path="/defects/create" element={<CreateDefectPage />} />
            <Route path="/defects/edit/:id" element={<DefectEditPage />} />
            <Route path="/defects/:id/history" element={<DefectHistoryPage />} />
            <Route path="/defects/:id" element={<DefectDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/deleted-defects" element={<DeletedDefectsPage />} />
            <Route path="/admin/settings" element={<div className="p-6">Admin Settings Page</div>} />
            <Route path="/admin/audit-log" element={<div className="p-6">Audit Logs Page</div>} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
