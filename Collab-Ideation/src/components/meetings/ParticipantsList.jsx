import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Crown, 
  Users,
  Clock,
  MoreVertical,
  UserCheck,
  UserX
} from 'lucide-react';
import { meetingAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ParticipantsList = ({ 
  participants, 
  currentUser, 
  meeting, 
  canControl, 
  onMuteParticipant 
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  const connectedParticipants = participants.filter(p => p.isConnected);
  const isHost = meeting?.host._id === currentUser._id;

  const formatJoinTime = (joinedAt) => {
    const now = new Date();
    const joined = new Date(joinedAt);
    const diff = Math.floor((now - joined) / (1000 * 60));
    return diff < 1 ? 'Just now' : `${diff} min ago`;
  };

  const handleMuteToggle = async (participantId, currentMutedState, canUnmute = true) => {
    try {
      setLoading(true);
      await onMuteParticipant(participantId, !currentMutedState, canUnmute);
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">
              Participants ({connectedParticipants.length})
            </h3>
          </div>
          
          {canControl && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMuteAll}
                disabled={loading}
                className="p-2 bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                title="Mute all participants"
              >
                <MicOff className="h-4 w-4" />
              </button>
              <button
                onClick={handleUnmuteAll}
                disabled={loading}
                className="p-2 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                title="Unmute all participants"
              >
                <Mic className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {connectedParticipants.map((participant) => {
          const isCurrentUser = participant.user._id === currentUser._id;
          const isParticipantHost = participant.user._id === meeting?.host._id;
          const status = getParticipantStatus(participant);
          
          return (
            <motion.div
              key={participant.user._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-700 rounded-lg p-3 flex items-center justify-between relative group"
            >
              <div className="flex items-center flex-1">
                {/* Avatar */}
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center mr-3 relative">
                  <span className="text-sm font-medium text-white">
                    {participant.user.name.charAt(0).toUpperCase()}
                  </span>
                  {isParticipantHost && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Crown className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="text-white font-medium">
                      {participant.user.name}
                      {isCurrentUser && (
                        <span className="text-gray-400 text-sm ml-2">(You)</span>
                      )}
                    </h4>
                  </div>
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatJoinTime(participant.joinedAt)}
                  </div>
                  <div className="flex items-center mt-1">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${status.color}`}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${status.bgColor}`}></div>
                      {status.text}
                    </div>
                    {participant.isMuted && !participant.canUnmute && (
                      <span className="text-xs text-red-400 ml-2">(Host muted)</span>
                    )}
                  </div>
                </div>

                {/* Audio Status */}
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${
                    participant.isMuted 
                      ? 'bg-red-600' 
                      : 'bg-green-600'
                  }`}>
                    {participant.isMuted ? (
                      <MicOff className="h-4 w-4 text-white" />
                    ) : (
                      <Mic className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Host Controls */}
                  {canControl && !isCurrentUser && (
                    <div className="relative">
                      <button
                        onClick={() => setSelectedParticipant(selectedParticipant === participant.user._id ? null : participant.user._id)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Participant controls"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {selectedParticipant === participant.user._id && (
                        <div className="absolute right-0 top-8 bg-gray-800 rounded-lg shadow-lg border border-gray-600 z-10 min-w-[120px]">
                          <button
                            onClick={() => {
                              handleMuteToggle(participant.user._id, participant.isMuted, false);
                              setSelectedParticipant(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center"
                          >
                            {participant.isMuted ? (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Unmute
                              </>
                            ) : (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Mute
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Meeting Info */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <p>Meeting ID: {meeting?._id?.slice(-8)}</p>
          <p>Host: {meeting?.host.name}</p>
          <p>Started: {meeting?.startedAt && new Date(meeting.startedAt).toLocaleTimeString()}</p>
          {meeting?.settings && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <p>Whiteboard: {meeting.settings.whiteboardAccess}</p>
              <p>Audio: {meeting.settings.allowAllToSpeak ? 'Open' : 'Restricted'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantsList;
