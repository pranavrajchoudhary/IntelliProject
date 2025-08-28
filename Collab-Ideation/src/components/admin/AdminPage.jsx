import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Activity, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  UserX, 
  Crown, 
  Eye,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { adminAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import UserEditModal from './UserEditModal';
import ActivityLogModal from './ActivityLogModal';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      return;
    }
    fetchAdminData();
  }, [currentUser]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, activitiesRes, statsRes] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getUserActivities(),
        adminAPI.getAdminStats()
      ]);
      
      setUsers(usersRes.data);
      setActivities(activitiesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userAPI.updateUserRole(userId, { role: newRole });
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(user => user._id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleSuspendUser = async (userId, suspended) => {
    try {
      await adminAPI.suspendUser(userId, suspended);
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, suspended } : user
      ));
      toast.success(`User ${suspended ? 'suspended' : 'reactivated'} successfully`);
    } catch (error) {
      toast.error(`Failed to ${suspended ? 'suspend' : 'reactivate'} user`);
    }
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (activityFilter === 'all') return true;
    return activity.type === activityFilter;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-50';
      case 'pm': return 'text-purple-600 bg-purple-50';
      case 'member': return 'text-blue-600 bg-blue-50';
      case 'guest': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'logout': return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'create': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'update': return <Edit3 className="h-4 w-4 text-yellow-500" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page requires admin privileges.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard - PROTOTYPE</h1>
          <p className="text-gray-600">Manage users and monitor system activity</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-red-500" />
          <span className="text-sm font-medium text-red-600">Admin Access</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { name: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'bg-blue-500' },
          { name: 'Active Today', value: stats.activeToday || 0, icon: Activity, color: 'bg-green-500' },
          { name: 'New This Week', value: stats.newThisWeek || 0, icon: Calendar, color: 'bg-purple-500' },
          { name: 'Suspended', value: stats.suspended || 0, icon: AlertCircle, color: 'bg-red-500' }
        ].map((stat) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Users Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <button
              onClick={() => setShowActivityModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>View Activity Log</span>
            </button>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="pm">Project Manager</option>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-none ${getRoleColor(user.role)}`}
                      disabled={user._id === currentUser._id}
                    >
                      <option value="admin">Admin</option>
                      <option value="pm">Project Manager</option>
                      <option value="member">Member</option>
                      <option value="guest">Guest</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.suspended 
                        ? 'text-red-600 bg-red-50' 
                        : 'text-green-600 bg-green-50'
                    }`}>
                      {user.suspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastActive 
                      ? new Date(user.lastActive).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500"
                        title="Edit User"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleSuspendUser(user._id, !user.suspended)}
                        className="p-1 text-gray-400 hover:text-yellow-500"
                        title={user.suspended ? 'Reactivate' : 'Suspend'}
                        disabled={user._id === currentUser._id}
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Delete User"
                        disabled={user._id === currentUser._id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Activities</option>
              <option value="login">Logins</option>
              <option value="create">Created</option>
              <option value="update">Updated</option>
              <option value="delete">Deleted</option>
            </select>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredActivities.slice(0, 20).map((activity, index) => (
            <div key={index} className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user?.name || 'Unknown User'}</span>
                  {' '}{activity.description}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <UserEditModal
          user={selectedUser}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={fetchAdminData}
        />
      )}
      
      {showActivityModal && (
        <ActivityLogModal
          activities={activities}
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
        />
      )}
    </div>
  );
};

export default AdminPage;
