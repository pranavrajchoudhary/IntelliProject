import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Bell, Trash2, Save, Calendar } from 'lucide-react';
import { settingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userSettings, setUserSettings] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user, logout } = useAuth();

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'danger', name: 'Danger Zone', icon: Trash2 },
  ];

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const response = await settingsAPI.getUserSettings();
      setUserSettings(response.data);
      setProfileForm({
        name: response.data.user.name,
        email: response.data.user.email
      });
    } catch (error) {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await settingsAPI.updateSettings(profileForm);
      setUserSettings(prev => ({ ...prev, user: response.data }));
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await settingsAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await settingsAPI.deleteAccount();
        toast.success('Account deleted successfully');
        logout();
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white border-2 border-black p-6">
              <h2 className="text-xl font-bold text-black mb-6">Profile Information</h2>
              
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={userSettings?.user.role.toUpperCase()}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-100 text-gray-600"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded border">
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Member since {new Date(userSettings?.stats.memberSince).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600 mt-2">
                    <User className="w-4 h-4" />
                    <span>
                      Active in {userSettings?.stats.projectCount} projects
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </motion.button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white border-2 border-black p-6">
              <h2 className="text-xl font-bold text-black mb-6">Change Password</h2>
              
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                    required
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Lock className="w-5 h-5" />
                  <span>{saving ? 'Updating...' : 'Update Password'}</span>
                </motion.button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white border-2 border-black p-6">
              <h2 className="text-xl font-bold text-black mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                {[
                  { id: 'email', name: 'Email Notifications', desc: 'Receive updates via email' },
                  { id: 'task', name: 'Task Updates', desc: 'Get notified when tasks are updated' },
                  { id: 'project', name: 'Project Activity', desc: 'Updates about project changes' },
                  { id: 'mentions', name: 'Mentions', desc: 'When someone mentions you' },
                ].map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 border border-gray-200 rounded">
                    <div>
                      <h3 className="font-medium text-black">{notification.name}</h3>
                      <p className="text-sm text-gray-600">{notification.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="bg-white border-2 border-red-500 p-6">
              <h2 className="text-xl font-bold text-red-600 mb-6">Danger Zone</h2>
              
              <div className="bg-red-50 border border-red-200 p-4 rounded mb-6">
                <h3 className="font-bold text-red-800 mb-2">Delete Account</h3>
                <p className="text-red-700 text-sm mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteAccount}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete My Account</span>
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
