// const { initTldrawSync } = require('../tldraw-server');
const MeetingRoom = require('../models/MeetingRoom');
const whiteboardRooms = new Map();
const saveTimers = new Map();

function saveWhiteboardToDatabase(meetingId, snapshot) {
  if (saveTimers.has(meetingId)) {
    clearTimeout(saveTimers.get(meetingId));
  }
  
  const timer = setTimeout(async () => {
    try {
      await MeetingRoom.findByIdAndUpdate(meetingId, {
        whiteboardData: snapshot,
        lastWhiteboardUpdate: new Date()
      });
      console.log(`Whiteboard saved for meeting ${meetingId}`);
    } catch (error) {
      console.error('Error saving whiteboard:', error);
    }
    saveTimers.delete(meetingId);
  }, 2000);
  
  saveTimers.set(meetingId, timer);
}

function initSocket(io) {
  // initTldrawSync(io);

  io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    // Store user data in socket
    socket.userData = {};

    socket.on('joinRoom', (roomId, cb) => {
      socket.join(roomId);
      cb && cb({ status: 'joined', roomId });
    });

    socket.on('chatMessage', (data) => {
      socket.to(data.roomId).emit('chatMessage', data);
    });

    // New message status events
    socket.on('messageDelivered', (data) => {
      socket.to(data.roomId).emit('messageDelivered', data);
    });

    socket.on('messageRead', (data) => {
      socket.to(data.roomId).emit('messageRead', data);
    });

    // User typing indicators
    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('typing', data);
    });

    socket.on('stopTyping', (data) => {
      socket.to(data.roomId).emit('stopTyping', data);
    });

    // Meeting-specific events

    
socket.on('joinMeeting', async (data) => {
  const { roomId, user } = data;
  socket.userData = { roomId, user };
  socket.join(`meeting-${roomId}`);
  
  console.log(`User ${user.name} joined meeting ${roomId}`);
  
  try {
    const updatedRoom = await MeetingRoom.findById(roomId)
      .populate('project', 'title')
      .populate('host', 'name email')
      .populate('participants.user', 'name email');

    socket.to(`meeting-${roomId}`).emit('participantJoined', {
      participant: {
        user,
        joinedAt: new Date(),
        isConnected: true,
        isMuted: false,
        canUnmute: true,
      },
      room: updatedRoom,
    });
  } catch (error) {
    console.error('Error fetching room data:', error);
  }
});


    socket.on('leaveMeeting', (roomId) => {
      socket.leave(`meeting-${roomId}`);
      socket.to(`meeting-${roomId}`).emit('participantLeft', {
        userId: socket.userData?.user?._id,
        userName: socket.userData?.user?.name,
      });
      console.log(`User left meeting ${roomId}`);
    });

    // Voice/Video signaling with proper error handling
    socket.on('offer', (data) => {
      console.log('Forwarding offer from', socket.userData?.user?.name, 'to user', data.targetId);
      const targetSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.userData?.user?._id === data.targetId
      );

      if (targetSocket) {
        targetSocket.emit('offer', {
          offer: data.offer,
          // CHANGE THIS LINE
          from: socket.userData.user._id, 
          roomId: data.roomId,
        });
      } else {
        console.log('Target socket not found for user:', data.targetId);
      }
    });

    socket.on('answer', (data) => {
      console.log('Forwarding answer from', socket.userData?.user?.name, 'to user', data.targetId);
      const targetSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.userData?.user?._id === data.targetId
      );

      if (targetSocket) {
        targetSocket.emit('answer', {
          answer: data.answer,
          // CHANGE THIS LINE
          from: socket.userData.user._id,
          roomId: data.roomId,
        });
      } else {
        console.log('Target socket not found for user:', data.targetId);
      }
    });

    socket.on('ice-candidate', (data) => {
      console.log('Forwarding ICE candidate from', socket.userData?.user?.name, 'to user', data.targetId);
      const targetSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.userData?.user?._id === data.targetId
      );

      if (targetSocket) {
        targetSocket.emit('ice-candidate', {
          candidate: data.candidate,
          // CHANGE THIS LINE
          from: socket.userData.user._id,
          roomId: data.roomId,
        });
      } else {
        console.log('Target socket not found for user:', data.targetId);
      }
    });

    // Voice control events
    socket.on('participantMuted', (data) => {
      socket.to(`meeting-${data.roomId}`).emit('participantMuted', {
        participantId: data.participantId,
        muted: data.muted,
        mutedBy: data.mutedBy,
        canUnmute: data.canUnmute,
      });
    });

    socket.on('participantUnmuted', (data) => {
      socket.to(`meeting-${data.roomId}`).emit('participantUnmuted', {
        participantId: data.participantId,
        unmutedBy: data.unmutedBy,
      });
    });

    socket.on('muteAllParticipants', (data) => {
      socket.to(`meeting-${data.roomId}`).emit('muteAllParticipants', {
        mutedBy: data.mutedBy,
      });
    });

    socket.on('unmuteAllParticipants', (data) => {
      socket.to(`meeting-${data.roomId}`).emit('unmuteAllParticipants', {
        unmutedBy: data.unmutedBy,
      });
    });

    // Meeting settings updates
    socket.on('meetingSettingsUpdated', (data) => {
      socket.to(`meeting-${data.roomId}`).emit('meetingSettingsUpdated', {
        settings: data.settings,
        updatedBy: data.updatedBy,
      });
    });

    // Participant status updates
    socket.on('participantStatusUpdate', (data) => {
      socket.to(`meeting-${data.roomId}`).emit('participantStatusUpdate', {
        participantId: data.participantId,
        status: data.status,
        value: data.value,
      });
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected', socket.id);

      // Notify others if user was in a meeting
      if (socket.userData?.roomId) {
        socket.to(`meeting-${socket.userData.roomId}`).emit('participantLeft', {
          userId: socket.userData?.user?._id,
          userName: socket.userData?.user?.name,
        });
      }
    });

  // Enhanced whiteboard events with real-time collaboration
 // Store whiteboard state

socket.on('joinWhiteboard', (data) => {
  const { meetingId, userId, userName } = data;
  socket.join(`whiteboard-${meetingId}`);
  
  // Initialize room state if it doesn't exist
  if (!whiteboardRooms.has(meetingId)) {
    whiteboardRooms.set(meetingId, {
      snapshot: null,
      users: new Map(),
      lastUpdate: Date.now()
    });
  }
  
  const room = whiteboardRooms.get(meetingId);
  room.users.set(userId, {
    id: userId,
    name: userName,
    socketId: socket.id,
    lastSeen: Date.now()
  });
  
  console.log(`User ${userName} joined whiteboard ${meetingId}`);
  
  // Notify others about new user
  socket.to(`whiteboard-${meetingId}`).emit('whiteboardUserJoined', {
    meetingId,
    userId,
    userName
  });
});

socket.on('leaveWhiteboard', (data) => {
  const { meetingId, userId } = data;
  socket.leave(`whiteboard-${meetingId}`);
  
  if (whiteboardRooms.has(meetingId)) {
    const room = whiteboardRooms.get(meetingId);
    room.users.delete(userId);
    
    // Clean up empty rooms
    if (room.users.size === 0) {
      whiteboardRooms.delete(meetingId);
    }
  }
  
  socket.to(`whiteboard-${meetingId}`).emit('whiteboardUserLeft', {
    meetingId,
    userId
  });
});

socket.on('whiteboardUpdate', (data) => {
      const { meetingId, type, changes, userId, userName, timestamp } = data;
      console.log(`Whiteboard update from ${userName}:`, changes);
      
      if (type === 'document' && whiteboardRooms.has(meetingId)) {
        const room = whiteboardRooms.get(meetingId);
        room.snapshot = changes;
        room.lastUpdate = timestamp || Date.now();
        
        // ✅ This will now use the function defined outside
        saveWhiteboardToDatabase(meetingId, changes);
      }
  
  // Broadcast to all other users in the room
  socket.to(`whiteboard-${meetingId}`).emit('whiteboardUpdate', {
        meetingId,
        type,
        changes,
        userId,
        userName,
        timestamp: timestamp || Date.now()
      });
    });

socket.on('requestWhiteboardSync', async (data) => {
  const { meetingId } = data;
  
  try {
    let snapshot = null;
    
    // First try to get from memory
    if (whiteboardRooms.has(meetingId)) {
      snapshot = whiteboardRooms.get(meetingId).snapshot;
    }
    
    // If not in memory, try database
    if (!snapshot) {
      const room = await MeetingRoom.findById(meetingId);
      if (room && room.whiteboardData) {
        snapshot = room.whiteboardData;
      }
    }
    
    if (snapshot) {
      console.log('Sending whiteboard sync to user');
      socket.emit('whiteboardSync', {
        meetingId,
        snapshot,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Error syncing whiteboard:', error);
  }
});

  });
}

module.exports = { initSocket };