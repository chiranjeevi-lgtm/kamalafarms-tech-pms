import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Leaf,
  LayoutDashboard,
  Users,
  Target,
  BarChart3,
  FileText,
  DollarSign,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: null },
  { label: 'Employees', icon: Users, path: '/employees', roles: ['admin', 'manager'] },
  { label: 'Targets', icon: Target, path: '/targets', roles: null },
  { label: 'KPI Entry', icon: BarChart3, path: '/kpi', roles: null },
  { label: 'Reviews', icon: FileText, path: '/reviews', roles: null },
  { label: 'Incentives', icon: DollarSign, path: '/incentives', roles: null },
  { label: 'Gradings', icon: Star, path: '/gradings', roles: null },
  { label: 'Settings', icon: Settings, path: '/settings', roles: ['admin'] },
];

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/targets': 'Targets',
  '/kpi': 'KPI Entry',
  '/reviews': 'Reviews',
  '/incentives': 'Incentives',
  '/gradings': 'Gradings',
  '/settings': 'Settings',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userRole = user?.role || 'employee';
  const userName = user?.name || 'User';

  const filteredNav = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleBadgeColor = {
    admin: 'bg-red-100 text-red-700',
    manager: 'bg-blue-100 text-blue-700',
    employee: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
          <Leaf className="h-8 w-8 text-green-400" />
          <span className="text-xl font-bold tracking-tight">Kamalafarms PMS</span>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'bg-transparent text-gray-300 hover:bg-primary-700 hover:text-white'
                  }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Header */}
      <header className="fixed top-0 left-0 lg:left-64 right-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700 font-medium hidden sm:inline">
            {userName}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${
              roleBadgeColor[userRole] || roleBadgeColor.employee
            }`}
          >
            {userRole}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 p-6 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
}
