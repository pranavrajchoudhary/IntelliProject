import React, { useState, useEffect } from 'react';
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
  UserX,
  AlertTriangle
} from 'lucide-react';
import { meetingAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ParticipantsList = ({ 
  participants, 
  currentUser, 
  meeting, 
  canControl, 
  onMuteParticipant,
  onKickParticipant 
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(null);

  const connectedParticipants = participants.filter(p => p.isConnected);
  const isHost = meeting?.host._id === currentUser._id;

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
      if (!canControl && participantId !== currentUser._id) {
        toast.error('You do not have permission to mute other participants');
        return;
      }

      if (currentMutedState && !currentCanUnmute && participantId === currentUser._id) {
      toast.error('You cannot unmute yourself - muted by host');
      return;
    }

      // Toggle the mute state
    const newMutedState = !currentMutedState;
    await onMuteParticipant(participantId, newMutedState, true);

    } catch (error) {
      console.error('Failed to mute/unmute participant:', error);
      toast.error(error.response?.data?.message || 'Failed to update participant mute status');
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualMute = async (participantId, currentCanUnmute) => {
  try {
    setLoading(true);
    
    // Find the participant to check their current mute status
    const participant = participants.find(p => p.user._id === participantId);
    const isCurrentlyMuted = participant?.isMuted || false;
    
    if (!isCurrentlyMuted) {
      // Participant is unmuted, so mute them AND remove permission
      await onMuteParticipant(participantId, true, false); // muted=true, canUnmute=false
      toast.success('Participant muted and cannot unmute');
    } else {
      // Participant is muted, so toggle their unmute permission
      const newCanUnmute = !currentCanUnmute;
      await onMuteParticipant(participantId, true, newCanUnmute);
      toast.success(newCanUnmute ? 'Participant can now unmute themselves' : 'Participant muted and cannot unmute');
    }
    
    setShowDropdown(null);
  } catch (error) {
    console.error('Failed to mute participant:', error);
    toast.error('Failed to mute participant');
  } finally {
    setLoading(false);
  }
};


  const handleKick = async (participantId) => {
    if (confirm('Are you sure you want to remove this participant from the meeting?')) {
      try {
        setLoading(true);
        await onKickParticipant(participantId);
        setShowDropdown(null);
        toast.success('Participant removed from meeting');
      } catch (error) {
        console.error('Failed to kick participant:', error);
        toast.error('Failed to remove participant');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMuteAll = async () => {
  try {
    setLoading(true);
    await meetingAPI.muteAllParticipants(meeting._id);
    // Update meeting settings state to reflect the change
    if (meeting?.settings) {
      meeting.settings.allowAllToSpeak = false;
      meeting.settings.muteAllMembers = true;
    }
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
    //Update meeting settings state to reflect the change
    if (meeting?.settings) {
      meeting.settings.allowAllToSpeak = true;
      meeting.settings.muteAllMembers = false;
    }
    toast.success('Mic permissions restored for all participants');
  } catch (error) {
    console.error('Failed to restore mic permissions:', error);
    toast.error('Failed to restore mic permissions');
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
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold">Participants ({connectedParticipants.length})</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{formatMeetingDuration(meeting?.startedAt)}</span>
          </div>
        </div>

        {/* Host Controls */}
        {canControl && (
          <div className="flex gap-2">
            <button
              onClick={handleMuteAll}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <MicOff className="h-4 w-4" />
              Mute All
            </button>
            <button
              onClick={handleUnmuteAll}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Mic className="h-4 w-4" />
              Restore Permissions
            </button>
          </div>
        )}
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {connectedParticipants.map((participant) => {
            const status = getParticipantStatus(participant);
            const isCurrentUser = participant.user._id === currentUser._id;
            const showControls = canControl && !isCurrentUser;

            return (
              <motion.div
                key={participant.user._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-700 rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {participant.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${status.bgColor}`}></div>
                  </div>

                  {/* Participant Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {participant.user.name}
                        {isCurrentUser && (
                          <span className="text-blue-400 text-sm ml-1">(You)</span>
                        )}
                      </p>
                      {participant.user._id === meeting?.host._id && (
                        <Crown className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Joined {formatJoinTime(participant.joinedAt)}</span>
                      <div className={`px-2 py-0.5 rounded-full ${status.color} bg-opacity-20`}>
                        <span className={status.color}>{status.text}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mic Status */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Mic Icon */}
                    <button
                      onClick={() => isCurrentUser ? handleMuteToggle(participant.user._id, participant.isMuted, participant.canUnmute) : null}
                      disabled={!isCurrentUser || (participant.isMuted && !participant.canUnmute)}
                      className={`p-2 rounded-full ${
                        participant.isMuted 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      } ${
                        isCurrentUser && participant.isMuted && !participant.canUnmute
                          ? 'opacity-50 cursor-not-allowed'
                          : isCurrentUser 
                          ? 'cursor-pointer'
                          : 'cursor-default'
                      }`}
                    >
                      {participant.isMuted ? (
                        <MicOff className="h-3 w-3" />
                      ) : (
                        <Mic className="h-3 w-3" />
                      )}
                    </button>

                    {/* Host Controls */}
                    {showControls && (
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown(showDropdown === participant.user._id ? null : participant.user._id)}
                          className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 text-gray-300"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown === participant.user._id && (
                          <div className="absolute right-0 top-10 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
                            <button
                              onClick={() => handleIndividualMute(participant.user._id, participant.canUnmute)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                              {participant.canUnmute ? (
                                <>
                                  <MicOff className="h-4 w-4" />
                                  Mute
                                </>
                              ) : (
                                <>
                                  <Mic className="h-4 w-4" />
                                  Unmute
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleKick(participant.user._id)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-sm text-red-400"
                            >
                              <UserX className="h-4 w-4" />
                              Kick
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
      </div>
    </div>
  );
};

export default ParticipantsList;
