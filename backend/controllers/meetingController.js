const MeetingRoom = require('../models/MeetingRoom');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

exports.createMeetingRoom = asyncHandler(async (req, res) => {
  const { title, projectId, scheduledStartTime } = req.body;
  const userId = req.user._id;
  const isScheduled = scheduledStartTime && new Date(scheduledStartTime) > Date.now();
  // Check if user can host meetings for this project
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const canHost = req.user.role === 'admin' || 
    (req.user.role === 'pm' && project.owner.toString() === userId.toString());

  if (!canHost) {
    return res.status(403).json({ message: 'Only project managers and admins can host meetings' });
  }

  const meetingRoom = await MeetingRoom.create({
    title,
    project: projectId,
    host: userId,
    status: isScheduled ? 'scheduled' : 'active',
    scheduledStartTime: isScheduled ? scheduledStartTime : undefined,
    startedAt: isScheduled ? undefined : Date.now(),
    participants: isScheduled ? [] : [{
      user: userId,
      joinedAt: new Date(),
      isConnected: true,
      canUnmute: true
    }]
  });

  const populatedRoom = await MeetingRoom.findById(meetingRoom._id)
    .populate('project', 'title')
    .populate('host', 'name email')
    .populate('participants.user', 'name email');

  // Emit to project members
  const io = req.app.get('io');
  if (io) {
    io.to(`project-${projectId}`).emit('meetingRoomCreated', populatedRoom);
  }

  res.status(201).json(populatedRoom);
});

exports.getUpcomingMeetingRooms = asyncHandler(async (req, res) => {
  let query = { status: 'scheduled' };

  // Admin sees all scheduled rooms
  if (req.user.role !== 'admin') {
    // Get user's projects
    const userProjects = await Project.find({
      members: req.user._id
    }).select('_id');
    query.project = { $in: userProjects.map(p => p._id) };
  }

  const rooms = await MeetingRoom.find(query)
    .populate('project', 'title')
    .populate('host', 'name')
    .sort({ scheduledStartTime: 1 });

  res.json(rooms);
});

// Cancel scheduled meeting (only host or admin)
exports.cancelMeetingRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await MeetingRoom.findById(roomId);

  if (!room) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  if (room.status !== 'scheduled') {
    return res.status(400).json({ message: 'Only scheduled meetings can be cancelled' });
  }

  // Check permissions - only host or admin can cancel
  const canCancel = req.user.role === 'admin' || room.host.toString() === userId.toString();
  if (!canCancel) {
    return res.status(403).json({ message: 'Only the host or admin can cancel the meeting' });
  }

  // Delete the meeting entirely (or you could set status to 'cancelled')
  await MeetingRoom.findByIdAndDelete(roomId);

  // Emit cancellation event to project members
  const io = req.app.get('io');
  if (io) {
    io.to(`project-${room.project}`).emit('meetingRoomCancelled', {
      roomId,
      title: room.title,
      cancelledBy: req.user.name
    });
  }

  res.json({ message: 'Meeting cancelled successfully' });
});



// Get active meeting rooms (filtered by user permissions)
exports.getActiveMeetingRooms = asyncHandler(async (req, res) => {
  let query = { status: 'active' };

  // Admin sees all active rooms
  if (req.user.role !== 'admin') {
    // Get user's projects
    const userProjects = await Project.find({ 
      members: req.user._id 
    }).select('_id');
    
    query.project = { $in: userProjects.map(p => p._id) };
  }

  const rooms = await MeetingRoom.find(query)
    .populate('project', 'title')
    .populate('host', 'name email')
    .populate('participants.user', 'name email')
    .sort({ createdAt: -1 });

  res.json(rooms);
});

// Join meeting room
exports.joinMeetingRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await MeetingRoom.findById(roomId)
    .populate('project', 'title members');

  if (!room || room.status !== 'active') {
    return res.status(404).json({ message: 'Meeting room not found or ended' });
  }

  // Check if user is project member
  const isProjectMember = room.project.members.some(
    member => member.toString() === userId.toString()
  );

  if (!isProjectMember && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You are not a member of this project' });
  }

  const isHost = room.host.toString() === userId.toString();
  const shouldBeMuted = !room.settings.allowAllToSpeak && !isHost;

  // Find existing participant
  const existingParticipant = room.participants.find(
    p => p.user.toString() === userId.toString()
  );

  if (existingParticipant) {
    if (existingParticipant.isConnected) {
      const updatedRoom = await MeetingRoom.findById(roomId)
        .populate('project', 'title')
        .populate('host', 'name email')
        .populate('participants.user', 'name email');
      return res.json(updatedRoom);
    } else {
      // Reconnecting user - apply current meeting state
      existingParticipant.isConnected = true;
      existingParticipant.joinedAt = new Date();
      existingParticipant.leftAt = undefined;
      
      // Apply current mute settings for rejoining users
      if (shouldBeMuted) {
        existingParticipant.isMuted = true;
        existingParticipant.canUnmute = false;
        existingParticipant.mutedBy = room.host;
        existingParticipant.mutedAt = new Date();
      } else if (isHost) {
        // Host always retains control
        existingParticipant.canUnmute = true;
      }
    }
  } else {
    // New participant - apply current meeting state
    const participantData = {
      user: userId,
      joinedAt: new Date(),
      isConnected: true,
      isMuted: shouldBeMuted,
      canUnmute: isHost ? true : !shouldBeMuted
    };

    if (shouldBeMuted) {
      participantData.mutedBy = room.host;
      participantData.mutedAt = new Date();
    }

    room.participants.push(participantData);
  }

  await room.save();

  const updatedRoom = await MeetingRoom.findById(roomId)
    .populate('project', 'title')
    .populate('host', 'name email')
    .populate('participants.user', 'name email');

  // Emit participant joined event
  const io = req.app.get('io');
  if (io) {
    io.to(`meeting-${roomId}`).emit('participantJoined', {
      participant: { 
        user: req.user, 
        joinedAt: new Date(),
        isMuted: shouldBeMuted,
        canUnmute: isHost ? true : !shouldBeMuted
      },
      room: updatedRoom
    });
  }

  res.json(updatedRoom);
});


// Leave meeting room
exports.leaveMeetingRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await MeetingRoom.findById(roomId);
  if (!room) {
    return res.status(404).json({ message: 'Meeting room not found' });
  }

  const participantIndex = room.participants.findIndex(
    p => p.user.toString() === userId.toString()
  );

  if (participantIndex >= 0) {
    room.participants[participantIndex].isConnected = false;
    room.participants[participantIndex].leftAt = new Date();
    await room.save();
  }

  // Emit participant left
 const io = req.app.get('io');
if (io) {
  io.to(`meeting-${roomId}`).emit('participantLeft', {
  userId: userId,
  userName: req.user.name,
});
}

  res.json({ message: 'Left meeting room successfully' });
});

// End meeting room (only host or admin)
exports.endMeetingRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await MeetingRoom.findById(roomId);
  if (!room || room.status !== 'active') {
    return res.status(404).json({ message: 'Meeting room not found or already ended' });
  }

  // Check permissions
  const canEnd = req.user.role === 'admin' || room.host.toString() === userId.toString();
  if (!canEnd) {
    return res.status(403).json({ message: 'Only the host or admin can end the meeting' });
  }

  // Calculate duration
  const duration = Math.round((new Date() - room.startedAt) / (1000 * 60));

  room.status = 'ended';
  room.endedAt = new Date();
  room.duration = duration;

  // Mark all participants as disconnected
  room.participants.forEach(p => {
    if (p.isConnected) {
      p.isConnected = false;
      p.leftAt = new Date();
    }
  });

  await room.save();

  // Emit meeting ended
  const io = req.app.get('io');
  if (io) {
    io.to(`meeting-${roomId}`).emit('meetingEnded', {
      roomId,
      duration,
      endedBy: req.user.name
    });
  }

  res.json({ message: 'Meeting ended successfully', duration });
});

// Update meeting settings (host or admin only)
exports.updateMeetingSettings = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { settings } = req.body;
  const userId = req.user._id;

  const room = await MeetingRoom.findById(roomId);
  if (!room || room.status !== 'active') {
    return res.status(404).json({ message: 'Meeting room not found or ended' });
  }

  const canUpdate = req.user.role === 'admin' || room.host.toString() === userId.toString();
  if (!canUpdate) {
    return res.status(403).json({ message: 'Only host or admin can update settings' });
  }

  room.settings = { ...room.settings, ...settings };
  await room.save();

  // Emit settings updated
  const io = req.app.get('io');
  if (io) {
    io.to(`meeting-${roomId}`).emit('settingsUpdated', {
      settings: room.settings,
      updatedBy: req.user.name
    });
  }

  res.json({ settings: room.settings });
});

// Mute/unmute participant (host or admin only)
exports.muteParticipant = asyncHandler(async (req, res) => {
  const { roomId, participantId } = req.params;
  const { muted, canUnmute = true } = req.body;
  const userId = req.user._id;

  const room = await MeetingRoom.findById(roomId);
  if (!room || room.status !== 'active') {
    return res.status(404).json({ message: 'Meeting room not found or ended' });
  }

  // Check if user is trying to mute themselves or if they have permission to mute others
  const isSelfMute = participantId === userId.toString();
  const canMute = isSelfMute || req.user.role === 'admin' || room.host.toString() === userId.toString();
  
  if (!canMute) {
    return res.status(403).json({ message: 'You can only mute yourself or you need host/admin permissions to mute others' });
  }

  const participant = room.participants.find(
    p => p.user.toString() === participantId && p.isConnected
  );

  if (!participant) {
    return res.status(404).json({ message: 'Participant not found in this room' });
  }

  // Update participant mute status
  participant.isMuted = muted;
  participant.mutedBy = muted ? userId : undefined;
  participant.mutedAt = muted ? new Date() : undefined;
  participant.canUnmute = canUnmute;
  
  await room.save();

  // Emit participant muted event
  const io = req.app.get('io');
  if (io) {
    io.to(`meeting-${roomId}`).emit('participantMuted', {
      participantId,
      muted,
      mutedBy: req.user.name,
      canUnmute
    });
  }

  res.json({ 
    message: `Participant ${muted ? 'muted' : 'unmuted'} successfully`,
    canUnmute
  });
});

// Kick participant (host or admin only)
exports.kickParticipant = asyncHandler(async (req, res) => {
  const { roomId, participantId } = req.params;
  const userId = req.user._id;

  const room = await MeetingRoom.findById(roomId);
  if (!room || room.status !== 'active') {
    return res.status(404).json({ message: 'Meeting room not found or ended' });
  }

  const canKick = req.user.role === 'admin' || room.host.toString() === userId.toString();
  if (!canKick) {
    return res.status(403).json({ message: 'Only host or admin can kick participants' });
  }

  const participant = room.participants.find(
    p => p.user.toString() === participantId && p.isConnected
  );

  if (!participant) {
    return res.status(404).json({ message: 'Participant not found in this room' });
  }

  // Mark participant as disconnected
  participant.isConnected = false;
  participant.leftAt = new Date();
  participant.kickedBy = userId;
  participant.kickedAt = new Date();

  await room.save();

  // Emit participant kicked event
  const io = req.app.get('io');
  if (io) {
    // Notify the kicked participant
    const kickedUserSocket = Array.from(io.sockets.sockets.values()).find(
      (s) => s.userData?.user?._id === participantId
    );
    
    if (kickedUserSocket) {
      kickedUserSocket.emit('participantKicked', {
        roomId,
        kickedBy: req.user.name,
        message: 'You have been removed from the meeting by the host.'
      });
    }

    // Notify other participants
    io.to(`meeting-${roomId}`).emit('participantLeft', {
      userId: participantId,
      userName: participant.user.name,
      wasKicked: true,
      kickedBy: req.user.name
    });
  }

  res.json({ message: 'Participant kicked successfully' });
});


// Mute all participants (host or admin only)
exports.muteAllParticipants = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await MeetingRoom.findById(roomId);
  if (!room || room.status !== 'active') {
    return res.status(404).json({ message: 'Meeting room not found or ended' });
  }

  const canMute = req.user.role === 'admin' || room.host.toString() === userId.toString();
  if (!canMute) {
    return res.status(403).json({ message: 'Only host or admin can mute all participants' });
  }

  // Mute all connected participants except the host
  room.participants.forEach(participant => {
    if (participant.isConnected && participant.user.toString() !== room.host.toString()) {
      participant.isMuted = true;
      participant.mutedBy = userId;
      participant.mutedAt = new Date();
      participant.canUnmute = false;
    }
  });

  room.settings.muteAllMembers = true;
  await room.save();

  // Emit mute all event
  const io = req.app.get('io');
  if (io) {
    io.to(`meeting-${roomId}`).emit('muteAllParticipants', {
      mutedBy: req.user.name
    });
  }

  res.json({ message: 'All participants muted successfully' });
});

// Unmute all participants (host or admin only)
exports.unmuteAllParticipants = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await MeetingRoom.findById(roomId);
  if (!room || room.status !== 'active') {
    return res.status(404).json({ message: 'Meeting room not found or ended' });
  }

  const canUnmute = req.user.role === 'admin' || room.host.toString() === userId.toString();
  if (!canUnmute) {
    return res.status(403).json({ message: 'Only host or admin can unmute all participants' });
  }

  // Unmute all participants
  room.participants.forEach(participant => {
    if (participant.isConnected) {
      participant.isMuted = false;
      participant.mutedBy = undefined;
      participant.mutedAt = undefined;
      participant.canUnmute = true;
    }
  });

  room.settings.muteAllMembers = false;
  await room.save();

  // Emit unmute all event
  const io = req.app.get('io');
  if (io) {
    io.to(`meeting-${roomId}`).emit('unmuteAllParticipants', {
      unmutedBy: req.user.name
    });
  }

  res.json({ message: 'All participants unmuted successfully' });
});

// Update whiteboard access (host or admin only)
exports.updateWhiteboardAccess = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { access, allowedUsers } = req.body;
  const userId = req.user._id;

  const room = await MeetingRoom.findById(roomId);
  if (!room || room.status !== 'active') {
    return res.status(404).json({ message: 'Meeting room not found or ended' });
  }

  const canUpdate = req.user.role === 'admin' || room.host.toString() === userId.toString();
  if (!canUpdate) {
    return res.status(403).json({ message: 'Only host or admin can update whiteboard access' });
  }

  room.settings.whiteboardAccess = access;
  if (access === 'specific' && allowedUsers) {
    room.settings.whiteboardAllowedUsers = allowedUsers;
  } else {
    room.settings.whiteboardAllowedUsers = [];
  }

  await room.save();

  // Emit whiteboard access updated
  const io = req.app.get('io');
  if (io) {
    io.to(`meeting-${roomId}`).emit('whiteboardAccessUpdated', {
      access,
      allowedUsers: room.settings.whiteboardAllowedUsers,
      updatedBy: req.user.name
    });
  }

  res.json({ 
    whiteboardAccess: access, 
    allowedUsers: room.settings.whiteboardAllowedUsers 
  });
});

// Get meeting history
exports.getMeetingHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  let query = { status: 'ended' };

  // Non-admin users see only their project meetings
  if (req.user.role !== 'admin') {
    const userProjects = await Project.find({ 
      members: req.user._id 
    }).select('_id');
    
    query.project = { $in: userProjects.map(p => p._id) };
  }

  const meetings = await MeetingRoom.find(query)
    .populate('project', 'title')
    .populate('host', 'name email')
    .select('title project host startedAt endedAt duration participants')
    .sort({ endedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await MeetingRoom.countDocuments(query);

  res.json({
    meetings,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total
    }
  });
});
