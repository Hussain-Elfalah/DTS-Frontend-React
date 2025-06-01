import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FiMenu, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { useState } from 'react';
import SearchDropdown from '../ui/SearchDropdown';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { actualTheme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  // Get the current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path === '/defects') return 'All Defects';
    if (path.includes('/defects/create')) return 'Create Defect';
    if (path.includes('/profile')) return 'My Profile';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/admin/users')) return 'Users';
    if (path.includes('/admin/settings')) return 'Settings';
    if (path.includes('/admin/audit-log')) return 'Audit Logs';
    return 'Defect Tracking System';
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-30 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            className="text-gray-600 dark:text-gray-300 focus:outline-none lg:hidden"
            onClick={toggleSidebar}
          >
            <FiMenu className="h-6 w-6" />
          </button>
          
          {/* <span className="ml-4 text-lg font-medium text-gray-900 dark:text-white">{getPageTitle()}</span> */}
        </div>
        
        <div className="flex-1 max-w-md mx-auto">
          <SearchDropdown placeholder="Search defects..." />
        </div>
        
        <div className="flex items-center">
          <button
            type="button"
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none mr-2"
            onClick={toggleTheme}
            title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {actualTheme === 'dark' ? (
              <FiSun className="h-5 w-5" />
            ) : (
              <FiMoon className="h-5 w-5" />
            )}
          </button>
          
          <div className="ml-3 relative">
            <button
              type="button"
              className="flex items-center max-w-xs text-sm rounded-full focus:outline-none"
              onClick={toggleUserMenu}
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>
            
            {userMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <button
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar; 