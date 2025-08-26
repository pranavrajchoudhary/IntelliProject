import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mic,
  MicOff,
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

const MobileParticipantsModal = ({
  participants,
  currentUser,
  meeting,
  canControl,
  onMuteParticipant,
  onKickParticipant,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Add ESC key support
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

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
      // Update meeting settings state to reflect the change
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full bg-gray-800 rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col mb-5" // Added mb-5 for 20px space
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">
                Participants ({connectedParticipants.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Meeting Duration */}
          <div className="px-4 py-2 bg-gray-750 border-b border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Meeting duration: {formatMeetingDuration(meeting?.startedAt)}</span>
            </div>
          </div>

          {/* Host Controls */}
          {canControl && (
            <div className="p-4 bg-gray-750 border-b border-gray-700">
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMuteAll}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <MicOff className="w-4 h-4 inline mr-2" />
                  Mute All
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUnmuteAll}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Mic className="w-4 h-4 inline mr-2" />
                  Restore Permissions
                </motion.button>
              </div>
            </div>
          )}

          {/* Participants List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3 pb-8"> {/* Added pb-8 for extra bottom padding */}
              {connectedParticipants.map((participant) => {
                const isCurrentUser = participant.user._id === currentUser._id;
                const status = getParticipantStatus(participant);

                return (
                  <motion.div
                    key={participant.user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {participant.user.name.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Status indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${status.bgColor} border-2 border-gray-700`} />
                        
                        {/* Host crown */}
                        {participant.user._id === meeting?.host._id && (
                          <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 fill-current" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">
                            {participant.user.name}
                          </p>
                          {isCurrentUser && (
                            <span className="text-xs text-blue-400 font-medium">(You)</span>
                          )}
                          {participant.user._id === meeting?.host._id && (
                            <div className="flex items-center gap-1">
                              <Crown className="w-3 h-3 text-yellow-400" />
                              <span className="text-xs text-yellow-400">Host</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{formatJoinTime(participant.joinedAt)}</span>
                          {participant.isMuted && !participant.canUnmute && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <span className="text-red-400">Cannot unmute</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      {/* Mute button */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleMuteToggle(
                          participant.user._id, 
                          participant.isMuted, 
                          participant.canUnmute
                        )}
                        disabled={loading || (!canControl && !isCurrentUser)}
                        className={`p-2 rounded-full transition-colors ${
                          participant.isMuted
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-gray-600 hover:bg-gray-500'
                        } disabled:opacity-50`}
                      >
                        {participant.isMuted ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </motion.button>

                      {/* More options for host */}
                      {canControl && !isCurrentUser && (
                        <div className="relative">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowDropdown(
                              showDropdown === participant.user._id ? null : participant.user._id
                            )}
                            className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </motion.button>

                          {showDropdown === participant.user._id && (
                            <div className="absolute right-0 bottom-full mb-2 bg-gray-800 rounded-lg shadow-xl border border-gray-600 z-10 min-w-[180px]"> {/* Changed to bottom-full mb-2 */}
                              <button
                                onClick={() => handleIndividualMute(participant.user._id, participant.canUnmute)}
                                className="w-full px-4 py-3 text-left text-orange-400 hover:bg-gray-700 rounded-t-lg transition-colors flex items-center gap-2"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                {participant.canUnmute ? 'Lock Mute' : 'Allow Unmute'}
                              </button>
                              <button
                                onClick={() => handleKick(participant.user._id)}
                                className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-700 rounded-b-lg transition-colors flex items-center gap-2"
                              >
                                <UserX className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileParticipantsModal;
