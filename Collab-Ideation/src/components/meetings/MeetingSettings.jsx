import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, X, Mic, MicOff, Palette, Users, Lock, Unlock, UserPlus, UserMinus, Save } from 'lucide-react';
import { meetingAPI, userAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MeetingSettings = ({ meeting, onUpdateSettings, onClose }) => {
  const [settings, setSettings] = useState(meeting?.settings || {
    allowAllToSpeak: true,
    muteAllMembers: false,
    whiteboardAccess: 'all',
    whiteboardAllowedUsers: []
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // Sync with meeting settings when they change
    if (meeting?.settings) {
      setSettings(meeting.settings);
      setHasUnsavedChanges(false);
    }
  }, [meeting?.settings]);

  useEffect(() => {
    if (settings.whiteboardAccess === 'specific') {
      loadUsers();
    }
  }, [settings.whiteboardAccess]);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  // Save all settings at once
  const handleSaveAllSettings = async () => {
  setLoading(true);
  try {
    // Prepare settings payload
    const settingsPayload = {
      allowAllToSpeak: settings.allowAllToSpeak,
      muteAllMembers: settings.muteAllMembers,
      whiteboardAccess: settings.whiteboardAccess,
      whiteboardAllowedUsers: settings.whiteboardAllowedUsers
    };

    // Update meeting settings
    await meetingAPI.updateSettings(meeting._id, settingsPayload);
    
    // Update whiteboard access if changed
    if (settings.whiteboardAccess !== meeting.settings?.whiteboardAccess || 
        JSON.stringify(settings.whiteboardAllowedUsers) !== JSON.stringify(meeting.settings?.whiteboardAllowedUsers)) {
      await meetingAPI.updateWhiteboardAccess(
        meeting._id, 
        settings.whiteboardAccess, 
        settings.whiteboardAllowedUsers
      );
    }

    // Call parent update function
    await onUpdateSettings(settingsPayload);
    
    setHasUnsavedChanges(false);
    toast.success('Meeting settings updated successfully');
  } catch (error) {
    console.error('Failed to update settings:', error);
    toast.error('Failed to update settings');
  } finally {
    setLoading(false);
  }
};


  const addWhiteboardUser = (selectedUser) => {
    if (!settings.whiteboardAllowedUsers.includes(selectedUser._id)) {
      const newAllowedUsers = [...settings.whiteboardAllowedUsers, selectedUser._id];
      setSettings(prev => ({ 
        ...prev, 
        whiteboardAllowedUsers: newAllowedUsers 
      }));
      setHasUnsavedChanges(true);
    }
    setShowUserSearch(false);
    setSearchQuery('');
  };

  const removeWhiteboardUser = (userId) => {
    const newAllowedUsers = settings.whiteboardAllowedUsers.filter(id => id !== userId);
    setSettings(prev => ({ 
      ...prev, 
      whiteboardAllowedUsers: newAllowedUsers 
    }));
    setHasUnsavedChanges(true);
  };

  const handleWhiteboardAccessChange = (access) => {
  setSettings(prev => ({
    ...prev,
    whiteboardAccess: access,
    whiteboardAllowedUsers: access === 'specific' ? prev.whiteboardAllowedUsers : []
  }));
  setHasUnsavedChanges(true);
};

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !settings.whiteboardAllowedUsers.includes(user._id)
  );

  const allowedUsers = users.filter(user =>
    settings.whiteboardAllowedUsers.includes(user._id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-999">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Meeting Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Audio Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 flex items-center space-x-2">
              <Mic className="w-5 h-5" />
              <span>Audio Controls</span>
            </h3>

            {/* Immediate Mute/Unmute Actions */}
            <div className="flex space-x-4">
              
            </div>

            {/* Allow All to Speak Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Allow All to Speak</p>
                <p className="text-sm text-gray-600">Let participants unmute themselves</p>
              </div>
              <button
                onClick={() => handleSettingChange('allowAllToSpeak', !settings.allowAllToSpeak)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.allowAllToSpeak ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.allowAllToSpeak ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Whiteboard Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Whiteboard Access</span>
            </h3>

            <div className="space-y-3">
              {/* Access Level Options */}
              {[
                { value: 'all', label: 'Everyone can edit', icon: Users },
                { value: 'host-only', label: 'Host only', icon: Lock },
                { value: 'specific', label: 'Specific users', icon: UserPlus },
                { value: 'disabled', label: 'Disabled', icon: X }
              ].map(({ value, label, icon: Icon }) => (
                <div key={value} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={`whiteboard-${value}`}
                    name="whiteboardAccess"
                    value={value}
                    checked={settings.whiteboardAccess === value}
                    onChange={(e) => handleSettingChange('whiteboardAccess', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`whiteboard-${value}`}
                    className="flex items-center space-x-2 text-gray-700 cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </label>
                </div>
              ))}
            </div>

            {/* Specific Users Management */}
            {settings.whiteboardAccess === 'specific' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">Allowed Users</h4>
                  <button
                    onClick={() => setShowUserSearch(!showUserSearch)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add User</span>
                  </button>
                </div>

                {/* Current Allowed Users */}
                <div className="space-y-2">
                  {allowedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <span className="text-gray-800">{user.name}</span>
                      <button
                        onClick={() => removeWhiteboardUser(user._id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {allowedUsers.length === 0 && (
                    <p className="text-gray-500 text-sm">No users selected</p>
                  )}
                </div>

                {/* User Search */}
                {showUserSearch && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {filteredUsers.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => addWhiteboardUser(user)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-gray-800"
                        >
                          {user.name}
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-gray-500 text-sm px-3 py-2">No users found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Save/Cancel */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600">● Unsaved changes</span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAllSettings}
              disabled={loading || !hasUnsavedChanges}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MeetingSettings;
