import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  XCircle,
  UserCheck,
  UserPlus,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Ban,
  RotateCcw,
  Bell,
  LogIn
} from 'lucide-react';
import { adminAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import UserEditModal from './UserEditModal';
import ActivityLogModal from './ActivityLogModal';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  
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
      const [usersRes, pendingRes, activitiesRes, statsRes] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getPendingRegistrations(),
        adminAPI.getUserActivities(),
        adminAPI.getAdminStats()
      ]);
      
      setUsers(usersRes.data);
      setPendingUsers(pendingRes.data);
      setActivities(activitiesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRegistration = async (userId, approved, rejectionReason = '') => {
    try {
      await adminAPI.approveRegistration(userId, approved, rejectionReason);
      setPendingUsers(prev => prev.filter(user => user._id !== userId));
      
      if (approved) {
        const usersRes = await adminAPI.getAllUsers();
        setUsers(usersRes.data);
        toast.success('Registration approved successfully');
      } else {
        toast.success('Registration rejected');
      }
      
      const statsRes = await adminAPI.getAdminStats();
      setStats(statsRes.data);
    } catch (error) {
      toast.error(`Failed to ${approved ? 'approve' : 'reject'} registration`);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUser(userId, { role: newRole });
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      toast.success('User role updated successfully');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(user => user._id !== userId));
      toast.success('User deleted successfully');
      fetchAdminData();
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
      fetchAdminData();
    } catch (error) {
      toast.error(`Failed to ${suspended ? 'suspend' : 'reactivate'} user`);
    }
  };

  const handleRestoreRole = async (userId) => {
    try {
      await adminAPI.restoreUserRole(userId);
      const usersRes = await adminAPI.getAllUsers();
      setUsers(usersRes.data);
      toast.success('User role restored successfully');
    } catch (error) {
      toast.error('Failed to restore user role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !user.suspended) ||
                         (statusFilter === 'suspended' && user.suspended);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredActivities = activities.filter(activity => {
    return activityFilter === 'all' || activity.type === activityFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading admin data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage users, registrations, and system activities</p>
            </div>
            <button
              onClick={fetchAdminData}
              className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'pending', label: `Pending (${pendingUsers.length})`, icon: UserCheck },
            { id: 'activities', label: 'Activities', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'pending' && pendingUsers.length > 0 && (
                <Bell className="w-4 h-4 text-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Users"
                  value={stats.users?.total || 0}
                  change={stats.users?.newThisWeek || 0}
                  changeLabel="new this week"
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Active Today"
                  value={stats.users?.activeToday || 0}
                  change={stats.users?.activeYesterday || 0}
                  changeLabel="yesterday"
                  icon={Activity}
                  color="green"
                  isComparison
                />
                <StatCard
                  title="Pending Approvals"
                  value={stats.users?.pending || 0}
                  change={0}
                  changeLabel="requiring action"
                  icon={UserCheck}
                  color="yellow"
                />
                <StatCard
                  title="Suspended Users"
                  value={stats.users?.suspended || 0}
                  change={0}
                  changeLabel="total suspended"
                  icon={Ban}
                  color="red"
                />
              </div>

              {/* Role Distribution */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Role Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.users?.roleDistribution || {}).map(([role, count]) => (
                    <div key={role} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-600 capitalize">{role}s</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
                <div className="space-y-3">
                  {(stats.recentActivities || []).slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">{activity.user?.name || 'Unknown User'}</span>
                      <span className="text-gray-600">{activity.description}</span>
                      <span className="text-gray-400 ml-auto">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Filters */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="pm">Project Manager</option>
                    <option value="member">Member</option>
                    <option value="guest">Guest</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <UserTable
                users={filteredUsers}
                onRoleChange={handleRoleChange}
                onDelete={handleDeleteUser}
                onSuspend={handleSuspendUser}
                onRestore={handleRestoreRole}
                onEdit={(user) => {
                  setSelectedUser(user);
                  setShowEditModal(true);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <PendingRegistrations
                users={pendingUsers}
                onApprove={(userId) => handleApproveRegistration(userId, true)}
                onReject={(userId, reason) => handleApproveRegistration(userId, false, reason)}
              />
            </motion.div>
          )}

          {activeTab === 'activities' && (
            <motion.div
              key="activities"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Activity Filters */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Activities</option>
                  <option value="login">Logins</option>
                  <option value="register">Registrations</option>
                  <option value="update">Updates</option>
                  <option value="delete">Deletions</option>
                  <option value="approve">Approvals</option>
                  <option value="reject">Rejections</option>
                </select>
              </div>

              {/* Activities List */}
              <ActivityList activities={filteredActivities} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        {showEditModal && (
          <UserEditModal
            user={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSave={async (userData) => {
              try {
                await adminAPI.updateUser(selectedUser._id, userData);
                setUsers(prev => prev.map(user => 
                  user._id === selectedUser._id ? { ...user, ...userData } : user
                ));
                toast.success('User updated successfully');
                fetchAdminData(); // Refresh stats
              } catch (error) {
                toast.error('Failed to update user');
              }
            }}
          />
        )}

        {showActivityModal && (
          <ActivityLogModal
            activities={activities}
            onClose={() => setShowActivityModal(false)}
          />
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, change, changeLabel, icon: Icon, color, isComparison = false }) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  const getChangeColor = () => {
    if (!isComparison) return 'text-gray-600';
    if (change > value) return 'text-red-500';
    if (change < value) return 'text-green-500';
    return 'text-gray-500';
  };

  const getChangeIcon = () => {
    if (!isComparison) return null;
    if (change > value) return <TrendingDown className="w-4 h-4" />;
    if (change < value) return <TrendingUp className="w-4 h-4" />;
    return null;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <div className={`flex items-center space-x-1 text-sm ${getChangeColor()}`}>
            {getChangeIcon()}
            <span>{change} {changeLabel}</span>
          </div>
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

// User Table Component
const UserTable = ({ users, onRoleChange, onDelete, onSuspend, onRestore, onEdit }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => onRoleChange(user._id, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="admin">Admin</option>
                    <option value="pm">Project Manager</option>
                    <option value="member">Member</option>
                    <option value="guest">Guest</option>
                  </select>
                  {user.originalRole && (
                    <button
                      onClick={() => onRestore(user._id)}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                      title={`Restore to ${user.originalRole}`}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.suspended
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.suspended ? 'Suspended' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSuspend(user._id, !user.suspended)}
                      className={`${user.suspended ? 'text-green-600 hover:text-green-900' : 'text-yellow-600 hover:text-yellow-900'}`}
                    >
                      {user.suspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onDelete(user._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Pending Registrations Component
const PendingRegistrations = ({ users, onApprove, onReject }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingUser, setRejectingUser] = useState(null);

  const handleReject = (userId) => {
    if (rejectingUser === userId) {
      onReject(userId, rejectReason);
      setRejectingUser(null);
      setRejectReason('');
    } else {
      setRejectingUser(userId);
    }
  };

  return (
    <div className="space-y-4">
      {users.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Registrations</h3>
          <p className="text-gray-600">All registration requests have been processed.</p>
        </div>
      ) : (
        users.map((user) => (
          <motion.div
            key={user._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Crown className="w-3 h-3 mr-1" />
                    {user.role.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    Registered: {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => onApprove(user._id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleReject(user._id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
            {rejectingUser === user._id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (optional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Provide a reason for rejection..."
                />
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => handleReject(user._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => {
                      setRejectingUser(null);
                      setRejectReason('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
};

// Activity List Component
const ActivityList = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return <LogIn className="w-4 h-4 text-green-500" />;
      case 'register': return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'update': return <Edit3 className="w-4 h-4 text-yellow-500" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'approve': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'reject': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="divide-y divide-gray-200">
        {activities.map((activity, index) => (
          <div key={index} className="p-4 hover:bg-gray-50">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.user?.name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm text-gray-600">{activity.description}</p>
                {activity.metadata && (
                  <div className="mt-1 text-xs text-gray-500">
                    {Object.entries(activity.metadata).map(([key, value]) => (
                      <span key={key} className="mr-3">
                        {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
