import React from 'react';
import { Calendar, Clock, Users, X} from 'lucide-react';
import { meetingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const UpcomingMeetingCard = ({ meeting, onUpdate, onCancel }) => {
  const { user } = useAuth();
  const now = new Date();
  const startTime = new Date(meeting.scheduledStartTime);
  const diffMinutes = Math.max(0, Math.round((startTime - now) / 60000));
  const isHost = meeting.host._id === user._id;
  const canCancel = user.role === 'admin' || isHost;

  const handleCancel = async () => {
    if (!confirm(`Are you sure you want to cancel "${meeting.title}"?`)) return;
    
    try {
      await meetingAPI.cancelMeeting(meeting._id);
      toast.success('Meeting cancelled successfully');
      
      // Remove immediately from UI
      if (onCancel) {
        onCancel(meeting._id);
      }
    } catch (error) {
      toast.error('Failed to cancel meeting');
    }
  };

  const formatTimeUntil = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatScheduledTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 opacity-75">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{meeting.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{meeting.project.title}</p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatScheduledTime(meeting.scheduledStartTime)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Starts in {formatTimeUntil(diffMinutes)}
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">Hosted by {meeting.host.name}</p>
        </div>
        
        <div className="text-right">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Scheduled
          </span>
          {canCancel && (
            <button
              onClick={handleCancel}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Cancel meeting"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingMeetingCard;
