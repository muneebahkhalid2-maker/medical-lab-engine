import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Files, 
  Upload, 
  Users, 
  CheckSquare, 
  Activity,
  FileBarChart,
  History,
  Settings,
  Bell,
  Search,
  LogOut,
  HelpCircle,
  Menu
} from 'lucide-react';
import { useState } from 'react';

const MENU_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Documents', path: '/documents', icon: Files },
  { name: 'Upload Report', path: '/documents/upload', icon: Upload },
  { name: 'Patients', path: '/patients', icon: Users },
  { name: 'Verification Queue', path: '/verification', icon: CheckSquare },
  { name: 'Analysis Results', path: '/analysis', icon: Activity },
  { name: 'Reports', path: '/reports', icon: FileBarChart },
  { name: 'Audit Logs', path: '/audit-logs', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    // Basic logout for now
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center z-20">
        <div className="font-bold text-xl text-brand-600 flex items-center gap-2">
          <Activity className="h-6 w-6 text-brand-500" />
          MedExtract
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
          <Menu className="h-6 w-6 text-slate-600" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 w-64 bg-white/60 backdrop-blur-xl border-r border-slate-200/60 z-10 transition-transform duration-200 ease-in-out flex flex-col`}>
        <div className="h-16 hidden md:flex items-center px-6 border-b border-slate-200/60">
          <div className="font-bold text-xl text-brand-700 flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg shadow-sm">
              <Activity className="h-5 w-5 text-white" />
            </div>
            MedExtract
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {MENU_ITEMS.map((item) => {
            const isActive = item.path === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname === item.path || (item.path !== '/documents' && location.pathname.startsWith(item.path + '/'));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-brand-50 text-brand-700 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
              DO
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">Dr. Smith</p>
              <p className="text-xs text-slate-500 truncate">Doctor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50/50">
        {/* Topbar */}
        <header className="h-16 glass-panel flex items-center justify-between px-4 lg:px-8 border-b-0 border-slate-200/60 shadow-sm sticky top-0 z-10">
          <div className="flex-1 max-w-xl flex items-center gap-2">
            <div className="relative w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patients, documents..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50">
              <HelpCircle className="h-5 w-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
