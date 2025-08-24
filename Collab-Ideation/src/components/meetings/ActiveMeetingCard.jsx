import React from 'react';
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

  const connectedParticipants = meeting.participants.filter(p => p.isConnected);
  const isHost = meeting.host._id === user._id;
  const canEnd = user.role === 'admin' || isHost;
  
  const formatDuration = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = Math.floor((now - start) / (1000 * 60));
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
      className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <Video className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
              <p className="text-sm text-gray-600">{meeting.project.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {connectedParticipants.length} participant{connectedParticipants.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatDuration(meeting.startedAt)}
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Live
            </div>
          </div>

          <div className="mt-3">
            <p className="text-sm text-gray-600">
              Hosted by <span className="font-medium">{meeting.host.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleJoinMeeting}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Join
          </button>

          {canEnd && (
            <button
              onClick={handleEndMeeting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Square className="h-4 w-4 mr-2" />
              End
            </button>
          )}
        </div>
      </div>

      {/* Participants List */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center space-x-2">
          {connectedParticipants.slice(0, 5).map((participant, index) => (
            <div
              key={participant.user._id}
              className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700"
              title={participant.user.name}
            >
              {participant.user.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {connectedParticipants.length > 5 && (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600">
              +{connectedParticipants.length - 5}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ActiveMeetingCard;
