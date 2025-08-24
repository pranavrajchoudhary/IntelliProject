import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  X, 
  Mic, 
  MicOff, 
  Palette, 
  Users,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  Save
} from 'lucide-react';
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
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await onUpdateSettings(settings);
      toast.success('Meeting settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleMuteAll = async () => {
    const newMuteState = !settings.muteAllMembers;
    setSettings(prev => ({ ...prev, muteAllMembers: newMuteState }));
    
    try {
      if (newMuteState) {
        await meetingAPI.muteAllParticipants(meeting._id);
        toast.success('All participants muted');
      } else {
        await meetingAPI.unmuteAllParticipants(meeting._id);
        toast.success('All participants unmuted');
      }
    } catch (error) {
      toast.error('Failed to update mute settings');
    }
  };

  const handleWhiteboardAccessChange = async (access) => {
    setSettings(prev => ({ 
      ...prev, 
      whiteboardAccess: access,
      whiteboardAllowedUsers: access === 'specific' ? prev.whiteboardAllowedUsers : []
    }));

    try {
      await meetingAPI.updateWhiteboardAccess(
        meeting._id, 
        access, 
        access === 'specific' ? settings.whiteboardAllowedUsers : []
      );
      toast.success('Whiteboard access updated');
    } catch (error) {
      toast.error('Failed to update whiteboard access');
    }
  };

  const addWhiteboardUser = (user) => {
    if (!settings.whiteboardAllowedUsers.includes(user._id)) {
      const newAllowedUsers = [...settings.whiteboardAllowedUsers, user._id];
      setSettings(prev => ({ ...prev, whiteboardAllowedUsers: newAllowedUsers }));
      
      meetingAPI.updateWhiteboardAccess(meeting._id, 'specific', newAllowedUsers)
        .then(() => toast.success(`${user.name} added to whiteboard access`))
        .catch(() => toast.error('Failed to update whiteboard access'));
    }
    setShowUserSearch(false);
    setSearchQuery('');
  };

  const removeWhiteboardUser = (userId) => {
    const newAllowedUsers = settings.whiteboardAllowedUsers.filter(id => id !== userId);
    setSettings(prev => ({ ...prev, whiteboardAllowedUsers: newAllowedUsers }));
    
    meetingAPI.updateWhiteboardAccess(meeting._id, 'specific', newAllowedUsers)
      .then(() => toast.success('User removed from whiteboard access'))
      .catch(() => toast.error('Failed to update whiteboard access'));
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !settings.whiteboardAllowedUsers.includes(user._id)
  );

  const allowedUsers = users.filter(user => 
    settings.whiteboardAllowedUsers.includes(user._id)
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Meeting Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Audio Settings */}
        <div className="space-y-4">
          <h4 className="text-white font-medium flex items-center">
            <Mic className="h-4 w-4 mr-2" />
            Audio Controls
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-gray-300 text-sm">Allow all to speak</label>
              <button
                onClick={() => handleSettingChange('allowAllToSpeak', !settings.allowAllToSpeak)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.allowAllToSpeak ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.allowAllToSpeak ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleMuteAll}
              className={`w-full p-3 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                settings.muteAllMembers 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {settings.muteAllMembers ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span>Unmute All</span>
                </>
              ) : (
                <>
                  <MicOff className="h-4 w-4" />
                  <span>Mute All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Whiteboard Settings */}
        <div className="space-y-4">
          <h4 className="text-white font-medium flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            Whiteboard Access
          </h4>
          
          <div className="space-y-2">
            {[
              { value: 'all', label: 'Everyone can edit', icon: Users, description: 'All participants can draw' },
              { value: 'host-only', label: 'Host only', icon: Lock, description: 'Only you can draw' },
              { value: 'specific', label: 'Specific users', icon: UserPlus, description: 'Choose who can draw' },
              { value: 'disabled', label: 'Disabled', icon: X, description: 'No one can draw' }
            ].map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleWhiteboardAccessChange(option.value)}
                  className={`w-full p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                    settings.whiteboardAccess === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs opacity-75">{option.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Specific Users Selection */}
          {settings.whiteboardAccess === 'specific' && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h5 className="text-white text-sm font-medium">Allowed Users</h5>
                <button
                  onClick={() => setShowUserSearch(!showUserSearch)}
                  className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              </div>

              {/* User Search */}
              {showUserSearch && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
                  />
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filteredUsers.map(user => (
                      <button
                        key={user._id}
                        onClick={() => addWhiteboardUser(user)}
                        className="w-full p-2 bg-gray-700 rounded-lg text-left hover:bg-gray-600 transition-colors"
                      >
                        <div className="text-white text-sm">{user.name}</div>
                        <div className="text-gray-400 text-xs">{user.email}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Allowed Users List */}
              <div className="space-y-2">
                {allowedUsers.map(user => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-2 bg-gray-700 rounded-lg"
                  >
                    <div>
                      <div className="text-white text-sm">{user.name}</div>
                      <div className="text-gray-400 text-xs">{user.email}</div>
                    </div>
                    <button
                      onClick={() => removeWhiteboardUser(user._id)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {allowedUsers.length === 0 && (
                  <div className="text-gray-400 text-sm text-center py-2">
                    No users selected
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Meeting Info */}
        <div className="space-y-4">
          <h4 className="text-white font-medium">Meeting Information</h4>
          <div className="bg-gray-700 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Title:</span>
              <span className="text-white">{meeting?.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Project:</span>
              <span className="text-white">{meeting?.project?.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Host:</span>
              <span className="text-white">{meeting?.host?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Started:</span>
              <span className="text-white">
                {meeting?.startedAt && new Date(meeting.startedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default MeetingSettings;
