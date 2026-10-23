import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiSearch } from 'react-icons/fi';
import { useState } from 'react';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path === '/defects') return 'All Defects';
    if (path.includes('/defects/create')) return 'Create Defect';
    if (path.includes('/profile')) return 'My Profile';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/admin/users')) return 'Users';
    if (path.includes('/admin/deleted-defects')) return 'Deleted Defects';
    if (path.includes('/admin/settings')) return 'Settings';
    if (path.includes('/admin/audit-log')) return 'Audit Logs';
    if (path.includes('/settings')) return 'Settings';
    return 'Defect Tracking System';
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring lg:hidden"
            onClick={toggleSidebar}
          >
            <FiMenu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {getPageTitle()}
          </span>
        </div>

        <div className="mx-auto hidden max-w-md flex-1 md:block">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FiSearch className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="form-input pl-9"
              placeholder="Search defects..."
            />
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            className="flex items-center rounded-full focus:outline-none focus:ring-1 focus:ring-ring"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg border border-border bg-card py-1 shadow-sm">
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                onClick={() => setUserMenuOpen(false)}
              >
                Your Profile
              </Link>
              <button
                className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
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
    </header>
  );
};

export default Navbar;
