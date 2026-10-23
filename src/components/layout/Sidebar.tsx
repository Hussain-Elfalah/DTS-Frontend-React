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
  FiTrash2,
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const sidebarClass = isOpen
    ? 'fixed inset-y-0 left-0 z-40 flex w-60 translate-x-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition md:relative md:translate-x-0'
    : 'fixed inset-y-0 left-0 z-40 flex w-60 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition md:relative md:translate-x-0';

  const isActiveLink = (path: string) => {
    const currentPath = location.pathname;

    if (path === '/dashboard') {
      return currentPath === '/' || currentPath === '/dashboard';
    }
    if (
      path === '/defects/closed' ||
      path === '/defects/create' ||
      path === '/profile' ||
      path === '/settings' ||
      path === '/reports' ||
      path === '/admin/users' ||
      path === '/admin/deleted-defects'
    ) {
      return currentPath === path;
    }

    if (path === '/defects') {
      return (
        currentPath === '/defects' ||
        (currentPath.startsWith('/defects/') &&
          !currentPath.startsWith('/defects/closed') &&
          !currentPath.startsWith('/defects/create') &&
          !!currentPath.match(/^\/defects\/\d+/))
      );
    }

    return currentPath.startsWith(path);
  };

  const getLinkClasses = (path: string) => {
    const base =
      'relative z-10 flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors';
    if (isActiveLink(path)) {
      return `${base} rounded-s-xl rounded-e-none border-y border-s border-border bg-background text-foreground`;
    }
    return `${base} rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside className={sidebarClass}>
        <div className="flex h-14 items-center gap-2 px-4">
          <FiAlertCircle className="h-5 w-5 text-foreground" />
          <span className="text-lg font-semibold tracking-tight">DTS</span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Main
          </p>
          <Link to="/dashboard" className={getLinkClasses('/dashboard')}>
            <FiHome className="h-4 w-4 shrink-0" />
            Dashboard
          </Link>
          <Link to="/defects" className={getLinkClasses('/defects')}>
            <FiList className="h-4 w-4 shrink-0" />
            All Defects
          </Link>
          <Link to="/defects/closed" className={getLinkClasses('/defects/closed')}>
            <FiCheckCircle className="h-4 w-4 shrink-0" />
            Closed Defects
          </Link>
          <Link to="/defects/create" className={getLinkClasses('/defects/create')}>
            <FiPlus className="h-4 w-4 shrink-0" />
            Create Defect
          </Link>
          <Link to="/profile" className={getLinkClasses('/profile')}>
            <FiUser className="h-4 w-4 shrink-0" />
            My Profile
          </Link>

          {isAdmin() && (
            <>
              <div className="mx-3 my-3 h-px bg-border" />
              <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Admin
              </p>
              <Link to="/admin/users" className={getLinkClasses('/admin/users')}>
                <FiUsers className="h-4 w-4 shrink-0" />
                Users
              </Link>
              <Link
                to="/admin/deleted-defects"
                className={getLinkClasses('/admin/deleted-defects')}
              >
                <FiTrash2 className="h-4 w-4 shrink-0" />
                Deleted Defects
              </Link>
              <Link to="/reports" className={getLinkClasses('/reports')}>
                <FiFileText className="h-4 w-4 shrink-0" />
                Reports
              </Link>
              <Link to="/settings" className={getLinkClasses('/settings')}>
                <FiSettings className="h-4 w-4 shrink-0" />
                Settings
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          © Developed by{' '}
          <a
            href="https://hussain-elfalah.github.io/Portfolio/"
            className="text-foreground underline-offset-2 hover:underline"
          >
            Hussain El Fallah
          </a>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
