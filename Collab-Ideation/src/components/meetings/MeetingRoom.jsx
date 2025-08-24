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
  AlertCircle
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


  // ***** CORRECTED ORDER STARTS HERE *****

  // Simplified WebRTC setup
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
    
    const handleParticipantLeft = ({ userId, userName }) => {
      console.log('Participant left:', userName);
      setParticipants(prev => prev.filter(p => p.user._id !== userId));
      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close();
        delete peerConnectionsRef.current[userId];
      }
      if (remoteStreamsRef.current[userId]) {
        delete remoteStreamsRef.current[userId];
      }
      toast.success(`${userName || 'A participant'} left the meeting`);
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
      toast.success(`Meeting ended by ${endedBy}`);
      navigate('/meetings');
    };

    // Attach listeners
    socket.on('participantJoined', handleParticipantJoined);
    socket.on('participantLeft', handleParticipantLeft);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('meetingEnded', handleMeetingEnded);

    // Return cleanup function
    return () => {
      socket.off('participantJoined', handleParticipantJoined);
      socket.off('participantLeft', handleParticipantLeft);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('meetingEnded', handleMeetingEnded);
    };
  }, [socket, user, roomId, createPeerConnection, navigate]);

  useEffect(() => {
  const initializeMeeting = async () => {
    try {
      setLoading(true);
      
      // Get meeting data
      const response = await meetingAPI.joinMeeting(roomId);
      const meetingData = response.data;
      setMeeting(meetingData);
      setParticipants(meetingData.participants);

      // Get user media with better error handling
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
    if (isMuted && !canUnmute) {
      toast.error('You have been muted by the host and cannot unmute yourself');
      return;
    }
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
    }
    try {
      await meetingAPI.muteParticipant(roomId, user._id, newMutedState, true);
    } catch (error) {
      setIsMuted(!newMutedState);
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

  const isHost = meeting?.host._id === user._id;
  const canControl = user.role === 'admin' || isHost;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Joining meeting...</p>
        </div>
      </div>
    );
  }
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

  const formatDuration = () => {
    if (!meeting?.startedAt) return '0:00';
    const now = new Date();
    const start = new Date(meeting.startedAt);
    const diff = Math.floor((now - start) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

 
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Joining meeting...</p>
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
    <div className={`min-h-screen bg-gray-900 text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
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
      )}

      {/* Meeting Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-semibold">{meeting?.title}</h1>
              <p className="text-gray-400 text-sm">{meeting?.project.title}</p>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="h-4 w-4 mr-1" />
              {formatDuration()}
            </div>
            {isHost && (
              <div className="flex items-center text-sm text-yellow-400">
                <Crown className="h-4 w-4 mr-1" />
                Host
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
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

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
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
                meetingId={roomId}
                canEdit={canEditWhiteboard()}
              />
            </div>
          )}

          {/* Audio Controls */}
          <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
            <button
              onClick={toggleMute}
              disabled={isMuted && !canUnmute}
              className={`p-3 rounded-full transition-colors ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-600 hover:bg-gray-500'
              } ${isMuted && !canUnmute ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isMuted && !canUnmute ? 'You have been muted by the host' : 'Toggle mute'}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>

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

            {canControl && (
              <button
                onClick={endMeeting}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                End Meeting
              </button>
            )}

            <button
              onClick={leaveMeeting}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Leave
            </button>
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            <ParticipantsList 
              participants={participants}
              currentUser={user}
              meeting={meeting}
              canControl={canControl}
              onMuteParticipant={(participantId, muted, canUnmute = false) => 
                meetingAPI.muteParticipant(roomId, participantId, muted, canUnmute)
              }
            />
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && canControl && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            <MeetingSettings 
              meeting={meeting}
              onUpdateSettings={(settings) => 
                meetingAPI.updateSettings(roomId, settings)
              }
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
