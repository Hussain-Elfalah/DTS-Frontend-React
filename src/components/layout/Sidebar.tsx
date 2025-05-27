import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiList,
  FiPlus,
  FiUser,
  FiUsers,
  FiSettings,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiTrash2
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  
  // Base styles for the sidebar
  const sidebarClass = isOpen
    ? 'fixed inset-y-0 left-0 transform translate-x-0 transition z-20 md:relative md:translate-x-0'
    : 'fixed inset-y-0 left-0 transform -translate-x-full transition z-20 md:relative md:translate-x-0';

  // Helper function to determine if a link is active
  const isActiveLink = (path: string) => {
    const currentPath = location.pathname;
    
    // Exact matches for specific routes
    if (path === '/dashboard') {
      return currentPath === '/dashboard';
    }
    if (path === '/defects/closed') {
      return currentPath === '/defects/closed';
    }
    if (path === '/defects/create') {
      return currentPath === '/defects/create';
    }
    if (path === '/profile') {
      return currentPath === '/profile';
    }
    if (path === '/settings') {
      return currentPath === '/settings';
    }
    if (path === '/reports') {
      return currentPath === '/reports';
    }
    if (path === '/admin/users') {
      return currentPath === '/admin/users';
    }
    if (path === '/admin/deleted-defects') {
      return currentPath === '/admin/deleted-defects';
    }
    
    // For /defects, only match exact /defects or defect detail pages (but not closed/create)
    if (path === '/defects') {
      return currentPath === '/defects' || 
             (currentPath.startsWith('/defects/') && 
              !currentPath.startsWith('/defects/closed') && 
              !currentPath.startsWith('/defects/create') &&
              currentPath.match(/^\/defects\/\d+/)); // Match defect detail pages like /defects/123
    }
    
    return currentPath.startsWith(path);
  };

  // Get link classes based on active state
  const getLinkClasses = (path: string) => {
    const baseClasses = "flex items-center px-6 py-3 text-base font-medium transition-colors duration-200";
    const activeClasses = "bg-slate-800 dark:bg-gray-700 text-white border-r-2 border-blue-500";
    const inactiveClasses = "text-gray-300 hover:bg-slate-800 dark:hover:bg-gray-700 hover:text-white";
    
    return `${baseClasses} ${isActiveLink(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className={`${sidebarClass} w-64 bg-slate-900 dark:bg-gray-800 text-white flex flex-col h-screen overflow-hidden`}>
      {/* Mobile close overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-10 bg-gray-600 opacity-75 md:hidden" 
          aria-hidden="true"
        ></div>
      )}
      
      {/* Logo and App Name */}
      <div className="flex items-center p-4 ">
        <FiAlertCircle className="h-6 w-6 mr-2" />
        <span className="text-xl font-semibold">DTS</span>
      </div>
      
      {/* Navigation section */}
      <div className="flex-1 overflow-y-auto">
        <nav className="py-4">
          <Link
            to="/dashboard"
            className={getLinkClasses('/dashboard')}
          >
            <FiHome className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          
          <Link
            to="/defects"
            className={getLinkClasses('/defects')}
          >
            <FiList className="mr-3 h-5 w-5" />
            All Defects
          </Link>
          
          <Link
            to="/defects/closed"
            className={getLinkClasses('/defects/closed')}
          >
            <FiCheckCircle className="mr-3 h-5 w-5" />
            Closed Defects
          </Link>
          
          <Link
            to="/defects/create"
            className={getLinkClasses('/defects/create')}
          >
            <FiPlus className="mr-3 h-5 w-5" />
            Create Defect
          </Link>
          
          <Link
            to="/profile"
            className={getLinkClasses('/profile')}
          >
            <FiUser className="mr-3 h-5 w-5" />
            My Profile
          </Link>
          
          {isAdmin() && (
            <>
              <div className="h-px bg-slate-700 dark:bg-gray-700 my-2 mx-4"></div>
              
              <div className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </div>
              
              <Link
                to="/admin/users"
                className={getLinkClasses('/admin/users')}
              >
                <FiUsers className="mr-3 h-5 w-5" />
                Users
              </Link>
              
              <Link
                to="/admin/deleted-defects"
                className={getLinkClasses('/admin/deleted-defects')}
              >
                <FiTrash2 className="mr-3 h-5 w-5" />
                Deleted Defects
              </Link>
              
              <Link
                to="/reports"
                className={getLinkClasses('/reports')}
              >
                <FiFileText className="mr-3 h-5 w-5" />
                Reports
              </Link>
              
              <Link
                to="/settings"
                className={getLinkClasses('/settings')}
              >
                <FiSettings className="mr-3 h-5 w-5" />
                Settings
              </Link>
              

              
            </>
          )}
        </nav>
      </div>
      
      {/* Footer note to ensure there's content at the bottom */}
      <div className="mt-auto p-4  text-xs text-gray-500">
        © Developed by <a href="https://hussain-elfalah.github.io/Portfolio/" className="text-blue-500 hover:text-blue-600">Hussain El Fallah</a>
      </div>
    </div>
  );
};

export default Sidebar; 