import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Bell, Trash2, Save, Calendar, Mail, Shield } from 'lucide-react';
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
  
  // New OTP-based password reset states
  const [passwordResetStep, setPasswordResetStep] = useState('initial'); // 'initial', 'email', 'otp', 'password'
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
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

  // New OTP-based password reset functions
  const startPasswordReset = () => {
    setPasswordResetStep('email');
    setResetEmail(user.email);
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setSaving(true);
    try {
      await settingsAPI.sendPasswordResetOTP(resetEmail);
      setOtpSent(true);
      setPasswordResetStep('otp');
      toast.success('OTP sent to your email!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSaving(false);
    }
  };

  const verifyOTPAndResetPassword = async (e) => {
    e.preventDefault();
    
    if (!otpCode.trim()) {
      toast.error('Please enter the OTP');
      return;
    }
    
    if (passwordResetStep === 'otp') {
      // Just verify OTP and move to password step
      setPasswordResetStep('password');
      toast.success('OTP verified! Now set your new password.');
      return;
    }

    if (passwordResetStep === 'password') {
      if (newPassword !== confirmNewPassword) {
        toast.error('New passwords do not match');
        return;
      }

      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      setSaving(true);
      try {
        await settingsAPI.verifyOTPAndResetPassword(resetEmail, otpCode, newPassword);
        toast.success('Password reset successfully!');
        resetPasswordForm();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      } finally {
        setSaving(false);
      }
    }
  };

  const resetPasswordForm = () => {
    setPasswordResetStep('initial');
    setResetEmail('');
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setOtpSent(false);
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
              <h2 className="text-xl font-bold text-black mb-6">Security Settings</h2>
              
              {/* Current Password Change Section */}
              {/* <div className="mb-8 p-4 border border-gray-200 rounded-lg"> */}
                {/* <h3 className="text-lg font-semibold text-black mb-4">Current Password Change</h3> */}
                {/* <form onSubmit={handlePasswordChange} className="space-y-4">
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
                    className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <Lock className="w-5 h-5" />
                    <span>{saving ? 'Updating...' : 'Update Password'}</span>
                  </motion.button>
                </form> */}
              {/* </div> */}

              {/* Email Verified Password Reset Section */}
              <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-black mb-2 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Change Password (Email Verified)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  For enhanced security, reset your password using email verification
                </p>

                {passwordResetStep === 'initial' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startPasswordReset}
                    className="flex items-center space-x-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Change Password</span>
                  </motion.button>
                )}

                {passwordResetStep === 'email' && (
                  <form onSubmit={sendOTP} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Confirm Your Email
                      </label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        <Mail className="w-5 h-5" />
                        <span>{saving ? 'Sending...' : 'Send OTP'}</span>
                      </motion.button>
                      <button
                        type="button"
                        onClick={resetPasswordForm}
                        className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {passwordResetStep === 'otp' && (
                  <form onSubmit={verifyOTPAndResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors text-center text-lg font-mono"
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        required
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        OTP sent to {resetEmail}. Check your email inbox.
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        <Shield className="w-5 h-5" />
                        <span>Verify OTP</span>
                      </motion.button>
                      <button
                        type="button"
                        onClick={resetPasswordForm}
                        className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {passwordResetStep === 'password' && (
                  <form onSubmit={verifyOTPAndResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                        placeholder="Enter new password"
                        required
                        minLength="6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                        placeholder="Confirm new password"
                        required
                        minLength="6"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Lock className="w-5 h-5" />
                        <span>{saving ? 'Updating...' : 'Update Password'}</span>
                      </motion.button>
                      <button
                        type="button"
                        onClick={resetPasswordForm}
                        className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
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
