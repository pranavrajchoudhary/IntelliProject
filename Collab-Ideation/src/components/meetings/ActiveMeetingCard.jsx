import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  Users,
  Clock,
  Play,
  Square,
  Settings,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { meetingAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ActiveMeetingCard = ({ meeting, onUpdate }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const connectedParticipants = meeting.participants.filter(p => p.isConnected);
  const isHost = meeting.host._id === user._id;
  const canEnd = user.role === 'admin' || isHost;

  // Update time every second for real-time duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDuration = (startTime) => {
    const start = new Date(startTime);
    const diff = Math.floor((currentTime - start) / (1000 * 60));
    return `${diff} min`;
  };

  const handleJoinMeeting = async () => {
    try {
      await meetingAPI.joinMeeting(meeting._id);
      navigate(`/meetings/${meeting._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join meeting');
    }
  };

  const handleEndMeeting = async () => {
    if (!confirm('Are you sure you want to end this meeting?')) return;
    
    try {
      await meetingAPI.endMeeting(meeting._id);
      toast.success('Meeting ended successfully');
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end meeting');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {meeting.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{meeting.project.title}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{connectedParticipants.length} participant{connectedParticipants.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(meeting.startedAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <div className="w-2 h-2 bg-red-400 rounded-full mr-1 animate-pulse"></div>
            Live
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">Hosted by {meeting.host.name}</p>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleJoinMeeting}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span>Join</span>
        </button>

        {canEnd && (
          <button
            onClick={handleEndMeeting}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Square className="w-4 h-4" />
            <span>End</span>
          </button>
        )}
      </div>

      {/* Participants List */}
      <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
        <div className="flex -space-x-2">
          {connectedParticipants.slice(0, 5).map((participant, index) => (
            <div
              key={participant.user._id}
              className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
              title={participant.user.name}
            >
              {participant.user.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {connectedParticipants.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-white">
              +{connectedParticipants.length - 5}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ActiveMeetingCard;
