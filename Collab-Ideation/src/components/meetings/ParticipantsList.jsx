import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Crown, Users, Clock, MoreVertical, UserCheck, UserX } from 'lucide-react';
import { meetingAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ParticipantsList = ({ participants, currentUser, meeting, canControl, onMuteParticipant }) => {
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date()); // Add real-time clock

  const connectedParticipants = participants.filter(p => p.isConnected);
  const isHost = meeting?.host._id === currentUser._id;

  // Update time every second for real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatJoinTime = (joinedAt) => {
    const joined = new Date(joinedAt);
    const diff = Math.floor((currentTime - joined) / (1000 * 60));
    return diff < 1 ? 'Just now' : `${diff} min ago`;
  };

  const formatMeetingDuration = (startTime) => {
    const start = new Date(startTime);
    const diff = Math.floor((currentTime - start) / (1000 * 60));
    if (diff < 60) return `${diff} min`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
  };

  const handleMuteToggle = async (participantId, currentMutedState, currentCanUnmute = true) => {
  try {
    setLoading(true);
    
    // Check if user can perform this action
    if (!canControl && participantId !== currentUser._id) {
      toast.error('You do not have permission to mute other participants');
      return;
    }
    
    // Check if trying to unmute when not allowed
    if (currentMutedState && !currentCanUnmute) {
      toast.error('You cannot unmute yourself - muted by host');
      return;
    }
    
    await onMuteParticipant(participantId, !currentMutedState, true);
  } catch (error) {
    console.error('Failed to mute/unmute participant:', error);
    toast.error(error.response?.data?.message || 'Failed to update participant mute status');
  } finally {
    setLoading(false);
  }
};


  const handleMuteAll = async () => {
    try {
      setLoading(true);
      await meetingAPI.muteAllParticipants(meeting._id);
      toast.success('All participants muted');
    } catch (error) {
      console.error('Failed to mute all participants:', error);
      toast.error('Failed to mute all participants');
    } finally {
      setLoading(false);
    }
  };

  const handleUnmuteAll = async () => {
    try {
      setLoading(true);
      await meetingAPI.unmuteAllParticipants(meeting._id);
      toast.success('All participants unmuted');
    } catch (error) {
      console.error('Failed to unmute all participants:', error);
      toast.error('Failed to unmute all participants');
    } finally {
      setLoading(false);
    }
  };

  const getParticipantStatus = (participant) => {
    if (participant.user._id === meeting?.host._id) {
      return { text: 'Host', color: 'text-yellow-400', bgColor: 'bg-yellow-500' };
    }
    if (participant.isMuted) {
      return { text: 'Muted', color: 'text-red-400', bgColor: 'bg-red-600' };
    }
    return { text: 'Active', color: 'text-green-400', bgColor: 'bg-green-600' };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Participants ({connectedParticipants.length})
          </h3>
        </div>
      </div>

      {/* Meeting Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
        <div className="text-sm text-gray-600">
          <strong>Meeting ID:</strong> {meeting?._id?.slice(-8)}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Host:</strong> {meeting?.host.name}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Duration:</strong> {meeting?.startedAt && formatMeetingDuration(meeting.startedAt)}
        </div>
        {meeting?.settings && (
          <div className="text-sm text-gray-600">
            <strong>Whiteboard:</strong> {meeting.settings.whiteboardAccess}
            <br />
            <strong>Audio:</strong> {meeting.settings.allowAllToSpeak ? 'Open' : 'Restricted'}
          </div>
        )}
      </div>

      {/* Host Controls */}
      {canControl && (
        <div className="flex space-x-2 mb-4">
          <button
            onClick={handleMuteAll}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
          >
            Mute All
          </button>
          <button
            onClick={handleUnmuteAll}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            Unmute All
          </button>
        </div>
      )}

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {connectedParticipants.map((participant) => {
          const status = getParticipantStatus(participant);
          return (
            <motion.div
              key={participant.user._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {participant.user.name.charAt(0).toUpperCase()}
                  </div>
                  {participant.user._id === meeting?.host._id && (
                    <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {participant.user.name}
                    {participant.user._id === currentUser._id && (
                      <span className="ml-2 text-xs text-blue-600">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    Joined {formatJoinTime(participant.joinedAt)}
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${status.color} bg-opacity-10`}>
                    {status.text}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
  {participant.isMuted ? (
    <MicOff className="w-4 h-4 text-red-500" />
  ) : (
    <Mic className="w-4 h-4 text-green-500" />
  )}
  
  {/* Show mute controls based on permissions */}
  {(canControl || participant.user._id === currentUser._id) && (
    <button
      onClick={() => handleMuteToggle(
        participant.user._id,
        participant.isMuted,
        participant.canUnmute
      )}
      disabled={loading || (participant.isMuted && !participant.canUnmute && participant.user._id === currentUser._id)}
      className={`p-1 rounded transition-colors ${
        loading ? 'opacity-50 cursor-not-allowed' :
        participant.isMuted && !participant.canUnmute && participant.user._id === currentUser._id 
          ? 'text-gray-400 cursor-not-allowed'
          : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
      }`}
      title={
        participant.isMuted && !participant.canUnmute && participant.user._id === currentUser._id
          ? 'Muted by host - cannot unmute'
          : participant.isMuted ? 'Unmute' : 'Mute'
      }
    >
      <MoreVertical className="w-4 h-4" />
    </button>
  )}
</div>

            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ParticipantsList;
