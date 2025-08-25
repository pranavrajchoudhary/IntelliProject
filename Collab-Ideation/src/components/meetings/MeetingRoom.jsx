import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Users, 
  Settings, 
  PhoneOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Palette,
  Share2,
  Clock,
  Crown,
  AlertCircle,
  X,
} from 'lucide-react';
import { meetingAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import VoiceWhiteboard from './VoiceWhiteBoard';
import ParticipantsList from './ParticipantsList';
import MeetingSettings from './MeetingSettings';

const MeetingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Meeting state
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Audio/Video controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [canUnmute, setCanUnmute] = useState(true);

  // UI state
  const [showParticipants, setShowParticipants] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const isHost = meeting?.host._id === user._id;
  const canControl = user.role === 'admin' || isHost;

  const [globalMuteSettings, setGlobalMuteSettings] = useState({
  allowAllToSpeak: true,
  muteAllMembers: false
});

// Kick/End meeting modal states
  const [showKickModal, setShowKickModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');


  // WebRTC refs
  const localAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const remoteStreamsRef = useRef({});

const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

   useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatMeetingDuration = () => {
    if (!meeting?.startedAt) return '00:00';
    
    const durationMs = currentTime - new Date(meeting.startedAt).getTime();
    const totalMinutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${Math.floor((durationMs % 60000) / 1000).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${Math.floor((durationMs % 60000) / 1000).toString().padStart(2, '0')}`;
  };

 // Wait helper: resolve when socket is connected (or timeout)
 const waitForSocketConnected = useCallback((timeout = 5000) => {
   return new Promise((resolve) => {
     const start = Date.now();
    const tick = () => {
      if (socket && socket.connected) return resolve(true);
      if (Date.now() - start >= timeout) return resolve(false);
       setTimeout(tick, 100);
     };
    tick();
   });
 }, [socket]);

 const safeEmit = useCallback(async (event, payload, timeout = 5000) => {
   const ready = await waitForSocketConnected(timeout);
   if (!ready) {
     console.warn('Socket not ready, skipping emit:', event);
     return false;
   }
   try {
     socket.emit(event, payload);
     return true;
   } catch (e) {
     console.error('safeEmit failed for', event, e);
    return false;
  }
 }, [socket, waitForSocketConnected]);



  //WebRTC setup
const createPeerConnection = useCallback((participantId) => {
  console.log('Creating peer connection for:', participantId);
  
  if (peerConnectionsRef.current[participantId]) {
    peerConnectionsRef.current[participantId].close();
  }

  const peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  });

  // Add local stream
  if (localStreamRef.current) {
    localStreamRef.current.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStreamRef.current);
    });
  }

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    console.log('Received remote track from:', participantId);
    const [remoteStream] = event.streams;
    
    let audioElement = document.getElementById(`audio-${participantId}`);
    if (!audioElement) {
      audioElement = document.createElement('audio');
      audioElement.id = `audio-${participantId}`;
      audioElement.autoplay = true;
      audioElement.playsInline = true;
      document.body.appendChild(audioElement);
    }
    
    audioElement.srcObject = remoteStream;
    audioElement.play().catch(e => console.log('Audio play failed:', e));
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate && socket) {
      socket.emit('ice-candidate', {
        candidate: event.candidate,
        roomId,
        targetId: participantId
      });
    }
  };

  peerConnectionsRef.current[participantId] = peerConnection;
  return peerConnection;
}, [socket, roomId]);


  const setupSocketListeners = useCallback(() => {
    if (!socket) return () => {};

    const handleParticipantJoined = ({ participant, room }) => {
      console.log('Participant joined:', participant.user.name);
      setMeeting(room);
      setParticipants(room.participants);
      
      if (participant.user._id !== user._id) {
        const peerConnection = createPeerConnection(participant.user._id);
        const createAndSendOffer = async () => {
          try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            await safeEmit('offer', { offer, roomId, targetId: participant.user._id });
          } catch (e) { console.error("Error creating offer", e); }
        }
        createAndSendOffer();
      }
      toast.success(`${participant.user.name} joined the meeting`);
    };
    
    const handleParticipantLeft = ({ userId, userName, wasKicked, kickedBy }) => {
  console.log('Participant left:', userName);
  setParticipants(prev => prev.filter(p => p.user._id !== userId));
  if (peerConnectionsRef.current[userId]) {
    peerConnectionsRef.current[userId].close();
    delete peerConnectionsRef.current[userId];
  }
  if (remoteStreamsRef.current[userId]) {
    delete remoteStreamsRef.current[userId];
  }
  if (wasKicked && kickedBy) {
    toast.success(`${userName} was removed by ${kickedBy}`);
  } else {
    toast.success(`${userName || 'A participant'} left the meeting`);
  }
};


    const handleParticipantKicked = ({ kickedBy, message }) => {
      setModalMessage(message);
      setShowKickModal(true);
    };
    

   const handleMuteAllParticipants = ({ mutedBy }) => {
  console.log(`All participants muted by ${mutedBy}`);
  // Checks if current user should be muted (not the host)
  const shouldMuteCurrentUser = meeting?.host._id !== user._id;
  setParticipants(prev =>
    prev.map(p => {
      // ── Host ──────────────────────────────────────────────
      if (p.user._id === meeting?.host._id) {
        return {
          ...p,
          // leave isMuted exactly as it was
          canUnmute: true    //host can always un-mute
        };
      }
    

    // ── Everyone else ─────────────────────────────────────
    return {
      ...p,
      isMuted: true,
      canUnmute: false,
      mutedBy: user._id,
      wasPreviouslyMuted: p.isMuted
    };
  })
);

if (shouldMuteCurrentUser && !isMuted) {
    setIsMuted(true);
    setCanUnmute(false);
    
    // Disable local audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }
  }

 if (isHost) setCanUnmute(true); 
  
  //Sync settings state
  setGlobalMuteSettings(prev => ({ ...prev, allowAllToSpeak: false, muteAllMembers: true }));
  setMeeting(prev => ({
    ...prev,
    settings: {
      ...prev.settings,
      allowAllToSpeak: false,
      muteAllMembers: true
    }
  }));
  
  // if (meeting?.host._id !== user._id) {
  //   setCanUnmute(false);
  //   if (!isMuted) {
  //     setIsMuted(true);
  //     if (localStreamRef.current) {
  //       localStreamRef.current.getAudioTracks().forEach(track => {
  //         track.enabled = false;
  //       });
  //     }
  //   }
  // }
  toast.success(`All participants muted by ${mutedBy}`);
};

const handleUnmuteAllParticipants = ({ unmutedBy }) => {
  console.log(`All participants unmuted by ${unmutedBy}`);
  setParticipants(prev => prev.map(p => ({
    ...p,
    canUnmute: true,
    mutedBy: null,
    mutedAt: null
  })));
  
  //Sync settings state
  setGlobalMuteSettings(prev => ({ ...prev, allowAllToSpeak: true, muteAllMembers: false }));
  setMeeting(prev => ({
    ...prev,
    settings: {
      ...prev.settings,
      allowAllToSpeak: true,
      muteAllMembers: false
    }
  }));
  
  if (!isHost) {
    setCanUnmute(true);
  }
  toast.success(`Mic permissions restored by ${unmutedBy}`);
};

const handleParticipantMuted = ({ participantId, muted, mutedBy, canUnmute }) => {
      console.log(`Participant ${participantId} ${muted ? 'muted' : 'unmuted'} by ${mutedBy}`);
      setParticipants(prev => prev.map(p => 
        p.user._id === participantId ? { 
          ...p, 
          isMuted: p.user._id === user._id ? p.isMuted : muted, // Don't force change for current user
          canUnmute, 
          mutedBy, 
          mutedAt: muted ? new Date() : null 
        } : p
      ));

      if (participantId === user._id) {
        setCanUnmute(canUnmute);
        // Don't force mute/unmute the user - let them control it
      }
    };


  const handleWhiteboardAccessUpdated = ({ access, allowedUsers, updatedBy }) => {
    console.log(`Whiteboard access updated to ${access} by ${updatedBy}`);
    setMeeting(prev => ({
    ...prev,
    settings: {
      ...prev.settings,
      whiteboardAccess: access,
      whiteboardAllowedUsers: allowedUsers
    }
  }));
    toast.success(`Whiteboard access updated by ${updatedBy}`);
  };

  const handleSettingsUpdated = ({ settings, updatedBy }) => {
      console.log(`Meeting settings updated by ${updatedBy}`);
      setMeeting(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
      setGlobalMuteSettings(prev => ({
        ...prev,
        allowAllToSpeak: settings.allowAllToSpeak ?? prev.allowAllToSpeak,
        muteAllMembers: settings.muteAllMembers ?? prev.muteAllMembers
      }));

      if (settings.allowAllToSpeak === false && !isHost) {
        setCanUnmute(false);
      } else if (settings.allowAllToSpeak === true && !isHost) {
        setCanUnmute(true);
      }
      toast.success(`Meeting settings updated by ${updatedBy}`);
    };

    const handleOffer = async ({ offer, from }) => {
      console.log('Received offer from', from);
      const peerConnection = createPeerConnection(from);
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { answer, roomId, targetId: from });
      } catch (error) { console.error('Error handling offer:', error); }
    };

    const handleAnswer = async ({ answer, from }) => {
      console.log('Received answer from', from);
      const peerConnection = peerConnectionsRef.current[from];
      if (peerConnection) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) { console.error('Error handling answer:', error); }
      }
    };

    const handleIceCandidate = async ({ candidate, from }) => {
      console.log('Received ICE candidate from', from);
      const peerConnection = peerConnectionsRef.current[from];
      if (peerConnection && candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) { console.error('Error adding ICE candidate:', error); }
      }
    };
    
    const handleMeetingEnded = ({ endedBy }) => {
      setModalMessage(`Meeting ended by ${endedBy}`);
      setShowEndModal(true);
    };

    // Attach listeners
    socket.on('participantJoined', handleParticipantJoined);
    socket.on('participantLeft', handleParticipantLeft);
    socket.on('participantKicked', handleParticipantKicked);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('meetingEnded', handleMeetingEnded);
    socket.on('muteAllParticipants', handleMuteAllParticipants);
    socket.on('unmuteAllParticipants', handleUnmuteAllParticipants);
    socket.on('whiteboardAccessUpdated', handleWhiteboardAccessUpdated);
    socket.on('settingsUpdated', handleSettingsUpdated);
    socket.on('participantMuted', handleParticipantMuted);

    // Return cleanup function
    return () => {
      socket.off('participantJoined', handleParticipantJoined);
      socket.off('participantLeft', handleParticipantLeft);
      socket.off('participantKicked', handleParticipantKicked);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('meetingEnded', handleMeetingEnded);
      socket.off('muteAllParticipants', handleMuteAllParticipants);
      socket.off('unmuteAllParticipants', handleUnmuteAllParticipants);
      socket.off('whiteboardAccessUpdated', handleWhiteboardAccessUpdated);
      socket.off('settingsUpdated', handleSettingsUpdated);
      socket.off('participantMuted', handleParticipantMuted);
    };
  }, [socket, user, roomId, createPeerConnection, navigate, isHost, isMuted]);

  useEffect(() => {
  const initializeMeeting = async () => {
    try {
      setLoading(true);
      
      // Get meeting data
      const response = await meetingAPI.joinMeeting(roomId);
      const meetingData = response.data;
      
      setMeeting(meetingData);
      setParticipants(meetingData.participants);
      
      // Set global mute settings from meeting data
      const meetingSettings = {
        allowAllToSpeak: meetingData.settings?.allowAllToSpeak ?? true,
        muteAllMembers: meetingData.settings?.muteAllMembers ?? false
      };
      setGlobalMuteSettings(meetingSettings);

      // Find current user's participant data
      const currentUserParticipant = meetingData.participants.find(
        p => p.user._id === user._id
      );
      
      // Check if user should be muted based on meeting settings
      const isUserHost = meetingData.host._id === user._id;
      const shouldBeMuted = !meetingSettings.allowAllToSpeak && !isUserHost;
      const userCanUnmute = isUserHost ? true : 
                           (currentUserParticipant?.canUnmute ?? meetingSettings.allowAllToSpeak);

      // Set initial state based on meeting and user status
      if (isUserHost) {
        // Host always has full control
        setCanUnmute(true);
        setIsMuted(currentUserParticipant?.isMuted ?? false);
      } else {
        // Non-host follows meeting rules
        setCanUnmute(userCanUnmute);
        setIsMuted(shouldBeMuted || (currentUserParticipant?.isMuted ?? false));
      }

      // Get user media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        
        localStreamRef.current = stream;
        console.log('Local audio stream obtained successfully');

        // Set audio track state based on mute status
        const shouldDisableAudio = shouldBeMuted || (currentUserParticipant?.isMuted ?? false);
        stream.getAudioTracks().forEach(track => {
          track.enabled = !shouldDisableAudio;
        });

        if (shouldBeMuted) {
          console.log('User joined/refreshed during MuteAll - automatically muted');
        }

        // Join via socket
        if (socket && socket.connected) {
          socket.emit('joinMeeting', { roomId, user });
        }
        
      } catch (mediaError) {
        console.error('Failed to get user media:', mediaError);
        toast.error('Failed to access microphone. Please check permissions.');
      }
      
    } catch (error) {
      console.error('Failed to join meeting:', error);
      toast.error('Failed to join meeting');
    } finally {
      setLoading(false);
    }
  };

  initializeMeeting();
}, [roomId, socket, user]);



  useEffect(() => {
    if (socket && meeting) {
      const cleanupListeners = setupSocketListeners();
      return cleanupListeners;
    }
  }, [socket, meeting, setupSocketListeners]);

  const cleanup = () => {
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (socket) {
      socket.emit('leaveMeeting', roomId);
    }
  };

const toggleMute = async () => {
  if (
  isMuted &&
  (
    !canUnmute ||                              // you’ve been individually locked
    (!globalMuteSettings.allowAllToSpeak && !isHost) // global lock but NOT the host
  )
) {
    if (!canUnmute) {
      toast.error('You have been muted by the host and cannot unmute yourself');
    } else if (!globalMuteSettings.allowAllToSpeak) {
      toast.error('Host has disabled participant unmuting');
    }
    return;
  }

  const newMutedState = !isMuted;
  setIsMuted(newMutedState);
  
  //Update participants array to reflect own mute status
  setParticipants(prev => prev.map(p => 
    p.user._id === user._id ? { ...p, isMuted: newMutedState } : p
  ));
  
  if (localStreamRef.current) {
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !newMutedState;
    });
  }

  try {
    await meetingAPI.muteParticipant(roomId, user._id, newMutedState, true);
  } catch (error) {
    //Revert participants array on error
    setIsMuted(!newMutedState);
    setParticipants(prev => prev.map(p => 
      p.user._id === user._id ? { ...p, isMuted: !newMutedState } : p
    ));
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newMutedState;
      });
    }
    toast.error(error.response?.data?.message || 'Failed to update mute status');
  }
};



  const leaveMeeting = async () => {
    if (confirm('Are you sure you want to leave the meeting?')) {
      try {
        await meetingAPI.leaveMeeting(roomId);
        navigate('/meetings');
      } catch (error) {
        console.error('Failed to leave meeting:', error);
        navigate('/meetings');
      }
    }
  };

  const handleModalOk = () => {
    setShowKickModal(false);
    setShowEndModal(false);
    navigate('/meetings');
  };

  const canEditWhiteboard = () => {
    if (!meeting?.settings) return true;
    const { whiteboardAccess, whiteboardAllowedUsers } = meeting.settings;
    switch (whiteboardAccess) {
      case 'all': return true;
      case 'host-only': return isHost;
      case 'specific': return whiteboardAllowedUsers?.includes(user._id) || isHost;
      case 'disabled': return false;
      default: return true;
    }
  };

  const toggleDeafen = () => {
    const newDeafenedState = !isDeafened;
    setIsDeafened(newDeafenedState);

    // Mute/unmute all remote audio elements
    participants.forEach(participant => {
      if (participant.user._id !== user._id) {
        const audioElement = document.getElementById(`audio-${participant.user._id}`);
        if (audioElement) {
          audioElement.muted = newDeafenedState;
        }
      }
    });

    toast.success(newDeafenedState ? 'Deafened - you won\'t hear others' : 'Undeafened');
  };

  
  const endMeeting = async () => {
    if (confirm('Are you sure you want to end this meeting for everyone?')) {
      try {
        await meetingAPI.endMeeting(roomId);
        navigate('/meetings');
      } catch (error) {
        toast.error('Failed to end meeting');
      }
    }
  };

  // Add these functions before the return statement in MeetingRoom component

const onMuteParticipant = async (participantId, muted, canUnmute = true) => {
  try {
    await meetingAPI.muteParticipant(roomId, participantId, muted, canUnmute);
    
    // Update local participants state
    setParticipants(prev => prev.map(p => 
      p.user._id === participantId ? {
        ...p,
        isMuted: muted,
        canUnmute: canUnmute,
        mutedBy: muted ? user._id : undefined,
        mutedAt: muted ? new Date() : undefined
      } : p
    ));
    
    // If it's the current user being muted/unmuted, update local state
    if (participantId === user._id) {
      setIsMuted(muted);
      setCanUnmute(canUnmute);
      
      // Update audio tracks
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !muted;
        });
      }
    }
    
    toast.success(`Participant ${muted ? 'muted' : 'unmuted'} successfully`);
  } catch (error) {
    console.error('Failed to mute/unmute participant:', error);
    toast.error(error.response?.data?.message || 'Failed to update participant status');
  }
};

const onKickParticipant = async (participantId) => {
  try {
    await meetingAPI.kickParticipant(roomId, participantId);
    
    // Update local participants state
    setParticipants(prev => prev.filter(p => p.user._id !== participantId));
    
    // Close peer connection if it exists
    if (peerConnectionsRef.current[participantId]) {
      peerConnectionsRef.current[participantId].close();
      delete peerConnectionsRef.current[participantId];
    }
    
    // Remove remote stream if it exists
    if (remoteStreamsRef.current[participantId]) {
      delete remoteStreamsRef.current[participantId];
    }
    
    toast.success('Participant removed successfully');
  } catch (error) {
    console.error('Failed to kick participant:', error);
    toast.error(error.response?.data?.message || 'Failed to remove participant');
  }
};


    if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Joining meeting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/meetings')}
            className="bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            Back to Meetings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-900 text-white relative flex flex-col`}>
      {/* Debug Panel - Remove in production */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 z-50 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-sm">
          <h4 className="font-bold mb-2">Debug Info</h4>
          <div>Participants: {participants.length}</div>
          <div>Peer Connections: {Object.keys(peerConnectionsRef.current).length}</div>
          <div>Remote Streams: {Object.keys(remoteStreamsRef.current).length}</div>
          <div>Local Stream: {localStreamRef.current ? 'Active' : 'None'}</div>
          <div>Socket: {socket ? 'Connected' : 'Disconnected'}</div>
          <div>Muted: {isMuted ? 'Yes' : 'No'}</div>
          <div>Can Unmute: {canUnmute ? 'Yes' : 'No'}</div>
        </div>
      )} */}
      {/* Kick Modal */}
      {showKickModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-gray-900">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Removed from Meeting</h3>
              <p className="text-gray-600 mb-4">{modalMessage}</p>
              <button
                onClick={handleModalOk}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Meeting Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-gray-900">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Meeting Ended</h3>
              <p className="text-gray-600 mb-4">{modalMessage}</p>
              <button
                onClick={handleModalOk}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Meeting Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-semibold">{meeting?.title}</h1>
              <p className="text-gray-400 text-sm">{meeting?.project.title}</p>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm font-semibold">
                {formatMeetingDuration()}
              </span>
            </div>
            {isHost && (
              <div className="flex items-center text-sm text-yellow-400">
                <Crown className="h-4 w-4 mr-1" />
                Host
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Users className="h-5 w-5" />
            </button>
            
            {canControl && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Whiteboard */}
          {showWhiteboard && (
            <div className="flex-1 bg-white">
              <VoiceWhiteboard 
                key={`${meeting._id}-${meeting.settings?.whiteboardAccess}-${meeting.settings?.whiteboardAllowedUsers?.length}`}
                meetingId={roomId}
                canEdit={canEditWhiteboard()}
                meeting={meeting} 
                user={user}
              />
            </div>
          )}

          {/* Audio Controls */}
          <div className="bg-gray-800 border-t border-gray-700 p-3 sm:p-4 left-0 right-0 lg:relative">
            <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-md mx-auto">
            {/* Mute Button */}
      <button
        onClick={toggleMute}
        disabled={
            isMuted &&
            (
              !canUnmute ||
              (!globalMuteSettings.allowAllToSpeak && !isHost)
            )
          }
        className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
          isMuted
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        } ${
          (isMuted && (!canUnmute || !globalMuteSettings.allowAllToSpeak) && !isHost) 
            ? 'opacity-50 cursor-not-allowed' 
            : ''
        }`}
        title={
          isMuted 
            ? (!canUnmute 
                ? 'Muted by host - cannot unmute' 
                : !globalMuteSettings.allowAllToSpeak
                  ? 'Host has disabled participant unmuting'
                  : 'Unmute') 
            : 'Mute'
        }
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Status Indicator */}
      {isMuted && !canUnmute && (
        <div className="flex items-center space-x-1 text-red-600 text-xs">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <span>Muted by host</span>
        </div>
      )}
      
      {isMuted && !globalMuteSettings.allowAllToSpeak && canUnmute && !isHost &&(
        <div className="flex items-center space-x-1 text-orange-600 text-xs">
          <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
          <span>Unmuting disabled</span>
        </div>
      )}

            <button
              onClick={toggleDeafen}
              className={`p-3 rounded-full transition-colors ${
                isDeafened 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title="Toggle deafen"
            >
              {isDeafened ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>

            <button
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              className={`p-3 rounded-full transition-colors ${
                showWhiteboard 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title="Toggle whiteboard"
            >
              <Palette className="h-6 w-6" />
            </button>

            <div className="flex-1" />
                <div className="flex items-center justify-center gap-2 mt-2">
            {canControl && (
              <button
                onClick={endMeeting}
                className="flex-1 max-w-32 bg-red-400 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                End Meeting
              </button>
            )}

            <button
              onClick={leaveMeeting}
              className="flex-1 max-w-32 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
              <PhoneOff className="h-5 w-5 mr-2" /> 
              Leave
            </button>
            </div>
          </div>
        </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-full lg:w-80 bg-gray-800 border-l border-gray-700 flex flex-col absolute lg:relative inset-0 lg:inset-auto z-999 mt-30 lg:mt-0">
             <ParticipantsList
              participants={participants}
              currentUser={user}
              meeting={meeting}
              canControl={canControl}
              onMuteParticipant={onMuteParticipant}
              onKickParticipant={onKickParticipant}
            />
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && canControl && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
             <MeetingSettings
              meeting={meeting}
              onUpdateSettings={async (settings) => {
                try {
                  await meetingAPI.updateSettings(roomId, settings);
                  setMeeting(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
                } catch (error) {
                  toast.error('Failed to update settings');
                }
              }}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}
      </div>

      {/* Hidden audio elements for participants */}
      <audio ref={localAudioRef} muted />
    </div>
  );
};

export default MeetingRoom;
