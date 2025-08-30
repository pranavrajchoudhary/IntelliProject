import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  FolderOpen, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  Trello,
  ChevronDown, Circle, Video, Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCurrentProject } from '../../context/CurrentProjectContext';
import api from '../../services/api';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProject, setCurrentProject, projects, fetchProjects } = useCurrentProject();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Kanban Board', href: '/kanban', icon: Trello },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Meetings', href: '/meetings', icon: Video },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ...(user?.role === 'admin' ? [{ name: 'Admin', href: '/admin', icon: Shield }] : []),
      { name: 'Settings', href: '/settings', icon: Settings },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data);
      } catch (err) {}
    };
    fetchProjects();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed inset-y-0 left-0 z-9999 w-64 bg-white border-r-2 border-black lg:hidden"
      >
        <div className="flex items-center justify-between h-16 px-6 border-b-2 border-black">
          <h2 className="text-xl font-bold">IntelliProject</h2>
          <button onClick={() => {setSidebarOpen(false);
            setDropdownOpen(false);
          }}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <SidebarContent navigation={navigation} currentPath={location.pathname} />
      </motion.div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-2 border-black">
        <div className="flex items-center h-16 px-6 border-b-2 border-black">
          <h2 className="text-xl font-bold">IntelliProject</h2>
        </div>
        <SidebarContent navigation={navigation} currentPath={location.pathname} />
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className="sticky top-0 h-16 bg-white border-b-2 border-black flex items-center justify-between px-6 z-9998">
          <button
            onClick={() => { setSidebarOpen(true);
              setDropdownOpen(false);
            }}
            className="lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-4 ml-5 mr-5">
            {/* Current Project Dropdown */}
            <div className="relative">
              <button
                className="flex items-center space-x-2 px-3 py-1 border border-black rounded-lg bg-white hover:bg-gray-100 transition-colors"
                onClick={() => setDropdownOpen((open) => !open)}
              >
                <span className="font-medium">
                  {currentProject ? currentProject.title : "Current Working Project"}
                </span>
                <ChevronDown className="w-4 h-4" />
                <Circle
                  className={`w-3 h-3 ml-2 ${
                    currentProject
                      ? "text-green-500 animate-pulse"
                      : "text-red-500"
                  }`}
                  style={{ minWidth: '12px' }}
                />
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-black rounded-lg shadow-lg z-50">
                  <ul>
                    {projects.map((proj) => (
                      <li key={proj._id}>
                        <button
                          className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                            currentProject && currentProject._id === proj._id
                              ? "bg-black text-white"
                              : "text-black"
                          }`}
                          onClick={() => {
                            setCurrentProject(proj);
                            setDropdownOpen(false);
                          }}
                        >
                          {proj.title || "Unnamed Project"}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
                        onClick={() => {
                          setCurrentProject(null);
                          setDropdownOpen(false);
                        }}
                      >
                        Clear Selection
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
            >
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-md lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

const SidebarContent = ({ navigation, currentPath }) => {
  return (
    <nav className="mt-8 px-4">
      <ul className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          
          return (
            <li key={item.name}>
              <Link
                to={item.href}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};


export default Layout;
